'use client';
import { useState } from 'react';
import axios from 'axios';

export default function ColorSearch({ onSelectColor }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/couleurs/search?query=${query}`);
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="color-search">
      <div className="search-box">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter color name..."
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      <div className="results">
        {results.map((color, index) => (
          <div 
            key={index} 
            className="color-swatch"
            onClick={() => onSelectColor(color)}
            style={{ backgroundColor: color.hexcode }}
            title={`${color.libelle} - ${color.hexcode}`}
          >
            <span>{color.libelle || color.hexcode}</span>
          </div>
        ))}
      </div>
    </div>
  );
}