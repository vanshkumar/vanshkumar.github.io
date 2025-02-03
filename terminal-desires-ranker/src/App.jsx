import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DesiresListPage from './pages/DesiresListPage';
import PairwiseComparisonPage from './pages/PairwiseComparisonPage';
import ResultsPage from './pages/ResultsPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DesiresListPage />} />
        <Route path="/compare" element={<PairwiseComparisonPage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
