import React, { useState } from 'react';
import { Header } from '../components/Header';
import { ScheduleGrid } from '../components/ScheduleGrid';
import { useStylists } from '../hooks/useStylists';
import { useAppointments } from '../hooks/useAppointments';

export const Schedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { stylists, loading: loadingStylists } = useStylists();
  const { appointments, loading: loadingAppointments, refetch } = useAppointments(undefined, selectedDate);
  const [isMoving, setIsMoving] = useState(false);

  const handleAppointmentMove = async (appointmentId: string, newStylistId: string, newStartTime: string) => {
    try {
      setIsMoving(true);
      
      const response = await fetch('http://localhost:8787/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: appointmentId,
          stylist_id: newStylistId,
          start_time: newStartTime
        })
      });

      if (response.ok) {
        alert('予約を移動しました');
        // Refetch appointments to update the grid
        refetch?.();
      } else {
        alert('予約の移動に失敗しました');
      }
    } catch (error) {
      console.error('Error moving appointment:', error);
      alert('エラーが発生しました');
    } finally {
      setIsMoving(false);
    }
  };

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
            disabled={isMoving}
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
              fontSize: '14px',
              opacity: isMoving ? 0.6 : 1
            }}
            disabled={isMoving}
          >
            今日
          </button>
          {isMoving && <span style={{ color: '#666', fontSize: '12px' }}>移動中...</span>}
        </div>
        
        <ScheduleGrid
          stylists={stylists}
          appointments={appointments}
          startHour={9}
          endHour={21}
          onAppointmentMove={handleAppointmentMove}
          selectedDate={selectedDate}
        />
      </div>
    </>
  );
};
