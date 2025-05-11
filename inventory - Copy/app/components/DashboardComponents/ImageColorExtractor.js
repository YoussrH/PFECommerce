'use client';
import { useState } from 'react';
import axios from 'axios';

export default function ImageColorExtractor({ onSelectColor }) {
  const [image, setImage] = useState(null);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await axios.post('/api/couleurs/extract', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setColors(response.data);
    } catch (error) {
      console.error('Extraction error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-color-extractor">
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleImageUpload}
        disabled={loading}
      />
      
      {loading && <p>Extracting colors...</p>}
      
      <div className="color-grid">
        {colors.map((color, index) => (
          <div
            key={index}
            className="color-swatch"
            onClick={() => onSelectColor(color)}
            style={{ backgroundColor: color.hexcode }}
            title={color.hexcode}
          >
            <span>{color.hexcode}</span>
          </div>
        ))}
      </div>
    </div>
  );
}