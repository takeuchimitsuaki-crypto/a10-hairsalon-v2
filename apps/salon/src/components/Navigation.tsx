import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: 'ダッシュボード', path: '/' },
    { label: 'スケジュール', path: '/schedule' },
    { label: '顧客管理', path: '/customers' },
    { label: '設定', path: '/settings' }
  ];

  return (
    <nav style={{
      width: '250px',
      background: '#f5f5f5',
      borderRight: '1px solid #e0e0e0',
      height: 'calc(100vh - 60px)',
      overflowY: 'auto'
    }}>
      <ul style={{ listStyle: 'none', margin: 0, padding: '20px 0' }}>
        {menuItems.map(item => (
          <li key={item.path}>
            <button
              onClick={() => navigate(item.path)}
              style={{
                width: '100%',
                padding: '12px 20px',
                border: 'none',
                background: location.pathname === item.path ? '#e3f2fd' : 'transparent',
                color: location.pathname === item.path ? '#1976d2' : '#333',
                textAlign: 'left',
                cursor: 'pointer',
                borderLeft: location.pathname === item.path ? '3px solid #1976d2' : 'none',
                fontSize: '14px'
              }}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};
