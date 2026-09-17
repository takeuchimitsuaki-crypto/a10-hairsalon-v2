import { useState, useEffect } from 'react';

export const useCurrentTime = () => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    // Set initial time immediately
    setNow(new Date());

    // Update every second for more responsive display
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return {
    now,
    hours: now.getHours(),
    minutes: now.getMinutes(),
    percentageOfDay: (now.getHours() + now.getMinutes() / 60) / 24
  };
};
