import { CartItem, MenuItem } from '../types';
import { MENU_ITEMS } from '../data';
import { RESTAURANT_INFO } from '../config/adminAuth';

// ─── Type Exports ──────────────────────────────────────────────────────────

export interface AdminOrder {
  id: string;
  createdAt: string;
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  deliveryType: 'delivery' | 'pickup' | 'dine-in';
  tableNumber?: string;
  paymentMethod: 'cod' | 'upi' | 'cash';
  specialInstructions?: string;
  subtotal: number;
  discount: number;
  cgst: number;
  sgst: number;
  deliveryFee: number;
  total: number;
  status: 'placed' | 'preparing' | 'completed' | 'cancelled';
  source?: 'pos' | 'online';
}

export interface SiteOffer {
  enabled: boolean;
  code: string;
  discountPercent: number;
  minOrder: number;
  label: string;
}

export interface AdminSettings {
  /** GST is disabled by default until scheme is explicitly enabled by staff */
  gstEnabled: boolean;
  gstin: string;
  cgstRate: number;
  sgstRate: number;
  deliveryFee: number;
  deliveryFeeThreshold: number;
  deliveryFeeAmount: number;
  upiVpa: string;
  kitchenBufferMinutes: number;
  offer: SiteOffer;
  whatsappNumber: string;
  isKitchenOpen: boolean;
}

// ─── Default Settings ──────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AdminSettings = {
  gstEnabled: false, // Default OFF as per requirements
  gstin: RESTAURANT_INFO.gstin,
  cgstRate: 2.5,
  sgstRate: 2.5,
  deliveryFee: 30,
  deliveryFeeThreshold: 500,
  deliveryFeeAmount: 40,
  upiVpa: 'aaravworlld@oksbi',
  kitchenBufferMinutes: 0,
  offer: {
    enabled: true,
    code: 'DELIGHT15',
    discountPercent: 15,
    minOrder: 600,
    label: 'Flat 15% off on orders above ₹600'
  },
  whatsappNumber: RESTAURANT_INFO.whatsappNumber,
  isKitchenOpen: true
};

// ─── LocalStorage Keys ─────────────────────────────────────────────────────

const STORAGE_KEYS = {
  MENU: 'curry_delight_menu_items',
  SETTINGS: 'curry_delight_settings',
  POS_ORDERS: 'curry_delight_pos_orders'
};

// ─── Sound Alert Engine ────────────────────────────────────────────────────

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

function speakText(text: string, pitch = 1.3, rate = 0.95, volume = 1) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = volume;
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

export function playNewOrderSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const notes = [
      { freq: 523.25, t: 0.00, dur: 0.18 }, // C5
      { freq: 587.33, t: 0.16, dur: 0.18 }, // D5
      { freq: 659.25, t: 0.32, dur: 0.18 }, // E5
      { freq: 783.99, t: 0.48, dur: 0.18 }, // G5
      { freq: 880.00, t: 0.64, dur: 0.18 }, // A5
      { freq: 1046.50, t: 0.80, dur: 0.35 } // C6
    ];

    notes.forEach(({ freq, t, dur }) => {
      playTone(ctx, freq, ctx.currentTime + t, dur, 0.85, 'square');
      playTone(ctx, freq, ctx.currentTime + t, dur, 0.4, 'sine');
    });

    setTimeout(() => {
      speakText('Order placed. Check ticket details.', 1.4, 0.9, 1);
    }, 1300);
  } catch (e) {
    console.error('Audio playback error:', e);
  }
}

export function playBillPrintedSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const notes = [
      { freq: 783.99, t: 0.00, dur: 0.2 }, // G5
      { freq: 659.25, t: 0.18, dur: 0.2 }, // E5
      { freq: 523.25, t: 0.36, dur: 0.4 }  // C5
    ];

    notes.forEach(({ freq, t, dur }) => {
      playTone(ctx, freq, ctx.currentTime + t, dur, 0.7, 'sine');
    });

    setTimeout(() => {
      speakText('Receipt generated successfully.', 1.2, 1.0, 1);
    }, 900);
  } catch (e) {
    console.error('Bill sound error:', e);
  }
}

// ─── Event Dispatcher ──────────────────────────────────────────────────────

function dispatchStoreUpdate() {
  window.dispatchEvent(new Event('adminStoreUpdate'));
  window.dispatchEvent(new Event('storage'));
}

// ─── Local State Cache ─────────────────────────────────────────────────────

let _menuItems: MenuItem[] = [];
let _settings: AdminSettings = { ...DEFAULT_SETTINGS };
let _posOrders: AdminOrder[] = [];
let _isInitialized = false;

function loadFromStorage() {
  try {
    const storedMenu = localStorage.getItem(STORAGE_KEYS.MENU);
    if (storedMenu) {
      _menuItems = JSON.parse(storedMenu);
    } else {
      _menuItems = [...MENU_ITEMS];
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(_menuItems));
    }

    const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (storedSettings) {
      _settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
    } else {
      _settings = { ...DEFAULT_SETTINGS };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(_settings));
    }

    const storedOrders = localStorage.getItem(STORAGE_KEYS.POS_ORDERS);
    if (storedOrders) {
      _posOrders = JSON.parse(storedOrders);
    } else {
      _posOrders = [];
    }
  } catch (err) {
    console.warn('Failed reading from localStorage, using in-memory fallbacks', err);
    _menuItems = [...MENU_ITEMS];
    _settings = { ...DEFAULT_SETTINGS };
    _posOrders = [];
  }
}

function saveMenuToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(_menuItems));
  } catch (err) {
    console.error('Failed saving menu to localStorage:', err);
  }
}

function saveSettingsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(_settings));
  } catch (err) {
    console.error('Failed saving settings to localStorage:', err);
  }
}

function saveOrdersToStorage() {
  try {
    // Keep last 100 orders for local review
    const sliced = _posOrders.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.POS_ORDERS, JSON.stringify(sliced));
  } catch (err) {
    console.error('Failed saving orders to localStorage:', err);
  }
}

// Initialize on load
loadFromStorage();
_isInitialized = true;

// ─── Store API ─────────────────────────────────────────────────────────────

export const adminStore = {
  get isInitialized() {
    return _isInitialized;
  },

  initializeStore() {
    loadFromStorage();
    _isInitialized = true;
    dispatchStoreUpdate();
  },

  destroy() {
    // No-op for local storage store
  },

  // Menu Read & Write
  getMenuItems(): MenuItem[] {
    if (_menuItems.length === 0) loadFromStorage();
    return _menuItems;
  },

  getSoldOutIds(): string[] {
    return _menuItems.filter(item => item.soldOut).map(item => item.id);
  },

  toggleSoldOut(itemId: string) {
    _menuItems = _menuItems.map(item =>
      item.id === itemId ? { ...item, soldOut: !item.soldOut } : item
    );
    saveMenuToStorage();
    dispatchStoreUpdate();
  },

  addMenuItem(itemData: Omit<MenuItem, 'id'>): MenuItem {
    const newItem: MenuItem = {
      ...itemData,
      id: `item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`
    };
    _menuItems = [newItem, ..._menuItems];
    saveMenuToStorage();
    dispatchStoreUpdate();
    return newItem;
  },

  updateMenuItem(id: string, updatedData: Partial<MenuItem>) {
    _menuItems = _menuItems.map(item =>
      item.id === id ? { ...item, ...updatedData } : item
    );
    saveMenuToStorage();
    dispatchStoreUpdate();
  },

  deleteMenuItem(id: string) {
    _menuItems = _menuItems.filter(item => item.id !== id);
    saveMenuToStorage();
    dispatchStoreUpdate();
  },

  resetMenuToDefault() {
    _menuItems = [...MENU_ITEMS];
    saveMenuToStorage();
    dispatchStoreUpdate();
  },

  // Settings Read & Write
  getSettings(): AdminSettings {
    return _settings;
  },

  saveSettings(settings: Partial<AdminSettings>) {
    _settings = { ..._settings, ...settings };
    saveSettingsToStorage();
    dispatchStoreUpdate();
  },

  // POS Orders Management (local only)
  getOrders(): AdminOrder[] {
    return _posOrders;
  },

  addOrder(orderData: Omit<AdminOrder, 'id' | 'createdAt' | 'status'>, customId?: string): AdminOrder {
    const id = customId || `CD-POS-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder: AdminOrder = {
      ...orderData,
      id,
      createdAt: new Date().toISOString(),
      status: 'placed'
    };
    _posOrders = [newOrder, ..._posOrders];
    saveOrdersToStorage();
    dispatchStoreUpdate();
    return newOrder;
  },

  updateOrderStatus(orderId: string, status: AdminOrder['status']) {
    _posOrders = _posOrders.map(o => o.id === orderId ? { ...o, status } : o);
    saveOrdersToStorage();
    dispatchStoreUpdate();
  },

  clearOrders() {
    _posOrders = [];
    saveOrdersToStorage();
    dispatchStoreUpdate();
  },

  // Compatibility stubs for celebratory/reservation forms (now drafts only)
  async addReservation(_data: unknown) {
    return { ok: true };
  },
  async addCelebration(_data: unknown) {
    return { ok: true };
  },
  getReservations() { return []; },
  getCelebrations() { return []; },
  getDeliveryBoys() { return []; }
};
