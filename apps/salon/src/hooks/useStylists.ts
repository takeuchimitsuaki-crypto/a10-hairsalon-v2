import { useState, useEffect } from 'react';
import { Stylist } from '../types';
import { API_BASE_URL } from '../config';

export const useStylists = (salonId?: string) => {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStylists = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (salonId) params.append('salon_id', salonId);

        const response = await fetch(`${API_BASE_URL}/api/stylists?${params}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          setStylists(data.results || []);
        } else {
          setError('Failed to fetch stylists');
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchStylists();
  }, [salonId]);

  return { stylists, loading, error };
};
