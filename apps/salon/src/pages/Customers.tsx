import React from 'react';
import { Header } from '../components/Header';

export const Customers: React.FC = () => {
  return (
    <>
      <Header title="顧客管理" />
      <div style={{ padding: '20px' }}>
        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginTop: 0 }}>顧客一覧</h2>
          <p style={{ color: '#999' }}>顧客管理機能は準備中です</p>
        </div>
      </div>
    </>
  );
};
