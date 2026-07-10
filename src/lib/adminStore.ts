import { CartItem, MenuItem } from '../types';
import { MENU_ITEMS } from '../data';
import { firebaseService } from './firebaseService';

// ─── Type Exports ──────────────────────────────────────────────────────────

export interface AdminOrder {
  id: string;
  createdAt: string;
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryType: 'delivery' | 'pickup';
  paymentMethod: 'cod' | 'upi';
  specialInstructions?: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: 'placed' | 'preparing' | 'out_for_delivery' | 'delivered';
  assignedDeliveryBoyId?: string;
}

export interface AdminReservation {
  id: string;
  createdAt: string;
  fullName: string;
  phone: string;
  partySize: number;
  date: string;
  timeSlot: string;
  specialRequests?: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface AdminCelebrationEnquiry {
  id: string;
  createdAt: string;
  fullName: string;
  phone: string;
  email?: string;
  eventDate: string;
  headcount: number;
  budget?: string;
  occasionType: string;
  requirements?: string;
  status: 'new' | 'contacted' | 'confirmed' | 'closed';
  notes?: string;
}

export interface DeliveryBoy {
  id: string;
  name: string;
  phone: string;
}

export interface AdminSettings {
  gstEnabled: boolean;
  gstin: string;
  cgstRate: number;
  sgstRate: number;
  deliveryFee: number;
  upiVpa: string;
  kitchenBufferMinutes: number;
}

export interface GalleryImage {
  url: string;
  title: string;
  category: string;
}

export interface SiteOffer {
  enabled: boolean;
  code: string;
  discountPercent: number;
  minOrder: number;
  label: string;
}

export interface SiteContent {
  heroImageUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  galleryImages: GalleryImage[];
  deliveryFeeThreshold: number; // free delivery above this amount
  deliveryFeeAmount: number;    // fee when below threshold
  offer: SiteOffer;
}

// ─── Default Settings (used when Firestore has no settings yet) ────────────

const DEFAULT_SETTINGS: AdminSettings = {
  gstEnabled: true,
  gstin: '24AAAAC1234A1Z5', // default sample placeholder GSTIN
  cgstRate: 2.5,
  sgstRate: 2.5,
  deliveryFee: 30,
  upiVpa: 'aaravworlld@oksbi',
  kitchenBufferMinutes: 0
};

const DEFAULT_SITE_CONTENT: SiteContent = {
  heroImageUrl: '',
  heroTitle: 'Aromatic Heritage from Kahalgaon',
  heroSubtitle: 'Home-style Indian curries, straight off the tandoor — with Chinese, pizza, and everyday favorites for the rest of the table.',
  galleryImages: [],
  deliveryFeeThreshold: 500,
  deliveryFeeAmount: 40,
  offer: {
    enabled: false,
    code: 'DELIGHT15',
    discountPercent: 15,
    minOrder: 600,
    label: 'Flat 15% off on orders above ₹600'
  }
};

// ─── Sound Alert Engine ────────────────────────────────────────────────────

export function playNewOrderSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.5);

    // Tone 2
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      gain2.gain.setValueAtTime(0, ctx.currentTime);
      gain2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.6);
    }, 150);
  } catch (e) {
    console.error("Audio playback error:", e);
  }
}

// ─── Custom Event for React Re-renders ─────────────────────────────────────
// We dispatch 'adminStoreUpdate' whenever the in-memory cache changes so that
// React components listening via addEventListener can re-render.

function dispatchStoreUpdate() {
  window.dispatchEvent(new Event('adminStoreUpdate'));
  // Also dispatch 'storage' for backward-compat with components that listen to it
  window.dispatchEvent(new Event('storage'));
}

// ─── In-Memory Cache ───────────────────────────────────────────────────────
// These hold the current state received from Firestore subscriptions.
// getXxx() reads from here; writes go straight to Firestore and the
// subscription callback updates the cache automatically.

let _menuItems: MenuItem[] = [];
let _orders: AdminOrder[] = [];
let _reservations: AdminReservation[] = [];
let _celebrations: AdminCelebrationEnquiry[] = [];
let _deliveryBoys: DeliveryBoy[] = [];
let _settings: AdminSettings = { ...DEFAULT_SETTINGS };
let _siteContent: SiteContent = { ...DEFAULT_SITE_CONTENT };
let _isInitialized = false;
let _isInitializing = false;

// Track previous order count to detect new orders for sound alert
let _prevOrderCount = -1;

// Unsubscribe handles so we can clean up if needed
let _unsubscribers: (() => void)[] = [];

// ─── Store Manager ─────────────────────────────────────────────────────────

export const adminStore = {
  // ─── Initialization Status ───────────────────────────────────────────────
  
  get isInitialized() {
    return _isInitialized;
  },

  // ─── Read Methods (from in-memory cache) ─────────────────────────────────

  getMenuItems(): MenuItem[] {
    return _menuItems;
  },

  getOrders(): AdminOrder[] {
    return _orders;
  },

  getReservations(): AdminReservation[] {
    return _reservations;
  },

  getCelebrations(): AdminCelebrationEnquiry[] {
    return _celebrations;
  },

  getDeliveryBoys(): DeliveryBoy[] {
    return _deliveryBoys;
  },

  getSettings(): AdminSettings {
    return _settings;
  },

  getSiteContent(): SiteContent {
    return _siteContent;
  },

  /** Get IDs of all sold-out items (derived from menu item soldOut field) */
  getSoldOutIds(): string[] {
    return _menuItems.filter(item => item.soldOut).map(item => item.id);
  },

  // ─── Write Methods (write to Firestore, cache updates via subscription) ──

  async addOrder(orderData: Omit<AdminOrder, 'id' | 'createdAt' | 'status'>, customId?: string): Promise<AdminOrder> {
    const id = customId || `CD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: AdminOrder = {
      ...orderData,
      id,
      createdAt: new Date().toISOString(),
      status: 'placed'
    };
    
    try {
      await firebaseService.addOrder(newOrder);
    } catch (e) {
      console.error("Firebase addOrder failed:", e);
      // Optimistic local update as fallback
      _orders = [newOrder, ..._orders];
      dispatchStoreUpdate();
    }

    playNewOrderSound();
    return newOrder;
  },

  async updateOrderStatus(orderId: string, status: AdminOrder['status']) {
    try {
      await firebaseService.updateOrderStatus(orderId, status);
    } catch (e) {
      console.error("Firebase updateOrderStatus failed:", e);
      // Optimistic local update
      _orders = _orders.map(o => o.id === orderId ? { ...o, status } : o);
      dispatchStoreUpdate();
    }
  },

  async assignDeliveryBoy(orderId: string, deliveryBoyId: string) {
    try {
      await firebaseService.assignDeliveryBoy(orderId, deliveryBoyId);
    } catch (e) {
      console.error("Firebase assignDeliveryBoy failed:", e);
      _orders = _orders.map(o => o.id === orderId ? { ...o, assignedDeliveryBoyId: deliveryBoyId } : o);
      dispatchStoreUpdate();
    }
  },

  // ─── Reservations ────────────────────────────────────────────────────────

  async addReservation(resData: Omit<AdminReservation, 'id' | 'createdAt' | 'status'>): Promise<AdminReservation> {
    const id = `TR-${Math.floor(100 + Math.random() * 900)}`;
    const newRes: AdminReservation = {
      ...resData,
      id,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    try {
      await firebaseService.addReservation(newRes);
    } catch (e) {
      console.error("Firebase addReservation failed:", e);
      _reservations = [newRes, ..._reservations];
      dispatchStoreUpdate();
    }

    return newRes;
  },

  async updateReservationStatus(id: string, status: AdminReservation['status']) {
    try {
      await firebaseService.updateReservationStatus(id, status);
    } catch (e) {
      console.error("Firebase updateReservationStatus failed:", e);
      _reservations = _reservations.map(r => r.id === id ? { ...r, status } : r);
      dispatchStoreUpdate();
    }
  },

  // ─── Celebrations ────────────────────────────────────────────────────────

  async addCelebration(enqData: Omit<AdminCelebrationEnquiry, 'id' | 'createdAt' | 'status'>): Promise<AdminCelebrationEnquiry> {
    const id = `CE-${Math.floor(900 + Math.random() * 99)}`;
    const newEnq: AdminCelebrationEnquiry = {
      ...enqData,
      id,
      createdAt: new Date().toISOString(),
      status: 'new'
    };

    try {
      await firebaseService.addCelebrationEnquiry(newEnq);
    } catch (e) {
      console.error("Firebase addCelebrationEnquiry failed:", e);
      _celebrations = [newEnq, ..._celebrations];
      dispatchStoreUpdate();
    }

    return newEnq;
  },

  async updateCelebrationStatus(id: string, status: AdminCelebrationEnquiry['status']) {
    try {
      await firebaseService.updateCelebrationStatus(id, status);
    } catch (e) {
      console.error("Firebase updateCelebrationStatus failed:", e);
      _celebrations = _celebrations.map(c => c.id === id ? { ...c, status } : c);
      dispatchStoreUpdate();
    }
  },

  async updateCelebrationNotes(id: string, notes: string) {
    try {
      await firebaseService.updateCelebrationNotes(id, notes);
    } catch (e) {
      console.error("Firebase updateCelebrationNotes failed:", e);
      _celebrations = _celebrations.map(c => c.id === id ? { ...c, notes } : c);
      dispatchStoreUpdate();
    }
  },

  // ─── Sold Out (writes to menu item's soldOut field) ──────────────────────

  async toggleSoldOut(itemId: string) {
    const item = _menuItems.find(i => i.id === itemId);
    if (!item) return;
    const newSoldOut = !item.soldOut;

    try {
      await firebaseService.toggleSoldOut(itemId, newSoldOut);
    } catch (e) {
      console.error("Firebase toggleSoldOut failed:", e);
      // Optimistic local update
      _menuItems = _menuItems.map(i => i.id === itemId ? { ...i, soldOut: newSoldOut } : i);
      dispatchStoreUpdate();
    }
  },

  // ─── Delivery Boys ───────────────────────────────────────────────────────

  async addDeliveryBoy(name: string, phone: string): Promise<DeliveryBoy> {
    const tempBoy: DeliveryBoy = { id: `db-${Date.now()}`, name, phone };

    try {
      const realId = await firebaseService.addDeliveryBoy({ name, phone });
      tempBoy.id = realId;
    } catch (e) {
      console.error("Firebase addDeliveryBoy failed:", e);
      _deliveryBoys = [..._deliveryBoys, tempBoy];
      dispatchStoreUpdate();
    }

    return tempBoy;
  },

  async removeDeliveryBoy(id: string) {
    try {
      await firebaseService.removeDeliveryBoy(id);
    } catch (e) {
      console.error("Firebase removeDeliveryBoy failed:", e);
      _deliveryBoys = _deliveryBoys.filter(b => b.id !== id);
      dispatchStoreUpdate();
    }
  },

  // ─── Settings ────────────────────────────────────────────────────────────

  async saveSettings(settings: AdminSettings) {
    _settings = settings; // Optimistic update
    dispatchStoreUpdate();
    try {
      await firebaseService.updateSettings(settings);
    } catch (e) {
      console.error("Firebase updateSettings failed:", e);
    }
  },

  // ─── Site Content ─────────────────────────────────────────────────────────

  async saveSiteContent(content: SiteContent) {
    _siteContent = content; // Optimistic update
    dispatchStoreUpdate();
    try {
      await firebaseService.updateSiteContent(content);
    } catch (e) {
      console.error("Firebase updateSiteContent failed:", e);
    }
  },

  // ─── Menu Item Management ────────────────────────────────────────────────

  async addMenuItem(itemData: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const tempId = `menu-item-${Date.now()}`;
    const newItem: MenuItem = { ...itemData, id: tempId };

    try {
      const realId = await firebaseService.addMenuItem(itemData);
      newItem.id = realId;
    } catch (e) {
      console.error("Firebase addMenuItem failed:", e);
      _menuItems = [..._menuItems, newItem];
      dispatchStoreUpdate();
    }

    return newItem;
  },

  async updateMenuItem(id: string, updatedData: Partial<MenuItem>) {
    // Optimistic local update
    _menuItems = _menuItems.map(item => item.id === id ? { ...item, ...updatedData } : item);
    dispatchStoreUpdate();
    
    const targetItem = _menuItems.find(i => i.id === id);
    if (targetItem) {
      try {
        await firebaseService.updateMenuItem(targetItem);
      } catch (e) {
        console.error("Firebase updateMenuItem failed:", e);
      }
    }
  },

  async deleteMenuItem(id: string) {
    // Optimistic local update
    _menuItems = _menuItems.filter(item => item.id !== id);
    dispatchStoreUpdate();
    
    try {
      await firebaseService.deleteMenuItem(id);
    } catch (e) {
      console.error("Firebase deleteMenuItem failed:", e);
    }
  },

  // ─── Initialization / Sync ───────────────────────────────────────────────
  // Sets up real-time Firestore subscriptions for ALL collections.
  // Data flows: Firestore → subscription callback → in-memory cache → event dispatch → React re-render

  async initializeStore() {
    if (_isInitializing || _isInitialized) return;
    _isInitializing = true;

    try {
      // 1. Seed menu if Firestore is empty
      const remoteMenu = await firebaseService.getMenuItems();
      if (remoteMenu.length === 0) {
        console.log("Seeding Firestore with initial menu data...");
        for (const item of MENU_ITEMS) {
          await firebaseService.updateMenuItem(item);
        }
      }

      // 2. Seed settings if empty
      const remoteSettings = await firebaseService.getSettings();
      if (!remoteSettings) {
        console.log("Seeding Firestore with default settings...");
        await firebaseService.updateSettings(DEFAULT_SETTINGS);
      }

      // 3. Seed default delivery boys if empty
      const remoteDeliveryBoys = await firebaseService.getDeliveryBoys();
      if (remoteDeliveryBoys.length === 0) {
        console.log("Seeding Firestore with default delivery boys...");
        const defaultBoys = [
          { name: 'Rahul Kumar', phone: '9123456789' },
          { name: 'Amit Singh', phone: '9876543210' },
          { name: 'Vikash Yadav', phone: '7004123456' }
        ];
        for (const boy of defaultBoys) {
          await firebaseService.addDeliveryBoy(boy);
        }
      }

      // 4. Set up real-time subscriptions
      const unsub1 = firebaseService.subscribeToMenuItems((items) => {
        _menuItems = items;
        dispatchStoreUpdate();
      });

      const unsub2 = firebaseService.subscribeToOrders((orders) => {
        // Detect new orders for sound alert
        if (_prevOrderCount >= 0 && orders.length > _prevOrderCount) {
          playNewOrderSound();
        }
        _prevOrderCount = orders.length;
        _orders = orders;
        dispatchStoreUpdate();
      });

      const unsub3 = firebaseService.subscribeToReservations((res) => {
        _reservations = res;
        dispatchStoreUpdate();
      });

      const unsub4 = firebaseService.subscribeToCelebrations((enquiries) => {
        _celebrations = enquiries;
        dispatchStoreUpdate();
      });

      const unsub5 = firebaseService.subscribeToDeliveryBoys((boys) => {
        _deliveryBoys = boys;
        dispatchStoreUpdate();
      });

      const unsub6 = firebaseService.subscribeToSettings((settings) => {
        _settings = settings || { ...DEFAULT_SETTINGS };
        dispatchStoreUpdate();
      });

      // Seed site content if missing
      const remoteSiteContent = await firebaseService.getSiteContent();
      if (!remoteSiteContent) {
        console.log("Seeding Firestore with default site content...");
        await firebaseService.updateSiteContent(DEFAULT_SITE_CONTENT);
      }

      const unsub7 = firebaseService.subscribeToSiteContent((content) => {
        _siteContent = content || { ...DEFAULT_SITE_CONTENT };
        dispatchStoreUpdate();
      });

      _unsubscribers = [unsub1, unsub2, unsub3, unsub4, unsub5, unsub6, unsub7];
      _isInitialized = true;

    } catch (e) {
      console.error("Store initialization failed:", e);
      // Fallback: use seed data so the app isn't completely broken
      if (_menuItems.length === 0) {
        _menuItems = MENU_ITEMS;
      }
      if (!_settings) {
        _settings = { ...DEFAULT_SETTINGS };
      }
      _isInitialized = true;
      dispatchStoreUpdate();
    } finally {
      _isInitializing = false;
    }
  },

  /** Clean up all Firestore subscriptions */
  destroy() {
    _unsubscribers.forEach(unsub => unsub());
    _unsubscribers = [];
    _isInitialized = false;
    _isInitializing = false;
  }
};
