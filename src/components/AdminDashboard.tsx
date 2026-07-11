import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Calendar, Sparkles, Users, Settings, 
  MapPin, Phone, Clock, FileText, CheckCircle2, 
  XCircle, Trash2, Plus, Search, AlertTriangle, 
  Printer, ArrowRight, Save, User, FileSpreadsheet, 
  UserCheck, ShieldAlert, BarChart3, TrendingUp, 
  TrendingDown, Check, RefreshCw, HelpCircle, Volume2,
  Edit
} from 'lucide-react';
import { 
  adminStore, AdminOrder, AdminReservation, 
  AdminCelebrationEnquiry, DeliveryBoy, AdminSettings,
  playNewOrderSound, playBillPrintedSound
} from '../lib/adminStore';
import { MenuItem } from '../types';
import { CATEGORY_IMAGES } from '../data';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AdminDashboardProps {
  navigateTo: (path: string) => void;
}

export default function AdminDashboard({ navigateTo }: AdminDashboardProps) {
  // --- Active Tab ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'orders' | 'menu' | 'reservations' | 'celebrations' | 'roster' | 'reports' | 'settings'>('dashboard');
  
  // --- Auth State ---
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- Staff Role: owner vs counter ---
  const [staffRole, setStaffRole] = useState<'owner' | 'counter'>('owner');

  // --- Real-time State (Synced with localStorage and storage events) ---
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [celebrations, setCelebrations] = useState<AdminCelebrationEnquiry[]>([]);
  const [soldOutIds, setSoldOutIds] = useState<string[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({
    gstEnabled: false,
    gstin: '',
    cgstRate: 2.5,
    sgstRate: 2.5,
    deliveryFee: 30,
    upiVpa: 'aaravworlld@oksbi',
    kitchenBufferMinutes: 0
  });
  // Image upload removed per requirements

  // For testing the sound alert
  const [soundEnabled, setSoundEnabled] = useState(true);

  // --- Kitchen Display Screen (KDS) State ---
  const [isKdsMode, setIsKdsMode] = useState(false);
  const [kdsCheckedItems, setKdsCheckedItems] = useState<{ [key: string]: boolean }>({});

  // --- UI Filter & Search States ---
  const [orderFilter, setOrderFilter] = useState<'all' | 'placed' | 'preparing' | 'out_for_delivery' | 'delivered'>('all');
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState('all');
  
  const [resDateFilter, setResDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState<'all' | 'new' | 'contacted' | 'confirmed' | 'closed'>('all');

  // --- Modal States for Printing ---
  const [printingOrder, setPrintingOrder] = useState<AdminOrder | null>(null);
  const [printType, setPrintType] = useState<'kot' | 'bill' | null>(null);

  // --- Form Inputs ---
  const [newBoyName, setNewBoyName] = useState('');
  const [newBoyPhone, setNewBoyPhone] = useState('');
  const [searchPhoneQuery, setSearchPhoneQuery] = useState('');

  // --- Menu Item Form States ---
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [menuModalType, setMenuModalType] = useState<'add' | 'edit'>('add');
  const [editingItemId, setEditingItemId] = useState('');
  const [menuForm, setMenuForm] = useState<{
    name: string;
    description: string;
    category: string;
    price: number;
    isVeg: boolean;
    spiceLevel: 'mild' | 'medium' | 'hot' | undefined;
    badge: string;
    image: string;
    gstRate: number | undefined;
  }>({
    name: '',
    description: '',
    category: 'Heritage Thalis',
    price: 150,
    isVeg: true,
    spiceLevel: 'medium' as 'mild' | 'medium' | 'hot',
    badge: '',
    image: '',
    gstRate: undefined
  });

  // --- POS (Take Order) State ---
  // Restore cart from sessionStorage to survive accidental tab refreshes
  const [posCart, setPosCart] = useState<{ item: MenuItem; qty: number; note: string }[]>(() => {
    try {
      const saved = sessionStorage.getItem('pos_cart_draft');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [posCustomerName, setPosCustomerName] = useState('');
  const [posTableNo, setPosTableNo] = useState('');
  const [posOrderType, setPosOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'cash' | 'upi' | 'cod'>('cash');
  const [posSearch, setPosSearch] = useState('');
  const [posCatFilter, setPosCatFilter] = useState('all');
  const [posOrderPlaced, setPosOrderPlaced] = useState<AdminOrder | null>(null);
  const [posDiscount, setPosDiscount] = useState(0);
  const [logbookViewMode, setLogbookViewMode] = useState<'table' | 'kds'>('table');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'dine-in' | 'pickup' | 'delivery'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // --- Load and Sync Data ---
  const syncAllData = () => {
    setOrders(adminStore.getOrders());
    setReservations(adminStore.getReservations());
    setCelebrations(adminStore.getCelebrations());
    setSoldOutIds(adminStore.getSoldOutIds());
    setDeliveryBoys(adminStore.getDeliveryBoys());
    setSettings(adminStore.getSettings());
    setMenuItems(adminStore.getMenuItems());
  };

  useEffect(() => {
    syncAllData();

    // Sync across tabs in real-time
    const handleStorageChange = () => {
      syncAllData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('adminStoreUpdate', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('adminStoreUpdate', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync state if activeTab restrictions change
  useEffect(() => {
    if (staffRole === 'counter' && (activeTab === 'settings' || activeTab === 'reports' || activeTab === 'menu' || activeTab === 'roster')) {
      setActiveTab('orders');
    }
  }, [staffRole]);

  // --- Audio play on new placed order detection ---
  const prevOrdersCount = React.useRef(orders.length);
  useEffect(() => {
    if (orders.length > prevOrdersCount.current) {
      // Check if the latest order is indeed 'placed'
      const hasNewPlaced = orders.some(o => o.status === 'placed' && new Date(o.createdAt).getTime() > Date.now() - 30000);
      if (hasNewPlaced && soundEnabled) {
        playNewOrderSound();
      }
    }
    prevOrdersCount.current = orders.length;
  }, [orders, soundEnabled]);

  // --- Manual Mock Order Generator for Testing Live Alert ---
  const handleCreateMockOrder = () => {
    const randomDish = menuItems[Math.floor(Math.random() * menuItems.length)] || { id: 'm1', name: 'Mutton Champaran', price: 350, category: 'Champaran Specialties', isVeg: false, spiceLevel: 'hot', badge: 'Best Seller' };
    const mockNames = ['Vikash Mishra', 'Sanjana Roy', 'Rajesh Gupta', 'Alok Pandey', 'Nisha Bharti'];
    const mockPhones = ['7061591831', '9933445566', '8877665544', '9554433221', '8123456789'];
    const mockAddresses = ['NTPC Colony, Sec-2, Kahalgaon', 'Main Bazaar near Durga Sthan', 'Bhudhar Block A-12', 'Kahalgaon Block, Ward 5'];
    
    const isDelivery = Math.random() > 0.3;
    const subtotal = randomDish.price;
    const isGst = settings.gstEnabled;
    const devFee = isDelivery ? settings.deliveryFee : 0;
    const total = subtotal + devFee;

    adminStore.addOrder({
      customerName: mockNames[Math.floor(Math.random() * mockNames.length)],
      customerPhone: mockPhones[Math.floor(Math.random() * mockPhones.length)],
      customerAddress: isDelivery ? mockAddresses[Math.floor(Math.random() * mockAddresses.length)] : 'Pickup Order',
      deliveryType: isDelivery ? 'delivery' : 'pickup',
      paymentMethod: Math.random() > 0.5 ? 'cod' : 'upi',
      subtotal,
      discount: 0,
      deliveryFee: devFee,
      total,
      items: [
        {
          menuItem: randomDish,
          quantity: Math.floor(Math.random() * 2) + 1,
          selectedSpice: 'medium',
          specialInstructions: Math.random() > 0.5 ? 'Make it fresh' : ''
        }
      ]
    });
    syncAllData();
  };

  // --- WhatsApp messaging handlers ---
  const getWhatsAppConfirmLink = (order: AdminOrder) => {
    const itemsList = order.items.map((it, idx) => 
      `${idx + 1}. ${it.menuItem.name} x${it.quantity} [Spice: ${it.selectedSpice || 'medium'}]` +
      (it.specialInstructions ? ` (Note: ${it.specialInstructions})` : '')
    ).join('\n');

    const paymentText = order.paymentMethod === 'cod' 
      ? `*COD Amount to Collect: ₹${order.total}* (Please pay in Cash/UPI to delivery boy)` 
      : `*Prepaid UPI* (₹${order.total})`;

    const text = `*Curry Delight Kahalgaon*\n` +
      `Namaste ${order.customerName}! Your order *${order.id}* has been *CONFIRMED*.\n\n` +
      `*ORDER ITEMS:*\n${itemsList}\n\n` +
      `*DELIVERY DETAIL:*\n` +
      `• *Type:* ${order.deliveryType.toUpperCase()}\n` +
      `• *Address:* ${order.customerAddress}\n` +
      `• *Total Price:* ₹${order.total}\n` +
      `• *Payment:* ${paymentText}\n\n` +
      `Our kitchen is preparing your piping hot Bihari delicacies! Let us know if you need any adjustments. Thank you!`;

    return `https://wa.me/${order.customerPhone.startsWith('91') ? order.customerPhone : '91' + order.customerPhone}?text=${encodeURIComponent(text)}`;
  };

  const getWhatsAppDeliveryLink = (order: AdminOrder, db: DeliveryBoy) => {
    const itemsList = order.items.map((it) => `${it.menuItem.name} x${it.quantity}`).join(', ');
    const codCollectText = order.paymentMethod === 'cod' 
      ? `🔴 *COLLECT CASH: ₹${order.total}* 🔴` 
      : `🟢 *PREPAID UPI (Collect ₹0)* 🟢`;

    const text = `*DELIVERY ASSIGNMENT - CURRY DELIGHT*\n\n` +
      `${codCollectText}\n\n` +
      `• *Order:* ${order.id}\n` +
      `• *Customer:* ${order.customerName}\n` +
      `• *Phone:* ${order.customerPhone}\n` +
      `• *Address:* ${order.customerAddress}\n` +
      `• *Items:* ${itemsList}\n` +
      `• *Instructions:* ${order.specialInstructions || 'None'}\n\n` +
      `Please deliver hot and handle with care. Report back immediately on successful delivery!`;

    return `https://wa.me/${db.phone.startsWith('91') ? db.phone : '91' + db.phone}?text=${encodeURIComponent(text)}`;
  };

  // --- KOT & Bill Format Helpers (Exact 32 chars spacing & alignment) ---
  const formatReceiptDateTime = (dateVal: number | string) => {
    const d = new Date(dateVal);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yy = d.getFullYear().toString().substring(2);
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    
    let hours = d.getHours();
    const minutes = pad(d.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hh = pad(hours);
    
    return `${dd}/${mm}/${yy} ${hh}:${minutes} ${ampm}`;
  };

  const centerText = (text: string, width = 32) => {
    if (text.length >= width) return text.substring(0, width);
    const left = Math.floor((width - text.length) / 2);
    const right = width - text.length - left;
    return ' '.repeat(left) + text + ' '.repeat(right);
  };

  const formatLeftRight = (left: string, right: string, width = 32) => {
    const spaceCount = width - left.length - right.length;
    if (spaceCount <= 0) return left.substring(0, width - right.length - 1) + ' ' + right;
    return left + ' '.repeat(spaceCount) + right;
  };

  const generateKOTText = (order: AdminOrder) => {
    const width = 32;
    const lines: string[] = [];
    
    const kotNo = order.id.split('-').pop() || '2';
    lines.push(`KOT No: ${kotNo}`);
    lines.push(`Date: ${formatReceiptDateTime(order.createdAt)}`);
    lines.push(`Bill No: ${order.id.split('-').pop() || '519'}`);
    
    const tableVal = order.tableNumber ? `Table ${order.tableNumber}` : order.customerAddress.includes('Table') ? order.customerAddress : 'Walk-in';
    lines.push(`Table: ${tableVal}`);
    
    order.items.forEach(it => {
      lines.push(`${it.menuItem.name} (${it.quantity})`);
      if (it.selectedSpice && it.selectedSpice !== 'medium') {
        lines.push(` *Spice: ${it.selectedSpice.toUpperCase()}`);
      }
      if (it.specialInstructions) {
        lines.push(` *Note: ${it.specialInstructions}`);
      }
    });
    
    lines.push(centerText('CURRY DELIGHT', width));
    lines.push(centerText('POWERED BY AARAV WORLD POS', width));
    return lines.join('\n');
  };

  const generateBillText = (order: AdminOrder, currentSettings: AdminSettings) => {
    const width = 32;
    const lines: string[] = [];
    
    lines.push(centerText('Curry Delight Restaurant', width));
    lines.push(centerText('A Delight In Every Bite', width));
    
    const shortNo = order.id.split('-').pop() || '551';
    lines.push(centerText(shortNo, width));
    
    const address = "Curry Delight Restaurant, ShivParvati Nagar, Block Road, Kahalgaon, Bhagalpur, BIHAR,813203";
    const wrapText = (text: string, limit: number) => {
      const words = text.split(' ');
      const wrapped: string[] = [];
      let currentLine = '';
      words.forEach(word => {
        if ((currentLine + word).length > limit) {
          wrapped.push(currentLine.trim());
          currentLine = word + ' ';
        } else {
          currentLine += word + ' ';
        }
      });
      if (currentLine.trim()) wrapped.push(currentLine.trim());
      return wrapped;
    };
    
    const wrappedAddress = wrapText(address, width);
    wrappedAddress.forEach(ln => lines.push(centerText(ln, width)));
    
    lines.push(`GST Number: ${currentSettings.gstin || '10ESRPK5680M1Z5'}`);
    lines.push(`FSSAI Number: 20426122000051`);
    lines.push(`Phone: ${currentSettings.whatsappNumber || '7061591831'}`);
    lines.push(`Bill No: ${order.id}`);
    lines.push(`Created On: ${formatReceiptDateTime(order.createdAt)}`);
    
    const tableVal = order.tableNumber ? `Table ${order.tableNumber}` : order.customerAddress.includes('Table') ? order.customerAddress : 'Walk-in';
    lines.push(`Bill To: ${tableVal}`);
    
    lines.push('Item Name');
    lines.push(formatLeftRight('Qty     Rate', 'Total', width));
    lines.push('-'.repeat(width));
    
    order.items.forEach(it => {
      lines.push(it.menuItem.name);
      const qty = it.quantity.toString();
      const rate = it.menuItem.price.toString();
      
      const gstInclusivePrice = currentSettings.gstEnabled 
        ? Math.round(it.menuItem.price * (1 + (currentSettings.cgstRate + currentSettings.sgstRate) / 100))
        : it.menuItem.price;
      const totalVal = (gstInclusivePrice * it.quantity).toString();
      
      const leftPart = `${qty.padEnd(8)}${rate.padEnd(8)}`;
      lines.push(formatLeftRight(leftPart, totalVal, width));
    });
    
    lines.push('-'.repeat(width));
    
    lines.push(`Total Items: ${order.items.length}`);
    lines.push(`Total Quantity: ${order.items.reduce((acc, it) => acc + it.quantity, 0)}`);
    
    lines.push('-'.repeat(width));
    lines.push(formatLeftRight('Sub Total', `${order.subtotal}`, width));
    
    if (currentSettings.gstEnabled) {
      const netAmount = Math.max(0, order.subtotal - order.discount);
      const cgstAmt = Math.round(netAmount * (currentSettings.cgstRate / 100));
      const sgstAmt = Math.round(netAmount * (currentSettings.sgstRate / 100));
      lines.push(formatLeftRight('CGST', `${currentSettings.cgstRate}%: ₹${cgstAmt}`, width));
      lines.push(formatLeftRight('SGST', `${currentSettings.sgstRate}%: ₹${sgstAmt}`, width));
    }
    
    if (order.discount > 0) {
      lines.push(formatLeftRight('Discount', `-₹${order.discount}`, width));
    }
    
    if (order.deliveryFee > 0) {
      lines.push(formatLeftRight('Delivery Fee', `+₹${order.deliveryFee}`, width));
    }
    
    lines.push('-'.repeat(width));
    lines.push(formatLeftRight('Total', `₹${order.total}`, width));
    lines.push('-'.repeat(width));
    
    lines.push('Mode of Payment');
    lines.push(order.paymentMethod === 'cod' ? 'cash' : 'upi');
    lines.push('Received');
    lines.push(`${order.total}`);
    
    lines.push('-'.repeat(width));
    lines.push(centerText('Thank You! Visit Again!', width));
    lines.push(centerText('Powered by AARAV WORLD POS', width));
    lines.push(centerText(`QR CODE Scan To Pay Rs. ${order.total} /-`, width));
    
    return lines.join('\n');
  };

  // --- KOT and Bill Thermal Print triggers ---
  const handleBrowserPrint = async () => {
    if (!printingOrder) return;

    // Try Web Bluetooth first
    const bluetooth = (navigator as any).bluetooth;
    if (bluetooth) {
      try {
        const device = await bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '0000ff00-0000-1000-8000-00805f9b34fb']
        });

        const server = await device.gatt!.connect();

        let characteristic: any = null;
        const serviceUuids = ['000018f0-0000-1000-8000-00805f9b34fb', '0000ff00-0000-1000-8000-00805f9b34fb'];
        for (const uuid of serviceUuids) {
          try {
            const service = await server.getPrimaryService(uuid);
            const chars = await service.getCharacteristics();
            for (const c of chars) {
              if (c.properties.write || c.properties.writeWithoutResponse) {
                characteristic = c;
                break;
              }
            }
            if (characteristic) break;
          } catch (_) {}
        }

        if (!characteristic) throw new Error('No writable characteristic found on printer');

        // Build ESC/POS byte sequence
        const textContent = printType === 'kot'
          ? generateKOTText(printingOrder)
          : generateBillText(printingOrder, settings);

        const raw = '\x1B\x40\x1B\x21\x00' + textContent + '\n\n\n\n\x1D\x56\x41';
        const encoder = new TextEncoder();
        const bytes = encoder.encode(raw);

        // Send in chunks of 20 bytes (BLE MTU limit)
        const CHUNK = 20;
        for (let i = 0; i < bytes.length; i += CHUNK) {
          await characteristic.writeValue(bytes.slice(i, i + CHUNK));
        }

        alert(`✅ Receipt sent successfully to "${device.name || 'Bluetooth Printer'}"!`);
        setPrintingOrder(null);
        setPrintType(null);
        return;
      } catch (err: any) {
        if (err.name === 'NotFoundError' || err.message?.includes('cancelled')) {
          // User cancelled device picker — fall through to browser print
        } else {
          console.error('Bluetooth print failed:', err);
          alert(`Bluetooth print failed: ${err.message}\n\nFalling back to browser print.`);
        }
      }
    }

    // Fallback: open browser print dialog targeting only the receipt area
    const receiptEl = document.getElementById('printable-thermal-receipt');
    if (receiptEl) {
      const printWindow = window.open('', '_blank', 'width=320,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html><head><title>Curry Delight - ${printType === 'kot' ? 'KOT' : 'Bill'}</title>
          <style>
            body { font-family: monospace; font-size: 11px; width: 220px; margin: 0; padding: 4px; }
            @media print { @page { margin: 0; size: 58mm auto; } body { width: 58mm; } }
          </style></head><body>
          ${receiptEl.innerHTML}
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
          </body></html>
        `);
        printWindow.document.close();
      }
    }
  };

  // --- Roster Managers ---
  const handleAddDeliveryBoy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoyName || !newBoyPhone) {
      alert('Please fill out Name and Phone.');
      return;
    }
    adminStore.addDeliveryBoy(newBoyName, newBoyPhone);
    setNewBoyName('');
    setNewBoyPhone('');
    syncAllData();
  };

  const handleRemoveDeliveryBoy = (id: string) => {
    if (confirm('Are you sure you want to remove this delivery agent from the roster?')) {
      adminStore.removeDeliveryBoy(id);
      syncAllData();
    }
  };

  // --- Settings Managers ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    adminStore.saveSettings(settings);
    alert('GST & Pricing settings updated successfully!');
    syncAllData();
  };

  // --- Menu Item Handlers ---
  // Categories where spice level is not applicable (non-savory items)
  const NON_SPICY_CATEGORIES = [
    'Desserts & Accompaniments',
    'Mocktails, Shakes & Beverages',
    'Indian Breads',
    'Desserts & Beverages'
  ];

  const handleOpenAddMenu = () => {
    setMenuModalType('add');
    setMenuForm({
      name: '',
      description: '',
      category: 'Heritage Thalis',
      price: 150,
      isVeg: true,
      spiceLevel: 'medium',
      badge: '',
      image: '',
      gstRate: undefined
    });
    setIsMenuModalOpen(true);
  };

  const handleOpenEditMenu = (item: MenuItem) => {
    setMenuModalType('edit');
    setEditingItemId(item.id);
    setMenuForm({
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      isVeg: item.isVeg,
      spiceLevel: item.spiceLevel,
      badge: item.badge || '',
      image: item.image || '',
      gstRate: item.gstRate
    });
    setIsMenuModalOpen(true);
  };

  const handleSaveMenuItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.name || !menuForm.category || menuForm.price <= 0) {
      alert('Please provide name, category, and valid price.');
      return;
    }

    if (menuModalType === 'add') {
      adminStore.addMenuItem({
        name: menuForm.name,
        description: menuForm.description,
        category: menuForm.category,
        price: menuForm.price,
        isVeg: menuForm.isVeg,
        spiceLevel: menuForm.spiceLevel,
        badge: menuForm.badge || undefined,
        image: menuForm.image || CATEGORY_IMAGES[menuForm.category] || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
        imagePrompt: 'Minimalist Indian dish',
        ...(menuForm.gstRate !== undefined ? { gstRate: menuForm.gstRate } : {})
      });
      alert('New dish added to the catalog!');
    } else {
      adminStore.updateMenuItem(editingItemId, {
        name: menuForm.name,
        description: menuForm.description,
        category: menuForm.category,
        price: menuForm.price,
        isVeg: menuForm.isVeg,
        spiceLevel: menuForm.spiceLevel,
        badge: menuForm.badge || undefined,
        ...(menuForm.image ? { image: menuForm.image } : {}),
        ...(menuForm.gstRate !== undefined ? { gstRate: menuForm.gstRate } : { gstRate: undefined })
      });
      alert('Menu item updated successfully!');
    }

    setIsMenuModalOpen(false);
    syncAllData();
  };

  const handleDeleteMenuItem = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this item from the menu catalog?')) {
      adminStore.deleteMenuItem(id);
      syncAllData();
    }
  };

  // --- POS Handlers ---
  const posSubtotal = posCart.reduce((s, c) => s + c.item.price * c.qty, 0);
  // GST applied on post-discount amount (correct per Indian GST law)
  const posNetForTax = Math.max(0, posSubtotal - posDiscount);
  const posGstAmount = settings.gstEnabled ? Math.round(posNetForTax * ((settings.cgstRate + settings.sgstRate) / 100)) : 0;
  const posTotal = Math.max(0, posNetForTax + posGstAmount);

  // Persist cart to sessionStorage on every change so refresh doesn't wipe it
  useEffect(() => {
    try {
      sessionStorage.setItem('pos_cart_draft', JSON.stringify(posCart));
    } catch {}
  }, [posCart]);

  const posAddItem = (item: MenuItem) => {
    setPosCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) return prev.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { item, qty: 1, note: '' }];
    });
  };
  const posRemoveItem = (id: string) => setPosCart(prev => prev.filter(c => c.item.id !== id));
  const posUpdateQty = (id: string, qty: number) => {
    if (qty <= 0) { posRemoveItem(id); return; }
    setPosCart(prev => prev.map(c => c.item.id === id ? { ...c, qty } : c));
  };

  const posFilteredItems = useMemo(() => {
    const items = menuItems.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(posSearch.toLowerCase());
      const matchCat = posCatFilter === 'all' || item.category === posCatFilter;
      return matchSearch && matchCat;
    });
    // Sort so available items are first, and sold-out items are last
    return [...items].sort((a, b) => {
      const aSold = soldOutIds.includes(a.id) ? 1 : 0;
      const bSold = soldOutIds.includes(b.id) ? 1 : 0;
      return aSold - bSold;
    });
  }, [menuItems, posSearch, posCatFilter, soldOutIds]);

  const handlePlacePosOrder = async () => {
    if (posCart.length === 0) { alert('Add at least one item to place an order.'); return; }
    try {
      const newOrder = await adminStore.addOrder({
        customerName: posCustomerName || (posOrderType === 'dine-in' ? `Table ${posTableNo || '?'}` : 'Walk-in'),
        customerPhone: '',
        customerAddress: posOrderType === 'dine-in' ? `Table ${posTableNo || '?'}` : posOrderType === 'takeaway' ? 'Takeaway' : 'Counter Delivery',
        deliveryType: posOrderType === 'delivery' ? 'delivery' : 'pickup',
        tableNumber: posTableNo,
        paymentMethod: posPaymentMethod === 'cash' ? 'cod' : 'upi',
        subtotal: posSubtotal,
        discount: posDiscount,
        deliveryFee: 0,
        total: posTotal,
        source: 'pos',
        items: posCart.map(c => ({
          menuItem: c.item,
          quantity: c.qty,
          selectedSpice: (c.item.spiceLevel || 'medium') as 'mild' | 'medium' | 'hot',
          specialInstructions: c.note
        }))
      });
      setPosOrderPlaced(newOrder);
      // Clear session draft
      sessionStorage.removeItem('pos_cart_draft');
      setPosCart([]);
      setPosCustomerName('');
      setPosTableNo('');
      setPosDiscount(0);
    } catch (err) {
      alert('Failed to place order. Please try again.');
      console.error('POS addOrder error:', err);
    }
  };



  const kdsOrders = useMemo(() => {
    return orders
      .filter(o => o.status === 'placed' || o.status === 'preparing')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders]);

  const [timeTick, setTimeTick] = useState(0);
  useEffect(() => {
    if (!isKdsMode) return;
    const interval = setInterval(() => {
      setTimeTick(prev => prev + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, [isKdsMode]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus = orderFilter === 'all' || o.status === orderFilter;
      const matchesType = orderTypeFilter === 'all' || o.deliveryType === orderTypeFilter;
      
      const q = orderSearchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        (o.tableNumber && o.tableNumber.toLowerCase().includes(q)) ||
        (o.customerAddress && o.customerAddress.toLowerCase().includes(q)) ||
        o.items.some(it => it.menuItem.name.toLowerCase().includes(q));
        
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [orders, orderFilter, orderTypeFilter, orderSearchQuery]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(menuItems.map(i => i.category));
    return ['all', ...Array.from(cats)];
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
                            item.category.toLowerCase().includes(menuSearch.toLowerCase());
      const matchesCat = menuCategoryFilter === 'all' || item.category === menuCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [menuSearch, menuCategoryFilter, menuItems]);

  const filteredReservations = useMemo(() => {
    return reservations.filter(r => r.date === resDateFilter);
  }, [reservations, resDateFilter]);

  const filteredCelebrations = useMemo(() => {
    return celebrations.filter(e => enquiryStatusFilter === 'all' || e.status === enquiryStatusFilter);
  }, [celebrations, enquiryStatusFilter]);

  // Past orders customer lookup state
  const customerPastOrders = useMemo(() => {
    if (!searchPhoneQuery.trim()) return [];
    return orders.filter(o => o.customerPhone.includes(searchPhoneQuery.trim()));
  }, [orders, searchPhoneQuery]);

  // Reports analytics calculations
  const analytics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
    const todayDelivered = todayOrders.filter(o => o.status === 'delivered');
    const totalTodayRevenue = todayDelivered.reduce((sum, o) => sum + o.total, 0);

    const codRevenue = todayDelivered.filter(o => o.paymentMethod === 'cod').reduce((sum, o) => sum + o.total, 0);
    const upiRevenue = todayDelivered.filter(o => o.paymentMethod === 'upi').reduce((sum, o) => sum + o.total, 0);

    const allDeliveredOrders = orders.filter(o => o.status === 'delivered' || o.status === 'completed');
    const aov = allDeliveredOrders.length > 0 
      ? Math.round(allDeliveredOrders.reduce((sum, o) => sum + o.total, 0) / allDeliveredOrders.length) 
      : 0;

    // Peak hours analysis
    const hourCounts: Record<number, number> = {};
    orders.forEach(o => {
      try {
        const hour = new Date(o.createdAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      } catch (err) {}
    });
    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: Number(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Top selling items count
    const itemCounts: Record<string, number> = {};
    orders.forEach(o => {
      o.items.forEach(it => {
        itemCounts[it.menuItem.name] = (itemCounts[it.menuItem.name] || 0) + it.quantity;
      });
    });
    const topSelling = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      todayCount: todayOrders.length,
      todayDeliveredCount: todayDelivered.length,
      todayRevenue: totalTodayRevenue,
      codRevenue,
      upiRevenue,
      aov,
      peakHours,
      topSelling
    };
  }, [orders]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'signin') {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  if (authLoading) {
    return <div className="min-h-screen bg-cream flex items-center justify-center text-charcoal font-bold">Checking credentials...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-black border border-charcoal/10 flex items-center justify-center p-1 shadow-sm">
              <img src="/favicon.png" className="w-full h-full object-cover" alt="Curry Delight Logo" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-center text-charcoal mb-2">Admin Portal</h2>
          <p className="text-center text-charcoal/60 mb-6 text-sm">Secure access required.</p>
          
          {authError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold mb-4 text-center border border-red-200">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-charcoal mb-1">Email</label>
              <input 
                type="email" 
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                className="w-full bg-cream/30 border border-charcoal/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-saffron"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-charcoal mb-1">Password</label>
              <input 
                type="password" 
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                className="w-full bg-cream/30 border border-charcoal/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-saffron"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-saffron hover:bg-saffron/90 text-white font-bold py-3 rounded-xl transition-all shadow-md cursor-pointer"
            >
              {authMode === 'signin' ? 'Sign In to Dashboard' : 'Create Admin Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
              className="text-xs text-charcoal/50 hover:text-charcoal font-bold transition-colors cursor-pointer"
            >
              {authMode === 'signin' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
            </button>
          </div>
          <div className="mt-4 text-center">
            <button 
              onClick={() => navigateTo('/')}
              className="text-xs text-charcoal/40 hover:text-charcoal transition-colors cursor-pointer"
            >
              &larr; Back to Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream/25 text-charcoal font-sans" id="admin-dashboard-container">
      
      {/* --- ADMIN HEADER BAR --- */}
      <header className="bg-charcoal text-white py-5 px-6 md:px-12 shadow-md border-b border-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-3">
            <span className="bg-saffron text-white text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full font-mono">STAFF ACCESS</span>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[10px] font-bold text-cream/60 uppercase font-mono">Terminal Active</span>
            </div>
          </div>
          <h1 className="text-2xl font-display font-black tracking-tight flex items-center gap-2">
            🌶️ Curry Delight Kahalgaon <span className="text-saffron">CMS</span>
          </h1>
          <p className="text-xs text-cream/40">Real-time Kitchen Order System, Roster & Guest Book</p>
        </div>

        {/* Header Right Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mock order test button */}
          <button
            onClick={handleCreateMockOrder}
            className="bg-saffron/10 hover:bg-saffron/20 border border-saffron/35 text-saffron text-xs font-bold px-4 py-2 rounded-xl cursor-pointer flex items-center space-x-1.5 transition-all"
            title="Create a random mock customer order to test the instant sound alert and real-time live feed!"
          >
            <Volume2 className="w-4 h-4" />
            <span>Test Sound Alert (+Mock Order)</span>
          </button>

          {/* Sound alert toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`border text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              soundEnabled ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500' : 'border-charcoal/10 bg-white/5 text-cream/40'
            }`}
          >
            <span>Sound Alert: {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Role selector dropdown */}
          <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setStaffRole('owner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                staffRole === 'owner' ? 'bg-saffron text-white shadow' : 'text-cream/60 hover:text-white'
              }`}
            >
              Owner Portal
            </button>
            <button
              onClick={() => setStaffRole('counter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                staffRole === 'counter' ? 'bg-saffron text-white shadow' : 'text-cream/60 hover:text-white'
              }`}
            >
              Counter Staff
            </button>
          </div>

          {/* Return button */}
          <button 
            onClick={() => navigateTo('/')}
            className="bg-white/10 hover:bg-white/15 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all border border-white/10 cursor-pointer"
          >
            Return to Site
          </button>
          
          <button 
            onClick={handleSignOut}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-bold px-4 py-2 rounded-xl transition-all border border-red-500/30 cursor-pointer flex items-center space-x-1"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* --- DASHBOARD SUB-NAVIGATION --- */}
      <nav className="bg-white border-b border-charcoal/5 px-6 md:px-12 py-3 overflow-x-auto flex items-center space-x-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'dashboard' 
              ? 'bg-charcoal text-white shadow' 
              : 'text-charcoal/60 hover:bg-charcoal/5 hover:text-charcoal'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Dashboard Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'orders' 
              ? 'bg-charcoal text-white shadow' 
              : 'text-charcoal/60 hover:bg-charcoal/5 hover:text-charcoal'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Order Logbook</span>
          {orders.filter(o => o.status === 'placed').length > 0 && (
            <span className="bg-red-500 text-white font-mono text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
              {orders.filter(o => o.status === 'placed').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('pos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'pos'
              ? 'bg-saffron text-white shadow'
              : 'text-charcoal/60 hover:bg-charcoal/5 hover:text-charcoal'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>🧾 Take Order (POS)</span>
          {posCart.length > 0 && (
            <span className="bg-saffron text-white font-mono text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {posCart.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'reservations' 
              ? 'bg-charcoal text-white shadow' 
              : 'text-charcoal/60 hover:bg-charcoal/5 hover:text-charcoal'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Table Reservations</span>
          {reservations.filter(r => r.status === 'pending').length > 0 && (
            <span className="bg-amber-500 text-white font-mono text-[10px] px-1.5 py-0.5 rounded-full flex items-center justify-center font-bold">
              {reservations.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('celebrations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'celebrations' 
              ? 'bg-charcoal text-white shadow' 
              : 'text-charcoal/60 hover:bg-charcoal/5 hover:text-charcoal'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Celebration Enquiries</span>
          {celebrations.filter(c => c.status === 'new').length > 0 && (
            <span className="bg-amber-500 text-white font-mono text-[10px] px-1.5 py-0.5 rounded-full flex items-center justify-center font-bold">
              {celebrations.filter(c => c.status === 'new').length}
            </span>
          )}
        </button>

        {/* Owner-only Tabs */}
        {staffRole === 'owner' && (
          <>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'menu' 
                  ? 'bg-charcoal text-white shadow' 
                  : 'text-charcoal/60 hover:bg-charcoal/5 hover:text-charcoal'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Menu Status ({soldOutIds.length} Sold Out)</span>
            </button>

            <button
              onClick={() => setActiveTab('roster')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'roster' 
                  ? 'bg-charcoal text-white shadow' 
                  : 'text-charcoal/60 hover:bg-charcoal/5 hover:text-charcoal'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Delivery Agents ({deliveryBoys.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'reports' 
                  ? 'bg-charcoal text-white shadow' 
                  : 'text-charcoal/60 hover:bg-charcoal/5 hover:text-charcoal'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Reports & Lookup</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'settings' 
                  ? 'bg-charcoal text-white shadow' 
                  : 'text-charcoal/60 hover:bg-charcoal/5 hover:text-charcoal'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>GST & Tax Panel</span>
            </button>
          </>
        )}
      </nav>

      {/* --- DASHBOARD WRAPPER PANEL --- */}
      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 text-left">

        {/* --- TAB 0: DASHBOARD OVERVIEW --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in" id="panel-dashboard">
            <div className="space-y-1">
              <h2 className="font-display font-black text-2xl text-charcoal">
                📈 Restaurant Performance Dashboard
              </h2>
              <p className="text-xs text-charcoal/50">Real-time metrics, order volumes, peak ordering hours, and menu performance metrics.</p>
            </div>

            {/* Performance Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Today's Revenue */}
              <div className="bg-white rounded-3xl border border-charcoal/10 p-6 shadow-xs hover:shadow-md transition-all space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 font-mono block">Today's Revenue</span>
                <p className="text-3xl font-display font-black text-saffron">₹{analytics.todayRevenue}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Real-time delivered total</span>
                </div>
              </div>

              {/* AOV */}
              <div className="bg-white rounded-3xl border border-charcoal/10 p-6 shadow-xs hover:shadow-md transition-all space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 font-mono block">Average Order Value</span>
                <p className="text-3xl font-display font-black text-charcoal">₹{analytics.aov}</p>
                <div className="text-[10px] text-charcoal/40 font-bold">Average ticket size (All-time)</div>
              </div>

              {/* Active Orders */}
              <div className="bg-white rounded-3xl border border-charcoal/10 p-6 shadow-xs hover:shadow-md transition-all space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 font-mono block">Active Kitchen Queue</span>
                <p className="text-3xl font-display font-black text-charcoal">
                  {orders.filter(o => !['delivered', 'completed', 'cancelled'].includes(o.status)).length}
                </p>
                <div className="text-[10px] text-charcoal/40 font-bold">Orders being prepared or out</div>
              </div>

              {/* Pending Bookings */}
              <div className="bg-white rounded-3xl border border-charcoal/10 p-6 shadow-xs hover:shadow-md transition-all space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 font-mono block">Pending Bookings</span>
                <p className="text-3xl font-display font-black text-amber-600">
                  {reservations.filter(r => r.status === 'pending').length}
                </p>
                <div className="text-[10px] text-charcoal/40 font-bold">Reservations awaiting response</div>
              </div>
            </div>

            {/* Top Dishes & Peak Hours Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Selling Items */}
              <div className="bg-white rounded-3xl border border-charcoal/10 p-6 shadow-sm space-y-4">
                <div className="border-b border-charcoal/5 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal/70 font-mono">🔥 Busiest Items (All-Time)</h3>
                  <p className="text-[10px] text-charcoal/40 mt-0.5">Top performing items by quantity sold</p>
                </div>
                <div className="space-y-4 pt-1">
                  {analytics.topSelling.length === 0 ? (
                    <div className="text-xs text-charcoal/40 text-center py-12">No orders recorded yet.</div>
                  ) : (
                    analytics.topSelling.map((it, idx) => {
                      const maxQty = analytics.topSelling[0].count;
                      const percentage = Math.round((it.count / maxQty) * 100);
                      return (
                        <div key={idx} className="space-y-1.5 text-xs text-charcoal">
                          <div className="flex justify-between font-bold">
                            <span>{idx + 1}. {it.name}</span>
                            <span className="font-mono text-saffron">{it.count} sold</span>
                          </div>
                          <div className="h-2 bg-charcoal/5 rounded-full overflow-hidden">
                            <div className="bg-saffron h-full rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Peak Ordering Hours */}
              <div className="bg-white rounded-3xl border border-charcoal/10 p-6 shadow-sm space-y-4">
                <div className="border-b border-charcoal/5 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal/70 font-mono">🕒 Peak Ordering Hours</h3>
                  <p className="text-[10px] text-charcoal/40 mt-0.5">Most common hours of the day when orders are placed</p>
                </div>
                <div className="space-y-3.5 pt-1">
                  {analytics.peakHours.length === 0 ? (
                    <div className="text-xs text-charcoal/40 text-center py-12">No order time stamps recorded.</div>
                  ) : (
                    analytics.peakHours.map((ph, idx) => {
                      const formatHour = (h: number) => {
                        const ampm = h >= 12 ? 'PM' : 'AM';
                        const displayHour = h % 12 || 12;
                        return `${displayHour}:00 ${ampm}`;
                      };
                      return (
                        <div key={idx} className="flex justify-between items-center bg-cream/35 border border-charcoal/5 p-3 rounded-2xl">
                          <div className="flex items-center space-x-3">
                            <span className="w-6 h-6 rounded-full bg-saffron/10 text-saffron font-bold text-xs flex items-center justify-center font-mono">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-charcoal">{formatHour(ph.hour)}</span>
                          </div>
                          <span className="text-xs font-mono font-bold bg-charcoal/5 px-3 py-1 rounded-xl text-charcoal/70">
                            {ph.count} orders
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* CMS Shortcut Actions Panel */}
            <div className="bg-charcoal text-white rounded-3xl p-6 md:p-8 space-y-4 border border-white/5 shadow-xl">
              <h3 className="font-display font-bold text-lg">⚡ CMS Quick Shortcuts</h3>
              <p className="text-xs text-white/50">Instantly switch to operational panels to manage your restaurant queue or update configuration.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <button onClick={() => setActiveTab('orders')} className="bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold text-center cursor-pointer transition-all">
                  📋 Live Orders
                </button>
                <button onClick={() => setActiveTab('reservations')} className="bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold text-center cursor-pointer transition-all">
                  📅 Reservations
                </button>
                <button onClick={() => setActiveTab('menu')} className="bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold text-center cursor-pointer transition-all">
                  🍔 Edit Menu
                </button>
                {staffRole === 'owner' && (
                  <button onClick={() => setActiveTab('settings')} className="bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold text-center cursor-pointer transition-all">
                    Settings
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 1: ORDER LOGBOOK & KDS --- */}
        {activeTab === 'orders' && (
          <div className="space-y-6" id="panel-orders">
            
            {/* Header section with View Toggle */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white rounded-3xl p-5 border border-charcoal/10 shadow-xs">
              <div className="space-y-1.5 text-left">
                <div className="flex items-center gap-3">
                  <h2 className="font-display font-black text-2xl text-charcoal">
                    📋 Order Operations Center
                  </h2>
                  <span className="text-[10px] bg-saffron/10 text-saffron border border-saffron/20 font-mono font-bold px-2.5 py-0.5 rounded-full">
                    {orders.filter(o => o.status !== 'delivered').length} Active Orders
                  </span>
                </div>
                <p className="text-xs text-charcoal/50">Track live orders, dispatch riders, manage kitchen queue, and print thermal receipts.</p>
              </div>

              {/* View mode toggle tabs */}
              <div className="flex bg-cream/15 p-1 rounded-2xl border border-charcoal/5 self-start lg:self-center">
                <button
                  onClick={() => setLogbookViewMode('table')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    logbookViewMode === 'table'
                      ? 'bg-charcoal text-white shadow-sm'
                      : 'text-charcoal/60 hover:text-charcoal'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Logbook Directory</span>
                </button>
                <button
                  onClick={() => setLogbookViewMode('kds')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    logbookViewMode === 'kds'
                      ? 'bg-charcoal text-white shadow-sm'
                      : 'text-charcoal/60 hover:text-charcoal'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Kitchen KDS</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar - Only shown in Logbook Mode */}
            {logbookViewMode === 'table' && (
              <div className="bg-white rounded-3xl border border-charcoal/10 p-5 shadow-xs space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  
                  {/* Search bar */}
                  <div className="relative md:col-span-4">
                    <Search className="w-4 h-4 text-charcoal/40 absolute left-4 top-3" />
                    <input
                      type="text"
                      placeholder="Search ID, customer name, phone, table..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full bg-cream/5 border border-charcoal/10 rounded-xl py-2.5 pl-11 pr-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron"
                    />
                  </div>

                  {/* Status Filters */}
                  <div className="md:col-span-5 flex flex-wrap gap-1">
                    {(['all', 'placed', 'preparing', 'out_for_delivery', 'delivered'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setOrderFilter(st)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          orderFilter === st
                            ? 'bg-saffron text-white shadow-xs'
                            : 'bg-cream/10 text-charcoal/60 border border-charcoal/5 hover:bg-cream/25 hover:text-charcoal'
                        }`}
                      >
                        {st === 'all' ? 'All Status' : st === 'placed' ? 'Placed' : st === 'preparing' ? 'Preparing' : st === 'out_for_delivery' ? 'Out' : 'Delivered'}
                      </button>
                    ))}
                  </div>

                  {/* Order Type Filters */}
                  <div className="md:col-span-3">
                    <select
                      value={orderTypeFilter}
                      onChange={(e) => setOrderTypeFilter(e.target.value as any)}
                      className="w-full bg-cream/20 text-charcoal text-xs font-bold px-3 py-2.5 rounded-xl border border-charcoal/10 focus:outline-none"
                    >
                      <option value="all">All Delivery Types</option>
                      <option value="dine-in">🍽️ Dine-in</option>
                      <option value="pickup">🛍️ Takeaway/Pickup</option>
                      <option value="delivery">🛵 Home Delivery</option>
                    </select>
                  </div>

                </div>
              </div>
            )}

            {/* Render Logbook table vs KDS cards */}
            {logbookViewMode === 'table' ? (
              <div className="bg-white rounded-3xl border border-charcoal/10 overflow-hidden shadow-xs">
                
                {/* Responsive table wrapper */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-charcoal/5 border-b border-charcoal/10 text-[10px] font-bold text-charcoal/50 uppercase font-mono tracking-wider">
                        <th className="py-4 px-5">Date/Time</th>
                        <th className="py-4 px-4">Order ID</th>
                        <th className="py-4 px-4">Customer & Type</th>
                        <th className="py-4 px-4">Items Summary</th>
                        <th className="py-4 px-4 text-center">Payment</th>
                        <th className="py-4 px-4 text-right">Total</th>
                        <th className="py-4 px-4 text-center">Status</th>
                        <th className="py-4 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-charcoal/5">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-16 text-center text-xs text-charcoal/40">
                            No orders found matching the filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => {
                          const isExpanded = expandedOrderId === order.id;
                          const formattedDate = new Date(order.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' });
                          const formattedTime = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          
                          return (
                            <React.Fragment key={order.id}>
                              
                              {/* Main Row */}
                              <tr 
                                onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                className={`group hover:bg-cream/15 text-xs transition-colors cursor-pointer ${
                                  order.status === 'placed' ? 'bg-red-50/20' : ''
                                }`}
                              >
                                {/* Date/Time */}
                                <td className="py-4 px-5 font-mono whitespace-nowrap">
                                  <span className="font-bold text-charcoal">{formattedDate}</span>
                                  <span className="text-[10px] text-charcoal/40 block mt-0.5">{formattedTime}</span>
                                </td>

                                {/* Order ID */}
                                <td className="py-4 px-4 font-mono font-bold text-saffron uppercase whitespace-nowrap">
                                  {order.id}
                                </td>

                                {/* Customer / Table & Type */}
                                <td className="py-4 px-4 whitespace-nowrap">
                                  <div className="font-bold text-charcoal">{order.customerName}</div>
                                  <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold">
                                    {order.deliveryType === 'dine-in' ? (
                                      <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">🍽️ Table {order.tableNumber || '?'}</span>
                                    ) : order.deliveryType === 'delivery' ? (
                                      <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">🛵 Delivery</span>
                                    ) : (
                                      <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">🛍️ Takeaway</span>
                                    )}
                                    {order.source === 'pos' ? (
                                      <span className="bg-charcoal text-white px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider">POS</span>
                                    ) : (
                                      <span className="bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider">ONLINE</span>
                                    )}
                                  </div>
                                </td>

                                {/* Items Summary */}
                                <td className="py-4 px-4 max-w-xs truncate">
                                  <div className="font-semibold text-charcoal/80">
                                    {order.items.map(it => `${it.quantity}x ${it.menuItem.name.substring(0, 15)}`).join(', ')}
                                  </div>
                                  {order.specialInstructions && (
                                    <span className="text-[10px] text-red-600 italic block mt-0.5 truncate">
                                      ⚠️ Note: "{order.specialInstructions}"
                                    </span>
                                  )}
                                </td>

                                {/* Payment */}
                                <td className="py-4 px-4 text-center whitespace-nowrap">
                                  <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                    order.paymentMethod === 'cod' ? 'bg-amber-50 border border-amber-200/50 text-amber-800' : 'bg-emerald-50 border border-emerald-200/50 text-emerald-800'
                                  }`}>
                                    {order.paymentMethod === 'cod' ? 'COD' : 'UPI'}
                                  </span>
                                </td>

                                {/* Total Amount */}
                                <td className="py-4 px-4 text-right font-mono font-black text-charcoal whitespace-nowrap">
                                  ₹{order.total}
                                </td>

                                {/* Status Progress select */}
                                <td className="py-4 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  <select
                                    value={order.status}
                                    onChange={async (e) => {
                                      await adminStore.updateOrderStatus(order.id, e.target.value as any);
                                      syncAllData();
                                    }}
                                    className={`bg-white text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                                      order.status === 'placed' ? 'border-red-300 text-red-700 bg-red-50/50' :
                                      order.status === 'preparing' ? 'border-amber-300 text-amber-700 bg-amber-50/50' :
                                      order.status === 'out_for_delivery' ? 'border-indigo-300 text-indigo-700 bg-indigo-50/50' :
                                      'border-emerald-300 text-emerald-700 bg-emerald-50/50'
                                    }`}
                                  >
                                    <option value="placed">🔴 Placed</option>
                                    <option value="preparing">🟡 Preparing</option>
                                    <option value="out_for_delivery">🔵 Out For Delivery</option>
                                    <option value="delivered">🟢 Delivered</option>
                                  </select>
                                </td>

                                {/* Quick actions icon */}
                                <td className="py-4 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => {
                                        setPrintingOrder(order);
                                        setPrintType('kot');
                                      }}
                                      title="Print KOT"
                                      className="p-1.5 hover:bg-charcoal/5 rounded-lg text-charcoal/70 hover:text-charcoal cursor-pointer transition-colors"
                                    >
                                      <Printer className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setPrintingOrder(order);
                                        setPrintType('bill');
                                      }}
                                      title="Print Bill"
                                      className="p-1.5 hover:bg-charcoal/5 rounded-lg text-saffron hover:bg-saffron/10 cursor-pointer transition-colors"
                                    >
                                      <FileText className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expanded Detail Panel */}
                              {isExpanded && (
                                <tr className="bg-cream/10">
                                  <td colSpan={8} className="p-5 border-l-4 border-saffron">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-charcoal">
                                      
                                      {/* Order Items Breakdown */}
                                      <div className="bg-white rounded-2xl border border-charcoal/10 p-4 space-y-3 shadow-sm">
                                        <div className="font-mono text-[10px] font-black uppercase tracking-wider text-charcoal/40 border-b border-charcoal/5 pb-2">
                                          Items Ordered
                                        </div>
                                        <div className="space-y-2">
                                          {order.items.map((it, idx) => (
                                            <div key={idx} className="flex justify-between items-start border-b border-charcoal/5 pb-2 last:border-0 last:pb-0">
                                              <div>
                                                <div className="font-bold text-charcoal">
                                                  {it.menuItem.name} <span className="text-saffron">x{it.quantity}</span>
                                                </div>
                                                {/* Spice & Customizations */}
                                                {(it.selectedSpice || it.selectedPortion || it.specialInstructions || it.thaliCustomizations) && (
                                                  <div className="text-[10px] text-charcoal/50 mt-1 pl-2 border-l border-charcoal/10 space-y-0.5 font-mono">
                                                    {it.selectedSpice && <p>• Spice: {it.selectedSpice.toUpperCase()}</p>}
                                                    {it.selectedPortion && <p>• Portion: {it.selectedPortion}</p>}
                                                    {it.thaliCustomizations && (
                                                      <>
                                                        {it.thaliCustomizations.currySwap && <p>• curry: {it.thaliCustomizations.currySwap}</p>}
                                                        {it.thaliCustomizations.breadSwap && <p>• bread: {it.thaliCustomizations.breadSwap}</p>}
                                                        {it.thaliCustomizations.dessertChoice && <p>• sweet: {it.thaliCustomizations.dessertChoice}</p>}
                                                      </>
                                                    )}
                                                    {it.specialInstructions && <p className="text-red-500 italic">• instructions: "{it.specialInstructions}"</p>}
                                                  </div>
                                                )}
                                              </div>
                                              <span className="font-mono font-bold">₹{it.menuItem.price * it.quantity}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Customer & Delivery Details */}
                                      <div className="bg-white rounded-2xl border border-charcoal/10 p-4 space-y-3 shadow-sm">
                                        <div className="font-mono text-[10px] font-black uppercase tracking-wider text-charcoal/40 border-b border-charcoal/5 pb-2">
                                          Customer &amp; Rider Details
                                        </div>
                                        <div className="space-y-2">
                                          <p><strong>Customer:</strong> {order.customerName}</p>
                                          {order.customerPhone && <p><strong>Phone:</strong> {order.customerPhone}</p>}
                                          {order.deliveryType === 'delivery' && (
                                            <>
                                              <p className="leading-relaxed"><strong>Address:</strong> {order.customerAddress}</p>
                                              
                                              {/* Rider Assignment */}
                                              <div className="mt-3 pt-3 border-t border-charcoal/5 space-y-1.5">
                                                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal/50 block"> RIDER ASSIGNED </label>
                                                <select
                                                  value={order.assignedDeliveryBoyId || ''}
                                                  onChange={(e) => {
                                                    adminStore.assignDeliveryBoy(order.id, e.target.value);
                                                    syncAllData();
                                                  }}
                                                  className="w-full bg-cream/10 border border-charcoal/15 rounded-xl px-3 py-2 text-xs font-semibold"
                                                >
                                                  <option value="">-- Choose Rider --</option>
                                                  {deliveryBoys.map(boy => (
                                                    <option key={boy.id} value={boy.id}>{boy.name} ({boy.phone})</option>
                                                  ))}
                                                </select>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {/* Order Summary & Dispatch Actions */}
                                      <div className="bg-white rounded-2xl border border-charcoal/10 p-4 space-y-3 shadow-sm flex flex-col justify-between">
                                        <div className="space-y-2">
                                          <div className="font-mono text-[10px] font-black uppercase tracking-wider text-charcoal/40 border-b border-charcoal/5 pb-2">
                                            Calculations
                                          </div>
                                          <div className="space-y-1 font-mono text-[11px]">
                                            <div className="flex justify-between"><span>Subtotal:</span><span>₹{order.subtotal}</span></div>
                                            {order.discount > 0 && <div className="flex justify-between text-red-600"><span>Discount:</span><span>-₹{order.discount}</span></div>}
                                            {order.deliveryFee > 0 && <div className="flex justify-between"><span>Delivery Fee:</span><span>+₹{order.deliveryFee}</span></div>}
                                            <div className="flex justify-between border-t border-charcoal/10 pt-1.5 font-bold text-sm text-saffron">
                                              <span>Grand Total:</span><span>₹{order.total}</span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Actions panel */}
                                        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-charcoal/5 mt-3">
                                          {order.customerPhone && (
                                            <button
                                              onClick={() => window.open(getWhatsAppConfirmLink(order), '_blank')}
                                              className="bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-[10px] uppercase py-2.5 rounded-xl transition-all text-center flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                                            >
                                              <span>Confirm WA</span>
                                            </button>
                                          )}
                                          
                                          {order.deliveryType === 'delivery' && (
                                            <button
                                              onClick={() => {
                                                const db = deliveryBoys.find(b => b.id === order.assignedDeliveryBoyId);
                                                if (!db) {
                                                  alert('Please assign a delivery boy from the dropdown first!');
                                                  return;
                                                }
                                                window.open(getWhatsAppDeliveryLink(order, db), '_blank');
                                              }}
                                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase py-2.5 rounded-xl transition-all text-center flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                                            >
                                              <span>Dispatch Rider</span>
                                            </button>
                                          )}

                                          <button
                                            onClick={() => {
                                              setPrintingOrder(order);
                                              setPrintType('kot');
                                            }}
                                            className="bg-charcoal hover:bg-charcoal/90 text-white font-bold text-[10px] uppercase py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                                          >
                                            <Printer className="w-3.5 h-3.5" />
                                            <span>KOT Copy</span>
                                          </button>

                                          <button
                                            onClick={() => {
                                              setPrintingOrder(order);
                                              setPrintType('bill');
                                            }}
                                            className="bg-charcoal hover:bg-charcoal/90 text-white font-bold text-[10px] uppercase py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                                          >
                                            <Printer className="w-3.5 h-3.5" />
                                            <span>Bill Receipt</span>
                                          </button>
                                        </div>

                                      </div>

                                    </div>
                                  </td>
                                </tr>
                              )}

                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            ) : (
              // Kitchen Display Mode Board
              <div className="space-y-6" id="kds-board">
                <div className="bg-charcoal text-white rounded-3xl p-6 border border-charcoal/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                      <h3 className="font-display font-bold text-lg uppercase tracking-wider text-saffron">Kitchen KDS Active Board</h3>
                    </div>
                    <p className="text-xs text-white/60">Optimized for landscape wall-mounted tablets. Tapping item checkboxes strikes them off. Oldest orders shown first.</p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="bg-white/10 px-4 py-2 rounded-xl text-center">
                      <span className="text-2xl font-black font-mono block text-saffron">
                        {orders.filter(o => o.status === 'placed' || o.status === 'preparing').length}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Prep Queue</span>
                    </div>
                  </div>
                </div>

                {orders.filter(o => o.status === 'placed' || o.status === 'preparing').length === 0 ? (
                  <div className="bg-charcoal/5 border border-charcoal/15 rounded-3xl p-16 text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                      🍳
                    </div>
                    <h3 className="font-display font-bold text-xl text-charcoal">All Orders Prep-Ready!</h3>
                    <p className="text-xs text-charcoal/50 max-w-sm mx-auto">Take a breath, chef! The live queue is completely cleared. New orders will pop in with alert bells instantly.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders
                      .filter(o => o.status === 'placed' || o.status === 'preparing')
                      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                      .map((order) => {
                        const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                        const isLate = elapsed >= 15;
                        const isNew = order.status === 'placed';

                        return (
                          <div 
                            key={order.id} 
                            className={`bg-white rounded-3xl border-2 overflow-hidden flex flex-col justify-between shadow-md transition-all ${
                              isLate 
                                ? 'border-red-600 ring-2 ring-red-600/10 shadow-sm' 
                                : isNew 
                                  ? 'border-saffron animate-pulse-light shadow-sm' 
                                  : 'border-charcoal/10 shadow-sm'
                            }`}
                          >
                            {/* Ticket Header */}
                            <div className={`p-4 ${isLate ? 'bg-red-50' : 'bg-charcoal/5'} border-b border-charcoal/10 text-left`}>
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-lg font-black text-charcoal tracking-tight">{order.id.slice(-6)}</span>
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase ${
                                  order.deliveryType === 'delivery' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {order.deliveryType === 'delivery' ? '📍 Delivery' : order.deliveryType === 'dine-in' ? '🍽️ Dine-in' : '🛍️ Takeaway'}
                                </span>
                              </div>

                              <div className="flex items-center justify-between mt-3">
                                <h4 className="font-display font-black text-lg text-charcoal truncate max-w-[150px]">{order.customerName}</h4>
                                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                  isLate ? 'bg-red-600 text-white animate-pulse' : 'bg-charcoal/10 text-charcoal/70'
                                }`}>
                                  ⏰ {elapsed}m ago
                                </span>
                              </div>

                              {order.specialInstructions && (
                                <div className="mt-2 bg-saffron/10 border border-saffron/30 rounded-lg p-2">
                                  <p className="text-[11px] font-bold text-saffron leading-tight">
                                    ⚠️ MSG: {order.specialInstructions}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Item Checklist (MASSIVE Typography) */}
                            <div className="p-5 flex-1 space-y-4 text-left">
                              <span className="text-[10px] font-bold text-charcoal/50 uppercase tracking-widest font-mono block">Item Checklist:</span>
                              <div className="space-y-3">
                                {order.items.map((item, idx) => {
                                  const checkKey = `${order.id}_${idx}`;
                                  const isChecked = !!kdsCheckedItems[checkKey];
                                  return (
                                    <div 
                                      key={idx}
                                      onClick={() => {
                                        setKdsCheckedItems(prev => ({
                                          ...prev,
                                          [checkKey]: !isChecked
                                        }));
                                      }}
                                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                        isChecked 
                                          ? 'bg-emerald-50 border-emerald-200/50' 
                                          : 'bg-cream/10 border-charcoal/5 hover:bg-cream/20'
                                      }`}
                                    >
                                      <input 
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {}} // handled by click container
                                        className="w-5 h-5 rounded border-charcoal/20 text-emerald-600 focus:ring-emerald-500 shrink-0 mt-0.5 cursor-pointer"
                                      />
                                      <div className="flex-1">
                                        <p className={`text-base font-black text-charcoal leading-tight ${isChecked ? 'line-through text-charcoal/40 font-normal' : ''}`}>
                                          <span className="text-saffron mr-1.5">{item.quantity}x</span>
                                          {item.menuItem.name}
                                        </p>
                                        {(item.selectedSpice || item.selectedPortion) && (
                                          <p className="text-[10px] text-charcoal/60 font-mono mt-0.5">
                                            ({item.selectedSpice && `Spice: ${item.selectedSpice}`} {item.selectedPortion && `| Size: ${item.selectedPortion}`})
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                             {/* Large Touch buttons */}
                            <div className="p-4 border-t border-charcoal/5 bg-cream/10 flex gap-2">
                              {order.status === 'placed' ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await adminStore.updateOrderStatus(order.id, 'preparing');
                                    syncAllData();
                                  }}
                                  className="w-full bg-saffron hover:bg-saffron/90 active:scale-95 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl cursor-pointer transition-all shadow-md text-center flex items-center justify-center gap-1.5"
                                >
                                  🧑‍🍳 START PREPARING 🔥
                                </button>
                              ) : (
                                <div className="flex gap-2 w-full">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await adminStore.updateOrderStatus(order.id, 'placed');
                                      syncAllData();
                                    }}
                                    className="flex-1 bg-charcoal/10 hover:bg-charcoal/20 active:scale-95 text-charcoal font-bold text-[10px] uppercase tracking-wider py-3 rounded-xl cursor-pointer transition-all text-center"
                                  >
                                    ↩ Undo
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await adminStore.updateOrderStatus(order.id, 'delivered');
                                      syncAllData();
                                    }}
                                    className="flex-[3] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl cursor-pointer transition-all shadow-md text-center flex items-center justify-center gap-1.5"
                                  >
                                    ✅ DONE / MARK READY
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 1.5: POS TAKE ORDER --- */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="panel-pos">
            
            {/* Left Column: Menu Item Catalog */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Category slider & search */}
              <div className="bg-white rounded-3xl border border-charcoal/10 p-5 shadow-xs space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-black text-lg text-charcoal">🍽️ Dish Catalog</h3>
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 text-charcoal/40 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search dish..."
                      value={posSearch}
                      onChange={(e) => setPosSearch(e.target.value)}
                      className="w-full bg-cream/5 border border-charcoal/10 rounded-xl py-1.5 pl-9 pr-3 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Category tags */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  <button
                    onClick={() => setPosCatFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer ${
                      posCatFilter === 'all'
                        ? 'bg-charcoal text-white'
                        : 'bg-cream/10 text-charcoal/60 border border-charcoal/5 hover:bg-cream/20'
                    }`}
                  >
                    All Dishes
                  </button>
                  {uniqueCategories.filter(c => c !== 'all').map(cat => (
                    <button
                      key={cat}
                      onClick={() => setPosCatFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer ${
                        posCatFilter === cat
                          ? 'bg-charcoal text-white'
                          : 'bg-cream/10 text-charcoal/60 border border-charcoal/5 hover:bg-cream/20'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {posFilteredItems.length === 0 ? (
                  <div className="col-span-full bg-white border border-charcoal/10 rounded-3xl p-12 text-center text-xs text-charcoal/40">
                    No dishes found matching filters.
                  </div>
                ) : (
                  posFilteredItems.map(item => {
                    const isSold = soldOutIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (!isSold) {
                            posAddItem(item);
                          }
                        }}
                        className={`bg-white rounded-2xl border overflow-hidden shadow-xs transition-all flex flex-col justify-between ${
                          isSold 
                            ? 'border-charcoal/5 opacity-55 grayscale cursor-default' 
                            : 'border-charcoal/10 hover:border-saffron hover:shadow-md cursor-pointer group'
                        }`}
                      >
                        <div>
                          {/* Item image */}
                          <div className="h-28 bg-charcoal/5 relative">
                            <img
                              src={item.image}
                              alt={item.name}
                              className={`w-full h-full object-cover transition-transform duration-500 ${!isSold && 'group-hover:scale-105'}`}
                              onError={(e) => {
                                // If customized image doesn't load, use placeholder
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80';
                              }}
                            />
                            {isSold ? (
                              <span className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded font-mono tracking-wider">
                                SOLD OUT
                              </span>
                            ) : (
                              <span className={`absolute top-2 right-2 w-4 h-4 border flex items-center justify-center p-0.5 rounded-xs bg-white ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                              </span>
                            )}
                          </div>

                          {/* Title & price */}
                          <div className="p-3 text-left space-y-1">
                            <div className={`font-bold text-xs line-clamp-1 transition-colors ${isSold ? 'text-charcoal/40 line-through' : 'text-charcoal group-hover:text-saffron'}`}>
                              {item.name}
                            </div>
                            <p className="text-[10px] text-charcoal/50 line-clamp-1 leading-tight">{item.description}</p>
                          </div>
                        </div>

                        <div className="p-3 pt-0 flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-charcoal">₹{item.price}</span>
                          {isSold ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                adminStore.toggleSoldOut(item.id);
                                syncAllData();
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-black uppercase px-2 py-1 rounded cursor-pointer transition-all shadow-xs"
                            >
                              Restore
                            </button>
                          ) : (
                            <span className="bg-saffron/10 text-saffron text-[9px] font-black uppercase px-2 py-0.5 rounded">
                              Add +
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* Right Column: POS Cart & Checkout */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-white rounded-3xl border border-charcoal/10 p-5 shadow-xs space-y-5 text-left flex flex-col justify-between min-h-[600px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-charcoal/5 pb-3">
                    <h3 className="font-display font-black text-lg text-charcoal flex items-center gap-1.5">
                      <span>🧾 Active Ticket</span>
                      {posCart.length > 0 && (
                        <span className="bg-saffron text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {posCart.reduce((sum, c) => sum + c.qty, 0)} items
                        </span>
                      )}
                    </h3>
                    {posCart.length > 0 && (
                      <button
                        onClick={() => setPosCart([])}
                        className="text-[10px] text-red-500 font-bold uppercase tracking-wider hover:underline cursor-pointer"
                      >
                        Clear Ticket
                      </button>
                    )}
                  </div>

                  {/* Cart Items List */}
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {posCart.length === 0 ? (
                      <div className="text-center py-16 text-charcoal/30 text-xs">
                        Add items from left catalog to start billing.
                      </div>
                    ) : (
                      posCart.map(c => (
                        <div key={c.item.id} className="bg-cream/15 p-3 rounded-2xl border border-charcoal/5 text-xs space-y-2">
                          <div className="flex justify-between items-start font-bold">
                            <span className="text-charcoal pr-3 line-clamp-1">{c.item.name}</span>
                            <span className="font-mono">₹{c.item.price * c.qty}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            {/* Note input */}
                            <input
                              type="text"
                              placeholder="Add KOT Chef Note (e.g. no onion, extra spicy)"
                              value={c.note}
                              onChange={(e) => setPosCart(prev => prev.map(x => x.item.id === c.item.id ? { ...x, note: e.target.value } : x))}
                              className="bg-white border border-charcoal/10 rounded-lg px-2 py-1 text-[9px] w-36 focus:outline-none"
                            />

                            {/* Qty selectors */}
                            <div className="flex items-center bg-white border border-charcoal/10 rounded-xl p-0.5 font-bold">
                              <button
                                onClick={() => posUpdateQty(c.item.id, c.qty - 1)}
                                className="w-5 h-5 flex items-center justify-center text-charcoal hover:bg-charcoal/5 rounded-lg text-[10px]"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-mono text-[10px]">{c.qty}</span>
                              <button
                                onClick={() => posUpdateQty(c.item.id, c.qty + 1)}
                                className="w-5 h-5 flex items-center justify-center text-charcoal hover:bg-charcoal/5 rounded-lg text-[10px]"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Customer Checkout Panel */}
                <div className="space-y-4 border-t border-charcoal/5 pt-4">
                  
                  {/* Order Options Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {(['dine-in', 'takeaway', 'delivery'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setPosOrderType(type)}
                        className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                          posOrderType === type
                            ? 'bg-charcoal text-white border-charcoal'
                            : 'bg-white text-charcoal/60 border-charcoal/10 hover:bg-cream/10'
                        }`}
                      >
                        {type === 'dine-in' ? '🍽️ Dine-in' : type === 'takeaway' ? '🛍️ Takeaway' : '🛵 Delivery'}
                      </button>
                    ))}
                  </div>

                  {/* Customer Inputs */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {posOrderType === 'dine-in' ? (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 font-mono ml-0.5">Table No.</label>
                        <input
                          type="text"
                          placeholder="e.g. 4"
                          value={posTableNo}
                          onChange={(e) => setPosTableNo(e.target.value)}
                          className="w-full bg-cream/10 border border-charcoal/10 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 font-mono ml-0.5">Customer Name</label>
                        <input
                          type="text"
                          placeholder="Walk-in Customer"
                          value={posCustomerName}
                          onChange={(e) => setPosCustomerName(e.target.value)}
                          className="w-full bg-cream/10 border border-charcoal/10 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 font-mono ml-0.5">Payment Method</label>
                      <select
                        value={posPaymentMethod}
                        onChange={(e) => setPosPaymentMethod(e.target.value as any)}
                        className="w-full bg-cream/10 border border-charcoal/10 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                      >
                        <option value="cash">💵 Cash / Collect</option>
                        <option value="upi">📱 UPI Payment</option>
                        {posOrderType === 'delivery' && <option value="cod">🛵 Cash on Delivery</option>}
                      </select>
                    </div>
                  </div>

                  {/* Pricing Calculations & Discount */}
                  <div className="bg-cream/10 border border-charcoal/5 rounded-2xl p-4 space-y-2.5 font-mono text-[11px]">
                    <div className="flex justify-between text-charcoal/60">
                      <span>Subtotal:</span>
                      <span>₹{posSubtotal}</span>
                    </div>

                    <div className="flex justify-between items-center text-charcoal/60">
                      <span>Discount (₹):</span>
                      <input
                        type="number"
                        min="0"
                        max={posSubtotal}
                        value={posDiscount || ''}
                        onChange={(e) => setPosDiscount(Math.min(posSubtotal, Number(e.target.value) || 0))}
                        placeholder="0"
                        className="bg-white border border-charcoal/10 rounded-lg px-2 py-0.5 text-right w-16 text-[10px] font-bold font-mono focus:outline-none"
                      />
                    </div>

                    {settings.gstEnabled && (
                      <div className="flex justify-between text-charcoal/60">
                        <span>GST ({settings.cgstRate + settings.sgstRate}%):</span>
                        <span>+₹{posGstAmount}</span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-charcoal/10 pt-2 font-bold text-sm text-saffron">
                      <span>Total Invoice:</span>
                      <span>₹{posTotal}</span>
                    </div>
                  </div>

                  {/* Place Order & Print Buttons */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handlePlacePosOrder}
                      disabled={posCart.length === 0}
                      className={`py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                        posCart.length === 0
                          ? 'bg-charcoal/10 text-charcoal/30 cursor-not-allowed shadow-none'
                          : 'bg-saffron text-white hover:bg-saffron/90'
                      }`}
                    >
                      <span>⚡ Save Order Only</span>
                    </button>

                    {/* Print KOT Button */}
                    <button
                      onClick={async () => {
                        if (posCart.length === 0) return;
                        try {
                          const order = await adminStore.addOrder({
                            customerName: posCustomerName || (posOrderType === 'dine-in' ? `Table ${posTableNo || '?'}` : 'Walk-in'),
                            customerPhone: '',
                            customerAddress: posOrderType === 'dine-in' ? `Table ${posTableNo || '?'}` : posOrderType === 'takeaway' ? 'Takeaway' : 'Counter Delivery',
                            deliveryType: posOrderType === 'delivery' ? 'delivery' : 'pickup',
                            tableNumber: posTableNo,
                            paymentMethod: posPaymentMethod === 'cash' ? 'cod' : 'upi',
                            subtotal: posSubtotal,
                            discount: posDiscount,
                            deliveryFee: 0,
                            total: posTotal,
                            source: 'pos',
                            items: posCart.map(c => ({
                              menuItem: c.item,
                              quantity: c.qty,
                              selectedSpice: c.item.spiceLevel,
                              specialInstructions: c.note
                            }))
                          });
                          setPosOrderPlaced(order);
                          setPrintingOrder(order);
                          setPrintType('kot');
                          sessionStorage.removeItem('pos_cart_draft');
                          setPosCart([]);
                          setPosCustomerName('');
                          setPosTableNo('');
                          setPosDiscount(0);
                        } catch (err) {
                          alert('Failed to place order. Please try again.');
                          console.error('POS KOT addOrder error:', err);
                        }
                      }}
                      disabled={posCart.length === 0}
                      className={`py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                        posCart.length === 0
                          ? 'bg-charcoal/10 text-charcoal/30 cursor-not-allowed shadow-none'
                          : 'bg-emerald-700 text-white hover:bg-emerald-800'
                      }`}
                    >
                      <Printer className="w-4 h-4" />
                      <span>🍳 Print KOT</span>
                    </button>

                    {/* Print Bill Button */}
                    <button
                      onClick={async () => {
                        if (posCart.length === 0) return;
                        try {
                          const order = await adminStore.addOrder({
                            customerName: posCustomerName || (posOrderType === 'dine-in' ? `Table ${posTableNo || '?'}` : 'Walk-in'),
                            customerPhone: '',
                            customerAddress: posOrderType === 'dine-in' ? `Table ${posTableNo || '?'}` : posOrderType === 'takeaway' ? 'Takeaway' : 'Counter Delivery',
                            deliveryType: posOrderType === 'delivery' ? 'delivery' : 'pickup',
                            tableNumber: posTableNo,
                            paymentMethod: posPaymentMethod === 'cash' ? 'cod' : 'upi',
                            subtotal: posSubtotal,
                            discount: posDiscount,
                            deliveryFee: 0,
                            total: posTotal,
                            source: 'pos',
                            items: posCart.map(c => ({
                              menuItem: c.item,
                              quantity: c.qty,
                              selectedSpice: c.item.spiceLevel,
                              specialInstructions: c.note
                            }))
                          });
                          setPosOrderPlaced(order);
                          setPrintingOrder(order);
                          setPrintType('bill');
                          sessionStorage.removeItem('pos_cart_draft');
                          setPosCart([]);
                          setPosCustomerName('');
                          setPosTableNo('');
                          setPosDiscount(0);
                        } catch (err) {
                          alert('Failed to place order. Please try again.');
                          console.error('POS Print addOrder error:', err);
                        }
                      }}
                      disabled={posCart.length === 0}
                      className={`py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                        posCart.length === 0
                          ? 'bg-charcoal/10 text-charcoal/30 cursor-not-allowed shadow-none'
                          : 'bg-charcoal text-white hover:bg-charcoal/90'
                      }`}
                    >
                      <Printer className="w-4 h-4" />
                      <span>🧾 Print Bill</span>
                    </button>
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

        {/* --- TAB 2: MENU MANAGEMENT --- */}
        {activeTab === 'menu' && (
          <div className="space-y-6" id="panel-menu">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="font-display font-black text-2xl text-charcoal flex items-center gap-2">
                  🍔 Menu Catalog Manager
                  <span className="text-xs bg-saffron/10 text-saffron font-bold px-2.5 py-1 rounded-full">
                    {menuItems.length} Total Dishes
                  </span>
                  <span className="text-xs bg-red-100 text-red-600 font-bold px-2.5 py-1 rounded-full">
                    {soldOutIds.length} Sold Out
                  </span>
                </h2>
                <p className="text-xs text-charcoal/50">Add new delicacies, modify pricing, delete dishes, or toggle real-time live availability.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Category selector */}
                <div className="flex items-center space-x-2 bg-white p-1 rounded-2xl border border-charcoal/5 shadow-xs flex-1 md:flex-none">
                  <select
                    value={menuCategoryFilter}
                    onChange={(e) => setMenuCategoryFilter(e.target.value)}
                    className="bg-cream/40 text-charcoal text-xs font-bold px-3 py-2 rounded-xl border-none focus:outline-none w-full capitalize"
                  >
                    <option value="all">All Categories</option>
                    {uniqueCategories.filter(c => c !== 'all').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Add Menu Item Button */}
                <button
                  type="button"
                  onClick={handleOpenAddMenu}
                  className="bg-saffron hover:bg-saffron/90 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-md shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Dish</span>
                </button>
              </div>
            </div>

            {/* Menu Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-charcoal/40 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search catalog by dish name or category..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="w-full bg-white border border-charcoal/10 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron"
              />
            </div>

            {/* Menu Table/Grid */}
            <div className="bg-white rounded-3xl border border-charcoal/10 overflow-hidden shadow-sm">
              <div className="p-4 bg-charcoal/5 border-b border-charcoal/10 grid grid-cols-12 text-xs font-bold text-charcoal/60 uppercase font-mono">
                <div className="col-span-5 md:col-span-6">Dish Name & Description</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2">Availability</div>
                <div className="col-span-3 md:col-span-2 text-right pr-2">Actions</div>
              </div>

              <div className="divide-y divide-charcoal/5 max-h-[550px] overflow-y-auto">
                {filteredMenuItems.length === 0 ? (
                  <div className="p-8 text-center text-xs text-charcoal/40">No menu items matches search query</div>
                ) : (
                  filteredMenuItems.map((item) => {
                    const isSoldOut = soldOutIds.includes(item.id);
                    return (
                      <div key={item.id} className="p-4 grid grid-cols-12 items-center text-xs">
                        <div className="col-span-5 md:col-span-6 pr-3 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`w-3.5 h-3.5 border flex items-center justify-center p-0.5 rounded-xs ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                            </span>
                            <span className="font-bold text-charcoal text-sm">{item.name}</span>
                            <span className="bg-cream text-charcoal/50 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded">
                              {item.category}
                            </span>
                            {item.badge && (
                              <span className="bg-saffron/10 text-saffron text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded font-mono">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-charcoal/50 line-clamp-1">{item.description || 'Our signature authentic preparation'}</p>
                        </div>

                        <div className="col-span-2 font-mono font-bold text-charcoal text-sm">
                          ₹{item.price}
                        </div>

                        <div className="col-span-2">
                          <button
                            type="button"
                            onClick={() => {
                              adminStore.toggleSoldOut(item.id);
                              syncAllData();
                            }}
                            className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs ${
                              isSoldOut 
                                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                            }`}
                          >
                            {isSoldOut ? 'Sold Out 🔴' : 'Available 🟢'}
                          </button>
                        </div>

                        <div className="col-span-3 md:col-span-2 flex items-center justify-end gap-2 pr-1">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditMenu(item)}
                            title="Edit Price & Details"
                            className="p-2 rounded-lg text-charcoal/60 hover:bg-charcoal/5 hover:text-charcoal transition-all cursor-pointer"
                          >
                            <Edit className="w-4 h-4" id={`btn-edit-${item.id}`} />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteMenuItem(item.id)}
                            title="Delete Dish"
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" id={`btn-delete-${item.id}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: TABLE RESERVATIONS --- */}
        {activeTab === 'reservations' && (
          <div className="space-y-6" id="panel-reservations">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="font-display font-black text-2xl text-charcoal flex items-center gap-2">
                  📅 Table Bookings Guest List
                  <span className="text-xs bg-saffron/10 text-saffron font-bold px-2.5 py-1 rounded-full">
                    {reservations.filter(r => r.status === 'pending').length} Pending
                  </span>
                </h2>
                <p className="text-xs text-charcoal/50">Manage incoming instant seating requests and capacities.</p>
              </div>

              {/* Date Filter selector */}
              <div className="flex items-center space-x-3 bg-white p-2.5 rounded-2xl border border-charcoal/5 shadow-xs">
                <span className="text-xs font-bold text-charcoal/60 font-mono">Select Date:</span>
                <input
                  type="date"
                  value={resDateFilter}
                  onChange={(e) => setResDateFilter(e.target.value)}
                  className="bg-cream/20 text-charcoal text-xs font-bold p-1 rounded focus:outline-none"
                />
              </div>
            </div>

            {/* Seating capacities status alerts */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-3xl flex items-start gap-3.5 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-extrabold uppercase font-mono block">Catering Safety Safeguard System:</span>
                <p className="leading-relaxed">
                  Tables are capped automatically at <strong>8 guests</strong> for instant counter seats. If groups exceed 8, they are routed to submit celebrations enquiries instead. Please use the Enquiry Inbox panel to view large private meets!
                </p>
              </div>
            </div>

            {/* Seating Slots grid */}
            <div className="bg-white rounded-3xl border border-charcoal/10 overflow-hidden shadow-sm">
              <div className="p-4 bg-charcoal/5 border-b border-charcoal/10 flex items-center justify-between text-xs font-bold text-charcoal/60 uppercase font-mono">
                <span>Reservation Slots ({resDateFilter})</span>
              </div>

              <div className="divide-y divide-charcoal/5">
                {filteredReservations.length === 0 ? (
                  <div className="p-12 text-center text-xs text-charcoal/40">No table bookings requested for {resDateFilter}</div>
                ) : (
                  filteredReservations.map((res) => (
                    <div key={res.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs">
                      
                      {/* Guest Details */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-charcoal/5 text-charcoal font-mono font-bold px-2 py-0.5 rounded text-[10px]">{res.id}</span>
                          <h4 className="font-display font-bold text-sm text-charcoal">{res.fullName}</h4>
                          <span className="text-[10px] text-charcoal/40 font-bold">({res.partySize} Guests)</span>
                        </div>
                        <div className="space-y-0.5 text-[11px] text-charcoal/60">
                          <p className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-charcoal/30" /> {res.phone}</p>
                          <p className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-charcoal/30" /> Seat Slot: <span className="font-bold text-charcoal">{res.timeSlot}</span></p>
                          {res.specialRequests && <p className="text-red-700 italic">"Instructions: {res.specialRequests}"</p>}
                        </div>
                      </div>

                      {/* Seat Slot Controls */}
                      <div className="flex items-center gap-2">
                        {res.status === 'pending' ? (
                          <>
                            <button
                              onClick={async () => {
                                await adminStore.updateReservationStatus(res.id, 'accepted');
                                syncAllData();
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                            >
                              Accept Seat
                            </button>
                            <button
                              onClick={async () => {
                                await adminStore.updateReservationStatus(res.id, 'declined');
                                syncAllData();
                              }}
                              className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-red-100"
                            >
                              Decline Seat
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                              res.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {res.status === 'accepted' ? '🟢 Accepted' : '🔴 Declined'}
                            </span>
                            
                            <button
                              onClick={() => {
                                adminStore.updateReservationStatus(res.id, 'pending');
                                syncAllData();
                              }}
                              className="text-charcoal/40 hover:text-charcoal p-1 rounded"
                              title="Reset state"
                            >
                              <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 4: CELEBRATION ENQUIRIES INBOX --- */}
        {activeTab === 'celebrations' && (
          <div className="space-y-6" id="panel-celebrations">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="font-display font-black text-2xl text-charcoal flex items-center gap-2">
                  💌 Private Banquet Enquiry Inbox
                  <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-full border border-indigo-200">
                    {celebrations.filter(e => e.status === 'new').length} New Enquiries
                  </span>
                </h2>
                <p className="text-xs text-charcoal/50">Private caterings, anniversaries, NTPC office corporate meets with 9+ guest setups.</p>
              </div>

              {/* Status Filters toggle */}
              <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-2xl border border-charcoal/5 shadow-xs">
                {(['all', 'new', 'contacted', 'confirmed', 'closed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setEnquiryStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      enquiryStatusFilter === st 
                        ? 'bg-charcoal text-white shadow-sm' 
                        : 'text-charcoal/60 hover:bg-charcoal/5 hover:text-charcoal'
                    }`}
                  >
                    {st === 'all' ? 'All' : st === 'new' ? '🔴 New' : st === 'contacted' ? '🟡 Contacted' : st === 'confirmed' ? '🟢 Confirmed' : '⚪ Closed'}
                  </button>
                ))}
              </div>
            </div>

            {/* Enquiries listings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCelebrations.length === 0 ? (
                <div className="col-span-2 bg-white border border-charcoal/10 rounded-3xl p-12 text-center text-xs text-charcoal/40">
                  No private celebration enquiries match this filter
                </div>
              ) : (
                filteredCelebrations.map((enq) => (
                  <div key={enq.id} className="bg-white rounded-3xl border border-charcoal/10 p-5 shadow-sm space-y-4 text-xs">
                    
                    {/* Header: Name and status */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-indigo-50 text-indigo-800 font-mono font-bold px-2 py-0.5 rounded text-[10px]">{enq.id}</span>
                          <h4 className="font-display font-bold text-sm text-charcoal">{enq.fullName}</h4>
                        </div>
                        <p className="flex items-center gap-1 text-[11px] text-charcoal/60"><Phone className="w-3.5 h-3.5 text-charcoal/30" /> {enq.phone}</p>
                      </div>

                      <select
                        value={enq.status}
                        onChange={async (e) => {
                          await adminStore.updateCelebrationStatus(enq.id, e.target.value as any);
                          syncAllData();
                        }}
                        className="bg-cream/40 text-charcoal text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-charcoal/10 focus:outline-none"
                      >
                        <option value="new">🔴 New</option>
                        <option value="contacted">🟡 Contacted</option>
                        <option value="confirmed">🟢 Confirmed</option>
                        <option value="closed">⚪ Closed</option>
                      </select>
                    </div>

                    {/* Banquet Criteria Requirements */}
                    <div className="bg-cream/15 p-3.5 rounded-2xl border border-charcoal/5 space-y-2 leading-relaxed">
                      <div className="grid grid-cols-2 gap-3 text-[11px] border-b border-charcoal/5 pb-2">
                        <p>🗓️ <strong>Date:</strong> {enq.eventDate}</p>
                        <p>👥 <strong>Guests:</strong> {enq.headcount} Pax</p>
                        <p>💰 <strong>Budget:</strong> ₹{enq.budget || 'Open/Custom'}</p>
                        <p>🎈 <strong>Occasion:</strong> <span className="capitalize font-bold text-amber-800">{enq.occasionType}</span></p>
                      </div>
                      
                      {enq.requirements && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 font-mono block">Requirements Details</span>
                          <p className="text-charcoal/80 font-normal">{enq.requirements}</p>
                        </div>
                      )}
                    </div>

                    {/* Enquiry Notes CRM tool */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 font-mono block">Enquiry Sales Notes (CRM)</span>
                      <textarea
                        defaultValue={enq.notes || ''}
                        onBlur={async (e) => {
                          await adminStore.updateCelebrationNotes(enq.id, e.target.value);
                          syncAllData();
                        }}
                        placeholder="Write down details from phone calls, pricing proposals shared, or decoration requirements... Notes are saved instantly on click away!"
                        className="w-full bg-cream/20 text-xs p-3 rounded-xl border border-charcoal/10 focus:outline-none h-20 leading-relaxed font-normal"
                      />
                    </div>

                    {/* Message WhatsApp shortcut */}
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          const text = `*Curry Delight Banquets*\n` +
                            `Namaste ${enq.fullName}! We received your celebration booking request for *${enq.occasionType.toUpperCase()}* on *${enq.eventDate}*.\n\n` +
                            `• *Party Size:* ${enq.headcount} Guests\n` +
                            `• *Estimated Budget:* ₹${enq.budget || 'Custom'}\n\n` +
                            `We would love to share our exclusive premium menu cards, customized table decors, and package deals. Please let us know a convenient time to schedule a quick call!`;
                          window.open(`https://wa.me/${enq.phone.startsWith('91') ? enq.phone : '91' + enq.phone}?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Chat & Propose over WhatsApp</span>
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- TAB 5: DELIVERY BOY ROSTER --- */}
        {activeTab === 'roster' && staffRole === 'owner' && (
          <div className="space-y-6" id="panel-roster">
            <div className="space-y-1">
              <h2 className="font-display font-black text-2xl text-charcoal flex items-center gap-2">
                🛵 Delivery Boy Roster Management
              </h2>
              <p className="text-xs text-charcoal/50">Add or manage delivery riders to assign them to customer orders in the queue.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Add Boy Form */}
              <div className="bg-white rounded-3xl border border-charcoal/10 p-5 shadow-sm text-xs h-fit space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-charcoal/55 block font-mono">Register New Rider</span>
                <form onSubmit={handleAddDeliveryBoy} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-charcoal/60 font-semibold block">Rider Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Kumar"
                      value={newBoyName}
                      onChange={(e) => setNewBoyName(e.target.value)}
                      className="w-full bg-cream/15 border border-charcoal/10 rounded-xl p-2.5 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-charcoal/60 font-semibold block">Phone Number (10 Digit)</label>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      placeholder="e.g. 9123456789"
                      value={newBoyPhone}
                      onChange={(e) => setNewBoyPhone(e.target.value)}
                      className="w-full bg-cream/15 border border-charcoal/10 rounded-xl p-2.5 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-saffron hover:bg-[#d15423] text-white font-bold py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1 shadow transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Rider</span>
                  </button>
                </form>
              </div>

              {/* Roster list */}
              <div className="col-span-2 bg-white rounded-3xl border border-charcoal/10 overflow-hidden shadow-sm h-fit">
                <div className="p-4 bg-charcoal/5 border-b border-charcoal/10 text-xs font-bold text-charcoal/60 uppercase font-mono">
                  Active Roster Boys ({deliveryBoys.length})
                </div>

                <div className="divide-y divide-charcoal/5">
                  {deliveryBoys.map(boy => (
                    <div key={boy.id} className="p-4 flex items-center justify-between text-xs">
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-charcoal text-sm">{boy.name}</span>
                          <span className="bg-emerald-50 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">ID: {boy.id}</span>
                        </div>
                        <p className="flex items-center gap-1 text-[11px] text-charcoal/60"><Phone className="w-3.5 h-3.5 text-charcoal/30" /> +91 {boy.phone}</p>
                      </div>

                      <button
                        onClick={() => handleRemoveDeliveryBoy(boy.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-100 transition-colors cursor-pointer"
                        title="Remove boy"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- TAB 6: BASIC REPORTS & CUSTOMER LOOKUP --- */}
        {activeTab === 'reports' && staffRole === 'owner' && (
          <div className="space-y-6" id="panel-reports">
            <div className="space-y-1">
              <h2 className="font-display font-black text-2xl text-charcoal">
                📊 Sales Analytics & Customer Lookup Records
              </h2>
              <p className="text-xs text-charcoal/50">Daily revenue reports and historical customer records search.</p>
            </div>

            {/* Micro dashboards cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className="bg-white rounded-3xl border border-charcoal/10 p-5 shadow-xs space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 font-mono block">Today's Revenue</span>
                <p className="text-3xl font-display font-black text-saffron">₹{analytics.todayRevenue}</p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Only delivered count counted</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-charcoal/10 p-5 shadow-xs space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 font-mono block">Cash (COD) Share</span>
                <p className="text-3xl font-display font-black text-charcoal">₹{analytics.codRevenue}</p>
                <span className="text-[10px] text-charcoal/40 font-bold">Today's on-delivery cash</span>
              </div>

              <div className="bg-white rounded-3xl border border-charcoal/10 p-5 shadow-xs space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 font-mono block">Prepaid UPI Share</span>
                <p className="text-3xl font-display font-black text-charcoal">₹{analytics.upiRevenue}</p>
                <span className="text-[10px] text-charcoal/40 font-bold">Settled via customer deep link</span>
              </div>

              <div className="bg-white rounded-3xl border border-charcoal/10 p-5 shadow-xs space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 font-mono block">Order Conversion</span>
                <p className="text-3xl font-display font-black text-charcoal">{analytics.todayDeliveredCount} / {analytics.todayCount}</p>
                <span className="text-[10px] text-charcoal/40 font-bold">Delivered vs placed orders</span>
              </div>

            </div>

            {/* Top dishes bar & customer search */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Top dishes chart */}
              <div className="md:col-span-5 bg-white rounded-3xl border border-charcoal/10 p-5 shadow-sm space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-charcoal/55 block font-mono">Today's Top Dishes</span>
                <div className="space-y-3.5">
                  {analytics.topSelling.length === 0 ? (
                    <div className="text-xs text-charcoal/40 text-center py-6">No dishes sold yet today</div>
                  ) : (
                    analytics.topSelling.map((it, idx) => (
                      <div key={idx} className="space-y-1.5 text-xs">
                        <div className="flex justify-between font-bold">
                          <span>{it.name}</span>
                          <span>{it.count} Sold</span>
                        </div>
                        {/* Custom horizontal slider bar */}
                        <div className="w-full bg-charcoal/5 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-saffron h-full rounded-full" 
                            style={{ width: `${Math.min(100, (it.count / Math.max(...analytics.topSelling.map(x => x.count))) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Customer records look up */}
              <div className="md:col-span-7 bg-white rounded-3xl border border-charcoal/10 p-5 shadow-sm space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-charcoal/55 block font-mono">Customer Records Search (Foundation CRM)</span>
                  <p className="text-[11px] text-charcoal/50">Look up historical customer order count and profiles by phone number.</p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-charcoal/40 absolute left-4 top-3.5" />
                  <input
                    type="tel"
                    placeholder="Enter phone number to search (e.g. 7061591831)..."
                    value={searchPhoneQuery}
                    onChange={(e) => setSearchPhoneQuery(e.target.value)}
                    className="w-full bg-cream/10 border border-charcoal/10 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                  {searchPhoneQuery.trim() === '' ? (
                    <div className="text-center text-xs text-charcoal/40 py-6">Search a customer's phone number above to see history</div>
                  ) : customerPastOrders.length === 0 ? (
                    <div className="text-center text-xs text-charcoal/40 py-6">No historical records found for this customer</div>
                  ) : (
                    customerPastOrders.map((ord, idx) => (
                      <div key={idx} className="bg-cream/15 border border-charcoal/5 p-3.5 rounded-2xl flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-charcoal text-sm">{ord.customerName}</span>
                            <span className="text-[10px] text-charcoal/40 font-bold">({ord.id})</span>
                          </div>
                          <p className="text-[11px] text-charcoal/55 font-normal">Delivered: {ord.items.map(it => `${it.menuItem.name} x${it.quantity}`).join(', ')}</p>
                          <p className="text-[10px] text-charcoal/40 font-mono">{new Date(ord.createdAt).toDateString()}</p>
                        </div>
                        <span className="font-display font-black text-sm text-saffron">₹{ord.total}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- TAB 7: PRICING & GST SETTINGS PANEL --- */}
        {activeTab === 'settings' && staffRole === 'owner' && (
          <form onSubmit={handleSaveSettings} className="space-y-6" id="panel-settings">
            <div className="space-y-1">
              <h2 className="font-display font-black text-2xl text-charcoal flex items-center gap-2">
                ⚙️ Global Settings Control Panel
              </h2>
              <p className="text-xs text-charcoal/50">Manage local taxes, delivery rates, billing options, and promotional offers.</p>
            </div>

            <div className="bg-white rounded-3xl border border-charcoal/10 p-6 md:p-8 shadow-sm space-y-6">
              
              {/* GST Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-charcoal/5">
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">GST Billing Schema Toggle</label>
                  <p className="text-[11px] text-charcoal/50 leading-relaxed font-normal">
                    Turn on tax-complaince calculation on customer bills. Consult your CA (Regular vs Composition Scheme) before enabling this feature on live counters!
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, gstEnabled: !prev.gstEnabled }))}
                      className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
                        settings.gstEnabled 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-charcoal/10 text-charcoal/60'
                      }`}
                    >
                      GST Status: {settings.gstEnabled ? 'ENABLED' : 'DISABLED (Recommended)'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-charcoal">GSTIN Number</label>
                    <input
                      type="text"
                      disabled={!settings.gstEnabled}
                      placeholder="e.g. 10AAAAA0000A1Z1"
                      value={settings.gstin}
                      onChange={(e) => setSettings(prev => ({ ...prev, gstin: e.target.value }))}
                      className={`w-full bg-cream/15 border border-charcoal/10 rounded-xl p-3 focus:outline-none text-xs font-semibold ${
                        !settings.gstEnabled ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-charcoal">CGST Rate (%)</label>
                      <input
                        type="number"
                        step="0.05"
                        disabled={!settings.gstEnabled}
                        value={settings.cgstRate}
                        onChange={(e) => setSettings(prev => ({ ...prev, cgstRate: parseFloat(e.target.value) || 0 }))}
                        className={`w-full bg-cream/15 border border-charcoal/10 rounded-xl p-2.5 focus:outline-none font-semibold ${
                          !settings.gstEnabled ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-charcoal">SGST Rate (%)</label>
                      <input
                        type="number"
                        step="0.05"
                        disabled={!settings.gstEnabled}
                        value={settings.sgstRate}
                        onChange={(e) => setSettings(prev => ({ ...prev, sgstRate: parseFloat(e.target.value) || 0 }))}
                        className={`w-full bg-cream/15 border border-charcoal/10 rounded-xl p-2.5 focus:outline-none font-semibold ${
                          !settings.gstEnabled ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Fee Settings */}
              <div className="pb-6 border-b border-charcoal/5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal block">🛵 Delivery Fee Rules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-charcoal/70">Free Delivery Threshold (₹)</label>
                    <input
                      type="number"
                      value={settings.deliveryFeeThreshold}
                      onChange={(e) => setSettings(prev => ({ ...prev, deliveryFeeThreshold: Number(e.target.value) }))}
                      className="w-full border border-charcoal/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5"
                    />
                    <p className="text-[10px] text-charcoal/40">Orders above this get free delivery.</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-charcoal/70">Delivery Fee Amount (₹)</label>
                    <input
                      type="number"
                      value={settings.deliveryFeeAmount}
                      onChange={(e) => setSettings(prev => ({ ...prev, deliveryFeeAmount: Number(e.target.value) }))}
                      className="w-full border border-charcoal/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5"
                    />
                    <p className="text-[10px] text-charcoal/40">Fee applied below the threshold.</p>
                  </div>
                </div>
              </div>

              {/* Promotional Offer */}
              <div className="pb-6 border-b border-charcoal/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal block">🏷️ Promotional Offer</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-bold text-charcoal/70">{settings.offer?.enabled ? '✅ Active' : '⭕ Inactive'}</span>
                    <input
                      type="checkbox"
                      checked={settings.offer?.enabled}
                      onChange={(e) => setSettings(prev => ({ ...prev, offer: { ...prev.offer, enabled: e.target.checked } }))}
                      className="w-5 h-5 rounded accent-saffron cursor-pointer"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-charcoal/70">Coupon Code</label>
                    <input
                      type="text"
                      value={settings.offer?.code}
                      onChange={(e) => setSettings(prev => ({ ...prev, offer: { ...prev.offer, code: e.target.value.toUpperCase() } }))}
                      className="w-full border border-charcoal/15 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-charcoal/70">Discount %</label>
                    <input
                      type="number"
                      value={settings.offer?.discountPercent}
                      onChange={(e) => setSettings(prev => ({ ...prev, offer: { ...prev.offer, discountPercent: Number(e.target.value) } }))}
                      className="w-full border border-charcoal/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-charcoal/70">Minimum Order Amount (₹)</label>
                    <input
                      type="number"
                      value={settings.offer?.minOrder}
                      onChange={(e) => setSettings(prev => ({ ...prev, offer: { ...prev.offer, minOrder: Number(e.target.value) } }))}
                      className="w-full border border-charcoal/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-charcoal/70">Offer Label (shown to customer)</label>
                    <input
                      type="text"
                      value={settings.offer?.label}
                      onChange={(e) => setSettings(prev => ({ ...prev, offer: { ...prev.offer, label: e.target.value } }))}
                      className="w-full border border-charcoal/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5"
                    />
                  </div>
                </div>
              </div>

              {/* Kitchen Buffer Time Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">🚀 Kitchen Buffer Delay (ETA Surcharge)</label>
                  <p className="text-[11px] text-charcoal/50 leading-relaxed font-normal">
                    If the kitchen is busy, input a buffer delay in minutes. This instantly updates the customer-facing checkout page with the revised delivery/takeaway times.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    required
                    min="0"
                    max="180"
                    value={settings.kitchenBufferMinutes || 0}
                    onChange={(e) => setSettings(prev => ({ ...prev, kitchenBufferMinutes: parseInt(e.target.value) || 0 }))}
                    className="w-32 bg-cream/15 border border-charcoal/10 rounded-xl p-3 focus:outline-none font-mono font-bold text-sm"
                  />
                  <span className="text-xs text-charcoal/70 font-bold">Minutes Delay</span>
                </div>
              </div>
              {/* WhatsApp Notification settings */}
              <div className="pb-6 border-b border-charcoal/5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal block">💬 WhatsApp Notifications Number</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-charcoal/70">Phone Number (with Country Code, no + or spaces)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 917061591831"
                      value={settings.whatsappNumber || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, whatsappNumber: e.target.value.replace(/\D/g, '') }))}
                      className="w-full border border-charcoal/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5"
                    />
                    <p className="text-[10px] text-charcoal/40">This is the number online customer orders/reservations are directed to.</p>
                  </div>
                </div>
              </div>

              {/* Kitchen Opening/Closed toggle */}
              <div className="pb-6 border-b border-charcoal/5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal block">🏪 Kitchen Store Status</h3>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 text-left">
                    <p className="text-xs font-bold text-charcoal/70">Online Ordering Availability Switch</p>
                    <p className="text-[11px] text-charcoal/50 leading-relaxed font-normal">
                      Toggle this off to immediately prevent online customers from placing orders (useful for off-hours, holiday closures, or extreme rush periods).
                    </p>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, isKitchenOpen: !prev.isKitchenOpen }))}
                      className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
                        settings.isKitchenOpen 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      KITCHEN STATE: {settings.isKitchenOpen ? 'OPEN (Accepting Orders)' : 'CLOSED (Stopped)'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Database Wipe Action */}
              <div className="pb-6 border-b border-charcoal/5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 block flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Danger Zone
                </h3>
                <p className="text-[11px] text-charcoal/50 leading-relaxed font-normal">
                  Completely wipe all order records from the database. This action is irreversible.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm("ARE YOU SURE? This will delete ALL orders from Firebase!")) {
                      try {
                        const { getFirestore, collection, getDocs, deleteDoc, doc } = await import('firebase/firestore');
                        const { app } = await import('../lib/firebase');
                        const db = getFirestore(app);
                        const snapshot = await getDocs(collection(db, 'orders'));
                        let count = 0;
                        for (const document of snapshot.docs) {
                          await deleteDoc(doc(db, 'orders', document.id));
                          count++;
                        }
                        alert(`Successfully deleted ${count} orders.`);
                      } catch (e: any) {
                        alert("Error wiping orders: " + e.message);
                      }
                    }
                  }}
                  className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Wipe All Orders
                </button>
              </div>

              {/* Save Settings Action Button */}
              <div className="flex justify-end pt-4 border-t border-charcoal/5">
                <button
                  type="submit"
                  className="bg-charcoal hover:bg-charcoal/90 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </button>
              </div>

            </div>
          </form>
        )}

      </main>

      {/* --- PRINT THERMAL RECEIPT MODAL SIMULATOR --- */}
      {printingOrder && printType && (
        <div className="fixed inset-0 z-55 overflow-y-auto bg-charcoal/80 flex items-center justify-center p-4" id="print-simulator-modal">
          <div className="bg-white rounded-3xl border border-charcoal/10 p-5 max-w-sm w-full space-y-6 relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Control headers */}
            <div className="flex items-center justify-between border-b border-charcoal/10 pb-3">
              <div className="space-y-0.5">
                <span className="text-[9px] bg-charcoal/5 border text-charcoal font-black tracking-widest px-2 py-0.5 rounded uppercase font-mono">
                  EZO 58mm Thermal Simulator
                </span>
                <p className="text-[10px] text-charcoal/40 font-semibold leading-none">Paper Roll Width: 58mm (Receipt)</p>
              </div>
              <button 
                onClick={() => {
                  setPrintingOrder(null);
                  setPrintType(null);
                }}
                className="p-1 bg-charcoal/5 hover:bg-charcoal/10 rounded-full cursor-pointer"
              >
                <XCircle className="w-5 h-5 text-charcoal/50" />
              </button>
            </div>

            {/* --- ACTUAL PRINTABLE EZO 58mm AREA (Class "print-receipt-container" for print media target) --- */}
            <pre 
              className="bg-cream/10 border-2 border-charcoal/25 p-4 mx-auto rounded font-mono text-[11px] text-black leading-tight w-[260px] shadow-inner select-all whitespace-pre text-left"
              id="printable-thermal-receipt"
              style={{ fontFamily: 'monospace', width: '260px' }}
            >
              {printType === 'kot' ? generateKOTText(printingOrder) : generateBillText(printingOrder, settings)}
            </pre>

            {printType === 'bill' && (
              <div className="flex flex-col items-center pt-3 border-t border-dashed border-charcoal/10 bg-cream/10 p-4 mx-auto rounded border-2 border-charcoal/25 w-[260px] border-t-0 -mt-6">
                <span className="text-[9px] font-bold text-charcoal/50 uppercase tracking-widest font-mono mb-1.5">Scan To Pay (UPI QR)</span>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=bharatpe.9c0q0m0j31267560@unitype&pn=CurryDelight&am=${printingOrder.total}&cu=INR`)}`} 
                  alt="UPI QR Code" 
                  className="w-24 h-24 border border-charcoal/10 p-1.5 rounded-lg bg-white shadow-xs"
                />
              </div>
            )}

            {/* Print Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => { handleBrowserPrint(); playBillPrintedSound(); }}
                className="w-full bg-charcoal hover:bg-charcoal/90 text-white font-bold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>🖨️ Print via Bluetooth / Browser</span>
              </button>

              <button
                onClick={() => {
                  setPrintingOrder(null);
                  setPrintType(null);
                }}
                className="w-full bg-charcoal/5 hover:bg-charcoal/10 text-charcoal font-bold py-2.5 rounded-xl transition-all cursor-pointer text-xs"
              >
                Cancel Print View
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- ADD / EDIT MENU ITEM MODAL --- */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/80 flex items-center justify-center p-4 backdrop-blur-xs" id="menu-item-modal">
          <div className="bg-white rounded-3xl border border-charcoal/10 p-6 max-w-md w-full space-y-6 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-charcoal/5 pb-4">
              <h3 className="font-display font-black text-lg text-charcoal flex items-center gap-2">
                {menuModalType === 'add' ? '➕ Add New Delight' : '📝 Modify Dish Details'}
              </h3>
              <button 
                onClick={() => setIsMenuModalOpen(false)}
                className="p-1 hover:bg-charcoal/5 rounded-full cursor-pointer transition-all"
                id="btn-close-menu-modal"
              >
                <XCircle className="w-5 h-5 text-charcoal/40 hover:text-charcoal" />
              </button>
            </div>

            <form onSubmit={handleSaveMenuItemSubmit} className="space-y-4">
              {/* Dish Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 ml-1">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mutton Handi / Paneer Makhani"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-charcoal/15 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5 font-sans"
                  id="menu-form-name"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 ml-1">Short Description</label>
                <textarea
                  placeholder="Describe key ingredients, preparation styles, allergens, serving size..."
                  value={menuForm.description}
                  onChange={(e) => setMenuForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full border border-charcoal/15 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5 font-sans resize-none"
                  id="menu-form-desc"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 ml-1">Category</label>
                  <select
                    value={menuForm.category}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-charcoal/15 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5 font-semibold"
                    id="menu-form-category"
                  >
                    <option value="Heritage Thalis">Heritage Thalis</option>
                    <option value="Champaran Specialties">Champaran Specialties</option>
                    <option value="Tandoor & Starters">Tandoor & Starters</option>
                    <option value="Breads & Rice">Breads & Rice</option>
                    <option value="Desserts & Beverages">Desserts & Beverages</option>
                  </select>
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 ml-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="150"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-charcoal/15 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5 font-mono font-bold"
                    id="menu-form-price"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Diet Type (Veg / Non-Veg) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 ml-1">Diet Classification</label>
                  <div className="flex bg-charcoal/5 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setMenuForm(prev => ({ ...prev, isVeg: true }))}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${menuForm.isVeg ? 'bg-white text-green-700 shadow-xs' : 'text-charcoal/50'}`}
                    >
                      🟢 Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setMenuForm(prev => ({ ...prev, isVeg: false }))}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${!menuForm.isVeg ? 'bg-white text-red-700 shadow-xs' : 'text-charcoal/50'}`}
                    >
                      🔴 Non-Veg
                    </button>
                  </div>
                </div>

                {/* Spice Level - hidden for non-spicy categories */}
                {!NON_SPICY_CATEGORIES.includes(menuForm.category) ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 ml-1">Spiciness Heat</label>
                    <select
                      value={menuForm.spiceLevel ?? 'medium'}
                      onChange={(e) => setMenuForm(prev => ({ ...prev, spiceLevel: e.target.value as 'mild' | 'medium' | 'hot' }))}
                      className="w-full border border-charcoal/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5 font-semibold"
                      id="menu-form-spice"
                    >
                      <option value="mild">🌶️ Mild</option>
                      <option value="medium">🌶️🌶️ Medium</option>
                      <option value="hot">🌶️🌶️🌶️ Bihari Spicy</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 ml-1">Spiciness Heat</label>
                    <div className="border border-charcoal/10 rounded-xl px-3 py-2 text-xs text-charcoal/40 bg-cream/10 font-semibold italic">
                      N/A — Not applicable for this category
                    </div>
                  </div>
                )}
              </div>

              {/* Per-Item GST Rate + Dish Image */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Per-item GST Rate */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 ml-1">GST Rate % <span className="text-charcoal/30 normal-case font-normal">(optional, overrides global)</span></label>
                  <input
                    type="number"
                    min="0"
                    max="28"
                    step="0.5"
                    placeholder={`Default (${settings.cgstRate + settings.sgstRate}%)`}
                    value={menuForm.gstRate ?? ''}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, gstRate: e.target.value !== '' ? parseFloat(e.target.value) : undefined }))}
                    className="w-full border border-charcoal/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5 font-mono font-bold"
                    id="menu-form-gst-rate"
                  />
                </div>
                {/* Price (duplicate col 2 — this is the existing Price col; no change needed) */}
                <div />
              </div>

              {/* Dish Image */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 ml-1">Dish Image URL</label>
                {menuForm.image && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-charcoal/10 shadow-inner">
                    <img src={menuForm.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <input
                  type="text"
                  placeholder="https://your-image-url.jpg"
                  value={menuForm.image}
                  onChange={(e) => setMenuForm(prev => ({ ...prev, image: e.target.value }))}
                  className="w-full border border-charcoal/15 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5 font-sans"
                  id="menu-form-image-url"
                />
              </div>

              {/* Promotional Badge */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 ml-1">Promotional Tag/Badge (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Best Seller / Chef Special / BOGO"
                  value={menuForm.badge}
                  onChange={(e) => setMenuForm(prev => ({ ...prev, badge: e.target.value }))}
                  className="w-full border border-charcoal/15 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5 font-sans"
                  id="menu-form-badge"
                />
              </div>


              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-charcoal/5">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="flex-1 border border-charcoal/10 hover:bg-charcoal/5 text-charcoal font-bold text-xs uppercase tracking-wider py-3 rounded-xl cursor-pointer transition-all text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-saffron hover:bg-saffron/90 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
                  id="menu-form-submit-btn"
                >
                  <Save className="w-4 h-4" />
                  <span>{menuModalType === 'add' ? 'Create Dish' : 'Apply Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
