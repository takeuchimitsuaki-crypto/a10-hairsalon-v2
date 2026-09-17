export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

export const formatTime = (time: string): string => {
  return time.substring(0, 5);
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
