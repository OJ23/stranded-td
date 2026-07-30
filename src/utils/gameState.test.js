import { beforeEach, describe, expect, it } from "vitest";
import {
  advance,
  answerSurvivor,
  clearSave,
  collectRoomItem,
  initialGameState,
  launch,
  loadGame,
  moveTo,
  saveGame,
  scanRoom,
} from "./gameState";

describe("game state", () => {
  beforeEach(() => clearSave());

  it("charges oxygen for movement", () => {
    const next = advance(initialGameState);
    expect(next.currentRoom).toBe("1b");
    expect(next.oxygen).toBe(90);
  });

  it("clamps oxygen at the maximum", () => {
    const roomState = { ...initialGameState, currentRoom: "1i", oxygen: 160 };
    const next = collectRoomItem(roomState);
    expect(next.oxygen).toBe(200);
  });

  it("uses battery when scanning and does not charge twice", () => {
    const scannerState = {
      ...initialGameState,
      battery: 2,
      inventory: ["scanner"],
    };
    const scanned = scanRoom(scannerState, "1f");
    expect(scanned.battery).toBe(1);
    expect(scanRoom(scanned, "1f").battery).toBe(1);
  });

  it("kills the player in an airlock", () => {
    const next = moveTo(initialGameState, "1f");
    expect(next.ending).toBe("bad");
    expect(next.oxygen).toBe(0);
  });

  it("unlocks the good ending with the engineer and evidence", () => {
    const survivorRoom = {
      ...initialGameState,
      currentRoom: "2h",
      oxygen: 120,
      aiInvestigated: true,
      battery: 2,
    };
    const rescued = answerSurvivor(survivorRoom, true);
    const ending = launch({ ...rescued, currentRoom: "3a" }, false);
    expect(ending.ending).toBe("good");
  });

  it("saves and loads progress", () => {
    const state = { ...initialGameState, currentRoom: "1c", oxygen: 80 };
    saveGame(state);
    expect(loadGame()).toMatchObject({ currentRoom: "1c", oxygen: 80 });
  });
});
