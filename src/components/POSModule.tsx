import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingBag,
  Printer,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Bluetooth,
  LogOut,
  Utensils,
  Settings,
  ListOrdered,
  FileText,
  RotateCcw,
  Coffee,
  Leaf,
  X,
  Phone,
  ArrowLeft,
  Flame,
  Check
} from 'lucide-react';
import { MenuItem, CartItem } from '../types';
import { adminStore, AdminOrder, AdminSettings, playBillPrintedSound } from '../lib/adminStore';
import { ADMIN_CREDENTIALS, RESTAURANT_INFO } from '../config/adminAuth';

interface POSModuleProps {
  navigateTo: (path: string) => void;
}

/**
 * Web Bluetooth Printer Service Configuration
 * Target: EZO 58mm Thermal Receipt Printer & compatible ESC/POS BLE printers.
 * Supported on Chromium browsers on Android and Desktop.
 */
const BLE_PRINT_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer Service
  'e7810a71-73ae-499d-8c15-f59b69da81a0', // Common Thermal POS
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent
  '0000ff00-0000-1000-8000-00805f9b34fb'
];

export default function POSModule({ navigateTo }: POSModuleProps) {
  // ─── Step 5: Admin Access Gate ───────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('cd_pos_auth') === 'true';
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      loginUsername.trim().toLowerCase() === ADMIN_CREDENTIALS.username.toLowerCase() &&
      loginPassword === ADMIN_CREDENTIALS.password
    ) {
      setIsAuthenticated(true);
      sessionStorage.setItem('cd_pos_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid administrator credentials. Please check your username and password.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('cd_pos_auth');
  };

  // ─── Navigation Tabs ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'pos' | 'menu' | 'orders' | 'settings'>('pos');

  // ─── Data State from adminStore ──────────────────────────────────────────
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => adminStore.getMenuItems());
  const [settings, setSettings] = useState<AdminSettings>(() => adminStore.getSettings());
  const [orders, setOrders] = useState<AdminOrder[]>(() => adminStore.getOrders());

  useEffect(() => {
    const handleStoreChange = () => {
      setMenuItems([...adminStore.getMenuItems()]);
      setSettings({ ...adminStore.getSettings() });
      setOrders([...adminStore.getOrders()]);
    };
    window.addEventListener('adminStoreUpdate', handleStoreChange);
    return () => window.removeEventListener('adminStoreUpdate', handleStoreChange);
  }, []);

  // ─── POS Ticket State ────────────────────────────────────────────────────
  const [ticketItems, setTicketItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'dine-in' | 'pickup' | 'delivery'>('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'cod'>('cash');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // ─── Search & Category Filters in POS ───────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');

  const categories = useMemo(() => {
    return Array.from(new Set(menuItems.map(item => item.category)));
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDiet =
        dietFilter === 'all' ||
        (dietFilter === 'veg' && item.isVeg) ||
        (dietFilter === 'non-veg' && !item.isVeg);
      return matchesCat && matchesSearch && matchesDiet;
    });
  }, [menuItems, selectedCategory, searchQuery, dietFilter]);

  // ─── Ticket Calculations ─────────────────────────────────────────────────
  const subtotal = useMemo(() => {
    return ticketItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  }, [ticketItems]);

  const deliveryFee = useMemo(() => {
    if (orderType !== 'delivery') return 0;
    return subtotal >= settings.deliveryFeeThreshold ? 0 : settings.deliveryFeeAmount;
  }, [orderType, subtotal, settings]);

  const cgst = useMemo(() => {
    if (!settings.gstEnabled) return 0;
    const taxable = Math.max(0, subtotal - discountAmount);
    return Math.round((taxable * settings.cgstRate) / 100);
  }, [subtotal, discountAmount, settings]);

  const sgst = useMemo(() => {
    if (!settings.gstEnabled) return 0;
    const taxable = Math.max(0, subtotal - discountAmount);
    return Math.round((taxable * settings.sgstRate) / 100);
  }, [subtotal, discountAmount, settings]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + cgst + sgst + deliveryFee);
  }, [subtotal, discountAmount, cgst, sgst, deliveryFee]);

  // ─── Ticket Actions ──────────────────────────────────────────────────────
  const addToTicket = (item: MenuItem) => {
    setTicketItems(prev => {
      const existing = prev.find(p => p.menuItem.id === item.id);
      if (existing) {
        return prev.map(p =>
          p.menuItem.id === item.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [
        ...prev,
        {
          menuItem: item,
          quantity: 1,
          selectedSpice: item.spiceLevel || 'medium',
          specialInstructions: ''
        }
      ];
    });
  };

  const updateQuantity = (idx: number, delta: number) => {
    setTicketItems(prev => {
      const item = prev[idx];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      return prev.map((p, i) => (i === idx ? { ...p, quantity: newQty } : p));
    });
  };

  const updateInstructions = (idx: number, notes: string) => {
    setTicketItems(prev =>
      prev.map((p, i) => (i === idx ? { ...p, specialInstructions: notes } : p))
    );
  };

  const removeFromTicket = (idx: number) => {
    setTicketItems(prev => prev.filter((_, i) => i !== idx));
  };

  const clearTicket = () => {
    setTicketItems([]);
    setTableNumber('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setDiscountAmount(0);
  };

  // ─── Web Bluetooth / Thermal Printing Implementation ───────────────────────
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null);
  const [printerCharacteristic, setPrinterCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [printerStatus, setPrinterStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [printFeedback, setPrintFeedback] = useState<string>('');

  // 58mm receipt preview modal state
  const [previewContent, setPreviewContent] = useState<{
    title: string;
    text: string;
    rawLines: string[];
    isKot: boolean;
  } | null>(null);

  /** Connect to Bluetooth thermal printer via Web Bluetooth API (Android / Chrome) */
  const handleConnectPrinter = async () => {
    if (!navigator.bluetooth) {
      alert(
        'Web Bluetooth API is not available on this browser or platform.\n\n' +
        'NOTE: Web Bluetooth is supported in Chrome on Android and Windows/Linux. On Safari/iOS, please use standard USB/browser printing instead.'
      );
      return;
    }

    try {
      setPrinterStatus('connecting');
      setPrintFeedback('Searching for Bluetooth printer...');

      // Request device with printer services or accept all devices
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BLE_PRINT_SERVICES
      });

      device.addEventListener('gattserverdisconnected', () => {
        setPrinterStatus('disconnected');
        setBluetoothDevice(null);
        setPrinterCharacteristic(null);
        setPrintFeedback('Printer disconnected');
      });

      setPrintFeedback(`Connecting to ${device.name || 'Printer'}...`);
      const server = await device.gatt?.connect();
      if (!server) throw new Error('Could not connect to GATT server');

      // Attempt to find writable characteristic across services
      let writeChar: BluetoothRemoteGATTCharacteristic | null = null;
      for (const serviceUuid of BLE_PRINT_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              writeChar = char;
              break;
            }
          }
          if (writeChar) break;
        } catch {
          // Try next service
        }
      }

      if (!writeChar) {
        // Fallback: search all available services
        const services = await server.getPrimaryServices();
        for (const service of services) {
          try {
            const characteristics = await service.getCharacteristics();
            for (const char of characteristics) {
              if (char.properties.write || char.properties.writeWithoutResponse) {
                writeChar = char;
                break;
              }
            }
            if (writeChar) break;
          } catch {
            // Ignore
          }
        }
      }

      if (!writeChar) {
        throw new Error('No writable ESC/POS printing characteristic discovered on device.');
      }

      setBluetoothDevice(device);
      setPrinterCharacteristic(writeChar);
      setPrinterStatus('connected');
      setPrintFeedback(`Connected to ${device.name || 'Thermal Printer'}!`);
      setTimeout(() => setPrintFeedback(''), 4000);
    } catch (err: unknown) {
      console.error('Bluetooth connection failed:', err);
      setPrinterStatus('disconnected');
      setPrintFeedback(`Connection failed: ${(err as Error).message || 'User cancelled'}`);
    }
  };

  /** Send formatted text chunk by chunk to BLE characteristic */
  const sendBytesToBluetooth = async (text: string) => {
    if (!printerCharacteristic) {
      throw new Error('Printer not connected');
    }

    const encoder = new TextEncoder();
    // ESC/POS Initialization: ESC @, followed by text, then cut paper
    const initCmd = new Uint8Array([0x1b, 0x40]);
    const cutCmd = new Uint8Array([0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x00]);
    const payload = encoder.encode(text);

    // Merge buffers
    const merged = new Uint8Array(initCmd.length + payload.length + cutCmd.length);
    merged.set(initCmd, 0);
    merged.set(payload, initCmd.length);
    merged.set(cutCmd, initCmd.length + payload.length);

    // Write in 100-byte chunks to avoid BLE MTU limits
    const CHUNK_SIZE = 100;
    for (let i = 0; i < merged.length; i += CHUNK_SIZE) {
      const chunk = merged.slice(i, i + CHUNK_SIZE);
      await printerCharacteristic.writeValue(chunk);
      // Small pause between chunks
      await new Promise(r => setTimeout(r, 25));
    }
  };

  // ─── Generate ESC/POS Formatted 58mm Plain Text ────────────────────────────
  // 58mm printers typically accommodate 32 columns in font A
  const padLine = (left: string, right: string, width = 32) => {
    const space = Math.max(1, width - left.length - right.length);
    return left + ' '.repeat(space) + right;
  };

  const centerText = (text: string, width = 32) => {
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(pad) + text;
  };

  const generateKotText = (orderId: string): string => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN');
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const divider = '--------------------------------';
    const lines: string[] = [
      centerText('*** KITCHEN ORDER TICKET ***'),
      centerText('(KOT)'),
      divider,
      padLine(`Order: ${orderId}`, timeStr),
      padLine(`Date: ${dateStr}`, `Type: ${orderType.toUpperCase()}`),
      orderType === 'dine-in' ? `Table: ${tableNumber || 'Walk-In'}` : `Customer: ${customerName || 'Counter'}`,
      divider,
      padLine('ITEM [QTY]', 'NOTES'),
      divider
    ];

    ticketItems.forEach((item, idx) => {
      const spiceTag = item.selectedSpice === 'hot' ? ' [Spicy]' : item.selectedSpice === 'mild' ? ' [Mild]' : '';
      lines.push(`${idx + 1}. ${item.menuItem.name} x${item.quantity}${spiceTag}`);
      if (item.specialInstructions) {
        lines.push(`   >> NOTE: ${item.specialInstructions}`);
      }
    });

    lines.push(divider);
    lines.push(centerText(`TOTAL ITEMS: ${ticketItems.reduce((s, i) => s + i.quantity, 0)}`));
    lines.push(divider);
    lines.push('\n\n\n');
    return lines.join('\n');
  };

  const generateBillText = (orderId: string): string => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN');
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const divider = '--------------------------------';
    const doubleDiv = '================================';

    const lines: string[] = [
      centerText(RESTAURANT_INFO.name.toUpperCase()),
      centerText(RESTAURANT_INFO.tagline),
      centerText(RESTAURANT_INFO.address),
      centerText(`Ph: ${RESTAURANT_INFO.displayPhone}`),
      settings.gstEnabled ? centerText(`GSTIN: ${settings.gstin}`) : '',
      centerText(`FSSAI: ${RESTAURANT_INFO.fssai}`),
      doubleDiv,
      padLine(`Bill: ${orderId}`, timeStr),
      padLine(`Date: ${dateStr}`, `Mode: ${paymentMethod.toUpperCase()}`),
      padLine(`Type: ${orderType.toUpperCase()}`, orderType === 'dine-in' ? `Table: ${tableNumber || '-'}` : ''),
      customerName ? `Customer: ${customerName}` : '',
      customerPhone ? `Phone: ${customerPhone}` : '',
      divider,
      padLine('Item (Qty x Rate)', 'Amount'),
      divider
    ].filter(Boolean);

    ticketItems.forEach((item) => {
      const itemSubtotal = item.menuItem.price * item.quantity;
      lines.push(item.menuItem.name);
      lines.push(padLine(`  ${item.quantity} x Rs.${item.menuItem.price}`, `Rs.${itemSubtotal}`));
    });

    lines.push(divider);
    lines.push(padLine('Subtotal:', `Rs.${subtotal}`));

    if (discountAmount > 0) {
      lines.push(padLine('Discount:', `-Rs.${discountAmount}`));
    }

    if (settings.gstEnabled) {
      lines.push(padLine(`CGST (${settings.cgstRate}%):`, `Rs.${cgst}`));
      lines.push(padLine(`SGST (${settings.sgstRate}%):`, `Rs.${sgst}`));
    }

    if (deliveryFee > 0) {
      lines.push(padLine('Delivery Fee:', `Rs.${deliveryFee}`));
    }

    lines.push(doubleDiv);
    lines.push(padLine('NET PAYABLE:', `Rs.${total}`));
    lines.push(doubleDiv);
    lines.push(centerText('Thank You! Visit Again!'));
    lines.push(centerText('Food served with pure love.'));
    lines.push('\n\n\n');
    return lines.join('\n');
  };

  /** Save Order to local adminStore */
  const saveOrderToStore = (status: AdminOrder['status'] = 'placed'): AdminOrder => {
    const order = adminStore.addOrder({
      customerName: customerName || (orderType === 'dine-in' ? `Table ${tableNumber || 'Walk-In'}` : 'Counter Walk-In'),
      customerPhone: customerPhone || 'Counter',
      customerAddress: customerAddress || undefined,
      deliveryType: orderType,
      tableNumber: tableNumber || undefined,
      paymentMethod,
      items: [...ticketItems],
      subtotal,
      discount: discountAmount,
      cgst,
      sgst,
      deliveryFee,
      total,
      source: 'pos'
    });
    return order;
  };

  /** Print KOT Action */
  const handlePrintKOT = async () => {
    if (ticketItems.length === 0) {
      alert('The ticket is empty. Please add items to print KOT.');
      return;
    }

    const orderId = `KOT-${Math.floor(100 + Math.random() * 900)}`;
    const kotText = generateKotText(orderId);

    // Save as local order in background
    saveOrderToStore('preparing');

    // Try Bluetooth printing if connected
    if (printerCharacteristic) {
      try {
        setPrintFeedback('Printing KOT via Bluetooth...');
        await sendBytesToBluetooth(kotText);
        setPrintFeedback('KOT Printed successfully via Bluetooth!');
        setTimeout(() => setPrintFeedback(''), 3000);
      } catch (err: unknown) {
        console.error('Bluetooth print failed:', err);
        setPrintFeedback('Bluetooth print failed, opening preview for standard print.');
        setPreviewContent({
          title: 'KITCHEN ORDER TICKET (KOT)',
          text: kotText,
          rawLines: kotText.split('\n'),
          isKot: true
        });
      }
    } else {
      // Show thermal preview modal with standard browser print fallback
      setPreviewContent({
        title: 'KITCHEN ORDER TICKET (KOT)',
        text: kotText,
        rawLines: kotText.split('\n'),
        isKot: true
      });
    }
  };

  /** Print Bill Action */
  const handlePrintBill = async () => {
    if (ticketItems.length === 0) {
      alert('The ticket is empty. Please add items to print Bill.');
      return;
    }

    const savedOrder = saveOrderToStore('completed');
    const billText = generateBillText(savedOrder.id);
    playBillPrintedSound();

    if (printerCharacteristic) {
      try {
        setPrintFeedback('Printing Bill via Bluetooth...');
        await sendBytesToBluetooth(billText);
        setPrintFeedback('Bill Printed successfully via Bluetooth!');
        setTimeout(() => setPrintFeedback(''), 3000);
        clearTicket();
      } catch (err: unknown) {
        console.error('Bluetooth bill print failed:', err);
        setPrintFeedback('Bluetooth print failed, opening print preview.');
        setPreviewContent({
          title: 'TAX INVOICE / BILL RECEIPT',
          text: billText,
          rawLines: billText.split('\n'),
          isKot: false
        });
      }
    } else {
      setPreviewContent({
        title: 'TAX INVOICE / BILL RECEIPT',
        text: billText,
        rawLines: billText.split('\n'),
        isKot: false
      });
    }
  };

  // ─── Menu Management State ────────────────────────────────────────────────
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [dishForm, setDishForm] = useState<{
    name: string;
    description: string;
    price: number;
    category: string;
    isVeg: boolean;
    spiceLevel?: 'mild' | 'medium' | 'hot';
  }>({
    name: '',
    description: '',
    price: 100,
    category: 'Classic Indian Gravies (Veg)',
    isVeg: true,
    spiceLevel: 'medium'
  });

  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishForm.name.trim()) {
      alert('Please provide a dish name.');
      return;
    }

    if (editingItem) {
      adminStore.updateMenuItem(editingItem.id, {
        name: dishForm.name,
        description: dishForm.description,
        price: Number(dishForm.price),
        category: dishForm.category,
        isVeg: dishForm.isVeg,
        spiceLevel: dishForm.spiceLevel
      });
      setEditingItem(null);
    } else {
      adminStore.addMenuItem({
        name: dishForm.name,
        description: dishForm.description || `${dishForm.name} prepared fresh with authentic ingredients.`,
        price: Number(dishForm.price),
        category: dishForm.category,
        isVeg: dishForm.isVeg,
        spiceLevel: dishForm.spiceLevel,
        image: '',
        imagePrompt: ''
      });
      setIsAddDishOpen(false);
    }

    setDishForm({
      name: '',
      description: '',
      price: 100,
      category: 'Classic Indian Gravies (Veg)',
      isVeg: true,
      spiceLevel: 'medium'
    });
  };

  const handleEditClick = (item: MenuItem) => {
    setEditingItem(item);
    setDishForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isVeg: item.isVeg,
      spiceLevel: item.spiceLevel
    });
  };

  const handleDeleteDish = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from the menu?`)) {
      adminStore.deleteMenuItem(id);
    }
  };

  // ─── If Not Authenticated: Render Step 5 Access Gate ───────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-charcoal flex flex-col justify-center items-center p-4 selection:bg-saffron selection:text-white">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-charcoal/10 space-y-6 text-left">
          {/* Logo / Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-saffron/10 border border-saffron/20 mx-auto flex items-center justify-center">
              <Utensils className="w-8 h-8 text-saffron" />
            </div>
            <h1 className="font-display font-bold text-2xl text-charcoal">Curry Delight POS</h1>
            <p className="text-xs text-charcoal/60 uppercase tracking-widest font-mono font-semibold">
              Counter Staff & Kitchen Terminal
            </p>
          </div>

          {/* Note: Security disclaimer is maintained in adminAuth.ts code comments */}

          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-charcoal/70 font-mono block">
                Counter ID / Email
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="currydelightrestaurant2026@gmail.com"
                className="w-full border border-charcoal/20 rounded-xl px-4 py-3.5 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-saffron bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-charcoal/70 font-mono block">
                Access Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full border border-charcoal/20 rounded-xl px-4 py-3.5 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-saffron bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-saffron hover:bg-[#d15423] text-white font-bold text-xs uppercase tracking-wider py-4 rounded-full transition-all duration-200 shadow-md cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Authenticate Terminal</span>
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className="text-xs text-charcoal/60 hover:text-charcoal font-semibold underline cursor-pointer"
            >
              ← Back to Customer Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Authenticated POS Layout ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream text-charcoal font-sans flex flex-col selection:bg-saffron selection:text-white">
      {/* 1. TOP HEADER & BAR */}
      <header className="bg-charcoal text-white px-4 md:px-6 py-3 border-b border-white/10 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Mode */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-saffron flex items-center justify-center text-white font-bold font-display text-lg shadow-sm">
              CD
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-display font-bold text-base md:text-lg leading-tight">Curry Delight POS</h1>
                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase">
                  Standalone Terminal
                </span>
              </div>
              <p className="text-[10px] text-white/50 font-mono">Kahalgaon Counter & Kitchen Module</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 bg-white/10 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center space-x-1.5 cursor-pointer min-h-[44px] ${
                activeTab === 'pos' ? 'bg-saffron text-white shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Counter POS</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center space-x-1.5 cursor-pointer min-h-[44px] ${
                activeTab === 'orders' ? 'bg-saffron text-white shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>Orders ({orders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center space-x-1.5 cursor-pointer min-h-[44px] ${
                activeTab === 'menu' ? 'bg-saffron text-white shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Menu Editor</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center space-x-1.5 cursor-pointer min-h-[44px] ${
                activeTab === 'settings' ? 'bg-saffron text-white shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Bluetooth Status & Logout Action */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleConnectPrinter}
              title="Connect EZO 58mm Thermal Printer via Web Bluetooth"
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 border transition-all duration-150 cursor-pointer min-h-[44px] ${
                printerStatus === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : printerStatus === 'connecting'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 animate-pulse'
                  : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
              }`}
            >
              <Bluetooth className={`w-4 h-4 ${printerStatus === 'connected' ? 'text-emerald-400' : 'text-white/60'}`} />
              <span className="hidden sm:inline">
                {printerStatus === 'connected'
                  ? bluetoothDevice?.name || 'Printer Connected'
                  : printerStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Connect Bluetooth'}
              </span>
            </button>

            <button
              onClick={() => navigateTo('/')}
              title="View Customer Site"
              className="px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors duration-150 cursor-pointer min-h-[44px] hidden md:flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Customer Site</span>
            </button>

            <button
              onClick={handleLogout}
              title="Logout from Terminal"
              className="p-2 text-white/70 hover:text-red-300 hover:bg-white/10 rounded-xl transition-colors duration-150 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback alert toast */}
        {printFeedback && (
          <div className="bg-saffron text-white text-xs font-semibold py-1 px-4 text-center mt-2 rounded-lg transition-all">
            {printFeedback}
          </div>
        )}
      </header>

      {/* 2. MAIN BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {/* ================================================================= */}
        {/* TAB 1: COUNTER POS ORDER ENTRY                                     */}
        {/* ================================================================= */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: MENU CATALOG (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Search & Filters */}
              <div className="bg-white p-4 rounded-2xl border border-charcoal/10 shadow-xs space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search dishes (e.g. Biryani, Paneer, Naan, Chai...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-cream/40 border border-charcoal/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-saffron min-h-[44px]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal cursor-pointer p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-charcoal/5">
                  {/* Diet filter */}
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-bold font-mono text-charcoal/50 uppercase">Diet:</span>
                    {(['all', 'veg', 'non-veg'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setDietFilter(d)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer min-h-[36px] ${
                          dietFilter === d
                            ? d === 'veg'
                              ? 'bg-green-600 text-white'
                              : d === 'non-veg'
                              ? 'bg-red-600 text-white'
                              : 'bg-charcoal text-white'
                            : 'bg-charcoal/5 text-charcoal/70 hover:bg-charcoal/10'
                        }`}
                      >
                        {d === 'all' ? 'All' : d === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
                      </button>
                    ))}
                  </div>

                  <span className="text-[11px] font-mono text-charcoal/50">
                    Showing <strong>{filteredMenuItems.length}</strong> items
                  </span>
                </div>

                {/* Category Pills Strip */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-150 cursor-pointer min-h-[38px] ${
                      selectedCategory === 'all'
                        ? 'bg-charcoal text-white shadow-xs'
                        : 'bg-cream text-charcoal/70 border border-charcoal/10 hover:border-charcoal/30'
                    }`}
                  >
                    All Dishes
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-150 cursor-pointer min-h-[38px] ${
                        selectedCategory === cat
                          ? 'bg-saffron text-white shadow-xs'
                          : 'bg-white text-charcoal/70 border border-charcoal/10 hover:border-charcoal/30'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items Grid - High density touch targets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredMenuItems.map(item => {
                  const isSoldOut = item.soldOut;
                  return (
                    <div
                      key={item.id}
                      onClick={() => !isSoldOut && addToTicket(item)}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 min-h-[110px] ${
                        isSoldOut
                          ? 'bg-charcoal/5 border-charcoal/10 opacity-50 cursor-not-allowed'
                          : 'bg-white border-charcoal/10 hover:border-saffron hover:shadow-md cursor-pointer active:scale-98'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                              item.isVeg ? 'bg-green-600' : 'bg-red-600'
                            }`}
                            title={item.isVeg ? 'Veg' : 'Non-Veg'}
                          />
                          <span className="text-[9px] font-mono text-charcoal/50 uppercase truncate max-w-[120px]">
                            {item.category}
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-sm text-charcoal leading-tight line-clamp-2">
                          {item.name}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-charcoal/5 mt-2">
                        <span className="font-sans font-bold text-saffron text-sm">
                          ₹{item.price}
                        </span>
                        {isSoldOut ? (
                          <span className="text-[9px] font-mono font-bold text-red-600 uppercase">
                            Sold Out
                          </span>
                        ) : (
                          <span className="bg-saffron/10 text-saffron hover:bg-saffron hover:text-white p-1 rounded-lg transition-colors">
                            <Plus className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: ACTIVE TICKET (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-charcoal/10 shadow-lg p-5 space-y-4 sticky top-20">
              {/* Header & Order Type */}
              <div className="space-y-3 pb-3 border-b border-charcoal/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-saffron" />
                    <h3 className="font-display font-bold text-lg text-charcoal">Active Counter Ticket</h3>
                  </div>
                  {ticketItems.length > 0 && (
                    <button
                      onClick={clearTicket}
                      className="text-xs text-red-600 hover:text-red-700 font-bold uppercase cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Order Type Selector */}
                <div className="grid grid-cols-3 gap-1.5 bg-cream/60 p-1.5 rounded-xl border border-charcoal/5">
                  {(['dine-in', 'pickup', 'delivery'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setOrderType(type)}
                      className={`py-2 px-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer min-h-[44px] ${
                        orderType === type
                          ? 'bg-charcoal text-white shadow-xs'
                          : 'text-charcoal/70 hover:bg-charcoal/5'
                      }`}
                    >
                      {type === 'dine-in' ? '🍽️ Dine-In' : type === 'pickup' ? '🏪 Takeaway' : '🛵 Delivery'}
                    </button>
                  ))}
                </div>

                {/* Conditional Inputs based on order type */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  {orderType === 'dine-in' ? (
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-bold text-charcoal/60 uppercase font-mono block mb-1">
                        Table Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Table 4"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="w-full border border-charcoal/20 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-saffron min-h-[44px]"
                      />
                    </div>
                  ) : (
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-bold text-charcoal/60 uppercase font-mono block mb-1">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        placeholder="Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full border border-charcoal/20 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-saffron min-h-[44px]"
                      />
                    </div>
                  )}

                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-bold text-charcoal/60 uppercase font-mono block mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full border border-charcoal/20 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-saffron min-h-[44px]"
                    />
                  </div>

                  {orderType === 'delivery' && (
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-charcoal/60 uppercase font-mono block mb-1">
                        Delivery Address
                      </label>
                      <input
                        type="text"
                        placeholder="House / Street / Landmark in Kahalgaon"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full border border-charcoal/20 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-saffron min-h-[44px]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Items List in Ticket */}
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {ticketItems.length === 0 ? (
                  <div className="text-center py-8 text-charcoal/40 space-y-1">
                    <Utensils className="w-8 h-8 mx-auto opacity-30" />
                    <p className="text-xs font-semibold">Tap menu items to add them here.</p>
                  </div>
                ) : (
                  ticketItems.map((item, idx) => (
                    <div
                      key={`${item.menuItem.id}-${idx}`}
                      className="p-2.5 rounded-xl bg-cream/40 border border-charcoal/5 space-y-2 text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <span className="font-bold text-xs text-charcoal block leading-snug">
                            {item.menuItem.name}
                          </span>
                          <span className="text-[10px] text-charcoal/50 font-mono">
                            ₹{item.menuItem.price} each
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-xs font-sans text-saffron">
                            ₹{item.menuItem.price * item.quantity}
                          </span>
                        </div>
                      </div>

                      {/* Instructions note for KOT */}
                      <input
                        type="text"
                        placeholder="Kitchen note (e.g. less spice, no onion)..."
                        value={item.specialInstructions || ''}
                        onChange={(e) => updateInstructions(idx, e.target.value)}
                        className="w-full text-[10px] px-2 py-1 bg-white border border-charcoal/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-saffron font-mono"
                      />

                      {/* Qty controls */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-2 bg-white rounded-lg border border-charcoal/10 p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(idx, -1)}
                            className="p-1 text-charcoal hover:bg-charcoal/5 rounded cursor-pointer min-h-[30px] min-w-[30px] flex items-center justify-center"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold font-mono px-1">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(idx, 1)}
                            className="p-1 text-charcoal hover:bg-charcoal/5 rounded cursor-pointer min-h-[30px] min-w-[30px] flex items-center justify-center"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromTicket(idx)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer min-h-[30px] min-w-[30px] flex items-center justify-center"
                          title="Remove from ticket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5 pt-2 border-t border-charcoal/10">
                <label className="text-[10px] font-bold text-charcoal/50 uppercase font-mono block">
                  Payment Mode
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['cash', 'upi', 'cod'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold uppercase font-mono transition-all duration-150 cursor-pointer min-h-[44px] ${
                        paymentMethod === m
                          ? 'bg-charcoal text-white shadow-xs'
                          : 'bg-cream text-charcoal/70 border border-charcoal/10 hover:border-charcoal/30'
                      }`}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="space-y-1.5 pt-3 border-t border-charcoal/10 text-xs">
                <div className="flex justify-between text-charcoal/70">
                  <span>Subtotal ({ticketItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="font-mono font-semibold">₹{subtotal}</span>
                </div>

                {/* Discount Line */}
                <div className="flex items-center justify-between text-charcoal/70">
                  <span className="flex items-center space-x-1">
                    <span>Discount (₹)</span>
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    value={discountAmount || ''}
                    placeholder="0"
                    onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                    className="w-20 text-right px-2 py-1 text-xs border border-charcoal/20 rounded-md font-mono"
                  />
                </div>

                {/* GST Line (Only shown if gstEnabled is true as per requirement) */}
                {settings.gstEnabled && (
                  <>
                    <div className="flex justify-between text-charcoal/60 text-[11px]">
                      <span>CGST ({settings.cgstRate}%)</span>
                      <span className="font-mono">₹{cgst}</span>
                    </div>
                    <div className="flex justify-between text-charcoal/60 text-[11px]">
                      <span>SGST ({settings.sgstRate}%)</span>
                      <span className="font-mono">₹{sgst}</span>
                    </div>
                  </>
                )}

                {deliveryFee > 0 && (
                  <div className="flex justify-between text-charcoal/70">
                    <span>Delivery Charge</span>
                    <span className="font-mono font-semibold">₹{deliveryFee}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-base font-bold text-charcoal border-t border-charcoal/10 pt-2">
                  <span>Grand Total:</span>
                  <span className="text-saffron font-bold text-xl font-mono">₹{total}</span>
                </div>
              </div>

              {/* Action Buttons: KOT vs Bill Print */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrintKOT}
                  disabled={ticketItems.length === 0}
                  className={`bg-charcoal text-white font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center space-x-1.5 transition-all duration-150 cursor-pointer min-h-[44px] ${
                    ticketItems.length === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-charcoal/90 shadow-md'
                  }`}
                >
                  <Flame className="w-4 h-4 text-saffron" />
                  <span>Print KOT</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintBill}
                  disabled={ticketItems.length === 0}
                  className={`bg-saffron text-white font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center space-x-1.5 transition-all duration-150 cursor-pointer min-h-[44px] ${
                    ticketItems.length === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#d15423] shadow-md'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Bill</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: MENU EDITOR (Editable through UI, no code changes needed)  */}
        {/* ================================================================= */}
        {activeTab === 'menu' && (
          <div className="space-y-6 text-left">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-charcoal/10 shadow-xs">
              <div>
                <span className="text-[10px] font-bold text-saffron uppercase tracking-widest font-mono">
                  Live Counter Menu Data
                </span>
                <h2 className="font-display font-bold text-2xl text-charcoal">Menu Management</h2>
                <p className="text-xs text-charcoal/60 mt-0.5">
                  Add, edit, change prices or toggle availability. Changes are saved to localStorage instantly.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all menu items to original defaults?')) {
                      adminStore.resetMenuToDefault();
                    }
                  }}
                  className="px-4 py-2.5 rounded-full border border-charcoal/20 text-xs font-bold text-charcoal hover:bg-charcoal/5 flex items-center space-x-1.5 cursor-pointer min-h-[44px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setDishForm({
                      name: '',
                      description: '',
                      price: 120,
                      category: 'Classic Indian Gravies (Veg)',
                      isVeg: true,
                      spiceLevel: 'medium'
                    });
                    setIsAddDishOpen(true);
                  }}
                  className="bg-saffron hover:bg-[#d15423] text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-md cursor-pointer min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Dish</span>
                </button>
              </div>
            </div>

            {/* Dishes Table */}
            <div className="bg-white rounded-3xl border border-charcoal/10 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cream/80 border-b border-charcoal/10 font-mono text-[10px] text-charcoal/60 uppercase">
                    <tr>
                      <th className="py-3.5 px-4">Dish</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Price (₹)</th>
                      <th className="py-3.5 px-4">Diet</th>
                      <th className="py-3.5 px-4">Availability</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal/5">
                    {menuItems.map(item => (
                      <tr key={item.id} className="hover:bg-cream/20 transition-colors">
                        <td className="py-3 px-4 font-semibold text-charcoal">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                item.isVeg ? 'bg-green-600' : 'bg-red-600'
                              }`}
                            />
                            <div>
                              <div className="font-bold text-sm text-charcoal">{item.name}</div>
                              <div className="text-[11px] text-charcoal/50 font-normal line-clamp-1">
                                {item.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-charcoal/70 font-mono text-[11px]">
                          {item.category}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-saffron text-sm">
                          ₹{item.price}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                              item.isVeg ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {item.isVeg ? 'Veg' : 'Non-Veg'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => adminStore.toggleSoldOut(item.id)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase font-mono cursor-pointer transition-colors min-h-[32px] ${
                              item.soldOut
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            }`}
                          >
                            {item.soldOut ? 'Sold Out' : 'Available'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => handleEditClick(item)}
                              className="p-2 text-charcoal/70 hover:text-saffron hover:bg-charcoal/5 rounded-lg cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Edit dish"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDish(item.id, item.name)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Delete dish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal for Add / Edit Dish */}
            {(isAddDishOpen || editingItem) && (
              <div className="fixed inset-0 z-50 bg-charcoal/70 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-charcoal/10 text-left">
                  <div className="flex items-center justify-between pb-3 border-b border-charcoal/10">
                    <h3 className="font-display font-bold text-xl text-charcoal">
                      {editingItem ? 'Edit Dish Details' : 'Add New Dish to Menu'}
                    </h3>
                    <button
                      onClick={() => {
                        setIsAddDishOpen(false);
                        setEditingItem(null);
                      }}
                      className="p-1 text-charcoal/50 hover:text-charcoal cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveDish} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-charcoal/60 uppercase font-mono">
                        Dish Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Kadai Paneer Special"
                        value={dishForm.name}
                        onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                        className="w-full border border-charcoal/20 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-saffron min-h-[44px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-charcoal/60 uppercase font-mono">
                          Price (INR ₹)
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={dishForm.price}
                          onChange={(e) => setDishForm({ ...dishForm, price: Number(e.target.value) })}
                          className="w-full border border-charcoal/20 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-saffron min-h-[44px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-charcoal/60 uppercase font-mono">
                          Dietary Type
                        </label>
                        <select
                          value={dishForm.isVeg ? 'veg' : 'non-veg'}
                          onChange={(e) => setDishForm({ ...dishForm, isVeg: e.target.value === 'veg' })}
                          className="w-full border border-charcoal/20 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-saffron min-h-[44px]"
                        >
                          <option value="veg">🟢 Vegetarian</option>
                          <option value="non-veg">🔴 Non-Vegetarian</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-charcoal/60 uppercase font-mono">
                        Category
                      </label>
                      <select
                        value={dishForm.category}
                        onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                        className="w-full border border-charcoal/20 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-saffron min-h-[44px]"
                      >
                        {categories.map(c => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-charcoal/60 uppercase font-mono">
                        Short Description
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Key ingredients, cooking style or notes..."
                        value={dishForm.description}
                        onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                        className="w-full border border-charcoal/20 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-saffron"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-2 border-t border-charcoal/10">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddDishOpen(false);
                          setEditingItem(null);
                        }}
                        className="px-5 py-2.5 rounded-full border border-charcoal/20 text-xs font-bold text-charcoal hover:bg-charcoal/5 cursor-pointer min-h-[44px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-saffron hover:bg-[#d15423] text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md cursor-pointer min-h-[44px]"
                      >
                        Save Dish
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: ORDER LOGBOOK                                               */}
        {/* ================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4 text-left">
            <div className="bg-white p-5 rounded-3xl border border-charcoal/10 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-saffron uppercase tracking-widest font-mono">
                  Local Terminal Log
                </span>
                <h2 className="font-display font-bold text-2xl text-charcoal">Recent POS Orders</h2>
              </div>
              {orders.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Clear all stored local order records?')) {
                      adminStore.clearOrders();
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-bold uppercase font-mono cursor-pointer"
                >
                  Clear History
                </button>
              )}
            </div>

            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-charcoal/10 text-center text-charcoal/40">
                  <ListOrdered className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="font-bold text-sm">No orders recorded in this session yet.</p>
                </div>
              ) : (
                orders.map(order => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-charcoal/10 p-4 shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-charcoal/5 pb-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-saffron">{order.id}</span>
                        <span className="bg-charcoal/5 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold">
                          {order.deliveryType}
                        </span>
                        {order.tableNumber && (
                          <span className="bg-saffron/10 text-saffron px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                            {order.tableNumber}
                          </span>
                        )}
                      </div>
                      <span className="text-charcoal/50 text-[11px] font-mono">
                        {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-charcoal/80">
                          <span>
                            • {item.menuItem.name} x{item.quantity}
                            {item.specialInstructions && (
                              <span className="text-[10px] text-saffron italic ml-1">
                                ({item.specialInstructions})
                              </span>
                            )}
                          </span>
                          <span className="font-mono">₹{item.menuItem.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-charcoal/5 text-xs font-bold">
                      <span className="text-charcoal/60">
                        Payment: <span className="font-mono uppercase text-charcoal">{order.paymentMethod}</span>
                      </span>
                      <span className="text-saffron font-bold text-base font-mono">
                        Total: ₹{order.total}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: TAX & RESTAURANT SETTINGS                                  */}
        {/* ================================================================= */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-charcoal/10 shadow-sm p-6 space-y-6 text-left">
            <div>
              <span className="text-[10px] font-bold text-saffron uppercase tracking-widest font-mono">
                Counter Terminal Configuration
              </span>
              <h2 className="font-display font-bold text-2xl text-charcoal">Tax & Printing Settings</h2>
              <p className="text-xs text-charcoal/60 mt-0.5">
                GST is disabled by default. Enable only after GST registration/scheme is active.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {/* GST Toggle Line (Follows gstEnabled pattern) */}
              <div className="flex items-center justify-between p-4 bg-cream/40 rounded-2xl border border-charcoal/10">
                <div>
                  <div className="font-bold text-sm text-charcoal">Enable GST on Counter Bills</div>
                  <div className="text-[11px] text-charcoal/60">
                    When disabled, bills show zero tax line. Default is OFF.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => adminStore.saveSettings({ gstEnabled: !settings.gstEnabled })}
                  className={`w-14 h-8 rounded-full transition-colors duration-150 p-1 flex items-center cursor-pointer ${
                    settings.gstEnabled ? 'bg-emerald-600 justify-end' : 'bg-charcoal/20 justify-start'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              {settings.gstEnabled && (
                <div className="grid grid-cols-2 gap-3 p-4 bg-cream/20 rounded-2xl border border-charcoal/10">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-charcoal/60 uppercase font-mono">
                      CGST Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.cgstRate}
                      onChange={(e) => adminStore.saveSettings({ cgstRate: Number(e.target.value) })}
                      className="w-full border border-charcoal/20 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-saffron"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-charcoal/60 uppercase font-mono">
                      SGST Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.sgstRate}
                      onChange={(e) => adminStore.saveSettings({ sgstRate: Number(e.target.value) })}
                      className="w-full border border-charcoal/20 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-saffron"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-charcoal/60 uppercase font-mono">
                      GSTIN Identifier
                    </label>
                    <input
                      type="text"
                      value={settings.gstin}
                      onChange={(e) => adminStore.saveSettings({ gstin: e.target.value })}
                      className="w-full border border-charcoal/20 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-saffron font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Delivery Fee settings */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-cream/20 rounded-2xl border border-charcoal/10">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-charcoal/60 uppercase font-mono">
                    Free Delivery Threshold (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.deliveryFeeThreshold}
                    onChange={(e) =>
                      adminStore.saveSettings({ deliveryFeeThreshold: Number(e.target.value) })
                    }
                    className="w-full border border-charcoal/20 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-charcoal/60 uppercase font-mono">
                    Standard Delivery Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.deliveryFeeAmount}
                    onChange={(e) =>
                      adminStore.saveSettings({ deliveryFeeAmount: Number(e.target.value) })
                    }
                    className="w-full border border-charcoal/20 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
              </div>

              {/* Kitchen Open / Closed Toggle */}
              <div className="flex items-center justify-between p-4 bg-cream/40 rounded-2xl border border-charcoal/10">
                <div>
                  <div className="font-bold text-sm text-charcoal">Kitchen Online Order Receiving</div>
                  <div className="text-[11px] text-charcoal/60">
                    Turn off if kitchen is overwhelmed or closed for the night.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => adminStore.saveSettings({ isKitchenOpen: !settings.isKitchenOpen })}
                  className={`w-14 h-8 rounded-full transition-colors duration-150 p-1 flex items-center cursor-pointer ${
                    settings.isKitchenOpen ? 'bg-emerald-600 justify-end' : 'bg-charcoal/20 justify-start'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================================================================= */}
      {/* 58MM THERMAL RECEIPT PRINT MODAL (Fallback & Preview)              */}
      {/* ================================================================= */}
      {previewContent && (
        <div className="fixed inset-0 z-50 bg-charcoal/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-charcoal/10 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-charcoal/10">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-saffron" />
                <h3 className="font-display font-bold text-base text-charcoal">
                  {previewContent.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewContent(null)}
                className="p-1 text-charcoal/50 hover:text-charcoal cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 58mm Thermal Preview Monospace Paper Simulation */}
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-charcoal/15 font-mono text-[11px] leading-tight text-charcoal max-h-[360px] overflow-y-auto whitespace-pre select-all shadow-inner">
              {previewContent.text}
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="w-full bg-saffron hover:bg-[#d15423] text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-full flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-colors duration-150 min-h-[44px]"
              >
                <Printer className="w-4 h-4" />
                <span>Send to Browser Print (58mm)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(previewContent.text);
                  alert('Receipt text copied to clipboard!');
                }}
                className="w-full border border-charcoal/20 text-charcoal font-bold text-xs py-2.5 rounded-full hover:bg-charcoal/5 cursor-pointer min-h-[44px]"
              >
                Copy ESC/POS Text
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
