import React from 'react';

export const History: React.FC = () => {
  const mockHistory = [
    { id: '1', date: '2026-09-10', stylist: 'タナカ', menu: 'カット', time: '14:00' },
    { id: '2', date: '2026-09-03', stylist: 'サトウ', menu: 'カット＆カラー', time: '10:30' }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>来店履歴</h2>
      <div style={{ marginTop: '15px' }}>
        {mockHistory.map(item => (
          <div key={item.id} style={{
            background: '#fff',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '10px',
            borderLeft: '4px solid #1976d2'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.menu}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  {item.stylist} - {item.date} {item.time}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
