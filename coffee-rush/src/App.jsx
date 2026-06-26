import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import SetupPage from './pages/SetupPage';
import GamePage from './pages/GamePage';
import ResultsPage from './pages/ResultsPage';
import './App.css';

export default function App({ queryInviteSecretsScrubbed = false }) {
  return (
    <HashRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <Routes>
        <Route
          path="/"
          element={<SetupPage queryInviteSecretsScrubbed={queryInviteSecretsScrubbed} />}
        />
        <Route path="/game" element={<GamePage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
