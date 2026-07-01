import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#2563eb', '#8b5cf6', '#ec4899'];

const KPICard = ({ title, value, icon, color }) => (
  <div style={{
    background: '#1e293b', border: '1px solid #334155', borderRadius: '1rem',
    padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
  }}>
    <div style={{ fontSize: '2.5rem', background: '#0f172a', borderRadius: '0.75rem', padding: '0.75rem', lineHeight: 1 }}>{icon}</div>
    <div>
      <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
      <div style={{ color: color || '#f8fafc', fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>{value}</div>
    </div>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div style={{
    background: '#1e293b', border: '1px solid #334155', borderRadius: '1rem',
    padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
  }}>
    <h3 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', margin: '0 0 1.25rem 0' }}>{title}</h3>
    {children}
  </div>
);

const TOOLTIP_STYLE = { contentStyle: { background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', borderRadius: '0.5rem' }, labelStyle: { color: '#94a3b8' } };

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/data/stats')
      .then(r => setStats(r.data))
      .catch(e => setError('Failed to load statistics. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div style={{ padding: '2rem', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '1rem', color: '#ef4444' }}>
        ⚠️ {error}
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: '#f8fafc', fontSize: '2rem', fontWeight: 700, margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Indian Traffic Accident Analysis Overview</p>
      </div>

      {stats && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <KPICard title="Total Accidents" value={stats.total_accidents?.toLocaleString()} icon="🚗" />
            <KPICard title="Fatal Accidents" value={stats.fatal_accidents?.toLocaleString()} icon="💀" color="#ef4444" />
            <KPICard title="Avg Speed (km/h)" value={stats.avg_speed} icon="⚡" color="#f59e0b" />
            <KPICard title="Total Casualties" value={stats.total_casualties?.toLocaleString()} icon="🏥" color="#8b5cf6" />
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

            {/* Monthly Trend */}
            <ChartCard title="Monthly Accident Trend">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={stats.month_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="Month" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Severity Pie */}
            <ChartCard title="Severity Distribution">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={stats.severity_dist} cx="50%" cy="50%" innerRadius={75} outerRadius={110} paddingAngle={4} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {stats.severity_dist.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* State Distribution */}
          <ChartCard title="Accidents by State">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.state_dist} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: '#334155' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {stats.state_dist.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;
