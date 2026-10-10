import { CartItem, MenuItem } from '../types';
import { MENU_ITEMS, SPECIFIC_DISH_IMAGES } from '../data';
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

export interface AnnouncementBanner {
  enabled: boolean;
  type: 'weather' | 'festival' | 'rush' | 'custom';
  text: string;
}

export interface KOTBatch {
  kotNumber: number;
  printedAt: string;
  items: CartItem[];
}

export interface TableSession {
  tableId: string;
  tableName: string;
  guestCount: number;
  status: 'vacant' | 'occupied' | 'billed';
  openedAt?: string;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  kots: KOTBatch[];
}

export interface PettyExpense {
  id: string;
  amount: number;
  category: 'dairy' | 'vegetables' | 'gas_fuel' | 'maintenance' | 'staff' | 'other';
  note: string;
  timestamp: string;
  staffName?: string;
}

export interface CustomerProfile {
  phone: string;
  name: string;
  address?: string;
  totalOrders: number;
  totalSpend: number;
  lastOrderDate: string;
  notes?: string;
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
  announcementBanner?: AnnouncementBanner;
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
  isKitchenOpen: true,
  announcementBanner: {
    enabled: false,
    type: 'weather',
    text: '🌧️ Heavy Rain Alert: Hot meals being cooked fresh! Deliveries across Kahalgaon & NTPC Township may take 15–20 mins extra.'
  }
};

// ─── LocalStorage Keys ─────────────────────────────────────────────────────

const STORAGE_KEYS = {
  MENU: 'curry_delight_menu_items',
  SETTINGS: 'curry_delight_settings',
  POS_ORDERS: 'curry_delight_pos_orders',
  TABLES: 'curry_delight_table_sessions',
  EXPENSES: 'curry_delight_petty_expenses',
  CUSTOMERS: 'curry_delight_customer_directory'
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

const DEFAULT_TABLES: TableSession[] = Array.from({ length: 10 }, (_, i) => ({
  tableId: `T${i + 1}`,
  tableName: `Table ${i + 1}`,
  guestCount: 2,
  status: 'vacant',
  items: [],
  kots: []
}));

let _menuItems: MenuItem[] = [];
let _settings: AdminSettings = { ...DEFAULT_SETTINGS };
let _posOrders: AdminOrder[] = [];
let _tableSessions: TableSession[] = [...DEFAULT_TABLES];
let _pettyExpenses: PettyExpense[] = [];
let _customerProfiles: Record<string, CustomerProfile> = {};
let _isInitialized = false;

function loadFromStorage() {
  try {
    const storedMenu = localStorage.getItem(STORAGE_KEYS.MENU);
    if (storedMenu) {
      const parsed = JSON.parse(storedMenu);
      if (Array.isArray(parsed) && parsed.length > 0) {
        _menuItems = parsed.filter(Boolean).map((item: MenuItem) => {
          if (item && item.id && SPECIFIC_DISH_IMAGES[item.id]) {
            return { ...item, image: SPECIFIC_DISH_IMAGES[item.id] };
          }
          return item;
        });
      } else {
        _menuItems = [...MENU_ITEMS];
      }
    } else {
      _menuItems = [...MENU_ITEMS];
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(_menuItems));
    }

    const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
      if (parsedSettings && typeof parsedSettings === 'object') {
        _settings = { ...DEFAULT_SETTINGS, ...parsedSettings };
      } else {
        _settings = { ...DEFAULT_SETTINGS };
      }
    } else {
      _settings = { ...DEFAULT_SETTINGS };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(_settings));
    }

    const storedOrders = localStorage.getItem(STORAGE_KEYS.POS_ORDERS);
    if (storedOrders) {
      const parsedOrders = JSON.parse(storedOrders);
      _posOrders = Array.isArray(parsedOrders) ? parsedOrders.filter(Boolean) : [];
    } else {
      _posOrders = [];
    }

    const storedTables = localStorage.getItem(STORAGE_KEYS.TABLES);
    if (storedTables) {
      const parsedTables = JSON.parse(storedTables);
      if (Array.isArray(parsedTables) && parsedTables.length > 0) {
        _tableSessions = parsedTables.filter(Boolean);
      } else {
        _tableSessions = [...DEFAULT_TABLES];
      }
    } else {
      _tableSessions = [...DEFAULT_TABLES];
      localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(_tableSessions));
    }

    const storedExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (storedExpenses) {
      const parsedExpenses = JSON.parse(storedExpenses);
      _pettyExpenses = Array.isArray(parsedExpenses) ? parsedExpenses.filter(Boolean) : [];
    } else {
      _pettyExpenses = [];
    }

    const storedCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (storedCustomers) {
      const parsedCustomers = JSON.parse(storedCustomers);
      _customerProfiles = (parsedCustomers && typeof parsedCustomers === 'object') ? parsedCustomers : {};
    } else {
      _customerProfiles = {};
    }
  } catch (err) {
    console.warn('Failed reading from localStorage, using in-memory fallbacks', err);
    _menuItems = [...MENU_ITEMS];
    _settings = { ...DEFAULT_SETTINGS };
    _posOrders = [];
    _tableSessions = [...DEFAULT_TABLES];
    _pettyExpenses = [];
    _customerProfiles = {};
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

function saveTablesToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(_tableSessions));
  } catch (err) {
    console.error('Failed saving tables to localStorage:', err);
  }
}

function saveExpensesToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(_pettyExpenses));
  } catch (err) {
    console.error('Failed saving expenses to localStorage:', err);
  }
}

function saveCustomersToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(_customerProfiles));
  } catch (err) {
    console.error('Failed saving customers to localStorage:', err);
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

  // ─── Dine-In Table Sessions ────────────────────────────────────────────────
  getTableSessions(): TableSession[] {
    return _tableSessions;
  },

  getTableSession(tableId: string): TableSession | undefined {
    return _tableSessions.find(t => t.tableId === tableId);
  },

  saveTableSession(session: TableSession) {
    _tableSessions = _tableSessions.map(t => t.tableId === session.tableId ? session : t);
    saveTablesToStorage();
    dispatchStoreUpdate();
  },

  clearTableSession(tableId: string) {
    _tableSessions = _tableSessions.map(t => {
      if (t.tableId === tableId) {
        return {
          tableId: t.tableId,
          tableName: t.tableName,
          guestCount: 2,
          status: 'vacant',
          items: [],
          kots: []
        };
      }
      return t;
    });
    saveTablesToStorage();
    dispatchStoreUpdate();
  },

  // ─── Petty Cash / Daily Expenses ───────────────────────────────────────────
  getPettyExpenses(): PettyExpense[] {
    return _pettyExpenses;
  },

  addPettyExpense(expense: Omit<PettyExpense, 'id' | 'timestamp'>): PettyExpense {
    const newExp: PettyExpense = {
      ...expense,
      id: `exp-${Date.now().toString(36)}-${Math.floor(10 + Math.random() * 90)}`,
      timestamp: new Date().toISOString()
    };
    _pettyExpenses = [newExp, ..._pettyExpenses];
    saveExpensesToStorage();
    dispatchStoreUpdate();
    return newExp;
  },

  deletePettyExpense(id: string) {
    _pettyExpenses = _pettyExpenses.filter(e => e.id !== id);
    saveExpensesToStorage();
    dispatchStoreUpdate();
  },

  // ─── Customer Directory & Profile ──────────────────────────────────────────
  getCustomer(phone: string): CustomerProfile | undefined {
    const cleanPhone = phone.replace(/\D/g, '');
    return _customerProfiles[cleanPhone];
  },

  saveCustomer(profile: CustomerProfile) {
    const cleanPhone = profile.phone.replace(/\D/g, '');
    _customerProfiles[cleanPhone] = { ...profile, phone: cleanPhone };
    saveCustomersToStorage();
    dispatchStoreUpdate();
  },

  recordCustomerOrder(phone: string, name: string, amount: number, address?: string) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) return;
    const existing = _customerProfiles[cleanPhone];
    if (existing) {
      existing.name = name || existing.name;
      if (address) existing.address = address;
      existing.totalOrders += 1;
      existing.totalSpend += amount;
      existing.lastOrderDate = new Date().toISOString();
      _customerProfiles[cleanPhone] = { ...existing };
    } else {
      _customerProfiles[cleanPhone] = {
        phone: cleanPhone,
        name: name || 'Customer',
        address,
        totalOrders: 1,
        totalSpend: amount,
        lastOrderDate: new Date().toISOString()
      };
    }
    saveCustomersToStorage();
    dispatchStoreUpdate();
  },

  getAllCustomers(): CustomerProfile[] {
    return Object.values(_customerProfiles);
  },

  // ─── Day End Backup (CSV Export) ───────────────────────────────────────────
  exportOrdersCSV(dateStr?: string): string {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const filtered = _posOrders.filter(o => o.createdAt.startsWith(targetDate));
    const header = ['Order ID', 'Date & Time', 'Type', 'Table', 'Customer Name', 'Phone', 'Payment', 'Subtotal', 'Discount', 'GST', 'Total', 'Items'];
    const rows = filtered.map(o => {
      const itemsSummary = o.items.map(i => `${i.menuItem.name} x${i.quantity}`).join('; ');
      return [
        o.id,
        new Date(o.createdAt).toLocaleString('en-IN'),
        o.deliveryType,
        o.tableNumber || '-',
        `"${(o.customerName || '').replace(/"/g, '""')}"`,
        o.customerPhone || '-',
        o.paymentMethod.toUpperCase(),
        o.subtotal,
        o.discount,
        o.cgst + o.sgst,
        o.total,
        `"${itemsSummary.replace(/"/g, '""')}"`
      ].join(',');
    });
    return [header.join(','), ...rows].join('\n');
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
