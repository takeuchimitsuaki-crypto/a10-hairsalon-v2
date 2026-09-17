import React from 'react';
import { Appointment } from '../types';

interface Props {
  date: Date;
  appointments: Appointment[];
  onDateSelect?: (date: Date) => void;
}

export const MonthView: React.FC<Props> = ({
  date,
  appointments,
  onDateSelect
}) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const days: Date[] = [];
  const currentDate = new Date(startDate);
  while (days.length < 42) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const getAppointmentsForDay = (d: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return aptDate.toDateString() === d.toDateString();
    });
  };

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>
          {year}年 {month + 1}月
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', flex: 1 }}>
        {weekDays.map(day => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '14px',
              padding: '8px',
              color: '#666'
            }}
          >
            {day}
          </div>
        ))}

        {days.map((d, idx) => {
          const dayAppointments = getAppointmentsForDay(d);
          const isCurrentMonth = d.getMonth() === month;
          const isToday = d.toDateString() === new Date().toDateString();

          return (
            <div
              key={idx}
              onClick={() => onDateSelect?.(d)}
              style={{
                minHeight: '80px',
                padding: '8px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                background: isToday ? '#e3f2fd' : isCurrentMonth ? '#fff' : '#f9f9f9',
                cursor: 'pointer',
                transition: 'background 0.2s',
                ':hover': {
                  background: '#f5f5f5'
                }
              }}
              onMouseEnter={(e) => {
                if (!isToday) {
                  (e.currentTarget as HTMLElement).style.background = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (isToday) {
                  (e.currentTarget as HTMLElement).style.background = '#e3f2fd';
                } else if (isCurrentMonth) {
                  (e.currentTarget as HTMLElement).style.background = '#fff';
                } else {
                  (e.currentTarget as HTMLElement).style.background = '#f9f9f9';
                }
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: isToday ? 'bold' : 'normal',
                  color: isCurrentMonth ? '#000' : '#ccc',
                  marginBottom: '4px'
                }}
              >
                {d.getDate()}
              </div>
              <div style={{ fontSize: '11px', color: '#1976d2' }}>
                {dayAppointments.length > 0 && `${dayAppointments.length}件`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
