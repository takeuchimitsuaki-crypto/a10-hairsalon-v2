import React, { useState } from 'react';
import { WeekView } from '../components/WeekView';
import { DayView } from '../components/DayView';
import { MonthView } from '../components/MonthView';
import { TabBar } from '../components/TabBar';
import { useWeekDays } from '../hooks/useWeekDays';
import { useMenus } from '../hooks/useMenus';
import { useAppointments } from '../hooks/useAppointments';

type ViewMode = 'day' | 'week' | 'month';
type StylistMode = 'personal' | 'all';

export const Schedule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [stylistMode, setStylistMode] = useState<StylistMode>('personal');
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekDays = useWeekDays(currentDate);
  const { menus } = useMenus();
  const { appointments, updateAppointment } = useAppointments();

  const handlePrevPeriod = () => {
    const prev = new Date(currentDate);
    if (viewMode === 'day') {
      prev.setDate(prev.getDate() - 1);
    } else if (viewMode === 'week') {
      prev.setDate(prev.getDate() - 7);
    } else {
      prev.setMonth(prev.getMonth() - 1);
    }
    setCurrentDate(prev);
  };

  const handleNextPeriod = () => {
    const next = new Date(currentDate);
    if (viewMode === 'day') {
      next.setDate(next.getDate() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getPeriodLabel = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });
    } else if (viewMode === 'week') {
      return currentDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' }) + ' の週';
    } else {
      return currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
    }
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
        borderBottom: '1px solid #e0e0e0'
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
          <button
            onClick={handlePrevPeriod}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              background: '#fff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ←
          </button>
          <button
            onClick={handleToday}
            style={{
              padding: '8px 12px',
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            今日
          </button>
          <button
            onClick={handleNextPeriod}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              background: '#fff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            →
          </button>
          <div style={{ fontSize: '12px', color: '#666', minWidth: '120px' }}>
            {getPeriodLabel()}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setViewMode('day')}
              style={{
                padding: '6px 10px',
                background: viewMode === 'day' ? '#1976d2' : '#f0f0f0',
                color: viewMode === 'day' ? '#fff' : '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              日
            </button>
            <button
              onClick={() => setViewMode('week')}
              style={{
                padding: '6px 10px',
                background: viewMode === 'week' ? '#1976d2' : '#f0f0f0',
                color: viewMode === 'week' ? '#fff' : '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              週
            </button>
            <button
              onClick={() => setViewMode('month')}
              style={{
                padding: '6px 10px',
                background: viewMode === 'month' ? '#1976d2' : '#f0f0f0',
                color: viewMode === 'month' ? '#fff' : '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              月
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setStylistMode('personal')}
            style={{
              padding: '6px 12px',
              background: stylistMode === 'personal' ? '#1976d2' : '#f0f0f0',
              color: stylistMode === 'personal' ? '#fff' : '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            個人スケジュール
          </button>
          <button
            onClick={() => setStylistMode('all')}
            style={{
              padding: '6px 12px',
              background: stylistMode === 'all' ? '#1976d2' : '#f0f0f0',
              color: stylistMode === 'all' ? '#fff' : '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            店全体
          </button>
        </div>
      </div>

      {viewMode === 'day' && (
        <DayView
          date={currentDate}
          appointments={appointments}
          businessHours={{ start: 9, end: 21 }}
          onUpdateAppointment={updateAppointment}
        />
      )}

      {viewMode === 'week' && (
        <WeekView
          weekDays={weekDays}
          appointments={appointments}
          businessHours={{ start: 9, end: 21 }}
          onUpdateAppointment={updateAppointment}
        />
      )}

      {viewMode === 'month' && (
        <MonthView
          date={currentDate}
          appointments={appointments}
          onDateSelect={(date) => {
            setCurrentDate(date);
            setViewMode('day');
          }}
        />
      )}

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};
