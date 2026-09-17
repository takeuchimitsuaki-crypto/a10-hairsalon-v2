import React from 'react';

export const Messages: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>メッセージ</h2>
      <div style={{
        background: '#fff',
        padding: '20px',
        borderRadius: '8px',
        marginTop: '15px',
        textAlign: 'center',
        color: '#999'
      }}>
        <div style={{ fontSize: '14px' }}>メッセージはまだありません</div>
      </div>
    </div>
  );
};
