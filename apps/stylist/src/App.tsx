import React from 'react';
import { Schedule } from './pages/Schedule';
import './App.css';

function App() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: '15px 20px',
        background: '#1976d2',
        color: '#fff',
        fontSize: '16px',
        fontWeight: 'bold',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        スタイリスト用アプリ
      </header>
      <Schedule />
    </div>
  );
}

export default App;
