import { useLocation, useNavigate } from 'react-router-dom';
import { seedDesires } from '../data/seedDesires';
import './ResultsPage.css';
import Attribution from '../components/Attribution';

function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const items = location.state?.items || [];
  const isPartialRanking = location.state?.isPartialRanking;

  const handleRestart = () => {
    navigate('/', { replace: true });
  };

  if (items.length === 0) {
    navigate('/');
    return null;
  }

  return (
    <div className="results-page">
      <h1>Your Ranked Terminal Desires</h1>
      
      {isPartialRanking && (
        <p className="partial-warning">
          Note: This is a partial ranking since the comparison was ended early. 
          Some items may not be in their final position.
        </p>
      )}
      
      <div className="results-list">
        {items.map((item, index) => (
          <div key={item.id} className="result-item">
            <div className="rank">{index + 1}</div>
            <div className="content">
              <h2>{item.name}</h2>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleRestart} className="restart-button">
        Restart
      </button>
      <Attribution />
    </div>
  );
}

export default ResultsPage; 