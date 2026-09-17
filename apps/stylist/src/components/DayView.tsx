import React, { useState, useRef, useEffect } from 'react';
import { Appointment } from '../types';

interface Props {
  date: Date;
  appointments: Appointment[];
  businessHours?: { start: number; end: number };
  onUpdateAppointment?: (id: string, updates: Partial<Appointment>) => Promise<boolean>;
}

export const DayView: React.FC<Props> = ({
  date,
  appointments,
  businessHours = { start: 9, end: 21 },
  onUpdateAppointment
}) => {
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  const [resizing, setResizing] = useState<{ aptId: string; startY: number; startEndTime: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hours = Array.from({ length: businessHours.end - businessHours.start }, (_, i) => businessHours.start + i);

  const getAppointmentsForDay = (d: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return aptDate.toDateString() === d.toDateString();
    });
  };

  const calculateHeight = (apt: Appointment) => {
    const start = new Date(apt.start_time);
    const end = new Date(apt.end_time);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return Math.max(30, (durationMinutes / 60) * 60);
  };

  const calculateTop = (apt: Appointment) => {
    const start = new Date(apt.start_time);
    const hour = start.getHours();
    const minutes = start.getMinutes();
    const topPercent = ((minutes / 60) * 60);
    return (hour - businessHours.start) * 60 + topPercent;
  };

  const handleDragStart = (e: React.DragEvent, apt: Appointment) => {
    setDraggedAppointment(apt);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, hour: number) => {
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

      const deltaY = window.event && (window.event as MouseEvent).clientY - resizing.startY;
      const deltaMinutes = Math.round(deltaY || 0);
      
      const startTime = new Date(apt.start_time);
      const originalEndTime = new Date(resizing.startEndTime);
      const originalDurationMinutes = (originalEndTime.getTime() - startTime.getTime()) / (1000 * 60);
      
      const newDurationMinutes = Math.max(30, originalDurationMinutes + deltaMinutes);
      const newEndTime = new Date(startTime.getTime() + newDurationMinutes * 60 * 1000);

      const success = await onUpdateAppointment(apt.id, {
        end_time: newEndTime.toISOString()
      });

      if (success) {
        setResizing(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, appointments, onUpdateAppointment]);

  const dayAppointments = getAppointmentsForDay(date);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        background: '#fff'
      }}
      onDragOver={handleDragOver}
    >
      <div style={{ display: 'flex' }}>
        <div style={{ width: '60px', background: '#f5f5f5', borderRight: '1px solid #e0e0e0' }}>
          {hours.map(hour => (
            <div
              key={hour}
              style={{
                height: '60px',
                borderBottom: '1px solid #e0e0e0',
                fontSize: '12px',
                color: '#999',
                padding: '4px',
                textAlign: 'center'
              }}
            >
              {hour}:00
            </div>
          ))}
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          {hours.map((hour, idx) => (
            <div
              key={hour}
              style={{
                height: '60px',
                borderBottom: '1px solid #e0e0e0',
                position: 'relative'
              }}
              onDrop={(e) => handleDrop(e, hour)}
            >
              {idx === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    height: '1px',
                    background: '#d32f2f'
                  }}
                />
              )}
            </div>
          ))}

          {dayAppointments.map(apt => (
            <div
              key={apt.id}
              data-apt-id={apt.id}
              draggable
              onDragStart={(e) => handleDragStart(e, apt)}
              style={{
                position: 'absolute',
                left: '4px',
                right: '4px',
                top: `${calculateTop(apt)}px`,
                height: `${calculateHeight(apt)}px`,
                background: '#1976d2',
                color: '#fff',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'move',
                zIndex: draggedAppointment?.id === apt.id ? 10 : 1,
                opacity: draggedAppointment?.id === apt.id ? 0.7 : 1,
                overflow: 'hidden',
                userSelect: 'none'
              }}
            >
              <div>{apt.menu_name}</div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>
                {new Date(apt.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} -
                {new Date(apt.end_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div
                onMouseDown={(e) => handleResizeStart(e, apt)}
                style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  right: '0',
                  height: '6px',
                  cursor: 'ns-resize',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '0 0 4px 4px'
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
