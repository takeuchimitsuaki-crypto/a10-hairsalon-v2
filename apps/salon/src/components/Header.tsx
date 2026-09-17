import React from 'react';

export const Header: React.FC<{ title: string }> = ({ title }) => {
  return (
    <header style={{
      padding: '20px',
      background: '#fff',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{title}</h1>
      <div style={{ fontSize: '12px', color: '#666' }}>
        {new Date().toLocaleDateString('ja-JP')}
      </div>
    </header>
  );
};
