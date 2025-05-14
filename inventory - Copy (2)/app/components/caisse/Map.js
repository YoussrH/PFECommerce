'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const Map = ({ center, onLocationSelect }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      // Initialize map
      mapRef.current = L.map('map').setView([center.lat, center.lng], 15);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      // Add marker
      markerRef.current = L.marker([center.lat, center.lng], {
        draggable: true
      }).addTo(mapRef.current);

      // Handle marker drag
      markerRef.current.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        onLocationSelect({ lat: newPos.lat, lng: newPos.lng });
      });
    } else {
      // Update map center and marker position
      mapRef.current.setView([center.lat, center.lng]);
      markerRef.current.setLatLng([center.lat, center.lng]);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, onLocationSelect]);

  return <div id="map" style={{ height: '100%', width: '100%' }} />;
};

export default Map;