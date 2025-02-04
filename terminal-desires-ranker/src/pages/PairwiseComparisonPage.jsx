import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PairwiseComparisonPage.css';
import Attribution from '../components/Attribution';

function PairwiseComparisonPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [pairs, setPairs] = useState([]); // Store all unique pairs
  const [currentPairIndex, setCurrentPairIndex] = useState(0); // Index of the current pair
  const [scores, setScores] = useState([]); // Store scores for each item

  useEffect(() => {
    if (!location.state?.items) {
      navigate('/');
      return;
    }
    setItems(location.state.items);
    setScores(new Array(location.state.items.length).fill(0)); // Initialize scores
  }, [location.state, navigate]);

  // Generate all possible unique pairs
  const generateUniquePairs = () => {
    const uniquePairs = [];
    const n = items.length;

    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        uniquePairs.push([i, j]);
      }
    }
    return uniquePairs;
  };

  useEffect(() => {
    if (items.length < 2) return;
    const allPairs = generateUniquePairs();
    // Shuffle pairs
    const shuffledPairs = allPairs.sort(() => Math.random() - 0.5);
    setPairs(shuffledPairs);
  }, [items]);

  const handleChoice = (chosenIndex) => {
    const [leftIndex, rightIndex] = pairs[currentPairIndex];
    const result = chosenIndex === rightIndex ? rightIndex : leftIndex;

    // Update scores for the winner
    setScores(prevScores => {
      const newScores = [...prevScores];
      newScores[result] += 1; // Increment score for the winner
      return newScores;
    });

    // Move to the next pair
    if (currentPairIndex + 1 < pairs.length) {
      setCurrentPairIndex(currentPairIndex + 1);
    } else {
      // All pairs have been compared, navigate to results
      navigate('/results', { state: { items, scores } });
    }
  };

  const handleRestart = () => {
    navigate('/', { replace: true });
  };

  const handleEnd = () => {
    navigate('/results', { 
      state: { 
        items,
        scores,
        isPartialRanking: true
      } 
    });
  };

  if (items.length < 2 || pairs.length === 0) return null;

  const [leftIndex, rightIndex] = pairs[currentPairIndex];
  const leftItem = items[leftIndex];
  const rightItem = items[rightIndex];

  // Calculate progress
  const totalPairs = pairs.length;
  const progress = Math.round(((currentPairIndex + 1) / totalPairs) * 100);

  return (
    <div className="comparison-page">
      <h1>Which matters more to you?</h1>
      <h2>Pay attention to how you feel.</h2>

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        ></div>
        <span className="progress-text">{progress}% Complete</span>
      </div>

      <div className="comparison-cards">
        <div 
          className="card comparison-card"
          onClick={() => handleChoice(leftIndex)}
          onMouseEnter={(e) => {
            const tooltip = e.currentTarget.querySelector('.tooltip');
            if (tooltip) tooltip.style.display = 'block';
          }}
          onMouseLeave={(e) => {
            const tooltip = e.currentTarget.querySelector('.tooltip');
            if (tooltip) tooltip.style.display = 'none';
          }}
        >
          <h2>{leftItem.name}</h2>
          <div className="tooltip" style={{ display: 'none' }}>
            {leftItem.description}
          </div>
        </div>

        <div 
          className="card comparison-card"
          onClick={() => handleChoice(rightIndex)}
          onMouseEnter={(e) => {
            const tooltip = e.currentTarget.querySelector('.tooltip');
            if (tooltip) tooltip.style.display = 'block';
          }}
          onMouseLeave={(e) => {
            const tooltip = e.currentTarget.querySelector('.tooltip');
            if (tooltip) tooltip.style.display = 'none';
          }}
        >
          <h2>{rightItem.name}</h2>
          <div className="tooltip" style={{ display: 'none' }}>
            {rightItem.description}
          </div>
        </div>
      </div>

      <div className="button-group">
        <button onClick={handleRestart} className="restart-button">
          Restart
        </button>
        <button onClick={handleEnd} className="end-button">
          End
        </button>
      </div>
      <Attribution />
    </div>
  );
}

export default PairwiseComparisonPage; 