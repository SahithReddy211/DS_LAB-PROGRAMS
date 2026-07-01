import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Basic layouts for now
const ProtectedRoute = ({ children }) => {
  // const { user } = useContext(AuthContext);
  // if (!user) {
  //   return <Navigate to="/login" replace />;
  // }
  return children;
};

// We will create these pages next
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Predict from './pages/Predict';
import MapPage from './pages/MapPage';

const AppContent = () => {
  return (
    <Router>
      <div className="min-h-screen bg-background text-textLight">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/predict" element={
            <ProtectedRoute>
              <Predict />
            </ProtectedRoute>
          } />
          <Route path="/map" element={
            <ProtectedRoute>
              <MapPage />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
