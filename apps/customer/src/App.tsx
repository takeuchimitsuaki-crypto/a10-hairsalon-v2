import React, { useState } from 'react';
import { Booking } from './pages/Booking';
import { History } from './pages/History';
import { Messages } from './pages/Messages';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('booking');

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
        マイサロン
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0',
          background: '#fff',
          borderBottom: '1px solid #e0e0e0'
        }}>
          {['booking', 'history', 'messages'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '15px',
                border: 'none',
                background: activeTab === tab ? '#1976d2' : '#f5f5f5',
                color: activeTab === tab ? '#fff' : '#333',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
                borderBottom: activeTab === tab ? '3px solid #1976d2' : 'none'
              }}
            >
              {tab === 'booking' && '予約する'}
              {tab === 'history' && '来店履歴'}
              {tab === 'messages' && 'メッセージ'}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'booking' && <Booking />}
          {activeTab === 'history' && <History />}
          {activeTab === 'messages' && <Messages />}
        </div>
      </div>
    </div>
  );
}

export default App;
