import React from 'react';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TabBar: React.FC<Props> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'schedule', label: '予約表' },
    { id: 'charts', label: 'カルテ' },
    { id: 'messages', label: 'メッセージ' },
    { id: 'settings', label: '設定' }
  ];

  return (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid #e0e0e0',
      background: '#fff'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            background: activeTab === tab.id ? '#1976d2' : '#f5f5f5',
            color: activeTab === tab.id ? '#fff' : '#333',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === tab.id ? 'bold' : 'normal',
            borderBottom: activeTab === tab.id ? '3px solid #1976d2' : 'none'
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
