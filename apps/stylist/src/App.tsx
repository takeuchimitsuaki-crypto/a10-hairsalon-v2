import React from 'react';
import { Schedule } from './pages/Schedule';
import { staffAuth } from './auth/client';
import { StaffAuthProvider, useStaffAuth } from '../../../packages/shared/src/auth/StaffAuthProvider';
import { StaffLoginScreen } from '../../../packages/shared/src/auth/StaffLoginScreen';
import './App.css';

// Salon App と同じ「スタッフ選択 + PIN」でログインする。本人の予約・カルテ中心の画面は今後ここに追加する
function StylistApp() {
  const { session, loading, logout } = useStaffAuth();

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>読み込み中...</div>;
  }
  if (!session) return <StaffLoginScreen subtitle="スタイリスト用アプリにログイン" />;

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
        <span>スタイリスト用アプリ</span>
        <span style={{ float: 'right', fontWeight: 'normal', fontSize: '13px' }}>
          {session.staff.name}
          <button
            onClick={() => { void logout(); }}
            style={{ marginLeft: '12px', padding: '4px 10px', background: 'transparent', color: '#fff', border: '1px solid #fff', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
          >
            ログアウト
          </button>
        </span>
      </header>
      <Schedule />
    </div>
  );
}

function App() {
  return (
    <StaffAuthProvider client={staffAuth}>
      <StylistApp />
    </StaffAuthProvider>
  );
}

export default App;
