import { apiFetch } from '../auth/client';
import { useState, useEffect } from 'react';
import { Menu } from '../types';

export const useMenus = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMenus = async () => {
      setLoading(true);
      try {
        const response = await apiFetch('/api/menus');
        if (response.ok) {
          const data = await response.json();
          setMenus(data.results || []);
        }
      } catch (err) {
        console.error('Error fetching menus:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenus();
  }, []);

  return { menus, loading };
};
