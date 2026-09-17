import { useState, useEffect } from 'react';

export const useCurrentTime = () => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  return {
    now,
    hours: now.getHours(),
    minutes: now.getMinutes(),
    percentageOfDay: (now.getHours() + now.getMinutes() / 60) / 24
  };
};
