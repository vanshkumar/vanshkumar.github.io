import { HashRouter, Routes, Route } from 'react-router-dom';
import DesiresListPage from './pages/DesiresListPage';
import PairwiseComparisonPage from './pages/PairwiseComparisonPage';
import ResultsPage from './pages/ResultsPage';
import './App.css';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<DesiresListPage />} />
        <Route path="/compare" element={<PairwiseComparisonPage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
