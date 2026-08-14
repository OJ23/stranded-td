import { corridors, getCorridor, junctionRooms, SAVE_KEY, sideRooms, STARTING_OXYGEN } from "../data/story";

export const initialGameState = {
  currentRoom: "1a",
  previousRoom: null,
  oxygen: STARTING_OXYGEN,
  battery: 0,
  inventory: [],
  visited: ["1a"],
  scanned: [],
  roomLayout: Object.fromEntries(Object.values(junctionRooms).flat().map((roomId) => [roomId, roomId])),
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

export function createRoomLayout(random = Math.random) {
  return Object.values(junctionRooms).reduce((layout, roomIds) => {
    const contents = [...roomIds];
    for (let index = contents.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [contents[index], contents[swapIndex]] = [contents[swapIndex], contents[index]];
    }
    if (contents.every((contentId, index) => contentId === roomIds[index])) {
      contents.push(contents.shift());
    }
    roomIds.forEach((roomId, index) => {
      layout[roomId] = contents[index];
    });
    return layout;
  }, {});
}

export function createInitialGameState(random = Math.random) {
  return { ...initialGameState, roomLayout: createRoomLayout(random) };
}

export function getSideRoom(state, roomId = state.currentRoom) {
  const slot = sideRooms[roomId];
  if (!slot) return undefined;
  const contents = sideRooms[state.roomLayout?.[roomId] ?? roomId] ?? slot;
  return {
    ...contents,
    id: roomId,
    label: slot.label,
    direction: slot.direction,
    contentId: contents.id,
  };
}

export function findRoomIdByType(state, type, deck = String(state.currentRoom).charAt(0)) {
  return Object.keys(sideRooms).find(
    (roomId) => roomId.startsWith(deck) && getSideRoom(state, roomId)?.type === type,
  );
}

export function getRoomScanClue(state, roomId) {
  const room = getSideRoom(state, roomId);
  if (!room) return "";
  const collected = state.inventory.includes(`${roomId}-collected`);
  return collected && room.emptyScanClue ? room.emptyScanClue : room.scanClue;
}

function withOxygen(state, amount) {
  const oxygen = Math.max(state.oxygen + amount, 0);
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
      lastEvent: `Entered ${getSideRoom(state, roomId)?.name ?? roomId}.`,
    },
    -10,
  );

  if (next.ending) return next;
  if (getSideRoom(state, roomId)?.type === "hazard") {
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
  const room = getSideRoom(state);
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
      oxygen: state.oxygen + 100,
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
  const room = getSideRoom(state, roomId);
  return {
    ...state,
    battery: state.battery - 1,
    scanned: [...new Set([...state.scanned, roomId])],
    lastEvent: `${room.label} scan: ${room.signal}. ${getRoomScanClue(state, roomId)}`,
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
  const room = getSideRoom(state);
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
    lastEvent: `Engineer rescued. She exposes the saboteur in ${getSideRoom(state, findRoomIdByType(state, "traitor")).label} and warns that ${getSideRoom(state, findRoomIdByType(state, "hazard")).label} is an airlock.`,
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
