import React from 'react';
import { Header } from '../components/Header';

export const Dashboard: React.FC = () => {
  const today = new Date();
  
  return (
    <>
      <Header title="ダッシュボード" />
      <div style={{ padding: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '12px', color: '#666' }}>本日の予約数</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '10px' }}>0件</div>
          </div>
          <div style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '12px', color: '#666' }}>営業時間</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '10px' }}>9:00 - 21:00</div>
          </div>
          <div style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '12px', color: '#666' }}>スタイリスト</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '10px' }}>0名</div>
          </div>
        </div>

        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginTop: 0 }}>今日の予約</h2>
          <div style={{ color: '#999', fontSize: '14px' }}>予約がありません</div>
        </div>
      </div>
    </>
  );
};
