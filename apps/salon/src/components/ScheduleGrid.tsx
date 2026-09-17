import React from 'react';
import { Appointment, Stylist, TimeSlot } from '../types';
import { useCurrentTime } from '../hooks/useCurrentTime';

interface Props {
  stylists: Stylist[];
  appointments: Appointment[];
  startHour?: number;
  endHour?: number;
}

export const ScheduleGrid: React.FC<Props> = ({ 
  stylists, 
  appointments,
  startHour = 9,
  endHour = 21
}) => {
  const { percentageOfDay } = useCurrentTime();
  const timeSlots = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  
  const getAppointmentsForStylist = (stylistId: string, hour: number) => {
    return appointments.filter(apt => {
      const startDate = new Date(apt.start_time);
      return apt.stylist_id === stylistId && startDate.getHours() === hour;
    });
  };

  const currentTimePosition = percentageOfDay * 100;

  return (
    <div style={{ overflowX: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', minWidth: '100%' }}>
        {/* Time axis */}
        <div style={{ width: '80px', borderRight: '1px solid #e0e0e0' }}>
          <div style={{ height: '60px', borderBottom: '1px solid #e0e0e0' }}></div>
          {timeSlots.map(hour => (
            <div
              key={hour}
              style={{
                height: '100px',
                borderBottom: '1px solid #f0f0f0',
                padding: '5px',
                fontSize: '12px',
                color: '#666'
              }}
            >
              {`${hour.toString().padStart(2, '0')}:00`}
            </div>
          ))}
        </div>

        {/* Stylists columns */}
        {stylists.map(stylist => (
          <div
            key={stylist.id}
            style={{
              flex: 1,
              minWidth: '200px',
              borderRight: '1px solid #e0e0e0',
              position: 'relative'
            }}
          >
            <div
              style={{
                height: '60px',
                padding: '10px',
                borderBottom: '1px solid #e0e0e0',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#333'
              }}
            >
              {stylist.name}
            </div>

            {/* Current time line */}
            {currentTimePosition > 0 && currentTimePosition < 100 && (
              <div
                style={{
                  position: 'absolute',
                  top: `${60 + (currentTimePosition / timeSlots.length) * timeSlots.length * 100}px`,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: '#ff0000',
                  zIndex: 10
                }}
              />
            )}

            {/* Hour slots */}
            {timeSlots.map(hour => (
              <div
                key={`${stylist.id}-${hour}`}
                style={{
                  height: '100px',
                  borderBottom: '1px solid #f0f0f0',
                  padding: '5px',
                  position: 'relative'
                }}
              >
                {getAppointmentsForStylist(stylist.id, hour).map(apt => (
                  <div
                    key={apt.id}
                    style={{
                      background: apt.menu_color || '#1976d2',
                      color: '#fff',
                      padding: '5px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      marginBottom: '3px',
                      cursor: 'grab'
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{apt.customer_name}</div>
                    <div>{apt.menu_name}</div>
                    <div>{new Date(apt.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
