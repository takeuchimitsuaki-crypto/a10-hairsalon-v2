// Appointment Types
export interface Appointment {
  id: string;
  customerId: string;
  stylerId: string;
  menuId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Styler (Stylist) Types
export interface Styler {
  id: string;
  salonId: string;
  name: string;
  bio?: string;
  image?: string;
  specialties?: string[];
  createdAt: string;
  updatedAt: string;
}

// Menu Types
export interface Menu {
  id: string;
  salonId: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

// Karte (Chart) Types
export interface Karte {
  id: string;
  customerId: string;
  stylerId: string;
  appointmentId: string;
  notes?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

// Message Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  images?: string[];
  createdAt: string;
}

// User Types
export interface LineUser {
  userId: string;
  lineUserId: string;
  customerId?: string;
  displayName: string;
  pictureUrl?: string;
  createdAt: string;
  updatedAt: string;
}
