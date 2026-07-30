import { corridors, getCorridor, junctionRooms, MAX_OXYGEN, SAVE_KEY, sideRooms } from "../data/story";

export const initialGameState = {
  currentRoom: "1a",
  previousRoom: null,
  oxygen: 200,
  battery: 0,
  inventory: [],
  visited: ["1a"],
  scanned: [],
  commsRepaired: false,
  aiInvestigated: false,
  traitorTrusted: false,
  survivorFound: false,
  survivorRescued: false,
  traitorExposed: false,
  ending: null,
  turn: 0,
  lastEvent: "Emergency wake cycle complete.",
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function withOxygen(state, amount) {
  const oxygen = clamp(state.oxygen + amount, 0, MAX_OXYGEN);
  return {
    ...state,
    oxygen,
    ending: oxygen <= 0 ? "oxygen" : state.ending,
    lastEvent:
      oxygen <= 0
        ? "Oxygen reserve depleted."
        : state.lastEvent,
  };
}

export function moveTo(state, roomId) {
  if (state.ending) return state;
  const next = withOxygen(
    {
      ...state,
      previousRoom: state.currentRoom,
      currentRoom: roomId,
      visited: [...new Set([...state.visited, roomId])],
      turn: state.turn + 1,
      lastEvent: `Entered ${sideRooms[roomId]?.name ?? roomId}.`,
    },
    -10,
  );

  if (next.ending) return next;
  if (sideRooms[roomId]?.type === "hazard") {
    return {
      ...next,
      oxygen: 0,
      ending: "airlock",
      lastEvent: "Airlock breach. Suit pressure lost.",
    };
  }
  return next;
}

export function advance(state) {
  const index = corridors.findIndex((room) => room.id === state.currentRoom);
  if (index < 0 || index === corridors.length - 1) return state;
  return moveTo(state, corridors[index + 1].id);
}

export function retreat(state) {
  const index = corridors.findIndex((room) => room.id === state.currentRoom);
  if (index <= 0) return state;
  return moveTo(state, corridors[index - 1].id);
}

export function leaveSideRoom(state) {
  return state.previousRoom ? moveTo(state, state.previousRoom) : state;
}

export function collectRoomItem(state) {
  const room = sideRooms[state.currentRoom];
  if (!room || state.inventory.includes(`${room.id}-collected`)) return state;

  if (room.type === "scanner") {
    return {
      ...state,
      inventory: [...new Set([...state.inventory, "scanner", "engineer-key", `${room.id}-collected`])],
      lastEvent: "Scanner and manual launch key acquired.",
    };
  }
  if (room.type === "battery") {
    return {
      ...state,
      battery: state.battery + 10,
      inventory: [...state.inventory, `${room.id}-collected`],
      lastEvent: "Portable cell recovered. Battery +10.",
    };
  }
  if (room.type === "oxygen") {
    return {
      ...state,
      oxygen: clamp(state.oxygen + 100, 0, MAX_OXYGEN),
      inventory: [...state.inventory, `${room.id}-collected`],
      lastEvent: "Emergency oxygen transferred. O₂ +100.",
    };
  }
  return state;
}

export function scanRoom(state, roomId) {
  const junction = getCorridor(state.currentRoom)?.junction;
  const roomCanBeScanned = junction && junctionRooms[junction]?.includes(roomId);
  if (
    !roomCanBeScanned ||
    !state.inventory.includes("scanner") ||
    state.battery < 1 ||
    state.scanned.includes(roomId)
  ) {
    return state;
  }
  return {
    ...state,
    battery: state.battery - 1,
    scanned: [...new Set([...state.scanned, roomId])],
    lastEvent: `${sideRooms[roomId].label} scan: ${sideRooms[roomId].signal}.`,
  };
}

export function repairComms(state) {
  if (state.currentRoom !== "1e" || state.battery < 1 || state.commsRepaired) return state;
  return {
    ...state,
    battery: state.battery - 1,
    commsRepaired: true,
    lastEvent: "Distress burst transmitted. A second signal answered from inside the ship.",
  };
}

export function investigateAI(state) {
  if (state.currentRoom !== "2c" || state.aiInvestigated) return state;
  return {
    ...state,
    aiInvestigated: true,
    lastEvent: "The AI signature is a routed crew terminal—not the ship core.",
  };
}

export function answerSurvivor(state, accept) {
  const room = sideRooms[state.currentRoom];
  if (!["survivor", "traitor"].includes(room?.type)) return state;
  if (!accept) {
    return { ...state, lastEvent: "You keep your oxygen and step away." };
  }
  if (state.oxygen <= 50) {
    return { ...state, lastEvent: "You do not have enough oxygen to share." };
  }
  if (room.type === "traitor") {
    return {
      ...state,
      oxygen: 0,
      traitorTrusted: true,
      ending: "betrayed",
      lastEvent: "The traitor backstabbed you and took all your oxygen.",
    };
  }
  return {
    ...state,
    oxygen: state.oxygen - 50,
    survivorFound: true,
    survivorRescued: true,
    traitorExposed: true,
    lastEvent: "Engineer rescued. She exposes the saboteur in 2G and warns that 2F is an airlock.",
  };
}

export function launch(state, trustAI) {
  if (state.currentRoom !== "3a" || state.battery < 2) {
    return { ...state, lastEvent: "The launch cradle needs two battery units." };
  }
  if (!trustAI && !state.inventory.includes("engineer-key")) {
    return { ...state, lastEvent: "The manual launch key is still missing." };
  }
  if (trustAI || (state.traitorTrusted && !state.aiInvestigated && !state.survivorFound)) {
    return { ...state, battery: state.battery - 2, ending: "bad" };
  }
  const good =
    state.survivorRescued &&
    (state.traitorExposed || state.aiInvestigated || state.commsRepaired) &&
    state.inventory.includes("engineer-key");
  return {
    ...state,
    battery: state.battery - 2,
    ending: good ? "good" : "neutral",
  };
}

export function saveGame(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    return saved && saved.currentRoom ? { ...initialGameState, ...saved } : null;
  } catch {
    return null;
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
