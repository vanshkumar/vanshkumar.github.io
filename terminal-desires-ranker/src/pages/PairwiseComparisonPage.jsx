import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PairwiseComparisonPage.css';
import Attribution from '../components/Attribution';

function PairwiseComparisonPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [currentPair, setCurrentPair] = useState([0, 1]);
  const [comparedPairs, setComparedPairs] = useState(new Set());
  
  useEffect(() => {
    if (!location.state?.items) {
      navigate('/');
      return;
    }
    setItems(location.state.items);
  }, [location.state, navigate]);

  // Helper to get a consistent pair key regardless of order
  const getPairKey = (id1, id2) => {
    // Always put smaller ID first to ensure consistency
    return [id1, id2].sort().join('-');
  };

  // Generate all possible unique pairs
  const generateUniquePair = () => {
    const n = items.length;
    
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const pairKey = getPairKey(items[i].id, items[j].id);
        if (!comparedPairs.has(pairKey)) {
          return [i, j];
        }
      }
    }
    return null;
  };

  useEffect(() => {
    if (items.length < 2) return;
    const nextPair = generateUniquePair();
    if (nextPair) {
      setCurrentPair(nextPair);
    } else {
      // All pairs have been compared, navigate to results
      navigate('/results', { state: { items } });
    }
  }, [items, comparedPairs]); // Add comparedPairs as dependency

  const handleChoice = (chosenIndex) => {
    const [leftIndex, rightIndex] = currentPair;
    const leftItem = items[leftIndex];
    const rightItem = items[rightIndex];

    const pairKey = getPairKey(leftItem.id, rightItem.id);
    
    // Record this comparison
    setComparedPairs(prev => {
      const newSet = new Set([...prev, pairKey]);
      return newSet;
    });
    
    if (chosenIndex === rightIndex) {
      const newItems = [...items];
      [newItems[leftIndex], newItems[rightIndex]] = [newItems[rightIndex], newItems[leftIndex]];
      setItems(newItems);
    }

    // Generate next pair
    const nextPair = generateUniquePair();
    if (nextPair) {
      setCurrentPair(nextPair);
    } else {
      navigate('/results', { state: { items } });
    }
  };

  const handleRestart = () => {
    navigate('/', { replace: true });
  };

  const handleEnd = () => {
    navigate('/results', { 
      state: { 
        items,
        isPartialRanking: true
      } 
    });
  };

  if (items.length < 2) return null;

  const [leftIndex, rightIndex] = currentPair;
  const leftItem = items[leftIndex];
  const rightItem = items[rightIndex];

  // Calculate progress
  const totalPairs = (items.length * (items.length - 1)) / 2;
  const progress = Math.round((comparedPairs.size / totalPairs) * 100);

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