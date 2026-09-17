export interface WeekDay {
  date: Date;
  dayName: string;
  dayOfWeek: number;
}

export interface TimeSlot {
  hour: number;
  minute: number;
}

export interface Menu {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  color_code?: string;
}

export interface Appointment {
  id: string;
  customer_name: string;
  menu_name: string;
  start_time: string;
  end_time: string;
  status: string;
}

export interface WorkingHours {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface OffDay {
  date: string;
  reason?: string;
}
