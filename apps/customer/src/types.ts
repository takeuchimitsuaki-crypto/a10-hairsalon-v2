export interface Reservation {
  id: string;
  stylist_name: string;
  menu_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
}

export interface Chart {
  id: string;
  date: string;
  stylist_name: string;
  shared_notes?: string;
  photos?: string[];
}

export interface Message {
  id: string;
  sender_name: string;
  content: string;
  timestamp: string;
}
