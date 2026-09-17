import React, { useState } from 'react';
import { WeekDay, Appointment } from '../types';

interface Props {
  weekDays: WeekDay[];
  appointments: Appointment[];
  businessHours?: { start: number; end: number };
  onUpdateAppointment?: (id: string, updates: Partial<Appointment>) => Promise<boolean>;
}

export const WeekView: React.FC<Props> = ({
  weekDays,
  appointments,
  businessHours = { start: 9, end: 21 },
  onUpdateAppointment
}) => {
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  const hours = Array.from({ length: businessHours.end - businessHours.start }, (_, i) => businessHours.start + i);

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const handleDragStart = (e: React.DragEvent, apt: Appointment) => {
    setDraggedAppointment(apt);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, date: Date, hour: number) => {
    e.preventDefault();
    if (!draggedAppointment || !onUpdateAppointment) return;

    const newStartTime = new Date(date);
    newStartTime.setHours(hour, 0, 0, 0);

    const success = await onUpdateAppointment(draggedAppointment.id, {
      start_time: newStartTime.toISOString()
    });

    if (success) {
      setDraggedAppointment(null);
    }
  };

  return (
    <div style={{ overflowX: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', minWidth: '100%' }}>
        {/* Time axis */}
        <div style={{ width: '60px', borderRight: '1px solid #e0e0e0' }}>
          <div style={{ height: '60px', borderBottom: '1px solid #e0e0e0' }}></div>
          {hours.map(hour => (
            <div
              key={hour}
              style={{
                height: '60px',
                borderBottom: '1px solid #f0f0f0',
                fontSize: '11px',
                color: '#666',
                padding: '5px',
                textAlign: 'center'
              }}
            >
              {`${hour}:00`}
            </div>
          ))}
        </div>

        {/* Days columns */}
        {weekDays.map(day => (
          <div
            key={day.date.toISOString()}
            style={{
              flex: 1,
              minWidth: '120px',
              borderRight: '1px solid #e0e0e0'
            }}
          >
            {/* Day header */}
            <div
              style={{
                height: '60px',
                padding: '10px',
                borderBottom: '1px solid #e0e0e0',
                textAlign: 'center',
                fontSize: '12px'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{day.dayName}</div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                {day.date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
              </div>
            </div>

            {/* Hour slots */}
            {hours.map(hour => {
              const isBusinessHours = hour >= businessHours.start && hour < businessHours.end;
              return (
                <div
                  key={`${day.date.toISOString()}-${hour}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day.date, hour)}
                  style={{
                    height: '60px',
                    borderBottom: '1px solid #f0f0f0',
                    background: isBusinessHours ? '#fff' : '#f5f5f5',
                    padding: '3px'
                  }}
                >
                  {getAppointmentsForDay(day.date)
                    .filter(apt => new Date(apt.start_time).getHours() === hour)
                    .map(apt => (
                      <div
                        key={apt.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, apt)}
                        style={{
                          background: draggedAppointment?.id === apt.id ? '#1565c0' : '#1976d2',
                          color: '#fff',
                          fontSize: '10px',
                          padding: '3px',
                          borderRadius: '3px',
                          marginBottom: '2px',
                          cursor: 'grab',
                          opacity: draggedAppointment?.id === apt.id ? 0.6 : 1,
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ fontWeight: 'bold' }}>{apt.customer_name}</div>
                        <div>{apt.menu_name}</div>
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
