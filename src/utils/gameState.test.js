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
  repairComms,
  saveGame,
  scanRoom,
} from "./gameState";

describe("game state", () => {
  beforeEach(() => clearSave());

  it("charges oxygen for movement", () => {
    const next = advance(initialGameState);
    expect(next.currentRoom).toBe("1b");
    expect(next.oxygen).toBe(190);
  });

  it("starts with a full 200 oxygen reserve", () => {
    expect(initialGameState.oxygen).toBe(200);
  });

  it("clamps oxygen at the maximum", () => {
    const roomState = { ...initialGameState, currentRoom: "1i", oxygen: 160 };
    const next = collectRoomItem(roomState);
    expect(next.oxygen).toBe(200);
  });

  it("uses battery when scanning and does not charge twice", () => {
    const scannerState = {
      ...initialGameState,
      currentRoom: "1c",
      battery: 2,
      inventory: ["scanner"],
    };
    const scanned = scanRoom(scannerState, "1f");
    expect(scanned.battery).toBe(1);
    expect(scanned.scanned).toEqual(["1f"]);
    expect(scanned.lastEvent).toContain("No life sign detected");
    expect(scanRoom(scanned, "1f").battery).toBe(1);
    const secondScan = scanRoom(scanned, "1g");
    expect(secondScan.scanned).toEqual(["1f", "1g"]);
    expect(secondScan.battery).toBe(0);
  });

  it("reports stable life for both people without revealing allegiance", () => {
    const scannerState = {
      ...initialGameState,
      currentRoom: "2c",
      battery: 2,
      inventory: ["scanner"],
    };
    const firstScan = scanRoom(scannerState, "2g");
    expect(firstScan.lastEvent).toContain("Stable life found");
    const secondScan = scanRoom(firstScan, "2h");
    expect(secondScan.lastEvent).toContain("Stable life found");
  });

  it("kills the player in an airlock", () => {
    const next = moveTo(initialGameState, "1f");
    expect(next.ending).toBe("airlock");
    expect(next.oxygen).toBe(0);
  });

  it("uses a distinct ending when movement depletes oxygen", () => {
    const next = advance({ ...initialGameState, oxygen: 10 });
    expect(next.ending).toBe("oxygen");
    expect(next.lastEvent).toBe("Oxygen reserve depleted.");
  });

  it("places the scanner and launch key in room 1g", () => {
    const next = collectRoomItem({ ...initialGameState, currentRoom: "1g" });
    expect(next.inventory).toEqual(expect.arrayContaining(["scanner", "engineer-key"]));
  });

  it("adds 10 battery units from the auxiliary power room", () => {
    const next = collectRoomItem({ ...initialGameState, currentRoom: "1h" });
    expect(next.battery).toBe(10);
    expect(next.lastEvent).toContain("Battery +10");
  });

  it("requires battery for the distress signal without blocking advancement", () => {
    const commsRoom = { ...initialGameState, currentRoom: "1e", battery: 0 };
    expect(repairComms(commsRoom)).toBe(commsRoom);

    const advanced = advance(commsRoom);
    expect(advanced.currentRoom).toBe("2a");
    expect(advanced.oxygen).toBe(190);

    const transmitted = repairComms({ ...commsRoom, battery: 1 });
    expect(transmitted.commsRepaired).toBe(true);
    expect(transmitted.battery).toBe(0);
  });

  it("unlocks the good ending with the engineer and evidence", () => {
    const survivorRoom = {
      ...initialGameState,
      currentRoom: "2h",
      oxygen: 120,
      battery: 2,
      inventory: ["engineer-key"],
    };
    const rescued = answerSurvivor(survivorRoom, true);
    const ending = launch({ ...rescued, currentRoom: "3a" }, false);
    expect(ending.ending).toBe("good");
  });

  it("reveals the saboteur and hazards when the engineer is rescued", () => {
    const rescued = answerSurvivor({
      ...initialGameState,
      currentRoom: "2h",
      oxygen: 120,
    }, true);
    expect(rescued.oxygen).toBe(70);
    expect(rescued.traitorExposed).toBe(true);
    expect(rescued.lastEvent).toContain("2G");
    expect(rescued.lastEvent).toContain("2F");
  });

  it("ends in betrayal when the player gives oxygen to the traitor", () => {
    const betrayed = answerSurvivor({
      ...initialGameState,
      currentRoom: "2g",
      oxygen: 120,
    }, true);
    expect(betrayed.oxygen).toBe(0);
    expect(betrayed.ending).toBe("betrayed");
    expect(betrayed.lastEvent).toContain("took all your oxygen");
  });

  it("requires the launch key for a manual launch", () => {
    const result = launch({ ...initialGameState, currentRoom: "3a", battery: 2 }, false);
    expect(result.ending).toBeNull();
    expect(result.lastEvent).toBe("The manual launch key is still missing.");
  });

  it("saves and loads progress", () => {
    const state = { ...initialGameState, currentRoom: "1c", oxygen: 80 };
    saveGame(state);
    expect(loadGame()).toMatchObject({ currentRoom: "1c", oxygen: 80 });
  });
});
