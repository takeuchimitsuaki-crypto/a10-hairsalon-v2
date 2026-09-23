import { useState, useEffect } from 'react';
import { Appointment } from '../types';
import { apiFetch } from '../auth/client';

export const useAppointments = (stylistId?: string, date?: Date) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (stylistId) params.append('stylist_id', stylistId);
        if (date) params.append('date', date.toISOString().split('T')[0]);

        const response = await apiFetch(`/api/appointments?${params}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          setAppointments(data.results || []);
        } else {
          setError('Failed to fetch appointments');
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [stylistId, date]);

  return { appointments, loading, error };
};
