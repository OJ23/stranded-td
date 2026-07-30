import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChoiceButton from "../components/ChoiceButton";
import ConfirmDialog from "../components/ConfirmDialog";
import EndingScreen from "../components/EndingScreen";
import GameHeader from "../components/GameHeader";
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

export default function GamePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState(() =>
    location.state?.newGame ? initialGameState : loadGame() ?? initialGameState,
  );
  const [restartOpen, setRestartOpen] = useState(false);
  const corridor = getCorridor(state.currentRoom);
  const room = corridor ?? sideRooms[state.currentRoom];
  const isSideRoom = !corridor;

  useEffect(() => {
    saveGame(state);
  }, [state]);

  const update = useCallback((fn, ...args) => {
    setState((current) => fn(current, ...args));
  }, []);

  const choices = useMemo(() => {
    if (state.ending) return [];
    const result = [];
    const side = sideRooms[state.currentRoom];

    if (side) {
      const collected = state.inventory.includes(`${side.id}-collected`);
      if (["scanner", "battery", "oxygen"].includes(side.type) && !collected) {
        result.push({
          title: side.type === "scanner" ? "Take the scanner" : side.type === "battery" ? "Recover the power cell" : "Refill suit oxygen",
          detail: side.type === "oxygen" ? "Restore up to 100 O₂" : side.type === "battery" ? "Add 5 battery units" : "Unlock room scans",
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
        action: () => update(leaveSideRoom),
      });
      return result;
    }

    if (room.junction) {
      junctionRooms[room.junction].forEach((roomId) => {
        const target = sideRooms[roomId];
        const scanned = state.scanned.includes(roomId);
        result.push({
          title: `Enter ${target.label}`,
          detail: scanned ? target.signal : target.name,
          action: () => update(moveTo, roomId),
          variant: scanned && target.type === "hazard" ? "danger" : scanned && ["survivor", "traitor"].includes(target.type) ? "signal" : "default",
        });
        if (state.inventory.includes("scanner") && state.battery > 0 && !scanned) {
          result.push({
            title: `Scan ${target.label}`,
            detail: "Costs 1 battery",
            action: () => update(scanRoom, roomId),
            variant: "quiet",
          });
        }
      });
    }
    if (room.action === "comms" && !state.commsRepaired) {
      result.push({
        title: "Repair communications",
        detail: state.battery ? "Costs 1 battery" : "Portable battery required",
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
        detail: "Costs 2 battery · deny AI access",
        action: () => update(launch, false),
        disabled: state.battery < 2,
        variant: "signal",
      });
      result.push({
        title: "Trust the AI",
        detail: "Grant command access and launch",
        action: () => update(launch, true),
        disabled: state.battery < 2,
        variant: "danger",
      });
    } else {
      result.push({
        title: "Advance forward",
        detail: "Movement costs 10 O₂",
        action: () => update(advance),
        variant: "signal",
      });
      if (state.currentRoom !== "1a") {
        result.push({
          title: "Go back",
          detail: "Movement costs 10 O₂",
          action: () => update(retreat),
          variant: "quiet",
        });
      }
    }
    return result;
  }, [room, state, update]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (restartOpen || event.target.matches("button, a")) return;
      const choice = choices[Number(event.key) - 1];
      if (choice && !choice.disabled) choice.action();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [choices, restartOpen]);

  const restart = () => {
    clearSave();
    setState({ ...initialGameState });
    setRestartOpen(false);
  };

  const continueExploring = () => {
    setState((current) => ({ ...current, ending: null, oxygen: Math.max(current.oxygen, 20) }));
  };

  if (state.ending) {
    return (
      <EndingScreen
        ending={state.ending}
        onRestart={restart}
        onContinue={continueExploring}
      />
    );
  }

  return (
    <div className="game-shell">
      <GameHeader onRestart={() => setRestartOpen(true)} />
      <main className="game-layout">
        <StatusPanel state={state} />
        <section className="game-stage">
          <div className="route-line" aria-label={`Current room ${state.currentRoom}`}>
            <span>Awakening</span>
            <i />
            <strong>{isSideRoom ? "Detour" : room.deck === 3 ? "Ascension" : "Adventuring"}</strong>
            <i />
            <span>Escape</span>
          </div>
          <SceneCard room={room}>
            <div className="choices" aria-label="Available choices">
              <div className="choices__heading">
                <span>Choose an action</span>
                <span>{choices.length} available</span>
              </div>
              {choices.map((choice, index) => (
                <ChoiceButton key={`${choice.title}-${index}`} index={index + 1} {...choice} onClick={choice.action} />
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
