import React from 'react';
import { Header } from '../components/Header';

export const Settings: React.FC = () => {
  return (
    <>
      <Header title="設定" />
      <div style={{ padding: '20px' }}>
        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginTop: 0 }}>スタイリスト管理</h2>
          <p style={{ color: '#999' }}>スタイリストの追加・編集機能は準備中です</p>
        </div>
        
        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginTop: '15px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginTop: 0 }}>営業時間設定</h2>
          <p style={{ color: '#999' }}>営業時間の設定機能は準備中です</p>
        </div>
      </div>
    </>
  );
};
