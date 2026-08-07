import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChoiceButton from "../components/ChoiceButton";
import ConfirmDialog from "../components/ConfirmDialog";
import EndingScreen from "../components/EndingScreen";
import GameHeader from "../components/GameHeader";
import MovementStage from "../components/MovementStage";
import SceneCard from "../components/SceneCard";
import StatusPanel from "../components/StatusPanel";
import { getCorridor, junctionRooms, sideRooms } from "../data/story";
import {
  advance,
  answerSurvivor,
  clearSave,
  collectRoomItem,
  initialGameState,
  investigateAI,
  launch,
  leaveSideRoom,
  loadGame,
  moveTo,
  repairComms,
  retreat,
  saveGame,
  scanRoom,
} from "../utils/gameState";

const failedEndings = new Set(["oxygen", "airlock", "betrayed", "bad"]);

function getSceneRoom(room, state) {
  if (state.currentRoom === "2h" && state.survivorFound) {
    return {
      ...room,
      text: "The wounded engineer reveals that the man in 2G is the saboteur who incapacitated her. She warns you not to enter 2G and confirms that 2F is an exposed airlock. With your oxygen shared, she can now reach the escape pod with you.",
      objective: "Avoid rooms 2F and 2G. Reach the escape deck together.",
    };
  }

  if (state.currentRoom === "3a" && state.battery < 2) {
    return {
      ...room,
      objective: `Insufficient battery: ${state.battery}/2 units available. Go back to Auxiliary Power in Starboard H to recover the power cell.`,
    };
  }

  return room;
}

export default function GamePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState(() =>
    location.state?.newGame ? initialGameState : loadGame() ?? initialGameState,
  );
  const [restartOpen, setRestartOpen] = useState(false);
  const [saveConfirmed, setSaveConfirmed] = useState(false);
  const [movement, setMovement] = useState(null);
  const movementActionRef = useRef(null);
  const movementStageRef = useRef(null);
  const corridor = getCorridor(state.currentRoom);
  const room = corridor ?? sideRooms[state.currentRoom];
  const sceneRoom = getSceneRoom(room, state);

  useEffect(() => {
    saveGame(state);
  }, [state]);

  useEffect(() => {
    if (!saveConfirmed) return undefined;
    const timeout = window.setTimeout(() => setSaveConfirmed(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [saveConfirmed]);

  const update = useCallback((fn, ...args) => {
    setState((current) => fn(current, ...args));
  }, []);

  const performMovement = useCallback((direction, action, targetRoomId = null) => {
    if (movementActionRef.current) return;
    const stage = movementStageRef.current;
    if (stage) {
      const bounds = stage.getBoundingClientRect();
      const stageIsVisible = bounds.top >= 0 && bounds.bottom <= window.innerHeight;
      if (!stageIsVisible) stage.scrollIntoView?.({ behavior: "auto", block: "center" });
    }
    movementActionRef.current = action;
    setMovement({ direction, targetRoomId });
  }, []);

  const finishMovement = useCallback((event) => {
    if (event.target !== event.currentTarget || !movementActionRef.current) return;
    const action = movementActionRef.current;
    movementActionRef.current = null;
    setMovement(null);
    action();
  }, []);

  const choices = useMemo(() => {
    if (state.ending) return [];
    const result = [];
    const side = sideRooms[state.currentRoom];

    if (side) {
      const collected = state.inventory.includes(`${side.id}-collected`);
      if (["scanner", "battery", "oxygen"].includes(side.type) && !collected) {
        result.push({
          title: side.type === "scanner" ? "Take scanner and launch key" : side.type === "battery" ? "Recover the power cell" : "Refill suit oxygen",
          detail: side.type === "oxygen" ? "Restore up to 100 O₂" : side.type === "battery" ? "Add 10 battery units" : "Unlock scans and manual launch",
          action: () => update(collectRoomItem),
        });
      }
      if (["survivor", "traitor"].includes(side.type) && !(side.type === "survivor" ? state.survivorFound : state.traitorTrusted)) {
        result.push({
          title: "Share 50 oxygen",
          detail: "Accept their offer",
          action: () => update(answerSurvivor, true),
          variant: "signal",
          disabled: state.oxygen <= 50,
        });
        result.push({
          title: "Refuse and leave",
          detail: "Keep your reserve",
          action: () => update(answerSurvivor, false),
        });
      }
      result.push({
        title: "Return to the junction",
        detail: "Movement costs 10 O₂",
        action: () => performMovement("backward", () => update(leaveSideRoom)),
      });
      return result;
    }

    if (room.junction) {
      junctionRooms[room.junction].forEach((roomId) => {
        const target = sideRooms[roomId];
        const scanned = state.scanned.includes(roomId);
        result.push({
          title: `Enter ${target.label}`,
          detail: scanned ? target.scanClue : "Scan pending",
          action: () => performMovement(target.direction, () => update(moveTo, roomId), roomId),
          variant: scanned && target.type === "hazard" ? "danger" : scanned && ["survivor", "traitor"].includes(target.type) ? "signal" : "default",
          roomId,
        });
        if (state.inventory.includes("scanner") && state.battery > 0 && !scanned) {
          result.push({
            title: `Scan ${target.label}`,
            detail: "Costs 1 battery",
            action: () => update(scanRoom, roomId),
            variant: "quiet",
            roomId,
          });
        }
      });
    }
    if (room.action === "comms" && !state.commsRepaired) {
      result.push({
        title: "Send distress signal",
        detail: state.battery ? "Transmit now · costs 1 battery" : "Requires 1 battery · optional",
        action: () => update(repairComms),
        disabled: state.battery < 1,
        variant: "signal",
      });
    }
    if (room.action === "ai" && !state.aiInvestigated) {
      result.push({
        title: "Trace the AI signal",
        detail: "Inspect the routed voiceprint",
        action: () => update(investigateAI),
        variant: "signal",
      });
    }
    if (room.ending) {
      result.push({
        title: "Use the manual launch",
        detail: !state.inventory.includes("engineer-key") ? "Launch key required" : "Costs 2 battery · deny AI access",
        action: () => update(launch, false),
        disabled: state.battery < 2 || !state.inventory.includes("engineer-key"),
        variant: "signal",
      });
      result.push({
        title: "Trust the AI",
        detail: "Grant command access and launch",
        action: () => update(launch, true),
        disabled: state.battery < 2,
        variant: "danger",
      });
      result.push({
        title: state.battery < 2 ? "Go back for battery" : "Retrace your steps",
        detail: state.battery < 2
          ? "Find Auxiliary Power at Starboard H · movement costs 10 O₂"
          : "Return to Deck 02 · movement costs 10 O₂",
        action: () => performMovement("backward", () => update(retreat)),
        variant: state.battery < 2 ? "signal" : "quiet",
      });
    } else {
      result.push({
        title: "Advance forward",
        detail: "Movement costs 10 O₂",
        action: () => performMovement("forward", () => update(advance)),
        variant: "signal",
      });
      if (state.currentRoom !== "1a") {
        result.push({
          title: "Go back",
          detail: "Movement costs 10 O₂",
          action: () => performMovement("backward", () => update(retreat)),
          variant: "quiet",
        });
      }
    }
    return result;
  }, [performMovement, room, state, update]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (restartOpen || movement || event.target.matches("button, a")) return;
      const choice = choices[Number(event.key) - 1];
      if (choice && !choice.disabled) choice.action();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [choices, movement, restartOpen]);

  const restart = () => {
    movementActionRef.current = null;
    setMovement(null);
    clearSave();
    setState({ ...initialGameState });
    setRestartOpen(false);
  };

  const save = () => {
    saveGame(state);
    setSaveConfirmed(true);
  };

  const continueExploring = () => {
    setState((current) => ({ ...current, ending: null, oxygen: Math.max(current.oxygen, 20) }));
  };

  const routeStage =
    state.currentRoom === "1a"
      ? "Awakening"
      : room.deck === 3
        ? "Ascension"
        : "Adventuring";

  if (state.ending) {
    return (
      <EndingScreen
        ending={state.ending}
        onRestart={restart}
        onContinue={failedEndings.has(state.ending) ? undefined : continueExploring}
      />
    );
  }

  return (
    <div className="game-shell">
      <GameHeader
        onRestart={() => setRestartOpen(true)}
        onSave={save}
        saveConfirmed={saveConfirmed}
      />
      <main className="game-layout">
        <StatusPanel state={state} />
        <section className="game-stage">
          <div className="route-line" aria-label={`Current room ${state.currentRoom}`}>
            <span className={routeStage === "Awakening" ? "is-current" : ""}>Awakening</span>
            <i />
            <span className={routeStage === "Adventuring" ? "is-current" : ""}>Adventuring</span>
            <i />
            <span className={routeStage === "Ascension" ? "is-current" : ""}>Ascension</span>
          </div>
          <MovementStage
            stageRef={movementStageRef}
            room={sceneRoom}
            exits={room.junction ? junctionRooms[room.junction].map((roomId) => sideRooms[roomId]) : []}
            direction={movement?.direction}
            targetRoomId={movement?.targetRoomId}
            moving={Boolean(movement)}
            onAnimationEnd={finishMovement}
          />
          <SceneCard room={sceneRoom}>
            <div className="choices" aria-label="Available choices">
              <div className="choices__heading">
                <span>Choose an action</span>
                <span>{choices.length} available</span>
              </div>
              {room.junction && (
                <div className="junction-choices">
                  {junctionRooms[room.junction].map((roomId) => (
                    <div className="junction-choice-row" key={roomId}>
                      {choices
                        .map((choice, index) => ({ choice, index }))
                        .filter(({ choice }) => choice.roomId === roomId)
                        .map(({ choice, index }) => (
                          <ChoiceButton
                            key={choice.title}
                            index={index + 1}
                            {...choice}
                            disabled={Boolean(movement) || choice.disabled}
                            onClick={choice.action}
                          />
                        ))}
                      {state.scanned.includes(roomId) && (
                        <div className="scan-result" role="status">
                          <span>{sideRooms[roomId].label} scan result</span>
                          <strong>
                            {sideRooms[roomId].signal}<br />
                            {sideRooms[roomId].scanClue}
                          </strong>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {choices
                .map((choice, index) => ({ choice, index }))
                .filter(({ choice }) => !room.junction || !choice.roomId)
                .map(({ choice, index }) => (
                  <ChoiceButton
                    key={`${choice.title}-${index}`}
                    index={index + 1}
                    {...choice}
                    disabled={Boolean(movement) || choice.disabled}
                    onClick={choice.action}
                  />
                ))}
            </div>
          </SceneCard>
        </section>
      </main>
      <p className="autosave-note">Progress saved locally after every choice</p>
      <ConfirmDialog open={restartOpen} onCancel={() => setRestartOpen(false)} onConfirm={restart} />
    </div>
  );
}
