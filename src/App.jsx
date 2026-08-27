import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import GameEntrance from "./pages/GameEntrance";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
import { sounds } from "./utils/sounds";

export default function App() {
  useEffect(() => {
    sounds.playStartup();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/entrance" element={<GameEntrance />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
