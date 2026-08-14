import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SAVE_KEY } from "../data/story";
import GamePage from "./GamePage";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

function renderGame(savedState) {
  if (savedState) localStorage.setItem(SAVE_KEY, JSON.stringify(savedState));
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(React.createElement(
      MemoryRouter,
      {
        initialEntries: ["/game"],
        future: { v7_startTransition: true, v7_relativeSplatPath: true },
      },
      React.createElement(GamePage),
    ));
  });
}

function findButton(label) {
  return [...container.querySelectorAll("button")]
    .find((button) => button.textContent.includes(label));
}

function click(element) {
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function finishMovement() {
  act(() => {
    container.querySelector(".player-character")
      .dispatchEvent(new Event("animationend", { bubbles: true }));
  });
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  if (root) act(() => root.unmount());
  container?.remove();
  root = null;
  container = null;
  vi.restoreAllMocks();
});

describe("character movement", () => {
  it("queues one forward move, locks choices, and commits after animation", () => {
    renderGame();
    const advanceButton = findButton("Advance forward");
    const movementStage = container.querySelector(".movement-stage");
    movementStage.getBoundingClientRect = () => ({ top: -180, bottom: 80 });
    movementStage.scrollIntoView = vi.fn();

    act(() => {
      advanceButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      advanceButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.querySelector(".movement-stage").dataset.direction).toBe("forward");
    expect(movementStage.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "center" });
    expect(container.querySelector(".movement-stage").dataset.moving).toBe("true");
    expect([...container.querySelectorAll(".choice")].every((choice) => choice.disabled)).toBe(true);
    expect(container.textContent).toContain("Cryo Bay");

    finishMovement();

    expect(container.textContent).toContain("Med Transit");
    expect(container.querySelector(".current-location strong").textContent).toBe("Med Transit");
    expect(container.querySelector(".oxygen-value strong").textContent).toBe("190");
    expect(container.querySelector(".movement-stage").dataset.moving).toBe("false");
  });

  it("maps backward, port, and starboard navigation to their directions", () => {
    renderGame({ currentRoom: "1b", previousRoom: "1a", oxygen: 190 });
    click(findButton("Go back"));
    expect(container.querySelector(".movement-stage").dataset.direction).toBe("backward");

    act(() => root.unmount());
    container.remove();
    root = null;
    localStorage.setItem(SAVE_KEY, JSON.stringify({ currentRoom: "1c", previousRoom: "1b", oxygen: 180 }));
    renderGame();
    click(findButton("Enter Port F"));
    expect(container.querySelector(".movement-stage").dataset.direction).toBe("left");
    expect(container.querySelector(".junction-door--target").dataset.roomId).toBe("1f");

    act(() => root.unmount());
    container.remove();
    root = null;
    localStorage.setItem(SAVE_KEY, JSON.stringify({ currentRoom: "1c", previousRoom: "1b", oxygen: 180 }));
    renderGame();
    click(findButton("Enter Starboard H"));
    expect(container.querySelector(".movement-stage").dataset.direction).toBe("right");
    expect(container.querySelector(".junction-door--target").dataset.roomId).toBe("1h");
    finishMovement();
    expect(container.textContent).toContain("Auxiliary Power");
  });

  it("shows F and G exits on the left and H and I exits on the right at junctions", () => {
    renderGame({ currentRoom: "2c", previousRoom: "2b", oxygen: 120 });

    const leftRooms = [...container.querySelectorAll('[data-side="left"] .junction-door')]
      .map((door) => door.dataset.roomId);
    const rightRooms = [...container.querySelectorAll('[data-side="right"] .junction-door')]
      .map((door) => door.dataset.roomId);

    expect(leftRooms).toEqual(["2f", "2g"]);
    expect(rightRooms).toEqual(["2h", "2i"]);
    expect(container.querySelector(".junction-door__name")).toBeNull();
  });

  it("directs the player back to auxiliary power when launch battery is insufficient", () => {
    renderGame({ currentRoom: "3a", previousRoom: "2e", oxygen: 80, battery: 1 });

    expect(container.textContent).toContain("Insufficient battery: 1/2 units available");
    expect(container.textContent).toContain("Batteries are aboard the ship somewhere. Find them.");
    expect(container.textContent).not.toContain("Auxiliary Power in Starboard H");
    expect(findButton("Use the manual launch").disabled).toBe(true);
    expect(findButton("Trust the AI").disabled).toBe(true);

    click(findButton("Go back for battery"));
    expect(container.querySelector(".movement-stage").dataset.direction).toBe("backward");
  });

  it("keeps non-navigation scans immediate", () => {
    renderGame({
      currentRoom: "1c",
      previousRoom: "1b",
      oxygen: 180,
      battery: 1,
      inventory: ["scanner"],
    });

    click(findButton("Scan Port F"));

    expect(container.querySelector(".movement-stage").dataset.direction).toBe("idle");
    expect(container.querySelector(".movement-stage").dataset.moving).toBe("false");
    expect(container.textContent).toContain("Pressure readings show the room is open to vacuum.");
  });

  it("updates a completed scan after the room item is collected", () => {
    renderGame({
      currentRoom: "1c",
      previousRoom: "1i",
      oxygen: 270,
      battery: 1,
      inventory: ["scanner", "1i-collected"],
      scanned: ["1i"],
    });

    expect(container.textContent).toContain("The oxygen cylinder is empty.");
    expect(container.textContent).not.toContain("A sealed oxygen cylinder is reading full.");
  });

  it("shows the bad ending when the player trusts the AI", () => {
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    renderGame({
      currentRoom: "3a",
      previousRoom: "2e",
      oxygen: 80,
      battery: 2,
      inventory: ["engineer-key"],
      survivorRescued: true,
      traitorExposed: true,
    });

    click(findButton("Trust the AI"));

    expect(container.textContent).toContain("Bad ending");
    expect(container.textContent).toContain("A voice in the dark");
  });
});
