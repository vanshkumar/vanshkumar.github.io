import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { seedDesires } from '../data/seedDesires';
import './DesiresListPage.css';
import Attribution from '../components/Attribution';

function DesiresListPage() {
  const navigate = useNavigate();
  const [desires, setDesires] = useState(seedDesires);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [showTooltip, setShowTooltip] = useState(null);

  const handleAddDesire = () => {
    if (!newName.trim() || desires.length >= 25) return;

    const newDesire = {
      id: String(Date.now()),
      name: newName.trim(),
      description: newDescription.trim()
    };

    setDesires([newDesire, ...desires]);
    setNewName('');
    setNewDescription('');
  };

  const handleRemove = (id) => {
    setDesires(desires.filter(d => d.id !== id));
  };

  const handleStart = () => {
    navigate('/compare', { state: { items: desires } });
  };

  return (
    <div className="desires-list-page">
      <h1>Terminal Desires Ranker</h1>
      
      <p className="header-text">
        Terminal desires are the true underlying reasons why you do everything. 
        Edit the list of potential terminal desires below and press Start at the
        bottom once you're ready to pairwise compare to see what might be pulling
        you.
      </p>

      <div className="add-desire-form">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Name (required)"
          maxLength={50}
          aria-label="Desire name"
        />
        <input
          type="text"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Description (optional)"
          aria-label="Desire description"
        />
        <button 
          onClick={handleAddDesire}
          disabled={desires.length >= 25}
          className="add-button"
          aria-label="Add desire"
        >
          ✓
        </button>
      </div>

      {desires.length >= 25 && (
        <p className="warning">
          You've reached the 25-item limit. Remove an item to add another.
        </p>
      )}

      <div className="desires-grid">
        {desires.map((desire) => (
          <div 
            key={desire.id}
            className="card"
            onMouseEnter={() => setShowTooltip(desire.id)}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <button
              onClick={() => handleRemove(desire.id)}
              className="remove-button"
              aria-label="Remove desire"
            >
              ✕
            </button>
            <h3>{desire.name}</h3>
            {showTooltip === desire.id && (
              <div className="tooltip" role="tooltip">
                {desire.description}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleStart}
        disabled={desires.length < 2}
        className="start-button"
      >
        Start
      </button>
      <Attribution />
    </div>
  );
}

export default DesiresListPage; 