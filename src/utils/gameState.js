import { corridors, MAX_OXYGEN, SAVE_KEY, sideRooms } from "../data/story";

export const initialGameState = {
  currentRoom: "1a",
  previousRoom: null,
  oxygen: 100,
  battery: 0,
  inventory: [],
  visited: ["1a"],
  scanned: [],
  commsRepaired: false,
  aiInvestigated: false,
  traitorTrusted: false,
  survivorFound: false,
  survivorRescued: false,
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
    ending: oxygen <= 0 ? "bad" : state.ending,
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
      ending: "bad",
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
      inventory: [...state.inventory, "scanner", `${room.id}-collected`],
      lastEvent: "Microwave scanner acquired.",
    };
  }
  if (room.type === "battery") {
    return {
      ...state,
      battery: state.battery + 5,
      inventory: [...state.inventory, `${room.id}-collected`],
      lastEvent: "Portable cell recovered. Battery +5.",
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
  if (!state.inventory.includes("scanner") || state.battery < 1 || state.scanned.includes(roomId)) {
    return state;
  }
  return {
    ...state,
    battery: state.battery - 1,
    scanned: [...state.scanned, roomId],
    lastEvent: `Scan complete: ${sideRooms[roomId].signal}.`,
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
      oxygen: state.oxygen - 50,
      traitorTrusted: true,
      lastEvent: "He takes the cylinder and tells you to grant the AI command access.",
    };
  }
  return {
    ...state,
    oxygen: state.oxygen - 50,
    survivorFound: true,
    survivorRescued: true,
    inventory: [...new Set([...state.inventory, "engineer-key"])],
    lastEvent: "Engineer rescued. She gives you a manual launch key and names the saboteur.",
  };
}

export function launch(state, trustAI) {
  if (state.currentRoom !== "3a" || state.battery < 2) {
    return { ...state, lastEvent: "The launch cradle needs two battery units." };
  }
  if (trustAI || (state.traitorTrusted && !state.aiInvestigated && !state.survivorFound)) {
    return { ...state, battery: state.battery - 2, ending: "bad" };
  }
  const good =
    state.survivorRescued &&
    (state.aiInvestigated || state.commsRepaired) &&
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
