export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  spiceLevel?: 'mild' | 'medium' | 'hot';
  image: string;
  imagePrompt: string; // The exact prompt used for generating the AI placeholder image
  badge?: string; // Optional single highlight badge
  soldOut?: boolean; // Whether this item is currently sold out
  gstRate?: number; // Custom GST percentage (e.g. 5, 12, 18, 0)
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedSpice?: 'mild' | 'medium' | 'hot';
  specialInstructions?: string;
  selectedAddons?: string[];
  thaliCustomizations?: {
    currySwap?: string;
    breadSwap?: string;
    extraRice?: boolean;
    dessertChoice?: string;
  };
  selectedPortion?: 'half' | 'full' | 'regular';
  addedPrice?: number;
}

export interface ReservationRequest {
  fullName: string;
  phone: string;
  partySize: number;
  date: string;
  timeSlot: string;
  specialRequests?: string;
}

export interface OrderDetails {
  fullName: string;
  phone: string;
  address: string;
  deliveryType: 'delivery' | 'pickup';
  paymentMethod: 'cod' | 'upi';
  specialInstructions?: string;
}
