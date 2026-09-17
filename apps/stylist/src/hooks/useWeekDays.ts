import { useState, useEffect } from 'react';
import { WeekDay } from '../types';

export const useWeekDays = (startDate?: Date) => {
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);

  useEffect(() => {
    const date = startDate || new Date();
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));

    const days: WeekDay[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      days.push({
        date: d,
        dayName: ['日', '月', '火', '水', '木', '金', '土'][d.getDay()],
        dayOfWeek: d.getDay()
      });
    }
    setWeekDays(days);
  }, [startDate]);

  return weekDays;
};
