import React, { useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const inputStyle = {
  width: '100%', background: '#0f172a', border: '1px solid #475569',
  borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: '#f8fafc',
  fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box'
};

const selectStyle = { ...inputStyle };

const labelStyle = { display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.3rem' };

const formGroups = [
  { label: 'State', name: 'State', type: 'select', opts: ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Telangana'] },
  { label: 'City', name: 'City', type: 'text' },
  { label: 'Urban / Rural', name: 'Urban_Rural', type: 'select', opts: ['Urban', 'Rural'] },
  { label: 'Weather', name: 'Weather_Condition', type: 'select', opts: ['Clear', 'Rainy', 'Foggy', 'Cloudy', 'Dust Storm'] },
  { label: 'Light Condition', name: 'Light_Condition', type: 'select', opts: ['Daylight', 'Night - Street Lights On', 'Night - No Street Lights', 'Twilight'] },
  { label: 'Road Surface', name: 'Road_Surface_Condition', type: 'select', opts: ['Dry', 'Wet', 'Potholed', 'Muddy'] },
  { label: 'Road Type', name: 'Road_Type', type: 'select', opts: ['National Highway', 'State Highway', 'City Road', 'Rural Road'] },
  { label: 'Road Category', name: 'Road_Category', type: 'select', opts: ['Single Lane', 'Double Lane', 'Four Lane', 'Six Lane'] },
  { label: 'Junction Type', name: 'Junction_Type', type: 'select', opts: ['Intersection', 'Roundabout', 'T-Junction', 'Y-Junction', 'No Junction'] },
  { label: 'Traffic Control', name: 'Traffic_Control', type: 'select', opts: ['Traffic Signal', 'Stop Sign', 'Police Controlled', 'None'] },
  { label: 'Vehicle Type', name: 'Vehicle_Type', type: 'select', opts: ['Two-Wheeler', 'Car', 'Bus', 'Truck', 'Auto Rickshaw', 'Tractor'] },
  { label: 'Driver Gender', name: 'Driver_Gender', type: 'select', opts: ['Male', 'Female', 'Unknown'] },
  { label: 'Day of Week', name: 'Day_of_Week', type: 'select', opts: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
  { label: 'Speed (km/h)', name: 'Speed', type: 'number' },
  { label: 'Driver Age', name: 'Driver_Age', type: 'number' },
  { label: 'Number of Vehicles', name: 'Number_of_Vehicles', type: 'number' },
  { label: 'Alcohol Involved (0/1)', name: 'Alcohol_Involvement', type: 'number', min: 0, max: 1 },
  { label: 'Hour (0-23)', name: 'Hour', type: 'number', min: 0, max: 23 },
  { label: 'Month (1-12)', name: 'Month', type: 'number', min: 1, max: 12 },
  { label: 'Year', name: 'Year', type: 'number' },
];

const DEFAULTS = {
  State: 'Maharashtra', City: 'Mumbai', Urban_Rural: 'Urban',
  Weather_Condition: 'Clear', Light_Condition: 'Daylight',
  Road_Surface_Condition: 'Dry', Road_Type: 'City Road',
  Road_Category: 'Four Lane', Junction_Type: 'Intersection',
  Traffic_Control: 'Traffic Signal', Vehicle_Type: 'Car',
  Driver_Gender: 'Male', Day_of_Week: 'Monday',
  Speed: 60, Driver_Age: 35, Number_of_Vehicles: 2,
  Alcohol_Involvement: 0, Hour: 14, Month: 6, Year: 2024,
  District: 'Mumbai District',
};

const severityColor = (s) => ({ Fatal: '#ef4444', Severe: '#f59e0b', Moderate: '#3b82f6', Minor: '#10b981' }[s] || '#94a3b8');

const Predict = () => {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      const payload = { ...form, Speed: +form.Speed, Driver_Age: +form.Driver_Age, Number_of_Vehicles: +form.Number_of_Vehicles, Alcohol_Involvement: +form.Alcohol_Involvement, Hour: +form.Hour, Month: +form.Month, Year: +form.Year };
      const res = await api.post('/ml/predict', payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const sev = result?.predicted_severity;
  const col = severityColor(sev);

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: '#f8fafc', fontSize: '2rem', fontWeight: 700, margin: 0 }}>🤖 AI Prediction Engine</h1>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Fill the scenario to predict accident severity and contributing factors.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1.5fr 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Form */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', padding: '1.75rem' }}>
          <h2 style={{ color: '#f8fafc', fontWeight: 600, fontSize: '1.1rem', margin: '0 0 1.25rem 0', paddingBottom: '0.75rem', borderBottom: '1px solid #334155' }}>Scenario Inputs</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {formGroups.map(f => (
                <div key={f.name}>
                  <label style={labelStyle}>{f.label}</label>
                  {f.type === 'select' ? (
                    <select name={f.name} value={form[f.name]} onChange={handleChange} style={selectStyle}>
                      {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange} min={f.min} max={f.max} style={inputStyle} required />
                  )}
                </div>
              ))}
            </div>

            {error && <div style={{ marginTop: '1.25rem', padding: '0.875rem', background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '0.625rem', fontSize: '0.875rem' }}>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: '1.5rem', background: loading ? '#1e40af' : '#2563eb', color: '#fff', border: 'none', borderRadius: '0.625rem', padding: '0.8rem 2rem', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s' }}
            >
              {loading ? <>⏳ Predicting...</> : <>🔍 Generate Prediction</>}
            </button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Severity Card */}
            <div style={{ background: '#1e293b', border: `1px solid ${col}`, borderRadius: '1rem', padding: '1.75rem', boxShadow: `0 0 25px ${col}33` }}>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Predicted Severity</div>
              <div style={{ color: col, fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.25rem' }}>{sev}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ background: '#0f172a', borderRadius: '0.625rem', padding: '0.875rem' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>Risk Score</div>
                  <div style={{ color: col, fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>{result.risk_score?.toFixed(1)}<span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>/100</span></div>
                </div>
                <div style={{ background: '#0f172a', borderRadius: '0.625rem', padding: '0.875rem' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>Confidence</div>
                  <div style={{ color: '#f8fafc', fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>{result.confidence?.toFixed(1)}<span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>%</span></div>
                </div>
              </div>
            </div>

            {/* SHAP Explanation */}
            {result.top_factors && result.top_factors.length > 0 && (
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', padding: '1.5rem' }}>
                <h3 style={{ color: '#f8fafc', fontWeight: 600, margin: '0 0 1rem 0', fontSize: '0.95rem' }}>🔬 Key Contributing Factors (SHAP)</h3>
                {result.top_factors.map((f, i) => {
                  const isRisk = f.impact > 0;
                  const bar = Math.min(100, Math.abs(f.impact) * 15);
                  const cleanName = f.feature.replace('num__', '').replace('cat__', '').replace(/_/g, ' ');
                  return (
                    <div key={i} style={{ marginBottom: '0.875rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ color: '#f8fafc', fontSize: '0.8rem', textTransform: 'capitalize' }}>{cleanName}</span>
                        <span style={{ color: isRisk ? '#ef4444' : '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>{isRisk ? '▲ Increases Risk' : '▼ Decreases Risk'}</span>
                      </div>
                      <div style={{ background: '#0f172a', borderRadius: '999px', height: '6px' }}>
                        <div style={{ width: `${bar}%`, height: '6px', borderRadius: '999px', background: isRisk ? '#ef4444' : '#10b981', transition: 'width 0.5s ease' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Safety Measures */}
            {result.safety_measures && (
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', padding: '1.5rem' }}>
                <h3 style={{ color: '#f8fafc', fontWeight: 600, margin: '0 0 0.875rem 0', fontSize: '0.95rem' }}>🛡️ Safety Recommendations</h3>
                <ul style={{ margin: 0, padding: '0 0 0 1rem', color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.8 }}>
                  {result.safety_measures.map((m, i) => (
                    <li key={i} style={{ color: m.includes('NEVER') || m.includes('Extreme') ? '#ef4444' : '#94a3b8', fontWeight: m.includes('NEVER') ? 700 : 400 }}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Predict;
