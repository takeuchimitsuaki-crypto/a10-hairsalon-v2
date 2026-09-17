import React, { useState } from 'react';
import { Header } from '../components/Header';
import { ScheduleGrid } from '../components/ScheduleGrid';
import { useStylists } from '../hooks/useStylists';
import { useAppointments } from '../hooks/useAppointments';

export const Schedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { stylists, loading: loadingStylists } = useStylists();
  const { appointments, loading: loadingAppointments } = useAppointments(undefined, selectedDate);

  if (loadingStylists || loadingAppointments) {
    return (
      <>
        <Header title="スケジュール" />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          読み込み中...
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="スケジュール" />
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
        <div style={{
          padding: '15px 20px',
          background: '#f5f5f5',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={() => setSelectedDate(new Date())}
            style={{
              padding: '8px 16px',
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            今日
          </button>
        </div>
        
        <ScheduleGrid
          stylists={stylists}
          appointments={appointments}
          startHour={9}
          endHour={21}
        />
      </div>
    </>
  );
};
