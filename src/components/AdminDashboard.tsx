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
  SiteContent, GalleryImage,
  playNewOrderSound
} from '../lib/adminStore';
import { MenuItem } from '../types';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface AdminDashboardProps {
  navigateTo: (path: string) => void;
}

export default function AdminDashboard({ navigateTo }: AdminDashboardProps) {
  // --- Active Tab ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'menu' | 'reservations' | 'celebrations' | 'roster' | 'reports' | 'settings' | 'sitecontent'>('dashboard');
  
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
  const [siteContent, setSiteContent] = useState<SiteContent>(adminStore.getSiteContent());
  const [uploadingImage, setUploadingImage] = useState<string | null>(null); // tracks which image slot is uploading

  // Upload image to Firebase Storage and return download URL
  const uploadImage = async (file: File, slot: string): Promise<string> => {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File is too large. Maximum size is 5MB.');
    }
    setUploadingImage(slot);
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storageRef = ref(storage, `site-images/${slot}-${Date.now()}-${sanitizedName}`);
      const snapshot = await uploadBytesResumable(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (err: any) {
      if (err.code === 'storage/unauthorized') {
        throw new Error('Permission denied. Please go to Firebase Console → Storage → Rules and set:\nallow read, write: if request.auth != null;');
      } else if (err.code === 'storage/unknown') {
        throw new Error('Storage error. Make sure Firebase Storage is enabled in your Firebase project.');
      }
      throw err;
    } finally {
      setUploadingImage(null);
    }
  };

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
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    category: 'Heritage Thalis',
    price: 150,
    isVeg: true,
    spiceLevel: 'medium' as 'mild' | 'medium' | 'hot',
    badge: '',
    image: ''
  });

  // --- Load and Sync Data ---
  const syncAllData = () => {
    setOrders(adminStore.getOrders());
    setReservations(adminStore.getReservations());
    setCelebrations(adminStore.getCelebrations());
    setSoldOutIds(adminStore.getSoldOutIds());
    setDeliveryBoys(adminStore.getDeliveryBoys());
    setSettings(adminStore.getSettings());
    setMenuItems(adminStore.getMenuItems());
    setSiteContent(adminStore.getSiteContent());
  };

  useEffect(() => {
    syncAllData();

    // Sync across tabs in real-time
    const handleStorageChange = () => {
      syncAllData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
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

  // --- KOT and Bill Thermal Print triggers ---
  const handleBrowserPrint = async () => {
    if (!printingOrder) return;

    // Try Web Bluetooth first
    const bluetooth = (navigator as any).bluetooth;
    if (bluetooth) {
      try {
        // Request a Bluetooth device with printer service UUID
        const device = await bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '0000ff00-0000-1000-8000-00805f9b34fb']
        });

        const server = await device.gatt!.connect();

        // Try known serial port / printer service UUIDs
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
        const lines: string[] = [];
        lines.push('\x1B\x40'); // Initialize printer (ESC @)
        lines.push('\x1B\x61\x01'); // Center align
        lines.push('\x1B\x21\x30'); // Double height + width
        lines.push('CURRY DELIGHT\n');
        lines.push('\x1B\x21\x00'); // Normal size
        lines.push('Station Road, Kahalgaon\n');
        lines.push('Ph: +91 7061591831\n');
        lines.push('--------------------------------\n');
        lines.push('\x1B\x61\x00'); // Left align
        lines.push(`Order: ${printingOrder.id}\n`);
        lines.push(`Type : ${printingOrder.deliveryType.toUpperCase()}\n`);
        lines.push(`Cust : ${printingOrder.customerName}\n`);
        lines.push(`Ph   : ${printingOrder.customerPhone}\n`);
        if (printingOrder.deliveryType === 'delivery') {
          lines.push(`Addr : ${printingOrder.customerAddress.substring(0, 32)}\n`);
        }
        lines.push('--------------------------------\n');

        printingOrder.items.forEach((it) => {
          lines.push(`${it.menuItem.name.substring(0, 20).padEnd(20)} x${it.quantity}`);
          if (printType === 'bill') {
            lines.push(`  Rs.${(it.menuItem.price * it.quantity).toString().padStart(6)}\n`);
          } else {
            lines.push('\n');
          }
          if (it.selectedSpice) lines.push(`  Spice: ${it.selectedSpice}\n`);
          if (it.specialInstructions) lines.push(`  Note: ${it.specialInstructions}\n`);
        });

        lines.push('--------------------------------\n');

        if (printType === 'bill') {
          lines.push(`Subtotal :  Rs.${printingOrder.subtotal}\n`);
          if (printingOrder.discount > 0) lines.push(`Discount : -Rs.${printingOrder.discount}\n`);
          if (printingOrder.deliveryFee > 0) lines.push(`Delivery : +Rs.${printingOrder.deliveryFee}\n`);
          lines.push('================================\n');
          lines.push('\x1B\x21\x10'); // Bold
          lines.push(`TOTAL    :  Rs.${printingOrder.total}\n`);
          lines.push('\x1B\x21\x00'); // Normal
          lines.push(`Pay Via  : ${printingOrder.paymentMethod.toUpperCase()}\n`);
        } else {
          lines.push('   ** KITCHEN COPY (KOT) **\n');
          lines.push('   No pricing on this slip\n');
        }

        lines.push('\x1B\x61\x01'); // Center
        lines.push('\nThank you! Cook with love.\n');
        lines.push('\x1B\x64\x05'); // Feed 5 lines
        lines.push('\x1D\x56\x41'); // Full cut

        const encoder = new TextEncoder();
        const raw = lines.join('');
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
      image: ''
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
      spiceLevel: item.spiceLevel || 'medium',
      badge: item.badge || '',
      image: item.image || ''
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
        image: menuForm.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=120&h=120',
        imagePrompt: 'Minimalist Indian dish'
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
        ...(menuForm.image ? { image: menuForm.image } : {})
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

  // --- Search / Filter / Report Computations & KDS ---
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
      return matchesStatus;
    });
  }, [orders, orderFilter]);

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
            <div className="w-16 h-16 rounded-full overflow-hidden bg-white border border-charcoal/10 flex items-center justify-center p-1 shadow-sm">
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
          <span>Live Order Queue</span>
          {orders.filter(o => o.status === 'placed').length > 0 && (
            <span className="bg-red-500 text-white font-mono text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
              {orders.filter(o => o.status === 'placed').length}
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

            <button
              onClick={() => setActiveTab('sitecontent')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sitecontent' 
                  ? 'bg-saffron text-white shadow' 
                  : 'text-charcoal/60 hover:bg-charcoal/5 hover:text-charcoal'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>🖼️ Site Content & Offers</span>
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
                <button onClick={() => setActiveTab('sitecontent')} className="bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold text-center cursor-pointer transition-all">
                  🖼️ Site Content
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 1: LIVE ORDER QUEUE --- */}
        {activeTab === 'orders' && (
          <div className="space-y-6" id="panel-orders">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h2 className="font-display font-black text-2xl text-charcoal flex items-center gap-2">
                  📋 Live Order Queue Feed
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                    {orders.filter(o => o.status !== 'delivered').length} Active
                  </span>
                </h2>

                {/* KDS Toggle button */}
                <button
                  type="button"
                  onClick={() => setIsKdsMode(!isKdsMode)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-xs border ${
                    isKdsMode 
                      ? 'bg-charcoal text-white border-charcoal' 
                      : 'bg-saffron/10 text-saffron border-saffron/20 hover:bg-saffron/20'
                  }`}
                  id="btn-kds-toggle"
                >
                  <Clock className={`w-4 h-4 ${isKdsMode ? 'animate-spin' : ''}`} />
                  <span>{isKdsMode ? '🧑‍🍳 Exit Kitchen KDS' : '🧑‍🍳 Kitchen KDS Mode'}</span>
                </button>
              </div>

              {/* Order filters */}
              {!isKdsMode && (
                <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-2xl border border-charcoal/5 shadow-xs">
                  {(['all', 'placed', 'preparing', 'out_for_delivery', 'delivered'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                        orderFilter === st 
                          ? 'bg-saffron text-white shadow-sm' 
                          : 'text-charcoal/60 hover:bg-charcoal/5 hover:text-charcoal'
                      }`}
                    >
                      {st === 'all' ? 'All Orders' : st === 'placed' ? '🔴 Placed' : st === 'preparing' ? '🟡 preparing' : st === 'out_for_delivery' ? '🔵 Out for Delivery' : '🟢 Delivered'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Render Kitchen Display Mode Board if active, else standard orders grid */}
            {isKdsMode ? (
              <div className="space-y-6" id="kds-board">
                <div className="bg-charcoal text-white rounded-3xl p-6 border border-charcoal/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                      <h3 className="font-display font-bold text-lg uppercase tracking-wider text-saffron">Kitchen KDS Active Board</h3>
                    </div>
                    <p className="text-xs text-white/60">Optimized for landscape wall-mounted tablets. Tapping item checkboxes strikes them off. Oldest orders shown first.</p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="bg-white/10 px-4 py-2 rounded-xl text-center">
                      <span className="text-2xl font-black font-mono block text-saffron">{kdsOrders.length}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Prep Queue</span>
                    </div>
                    <div className="bg-white/10 px-4 py-2 rounded-xl text-center">
                      <span className="text-2xl font-black font-mono block text-red-400">
                        {kdsOrders.filter(o => {
                          const elapsed = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000);
                          return elapsed >= 15;
                        }).length}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Late (&gt;15m)</span>
                    </div>
                  </div>
                </div>

                {kdsOrders.length === 0 ? (
                  <div className="bg-charcoal/5 border border-charcoal/15 rounded-3xl p-16 text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                      🍳
                    </div>
                    <h3 className="font-display font-bold text-xl text-charcoal">All Orders Prep-Ready!</h3>
                    <p className="text-xs text-charcoal/50 max-w-sm mx-auto">Take a breath, chef! The live queue is completely cleared. New orders will pop in with alert bells instantly.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {kdsOrders.map((order) => {
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
                          <div className={`p-4 ${isLate ? 'bg-red-50' : 'bg-charcoal/5'} border-b border-charcoal/10`}>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-lg font-black text-charcoal tracking-tight">{order.id.slice(-6)}</span>
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase ${
                                order.deliveryType === 'delivery' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {order.deliveryType === 'delivery' ? '📍 Delivery' : '🏪 Takeaway'}
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
                          <div className="p-5 flex-1 space-y-4">
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
                                        {item.name}
                                      </p>
                                      {item.selectedCustomizations && item.selectedCustomizations.length > 0 && (
                                        <p className="text-[10px] text-charcoal/60 font-mono mt-0.5">
                                          ({item.selectedCustomizations.map(c => `${c.option}`).join(', ')})
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Large Interactive Touch Buttons */}
                          <div className="p-4 border-t border-charcoal/5 bg-cream/10 flex gap-2">
                            {order.status === 'placed' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  adminStore.updateOrderStatus(order.id, 'preparing');
                                  syncAllData();
                                }}
                                className="w-full bg-saffron hover:bg-saffron/90 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl cursor-pointer transition-all shadow-md text-center flex items-center justify-center gap-1.5"
                              >
                                🧑‍🍳 START PREPARING (🔥)
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  adminStore.updateOrderStatus(order.id, 'out_for_delivery');
                                  syncAllData();
                                }}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl cursor-pointer transition-all shadow-md text-center flex items-center justify-center gap-1.5"
                              >
                                ✅ DONE / MARK READY
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <>
                {filteredOrders.length === 0 ? (
                  <div className="bg-white border border-charcoal/10 rounded-3xl p-12 text-center space-y-3">
                    <div className="bg-charcoal/5 text-charcoal/40 p-4 rounded-full inline-flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-charcoal">No orders match this status</h3>
                    <p className="text-xs text-charcoal/50 max-w-sm mx-auto">Whenever a user submits an order via the customer checkout, it will instantly sound an alert and pop up here!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.map((order) => {
                  const isNew = order.status === 'placed';
                  return (
                    <div 
                      key={order.id}
                      className={`bg-white rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                        isNew 
                          ? 'border-red-500 ring-2 ring-red-500/20 shadow-md animate-pulse-light' 
                          : 'border-charcoal/10 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {/* Top Header Card */}
                      <div className="p-5 border-b border-charcoal/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-saffron">{order.id}</span>
                          <span className="text-[10px] text-charcoal/40 font-bold">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>

                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-display font-bold text-base text-charcoal leading-none">{order.customerName}</h4>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded ${
                            order.paymentMethod === 'cod' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {order.paymentMethod === 'cod' ? 'Cash (COD)' : 'Prepaid (UPI)'}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-charcoal/60 leading-tight">
                          <p className="flex items-start gap-1"><Phone className="w-3.5 h-3.5 mt-0.5 shrink-0 text-charcoal/40" /> {order.customerPhone}</p>
                          <p className="flex items-start gap-1"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-charcoal/40" /> <span className="line-clamp-2">{order.customerAddress}</span></p>
                        </div>
                      </div>

                      {/* Middle Body: Items & Customizations */}
                      <div className="p-5 bg-cream/10 flex-grow space-y-3.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-charcoal/40 block font-mono">Items Ordered</span>
                        <div className="space-y-2">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-2xl border border-charcoal/5 text-xs space-y-1">
                              <div className="flex justify-between font-bold">
                                <span>{it.menuItem.name} <span className="text-saffron">x{it.quantity}</span></span>
                                <span className="font-mono font-bold text-charcoal/70">₹{it.menuItem.price * it.quantity}</span>
                              </div>
                              {/* Portions & custom options */}
                              {(it.selectedSpice || it.specialInstructions || it.thaliCustomizations || it.selectedAddons) && (
                                <div className="text-[10px] text-charcoal/55 bg-cream/30 p-2 rounded-xl border border-dashed border-charcoal/5 space-y-0.5 font-normal">
                                  {it.selectedSpice && <p>🔥 Spice: <span className="font-bold capitalize text-amber-800">{it.selectedSpice}</span></p>}
                                  {it.selectedPortion && <p>📦 Portion: <span className="font-bold capitalize">{it.selectedPortion}</span></p>}
                                  {it.selectedAddons && it.selectedAddons.length > 0 && <p>🧀 Addons: <span className="font-semibold">{it.selectedAddons.join(', ')}</span></p>}
                                  {it.thaliCustomizations && (
                                    <div className="space-y-0.5">
                                      {it.thaliCustomizations.currySwap && <p>🍛 Main: {it.thaliCustomizations.currySwap}</p>}
                                      {it.thaliCustomizations.breadSwap && <p>🫓 Bread: {it.thaliCustomizations.breadSwap}</p>}
                                      {it.thaliCustomizations.dessertChoice && <p>🍬 Sweet: {it.thaliCustomizations.dessertChoice}</p>}
                                      {it.thaliCustomizations.extraRice && <p>🍚 Extra Rice Portion Included</p>}
                                    </div>
                                  )}
                                  {it.specialInstructions && <p className="text-red-600 italic">"Instructions: {it.specialInstructions}"</p>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {order.specialInstructions && (
                          <div className="bg-red-50 text-red-900 text-[11px] p-2.5 rounded-xl border border-red-100 flex items-start gap-1.5">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                            <p><strong>Chef Note:</strong> "{order.specialInstructions}"</p>
                          </div>
                        )}
                      </div>

                      {/* Calculations & Status Assignment */}
                      <div className="p-5 border-t border-charcoal/5 bg-white space-y-4">
                        <div className="flex justify-between items-end">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-charcoal/50 uppercase block font-bold font-mono">Grand Total</span>
                            <span className="font-display font-black text-xl text-saffron">₹{order.total}</span>
                          </div>

                          {/* Dynamic status dropdown */}
                          <div className="flex flex-col items-end gap-1">
                            <label className="text-[9px] text-charcoal/40 font-bold uppercase tracking-wider font-mono">STATUS PROGRESS</label>
                            <select
                              value={order.status}
                              onChange={(e) => {
                                adminStore.updateOrderStatus(order.id, e.target.value as any);
                                syncAllData();
                              }}
                              className="bg-cream/40 text-charcoal text-xs font-bold px-3 py-1.5 rounded-xl border border-charcoal/10 focus:outline-none"
                            >
                              <option value="placed">🔴 Placed</option>
                              <option value="preparing">🟡 Preparing</option>
                              <option value="out_for_delivery">🔵 Out For Delivery</option>
                              <option value="delivered">🟢 Delivered</option>
                            </select>
                          </div>
                        </div>

                        {/* Delivery Boy Assignment (if type is delivery) */}
                        {order.deliveryType === 'delivery' && (
                          <div className="space-y-1.5 bg-cream/30 p-3 rounded-2xl border border-charcoal/5">
                            <span className="text-[9px] font-mono uppercase tracking-wider text-charcoal/50 block font-bold">Assign Delivery Rider</span>
                            <select
                              value={order.assignedDeliveryBoyId || ''}
                              onChange={(e) => {
                                adminStore.assignDeliveryBoy(order.id, e.target.value);
                                syncAllData();
                              }}
                              className="w-full bg-white text-charcoal text-xs font-bold px-3 py-2 rounded-xl border border-charcoal/10"
                            >
                              <option value="">-- Choose Rider --</option>
                              {deliveryBoys.map(boy => (
                                <option key={boy.id} value={boy.id}>{boy.name} ({boy.phone})</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Order action grid - Day One features */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button
                            onClick={() => {
                              window.open(getWhatsAppConfirmLink(order), '_blank');
                            }}
                            className="bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-[11px] py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1 shadow-sm cursor-pointer"
                          >
                            <span>WhatsApp Confirm</span>
                          </button>

                          <button
                            onClick={() => {
                              const db = deliveryBoys.find(b => b.id === order.assignedDeliveryBoyId);
                              if (!db) {
                                alert('Please assign a delivery boy from the dropdown first!');
                                return;
                              }
                              window.open(getWhatsAppDeliveryLink(order, db), '_blank');
                            }}
                            disabled={order.deliveryType !== 'delivery'}
                            className={`font-bold text-[11px] py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1 shadow-sm cursor-pointer ${
                              order.deliveryType === 'delivery' 
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                                : 'bg-charcoal/5 text-charcoal/30 cursor-not-allowed'
                            }`}
                          >
                            <span>Dispatch Rider</span>
                          </button>

                          <button
                            onClick={() => {
                              setPrintingOrder(order);
                              setPrintType('kot');
                            }}
                            className="bg-charcoal hover:bg-charcoal/90 text-white font-bold text-[11px] py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print KOT (Kitchen)</span>
                          </button>

                          <button
                            onClick={() => {
                              setPrintingOrder(order);
                              setPrintType('bill');
                            }}
                            className="bg-charcoal hover:bg-charcoal/90 text-white font-bold text-[11px] py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Bill</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
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
                              onClick={() => {
                                adminStore.updateReservationStatus(res.id, 'accepted');
                                syncAllData();
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                            >
                              Accept Seat
                            </button>
                            <button
                              onClick={() => {
                                adminStore.updateReservationStatus(res.id, 'declined');
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
                        onChange={(e) => {
                          adminStore.updateCelebrationStatus(enq.id, e.target.value as any);
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
                        value={enq.notes || ''}
                        onChange={(e) => {
                          adminStore.updateCelebrationNotes(enq.id, e.target.value);
                          syncAllData();
                        }}
                        placeholder="Write down details from phone calls, pricing proposals shared, or decoration requirements... Notes are saved instantly!"
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
                ⚙️ GST & Pricing Control panel
              </h2>
              <p className="text-xs text-charcoal/50">Manage local taxes, delivery rates, and billing options.</p>
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
                      placeholder="e.g. 10AAAAA0000A1Z1 (Blank until CA confirms)"
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

              {/* Delivery Fee Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">Standard Flat Delivery Fee</label>
                  <p className="text-[11px] text-charcoal/50 leading-relaxed font-normal">
                    This flat rate is added as a dedicated delivery surcharge line to all "Home Delivery" type orders under ₹500. Orders above ₹500 continue to get free shipping.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-charcoal text-lg font-mono">₹</span>
                  <input
                    type="number"
                    required
                    value={settings.deliveryFee}
                    onChange={(e) => setSettings(prev => ({ ...prev, deliveryFee: parseInt(e.target.value) || 0 }))}
                    className="w-32 bg-cream/15 border border-charcoal/10 rounded-xl p-3 focus:outline-none font-mono font-bold text-sm"
                  />
                  <span className="text-xs text-charcoal/40 font-bold">Flat Rate</span>
                </div>
              </div>

              {/* Kitchen Buffer Time Input (Automated Delivery ETA Calculation) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-t border-charcoal/5 pt-6">
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
                  {settings.kitchenBufferMinutes > 0 ? (
                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded font-mono font-semibold">
                      ⚠️ busy +{settings.kitchenBufferMinutes}m
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-1 rounded font-mono font-semibold">
                      ⚡ normal
                    </span>
                  )}
                </div>
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

        {/* --- SITE CONTENT & OFFERS TAB --- */}
        {activeTab === 'sitecontent' && (
          <div className="space-y-8" id="panel-sitecontent">
            <div>
              <h2 className="font-display font-black text-2xl text-charcoal">🖼️ Site Content &amp; Offers</h2>
              <p className="text-xs text-charcoal/50 mt-1">Control the website's images, delivery fee, and promotional offers from here. Changes reflect live instantly.</p>
            </div>

            {/* Hero Image */}
            <div className="bg-white border border-charcoal/10 rounded-3xl p-6 space-y-4">
              <h3 className="font-display font-bold text-lg text-charcoal">🏠 Hero Section Image</h3>
              <p className="text-xs text-charcoal/50">This is the large restaurant interior image shown in the top section of the homepage.</p>
              <div className="flex gap-4 items-start">
                {siteContent.heroImageUrl && (
                  <img src={siteContent.heroImageUrl} alt="Hero Preview" className="w-32 h-24 object-cover rounded-2xl border border-charcoal/10 flex-shrink-0" onError={(e) => (e.currentTarget.style.display='none')} />
                )}
                {!siteContent.heroImageUrl && (
                  <div className="w-32 h-24 rounded-2xl bg-charcoal/5 border-2 border-dashed border-charcoal/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] text-charcoal/30 font-mono text-center uppercase">No Image</span>
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <label className="block text-xs font-bold text-charcoal/70">Hero Image URL</label>
                  <input
                    type="url"
                    value={siteContent.heroImageUrl}
                    onChange={(e) => setSiteContent(prev => ({ ...prev, heroImageUrl: e.target.value }))}
                    placeholder="https://your-image-url.jpg"
                    className="w-full border border-charcoal/15 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5 font-sans"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 bg-saffron/10 hover:bg-saffron/20 text-saffron text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-all border border-saffron/20">
                      {uploadingImage === 'hero' ? '⏳ Uploading...' : '📁 Upload from Device'}
                      <input type="file" accept="image/*" className="hidden" disabled={!!uploadingImage} onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadImage(file, 'hero');
                          setSiteContent(prev => ({ ...prev, heroImageUrl: url }));
                        } catch (err: any) {
                          alert(`Upload failed: ${err.message}`);
                        }
                      }} />
                    </label>
                    <span className="text-[10px] text-charcoal/40">or paste any direct image URL above</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery Images */}
            <div className="bg-white border border-charcoal/10 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-charcoal">📸 Gallery Images</h3>
                  <p className="text-xs text-charcoal/50 mt-0.5">{siteContent.galleryImages.length} images in the gallery.</p>
                </div>
                <button
                  onClick={() => setSiteContent(prev => ({
                    ...prev,
                    galleryImages: [...prev.galleryImages, { url: '', title: 'New Image', category: 'Food' }]
                  }))}
                  className="bg-saffron/10 hover:bg-saffron/20 text-saffron text-xs font-bold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all border border-saffron/20"
                >
                  <Plus className="w-4 h-4" /> Add Image
                </button>
              </div>
              <div className="space-y-4">
                {siteContent.galleryImages.map((img, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-4 bg-cream/30 rounded-2xl border border-charcoal/5">
                    {img.url ? (
                      <img src={img.url} alt={img.title} className="w-20 h-16 object-cover rounded-xl border border-charcoal/10 flex-shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    ) : (
                      <div className="w-20 h-16 rounded-xl bg-charcoal/5 border-2 border-dashed border-charcoal/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-[8px] text-charcoal/30 font-mono uppercase">No img</span>
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-charcoal/60 uppercase">Title</label>
                          <input
                            type="text"
                            value={img.title}
                            onChange={(e) => setSiteContent(prev => ({ ...prev, galleryImages: prev.galleryImages.map((g, i) => i === idx ? { ...g, title: e.target.value } : g) }))}
                            className="w-full border border-charcoal/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-charcoal/60 uppercase">Category</label>
                          <input
                            type="text"
                            value={img.category}
                            onChange={(e) => setSiteContent(prev => ({ ...prev, galleryImages: prev.galleryImages.map((g, i) => i === idx ? { ...g, category: e.target.value } : g) }))}
                            className="w-full border border-charcoal/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-charcoal/60 uppercase">Image</label>
                        <input
                          type="url"
                          value={img.url}
                          onChange={(e) => setSiteContent(prev => ({ ...prev, galleryImages: prev.galleryImages.map((g, i) => i === idx ? { ...g, url: e.target.value } : g) }))}
                          placeholder="https://your-image-url.jpg"
                          className="w-full border border-charcoal/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-white mb-1"
                        />
                        <label className="flex items-center gap-1.5 bg-saffron/10 hover:bg-saffron/20 text-saffron text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all border border-saffron/20 w-fit">
                          {uploadingImage === `gallery-${idx}` ? '⏳ Uploading...' : '📁 Upload from Device'}
                          <input type="file" accept="image/*" className="hidden" disabled={!!uploadingImage} onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const url = await uploadImage(file, `gallery-${idx}`);
                              setSiteContent(prev => ({ ...prev, galleryImages: prev.galleryImages.map((g, i) => i === idx ? { ...g, url } : g) }));
                            } catch (err) {
                              alert(`Upload failed: ${err.message}`);
                            }
                          }} />
                        </label>
                      </div>
                    </div>
                    <button
                      onClick={() => setSiteContent(prev => ({ ...prev, galleryImages: prev.galleryImages.filter((_, i) => i !== idx) }))}
                      className="text-red-400 hover:bg-red-50 p-2 rounded-xl cursor-pointer transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Fee Settings */}
            <div className="bg-white border border-charcoal/10 rounded-3xl p-6 space-y-4">
              <h3 className="font-display font-bold text-lg text-charcoal">🛵 Delivery Fee Rules</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal/70">Free Delivery Threshold (₹)</label>
                  <input
                    type="number"
                    value={siteContent.deliveryFeeThreshold}
                    onChange={(e) => setSiteContent(prev => ({ ...prev, deliveryFeeThreshold: Number(e.target.value) }))}
                    className="w-full border border-charcoal/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5"
                  />
                  <p className="text-[10px] text-charcoal/40">Orders above this amount get free delivery. Set to 0 to always charge.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal/70">Delivery Fee Amount (₹)</label>
                  <input
                    type="number"
                    value={siteContent.deliveryFeeAmount}
                    onChange={(e) => setSiteContent(prev => ({ ...prev, deliveryFeeAmount: Number(e.target.value) }))}
                    className="w-full border border-charcoal/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5"
                  />
                  <p className="text-[10px] text-charcoal/40">This fee is charged for orders below the threshold. Set to 0 for always free.</p>
                </div>
              </div>
            </div>

            {/* Promotional Offer */}
            <div className="bg-white border border-charcoal/10 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-charcoal">🏷️ Promotional Offer</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-bold text-charcoal/70">{siteContent.offer.enabled ? '✅ Active' : '⭕ Inactive'}</span>
                  <input
                    type="checkbox"
                    checked={siteContent.offer.enabled}
                    onChange={(e) => setSiteContent(prev => ({ ...prev, offer: { ...prev.offer, enabled: e.target.checked } }))}
                    className="w-5 h-5 rounded accent-saffron cursor-pointer"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal/70">Coupon Code</label>
                  <input
                    type="text"
                    value={siteContent.offer.code}
                    onChange={(e) => setSiteContent(prev => ({ ...prev, offer: { ...prev.offer, code: e.target.value.toUpperCase() } }))}
                    className="w-full border border-charcoal/15 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5"
                    placeholder="DELIGHT15"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal/70">Discount %</label>
                  <input
                    type="number"
                    value={siteContent.offer.discountPercent}
                    onChange={(e) => setSiteContent(prev => ({ ...prev, offer: { ...prev.offer, discountPercent: Number(e.target.value) } }))}
                    className="w-full border border-charcoal/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal/70">Minimum Order Amount (₹)</label>
                  <input
                    type="number"
                    value={siteContent.offer.minOrder}
                    onChange={(e) => setSiteContent(prev => ({ ...prev, offer: { ...prev.offer, minOrder: Number(e.target.value) } }))}
                    className="w-full border border-charcoal/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal/70">Offer Label (shown to customer)</label>
                  <input
                    type="text"
                    value={siteContent.offer.label}
                    onChange={(e) => setSiteContent(prev => ({ ...prev, offer: { ...prev.offer, label: e.target.value } }))}
                    className="w-full border border-charcoal/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5"
                    placeholder="Flat 15% off on orders above ₹600"
                  />
                </div>
              </div>
              {siteContent.offer.enabled && (
                <div className="bg-saffron/10 border border-saffron/20 rounded-2xl p-4 text-sm font-bold text-saffron">
                  Preview: Use code <span className="font-mono bg-white px-2 py-0.5 rounded-lg border border-saffron/30">{siteContent.offer.code}</span> to get {siteContent.offer.discountPercent}% off on orders above ₹{siteContent.offer.minOrder}
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={async () => {
                await adminStore.saveSiteContent(siteContent);
                alert('Site content & offers saved successfully! Your website will update instantly.');
              }}
              className="w-full bg-saffron hover:bg-saffron/90 text-white font-black text-sm py-4 rounded-2xl cursor-pointer transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save All Site Content &amp; Offers
            </button>
          </div>
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
            <div 
              className="bg-cream/10 border-2 border-charcoal/25 p-4 mx-auto rounded font-mono text-[11px] text-black leading-tight w-[220px] shadow-inner select-all"
              id="printable-thermal-receipt"
              style={{ fontFamily: 'monospace' }}
            >
              <div className="text-center space-y-1">
                <p className="font-extrabold text-sm uppercase">CURRY DELIGHT</p>
                <p className="text-[9px]">Station Road, Kahalgaon</p>
                <p className="text-[9px]">PH: +91 7061591831</p>
                <p className="text-[9px]">------------------------</p>
              </div>

              {/* Receipt Header details */}
              <div className="space-y-1 py-1.5 border-b border-dashed border-black/30">
                <p>Order: {printingOrder.id}</p>
                <p>Date: {new Date(printingOrder.createdAt).toLocaleDateString()}</p>
                <p>Time: {new Date(printingOrder.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                <p>Type: {printingOrder.deliveryType.toUpperCase()}</p>
                <p className="font-bold">Cust: {printingOrder.customerName}</p>
                <p>Ph: {printingOrder.customerPhone}</p>
                {printingOrder.deliveryType === 'delivery' && (
                  <p className="text-[9px] leading-tight">Add: {printingOrder.customerAddress}</p>
                )}
              </div>

              {/* Items Table details */}
              <div className="py-2 space-y-1.5 border-b border-dashed border-black/30">
                <div className="flex justify-between font-extrabold text-[10px]">
                  <span>ITEM [QTY]</span>
                  {printType === 'bill' && <span>PRICE</span>}
                </div>
                <p className="text-[9px]">------------------------</p>
                
                {printingOrder.items.map((it, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span>{it.menuItem.name.substring(0, 15)} x{it.quantity}</span>
                      {printType === 'bill' && <span>₹{it.menuItem.price * it.quantity}</span>}
                    </div>
                    {/* Notes & Swaps */}
                    {it.selectedSpice && <p className="text-[9px] text-black/70"> *Spice: {it.selectedSpice.toUpperCase()}</p>}
                    {it.specialInstructions && <p className="text-[9px] text-black/70 italic"> *Note: {it.specialInstructions}</p>}
                    {it.thaliCustomizations && (
                      <div className="text-[9px] text-black/70 pl-2">
                        {it.thaliCustomizations.currySwap && <p>*Curry: {it.thaliCustomizations.currySwap}</p>}
                        {it.thaliCustomizations.breadSwap && <p>*Bread: {it.thaliCustomizations.breadSwap}</p>}
                        {it.thaliCustomizations.dessertChoice && <p>*Sweet: {it.thaliCustomizations.dessertChoice}</p>}
                        {it.thaliCustomizations.extraRice && <p>*Add: Extra Rice portion</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom total calculations for "Bill" only. KOT NEVER SEES MONEY */}
              {printType === 'bill' ? (
                <div className="pt-2 text-[10px] space-y-1 text-right">
                  <p>Subtotal: ₹{printingOrder.subtotal}</p>
                  {printingOrder.discount > 0 && <p>Discount: -₹{printingOrder.discount}</p>}
                  {printingOrder.deliveryFee > 0 && <p>Delivery: +₹{printingOrder.deliveryFee}</p>}
                  
                  {/* GST computation breakdown */}
                  {settings.gstEnabled && (
                    <>
                      {settings.gstin && <p className="text-[8px] font-mono block">GSTIN: {settings.gstin}</p>}
                      <p>CGST ({settings.cgstRate}%): ₹{Math.round(printingOrder.subtotal * (settings.cgstRate / 100))}</p>
                      <p>SGST ({settings.sgstRate}%): ₹{Math.round(printingOrder.subtotal * (settings.sgstRate / 100))}</p>
                    </>
                  )}
                  <p className="text-[9px]">------------------------</p>
                  <p className="font-extrabold text-xs">GRAND TOTAL: ₹{printingOrder.total}</p>
                  <p className="font-bold text-[9px] uppercase">{printingOrder.paymentMethod === 'cod' ? 'CASH ON DELIVERY' : 'PAID VIA UPI'}</p>
                </div>
              ) : (
                <div className="pt-1.5 text-center text-[9px]">
                  <p className="font-extrabold uppercase bg-black/5 p-1 rounded">KITCHEN COPY (KOT)</p>
                  <p>No pricing details printed</p>
                </div>
              )}

              {/* Footer thank you message */}
              <div className="text-center pt-3 text-[8px] space-y-0.5">
                <p>Thank you for dining! 🌸</p>
                <p>Cooked with authentic love</p>
              </div>

            </div>

            {/* Print Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleBrowserPrint}
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

                {/* Spice Level */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 ml-1">Spiciness Heat</label>
                  <select
                    value={menuForm.spiceLevel}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, spiceLevel: e.target.value as 'mild' | 'medium' | 'hot' }))}
                    className="w-full border border-charcoal/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-cream/5 font-semibold"
                    id="menu-form-spice"
                  >
                    <option value="mild">🌶️ Mild</option>
                    <option value="medium">🌶️🌶️ Medium</option>
                    <option value="hot">🌶️🌶️🌶️ Bihari Spicy</option>
                  </select>
                </div>
              </div>

              {/* Dish Image Upload */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 ml-1">Dish Image</label>
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
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 bg-saffron/10 hover:bg-saffron/20 text-saffron text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-all border border-saffron/20">
                    {uploadingImage === 'menu-item' ? '⏳ Uploading...' : '📁 Upload Image'}
                    <input type="file" accept="image/*" className="hidden" disabled={!!uploadingImage} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadImage(file, 'menu-item');
                        setMenuForm(prev => ({ ...prev, image: url }));
                      } catch (err: any) {
                        alert(`Upload failed: ${err.message}`);
                      }
                    }} />
                  </label>
                  <span className="text-[10px] text-charcoal/40">or paste URL above</span>
                </div>
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
