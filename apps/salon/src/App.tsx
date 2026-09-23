import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { Schedule } from './pages/Schedule';
import { Settings } from './pages/Settings';
import { Customers } from './pages/Customers';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { staffAuth } from './auth/client';
import './App.css';

// ログインしていなければ、どの画面を開いてもログイン画面を表示する
function AuthenticatedApp() {
  const { session, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>読み込み中...</div>;
  }
  if (!session) return <Login />;

  return (
    <Router>
      <div style={{ display: 'flex', height: '100vh' }}>
        <Navigation />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/customers" element={<Customers />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider client={staffAuth}>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
