import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const severityColor = (s) => ({
  Fatal: '#ef4444',
  Severe: '#f59e0b',
  Moderate: '#3b82f6',
  Minor: '#10b981'
}[s] || '#94a3b8');

const MapPage = () => {
  const [mapData, setMapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    api.get('/data/map')
      .then(r => setMapData(r.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? mapData : mapData.filter(d => d.Severity === filter);

  return (
    <Layout>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: '2rem', fontWeight: 700, margin: 0 }}>🗺️ Accident Hotspot Map</h1>
          <p style={{ color: '#94a3b8', marginTop: '0.4rem' }}>Spatial distribution of accidents across India</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['All', 'Fatal', 'Severe', 'Moderate', 'Minor'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                padding: '0.45rem 1rem', borderRadius: '999px', border: `1px solid ${s === 'All' ? '#475569' : severityColor(s)}`,
                background: filter === s ? (s === 'All' ? '#475569' : severityColor(s)) : 'transparent',
                color: '#f8fafc', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['Fatal', 'Severe', 'Moderate', 'Minor'].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: severityColor(s) }}></div>
            {s}
          </div>
        ))}
      </div>

      <div style={{ height: 'calc(100vh - 280px)', minHeight: 450, borderRadius: '1rem', overflow: 'hidden', border: '1px solid #334155' }}>
        {loading ? (
          <div style={{ height: '100%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗺️</div>
              <p>Loading map data...</p>
            </div>
          </div>
        ) : (
          <MapContainer center={[20.5937, 78.9629]} zoom={5} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filtered.map((acc, i) => (
              <CircleMarker
                key={i}
                center={[acc.Latitude, acc.Longitude]}
                radius={6}
                pathOptions={{ color: severityColor(acc.Severity), fillColor: severityColor(acc.Severity), fillOpacity: 0.7, weight: 1 }}
              >
                <Popup>
                  <div style={{ fontSize: '13px', minWidth: 160 }}>
                    <strong style={{ color: '#1e293b' }}>{acc.City || 'Unknown'}, {acc.State}</strong>
                    <div style={{ marginTop: 6, color: '#374151' }}>
                      <div>Severity: <span style={{ fontWeight: 600, color: severityColor(acc.Severity) }}>{acc.Severity}</span></div>
                      <div>Weather: {acc.Weather_Condition}</div>
                      <div>Speed: {acc.Speed} km/h</div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>

      <div style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.8rem', textAlign: 'right' }}>
        Showing {filtered.length} accidents
      </div>
    </Layout>
  );
};

export default MapPage;
