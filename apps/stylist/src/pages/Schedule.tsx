import React, { useState } from 'react';
import { WeekView } from '../components/WeekView';
import { TabBar } from '../components/TabBar';
import { useWeekDays } from '../hooks/useWeekDays';
import { useMenus } from '../hooks/useMenus';
import { useAppointments } from '../hooks/useAppointments';

export const Schedule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekDays = useWeekDays(currentDate);
  const { menus } = useMenus();
  const { appointments, updateAppointment } = useAppointments();

  const handlePrevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  if (activeTab !== 'schedule') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <div style={{ padding: '20px', flex: 1 }}>
          <div style={{ fontSize: '14px', color: '#999' }}>
            {activeTab === 'charts' && 'カルテ機能は準備中です'}
            {activeTab === 'messages' && 'メッセージ機能は準備中です'}
            {activeTab === 'settings' && '設定機能は準備中です'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        padding: '15px 20px',
        background: '#fff',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <button
          onClick={handlePrevWeek}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            background: '#fff',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← 前週
        </button>
        <button
          onClick={handleToday}
          style={{
            padding: '8px 12px',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          今週
        </button>
        <button
          onClick={handleNextWeek}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            background: '#fff',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          次週 →
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: '12px', color: '#666' }}>
          {currentDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })} の週
        </div>
      </div>

      <WeekView
        weekDays={weekDays}
        appointments={appointments}
        businessHours={{ start: 9, end: 21 }}
        onUpdateAppointment={updateAppointment}
      />

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};
