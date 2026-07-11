import { CartItem, MenuItem } from '../types';
import { MENU_ITEMS } from '../data';
import { firebaseService } from './firebaseService';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// ─── Type Exports ──────────────────────────────────────────────────────────

export interface AdminOrder {
  id: string;
  createdAt: string;
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryType: 'delivery' | 'pickup' | 'dine-in';
  tableNumber?: string;
  paymentMethod: 'cod' | 'upi';
  specialInstructions?: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: 'placed' | 'preparing' | 'out_for_delivery' | 'delivered';
  assignedDeliveryBoyId?: string;
  assignedDeliveryBoyName?: string;
  assignedDeliveryBoyPhone?: string;
  /** Whether order came from POS counter or online customer */
  source?: 'pos' | 'online';
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

export interface SiteOffer {
  enabled: boolean;
  code: string;
  discountPercent: number;
  minOrder: number;
  label: string;
}

export interface AdminSettings {
  gstEnabled: boolean;
  gstin: string;
  cgstRate: number;
  sgstRate: number;
  deliveryFee: number;
  upiVpa: string;
  kitchenBufferMinutes: number;
  offer: SiteOffer;
  deliveryFeeThreshold: number;
  deliveryFeeAmount: number;
  /** WhatsApp number for order/reservation notifications (with country code, no +) */
  whatsappNumber: string;
  /** When false, online ordering shows "Kitchen Closed" — no new orders accepted */
  isKitchenOpen: boolean;
}

// ─── Default Settings (used when Firestore has no settings yet) ────────────

const DEFAULT_SETTINGS: AdminSettings = {
  gstEnabled: true,
  gstin: '24AAAAC1234A1Z5',
  cgstRate: 2.5,
  sgstRate: 2.5,
  deliveryFee: 30,
  upiVpa: 'aaravworlld@oksbi',
  kitchenBufferMinutes: 0,
  offer: {
    enabled: false,
    code: 'DELIGHT15',
    discountPercent: 15,
    minOrder: 600,
    label: 'Flat 15% off on orders above ₹600'
  },
  deliveryFeeThreshold: 500,
  deliveryFeeAmount: 40,
  whatsappNumber: '917061591831',
  isKitchenOpen: true
};

// ─── Sound Alert Engine ────────────────────────────────────────────────────

/** Helper: play a single tone on a shared AudioContext */
function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  gain: number = 0.8,
  type: OscillatorType = 'square'
) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.02);
  gainNode.gain.setValueAtTime(gain, startTime + duration - 0.05);
  gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

  osc.connect(gainNode);
  gainNode.connect(compressor);
  compressor.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Speak a text using browser's speech synthesis (Text-to-Speech) */
function speakText(text: string, pitch = 1.3, rate = 0.95, volume = 1) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = volume;
    // Prefer a clear English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
      || voices.find(v => v.lang.startsWith('en'))
      || voices[0];
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
}

/** 
 * NEW ORDER ALERT — loud musical fanfare + voice: "Attention! New Order Received!"
 * Uses a 6-note ascending fanfare in the key of C major at high gain for
 * maximum audibility across a busy kitchen or counter environment.
 */
export function playNewOrderSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // 6-note ascending fanfare — C5 D5 E5 G5 A5 C6
    const notes = [
      { freq: 523.25, t: 0.00, dur: 0.18 },   // C5
      { freq: 587.33, t: 0.16, dur: 0.18 },   // D5
      { freq: 659.25, t: 0.32, dur: 0.18 },   // E5
      { freq: 783.99, t: 0.48, dur: 0.18 },   // G5
      { freq: 880.00, t: 0.64, dur: 0.18 },   // A5
      { freq: 1046.50, t: 0.80, dur: 0.35 },  // C6 — high hold
    ];

    notes.forEach(({ freq, t, dur }) => {
      playTone(ctx, freq, ctx.currentTime + t, dur, 0.85, 'square');
      // Layer a sine underneath for warmth
      playTone(ctx, freq, ctx.currentTime + t, dur, 0.4, 'sine');
    });

    // After the fanfare, fire the voice alert
    setTimeout(() => {
      speakText('Attention! New order received. Please check the dashboard.', 1.4, 0.9, 1);
    }, 1300);

  } catch (e) {
    console.error("Audio playback error:", e);
  }
}

/**
 * BILL PRINTED ALERT — 3-note confirmation chime + voice: "Bill printed successfully."
 */
export function playBillPrintedSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // 3-note confirmation: G5 → E5 → C5 (descending resolution)
    const notes = [
      { freq: 783.99, t: 0.00, dur: 0.2 },  // G5
      { freq: 659.25, t: 0.18, dur: 0.2 },  // E5
      { freq: 523.25, t: 0.36, dur: 0.4 },  // C5 hold
    ];

    notes.forEach(({ freq, t, dur }) => {
      playTone(ctx, freq, ctx.currentTime + t, dur, 0.7, 'sine');
    });

    setTimeout(() => {
      speakText('Bill printed successfully.', 1.2, 1.0, 1);
    }, 900);

  } catch (e) {
    console.error("Bill sound error:", e);
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

  /** Get IDs of all sold-out items (derived from menu item soldOut field) */
  getSoldOutIds(): string[] {
    return _menuItems.filter(item => item.soldOut).map(item => item.id);
  },

  // ─── Write Methods (write to Firestore, cache updates via subscription) ──

  async addOrder(orderData: Omit<AdminOrder, 'id' | 'createdAt' | 'status'>, customId?: string): Promise<AdminOrder> {
    // Collision-resistant ID: year + base36 timestamp + 4 random chars
    const id = customId || `CD-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
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

    return newOrder;
  },

  async updateOrderStatus(orderId: string, status: AdminOrder['status']) {
    // Optimistic local update
    const previousOrders = [..._orders];
    _orders = _orders.map(o => o.id === orderId ? { ...o, status } : o);
    dispatchStoreUpdate();

    try {
      await firebaseService.updateOrderStatus(orderId, status);
    } catch (e) {
      console.error("Firebase updateOrderStatus failed, reverting:", e);
      _orders = previousOrders;
      dispatchStoreUpdate();
    }
  },

  async assignDeliveryBoy(orderId: string, deliveryBoyId: string) {
    const boy = _deliveryBoys.find(b => b.id === deliveryBoyId);
    const boyName = boy ? boy.name : '';
    const boyPhone = boy ? boy.phone : '';

    // Optimistic local update
    const previousOrders = [..._orders];
    _orders = _orders.map(o => o.id === orderId ? { 
      ...o, 
      assignedDeliveryBoyId: deliveryBoyId,
      assignedDeliveryBoyName: boyName,
      assignedDeliveryBoyPhone: boyPhone
    } : o);
    dispatchStoreUpdate();

    try {
      await firebaseService.assignDeliveryBoy(orderId, deliveryBoyId, boyName, boyPhone);
    } catch (e) {
      console.error("Firebase assignDeliveryBoy failed, reverting:", e);
      _orders = previousOrders;
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
    // Optimistic local update
    const previousReservations = [..._reservations];
    _reservations = _reservations.map(r => r.id === id ? { ...r, status } : r);
    dispatchStoreUpdate();

    try {
      await firebaseService.updateReservationStatus(id, status);
    } catch (e) {
      console.error("Firebase updateReservationStatus failed, reverting:", e);
      _reservations = previousReservations;
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
    // Optimistic local update
    const previousCelebrations = [..._celebrations];
    _celebrations = _celebrations.map(c => c.id === id ? { ...c, status } : c);
    dispatchStoreUpdate();

    try {
      await firebaseService.updateCelebrationStatus(id, status);
    } catch (e) {
      console.error("Firebase updateCelebrationStatus failed, reverting:", e);
      _celebrations = previousCelebrations;
      dispatchStoreUpdate();
    }
  },

  async updateCelebrationNotes(id: string, notes: string) {
    // Optimistic local update
    const previousCelebrations = [..._celebrations];
    _celebrations = _celebrations.map(c => c.id === id ? { ...c, notes } : c);
    dispatchStoreUpdate();

    try {
      await firebaseService.updateCelebrationNotes(id, notes);
    } catch (e) {
      console.error("Firebase updateCelebrationNotes failed, reverting:", e);
      _celebrations = previousCelebrations;
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

      // 3. Set up dynamic authentication-driven subscriptions
      const authUnsub = onAuthStateChanged(auth, (user) => {
        // Clean up previous subscriptions
        _unsubscribers.forEach(unsub => {
          try { unsub(); } catch (e) {}
        });
        _unsubscribers = [];

        // Always subscribe to public collections
        const unsubMenu = firebaseService.subscribeToMenuItems((items) => {
          _menuItems = items;
          dispatchStoreUpdate();
        });
        const unsubSettings = firebaseService.subscribeToSettings((settings) => {
          _settings = settings || { ...DEFAULT_SETTINGS };
          dispatchStoreUpdate();
        });
        _unsubscribers.push(unsubMenu, unsubSettings);

        if (user) {
          console.log("Store: Admin authenticated. Subscribing to secure collections...");
          
          const unsubOrders = firebaseService.subscribeToOrders((orders) => {
            if (_prevOrderCount >= 0 && orders.length > _prevOrderCount) {
              playNewOrderSound();
            }
            _prevOrderCount = orders.length;
            _orders = orders;
            dispatchStoreUpdate();
          });

          const unsubReservations = firebaseService.subscribeToReservations((res) => {
            _reservations = res;
            dispatchStoreUpdate();
          });

          const unsubCelebrations = firebaseService.subscribeToCelebrations((enquiries) => {
            _celebrations = enquiries;
            dispatchStoreUpdate();
          });

          const unsubDeliveryBoys = firebaseService.subscribeToDeliveryBoys((boys) => {
            _deliveryBoys = boys;
            dispatchStoreUpdate();
          });

          _unsubscribers.push(unsubOrders, unsubReservations, unsubCelebrations, unsubDeliveryBoys);
        } else {
          console.log("Store: No authenticated admin. secure subscriptions skipped.");
          // Clear cached secure data to avoid stale data remaining on screen
          _orders = [];
          _reservations = [];
          _celebrations = [];
          _deliveryBoys = [];
          _prevOrderCount = -1;
          dispatchStoreUpdate();
        }
      });

      // Maintain authUnsub handle so destroy() can clean it up
      _unsubscribers.push(authUnsub);
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
