import { useState, useEffect, useCallback } from 'react';
import { Appointment } from '../types';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/appointments');
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.results || []);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        await fetchAppointments();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating appointment:', err);
      return false;
    }
  }, [fetchAppointments]);

  return { appointments, loading, updateAppointment, refetch: fetchAppointments };
};
