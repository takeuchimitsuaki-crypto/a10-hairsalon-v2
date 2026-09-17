import React, { useState, useRef, useEffect } from 'react';
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
  const [resizing, setResizing] = useState<{ aptId: string; startY: number; startEndTime: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hours = Array.from({ length: businessHours.end - businessHours.start }, (_, i) => businessHours.start + i);

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const calculateHeight = (apt: Appointment) => {
    const start = new Date(apt.start_time);
    const end = new Date(apt.end_time);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return Math.max(30, (durationMinutes / 60) * 60);
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

  const handleResizeStart = (e: React.MouseEvent, apt: Appointment) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      aptId: apt.id,
      startY: e.clientY,
      startEndTime: apt.end_time
    });
  };

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const apt = appointments.find(a => a.id === resizing.aptId);
      if (!apt) return;

      const deltaY = e.clientY - resizing.startY;
      const deltaMinutes = Math.round(deltaY);
      
      const startTime = new Date(apt.start_time);
      const originalEndTime = new Date(resizing.startEndTime);
      const originalDurationMinutes = (originalEndTime.getTime() - startTime.getTime()) / (1000 * 60);
      
      const newDurationMinutes = Math.max(30, originalDurationMinutes + deltaMinutes);

      const previewHeight = Math.max(30, (newDurationMinutes / 60) * 60);
      const handles = containerRef.current?.querySelectorAll(`[data-apt-id="${apt.id}"]`);
      if (handles) {
        handles.forEach(handle => {
          (handle as HTMLElement).style.height = `${previewHeight}px`;
        });
      }
    };

    const handleMouseUp = async () => {
      if (!resizing) return;

      const apt = appointments.find(a => a.id === resizing.aptId);
      if (!apt || !onUpdateAppointment) {
        setResizing(null);
        return;
      }

      const deltaY = (event as MouseEvent).clientY - resizing.startY;
      const deltaMinutes = Math.round(deltaY);
      
      const startTime = new Date(apt.start_time);
      const originalEndTime = new Date(resizing.startEndTime);
      const originalDurationMinutes = (originalEndTime.getTime() - startTime.getTime()) / (1000 * 60);
      
      const newDurationMinutes = Math.max(30, originalDurationMinutes + deltaMinutes);
      const newEndTime = new Date(startTime);
      newEndTime.setMinutes(startTime.getMinutes() + newDurationMinutes);

      await onUpdateAppointment(apt.id, {
        end_time: newEndTime.toISOString()
      });

      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, appointments, onUpdateAppointment]);

  return (
    <div ref={containerRef} style={{ overflowX: 'auto', flex: 1 }}>
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
                    padding: '3px',
                    boxSizing: 'border-box'
                  }}
                >
                  {getAppointmentsForDay(day.date)
                    .filter(apt => new Date(apt.start_time).getHours() === hour)
                    .map(apt => {
                      const height = calculateHeight(apt);
                      return (
                        <div
                          key={apt.id}
                          data-apt-id={apt.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, apt)}
                          style={{
                            background: draggedAppointment?.id === apt.id ? '#1565c0' : '#1976d2',
                            color: '#fff',
                            fontSize: '10px',
                            padding: '3px 3px 8px 3px',
                            borderRadius: '3px',
                            marginBottom: '2px',
                            cursor: 'grab',
                            opacity: draggedAppointment?.id === apt.id ? 0.6 : 1,
                            userSelect: 'none',
                            position: 'relative',
                            height: `${height}px`,
                            minHeight: '30px',
                            transition: resizing?.aptId === apt.id ? 'none' : 'height 0.2s'
                          }}
                        >
                          <div style={{ fontWeight: 'bold', fontSize: '9px' }}>{apt.customer_name}</div>
                          <div style={{ fontSize: '8px' }}>{apt.menu_name}</div>
                          
                          {/* Resize handle */}
                          <div
                            onMouseDown={(e) => handleResizeStart(e, apt)}
                            style={{
                              position: 'absolute',
                              bottom: '-4px',
                              left: '2px',
                              right: '2px',
                              height: '8px',
                              cursor: 'ns-resize',
                              background: resizing?.aptId === apt.id ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',
                              borderRadius: '2px',
                              transition: 'background 0.2s'
                            }}
                            title="下をドラッグして終了時間を変更"
                          />
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
