import { useLocation, useNavigate } from 'react-router-dom';
import './ResultsPage.css';
import Attribution from '../components/Attribution';
import html2canvas from 'html2canvas';

function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const items = location.state?.items || [];
  const scores = location.state?.scores || []; // Retrieve scores
  const isPartialRanking = location.state?.isPartialRanking;

  const handleRestart = () => {
    navigate('/', { replace: true });
  };

  if (items.length === 0) {
    navigate('/');
    return null;
  }

  // Sort items based on scores (higher score means more important)
  const sortedItems = [...items].sort((a, b) => {
    const aIndex = items.indexOf(a);
    const bIndex = items.indexOf(b);
    return scores[bIndex] - scores[aIndex]; // Sort in descending order
  });

  // Function to copy results to clipboard
  const copyToClipboard = () => {
    const resultsText = sortedItems.map((item, index) => 
      `${index + 1}. ${item.name} - ${item.description}`
    ).join('\n');
    
    navigator.clipboard.writeText(resultsText)
      .then(() => {
        alert('Results copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  // Function to take a screenshot
  const takeScreenshot = () => {
    const resultsDiv = document.querySelector('.results-list');
    html2canvas(resultsDiv).then(canvas => {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'results_screenshot.png';
      link.click();
    });
  };

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
        {sortedItems.map((item, index) => (
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
      
      <div className="button-container">
        <button onClick={copyToClipboard} className="copy-button">
          Copy Results
        </button>
        <button onClick={takeScreenshot} className="screenshot-button">
          Take Screenshot
        </button>
      </div>
      
      <Attribution />
    </div>
  );
}

export default ResultsPage; 