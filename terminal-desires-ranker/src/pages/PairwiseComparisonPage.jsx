import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PairwiseComparisonPage.css';
import Attribution from '../components/Attribution';

function PairwiseComparisonPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [currentPair, setCurrentPair] = useState([0, 1]);
  const [pairsInPass, setPairsInPass] = useState([]);
  const [hasSwappedInPass, setHasSwappedInPass] = useState(false);

  useEffect(() => {
    if (!location.state?.items) {
      navigate('/');
      return;
    }
    setItems(location.state.items);
  }, [location.state, navigate]);

  useEffect(() => {
    if (items.length < 2) return;
    
    setHasSwappedInPass(false);
    const pairs = [];
    for (let i = 0; i < items.length - 1; i++) {
      pairs.push([i, i + 1]);
    }
    setPairsInPass(pairs);
    setCurrentPair(pairs[0]);
  }, [items]);

  const handleChoice = (chosenIndex) => {
    const [leftIndex, rightIndex] = currentPair;
    let itemsToUse = items;
    
    if (chosenIndex === rightIndex) {
      const newItems = [...items];
      [newItems[leftIndex], newItems[rightIndex]] = [newItems[rightIndex], newItems[leftIndex]];
      setItems(newItems);
      setHasSwappedInPass(true);
      itemsToUse = newItems;
    }

    const currentPairIndex = pairsInPass.findIndex(
      pair => pair[0] === leftIndex && pair[1] === rightIndex
    );

    if (currentPairIndex === pairsInPass.length - 1) {
      if (!hasSwappedInPass || items.length === 2) {
        navigate('/results', { state: { items: itemsToUse } });
      } else {
        const newPairs = [];
        for (let i = 0; i < itemsToUse.length - 1; i++) {
          newPairs.push([i, i + 1]);
        }
        setPairsInPass(newPairs);
        setCurrentPair(newPairs[0]);
      }
    } else {
      setCurrentPair(pairsInPass[currentPairIndex + 1]);
    }
  };

  const handleRestart = () => {
    navigate('/', { replace: true });
  };

  const handleEnd = () => {
    navigate('/results', { 
      state: { 
        items,
        isPartialRanking: true // Always true when ending early
      } 
    });
  };

  if (items.length < 2) return null;

  const [leftIndex, rightIndex] = currentPair;
  const leftItem = items[leftIndex];
  const rightItem = items[rightIndex];

  return (
    <div className="comparison-page">
      <h1>Which matters more to you?</h1>

      <h2>Pay attention to how you feel.</h2>

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