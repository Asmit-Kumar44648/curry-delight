import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  Soup,
  Wheat,
  Grid,
  Search,
  ShoppingBag,
  Plus,
  Minus,
  X,
  MapPin,
  Phone,
  Clock,
  Calendar,
  Users,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Info,
  ArrowRight,
  ArrowLeft,
  UtensilsCrossed,
  Award,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Gift,
  Menu
} from 'lucide-react';


import { MenuItem, CartItem, ReservationRequest, OrderDetails } from './types';
import Gallery from './components/Gallery';
import OnlineOrdering from './components/OnlineOrdering';
import TableReservation from './components/TableReservation';
import Celebrations from './components/Celebrations';
import AdminDashboard from './components/AdminDashboard';
import { adminStore, AdminSettings, SiteContent } from './lib/adminStore';

export default function App() {
  // --- Routing State ---
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigateTo = (path: string, callback?: () => void) => {
    setIsFullMenuSubpageActive(false);
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    if (callback) {
      // Small delay to allow React to mount/update components before scrolling
      setTimeout(callback, 150);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const headerOffset = 85;
      const elementPosition = ref.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    adminStore.initializeStore();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  // --- Dynamic Menu Items, Settings & Site Content ---
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [siteContent, setSiteContent] = useState<SiteContent>(adminStore.getSiteContent());
  const [isLoading, setIsLoading] = useState(!adminStore.isInitialized);
  
  useEffect(() => {
    setMenuItems(adminStore.getMenuItems());
    setSettings(adminStore.getSettings());
    setSiteContent(adminStore.getSiteContent());
    setIsLoading(!adminStore.isInitialized);
    const handleStorageChange = () => {
      setMenuItems(adminStore.getMenuItems());
      setSettings(adminStore.getSettings());
      setSiteContent(adminStore.getSiteContent());
      setIsLoading(!adminStore.isInitialized);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('adminStoreUpdate', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('adminStoreUpdate', handleStorageChange);
    };
  }, []);

  // --- Cart and Checkout State ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  
  // Customization modal temporary selections
  const [customSpice, setCustomSpice] = useState<'mild' | 'medium' | 'hot'>('medium');
  const [customQty, setCustomQty] = useState(1);
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [thaliCurry, setThaliCurry] = useState<string>('No swap (As per original Chef recipe)');
  const [thaliBread, setThaliBread] = useState<string>('2 Tandoori Butter Rotis');
  const [thaliDessert, setThaliDessert] = useState<string>('Gulab Jamun (1pc)');
  const [thaliExtraRice, setThaliExtraRice] = useState<boolean>(false);

  // --- Category and Search State ---
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullMenuSubpageActive, setIsFullMenuSubpageActive] = useState(false);

  // --- Bestsellers Handpicked ---
  const BESTSELLER_IDS = useMemo(() => [
    'bir-chk',                  // Chicken Biryani
    'ind-paneer-butter',        // Paneer Butter Masala
    'bread-naan-butter',        // Butter Naan
    'starter-chilli-paneer-dry',// Chilli Paneer Dry
    'pizza-veg-over-md',        // Veggie Overloaded Pizza (Medium)
    'shake-kesar'               // Kesar Badam Milkshake
  ], []);

  const bestsellerMenuItems = useMemo(() => {
    return menuItems.filter(item => BESTSELLER_IDS.includes(item.id));
  }, [BESTSELLER_IDS, menuItems]);

  // --- Reservation State ---
  const [reservationStep, setReservationStep] = useState(1);
  const [reservationData, setReservationData] = useState<ReservationRequest>({
    fullName: '',
    phone: '',
    partySize: 2,
    date: new Date().toISOString().split('T')[0],
    timeSlot: '19:30',
    specialRequests: ''
  });

  // --- Checkout form State ---
  const [checkoutData, setCheckoutData] = useState<OrderDetails>({
    fullName: '',
    phone: '',
    address: '',
    deliveryType: 'delivery',
    paymentMethod: 'cod',
    specialInstructions: ''
  });
  
  // --- Order confirmation state ---
  const [orderConfirmation, setOrderConfirmation] = useState<{
    orderId: string;
    estimatedTime: string;
    items: CartItem[];
    summary: OrderDetails;
    subtotal: number;
    discount: number;
    deliveryFee: number;
    total: number;
  } | null>(null);

  // --- Active Tab for Scroll Spy / Quick Navigation ---
  const [activeTab, setActiveTab] = useState<'home' | 'menu' | 'about' | 'gallery' | 'reservation' | 'contact'>('home');

  // References for sections to scroll to
  const homeRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const offersRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const reservationRef = useRef<HTMLDivElement>(null);

  // --- Cart computations ---
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  }, [cart]);

  // Special offer discount calculation (driven by CMS siteContent)
  const discountAmount = useMemo(() => {
    if (!siteContent.offer.enabled) return 0;
    if (cartSubtotal >= siteContent.offer.minOrder) {
      return Math.round(cartSubtotal * (siteContent.offer.discountPercent / 100));
    }
    return 0;
  }, [cartSubtotal, siteContent.offer]);

  const deliveryFee = useMemo(() => {
    if (checkoutData.deliveryType === 'pickup' || cart.length === 0) return 0;
    return cartSubtotal >= siteContent.deliveryFeeThreshold ? 0 : siteContent.deliveryFeeAmount;
  }, [cartSubtotal, checkoutData.deliveryType, cart, siteContent]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - discountAmount + deliveryFee);
  }, [cartSubtotal, discountAmount, deliveryFee]);

  const cartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // --- Helper to smooth scroll ---
  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>, tabName: typeof activeTab) => {
    setActiveTab(tabName);
    if (tabName === 'menu') {
      setIsFullMenuSubpageActive(true);
    } else {
      setIsFullMenuSubpageActive(false);
    }
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setIsFullMenuSubpageActive(true);
    setTimeout(() => {
      menuRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // --- Cart Actions ---
  const handleQuickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal
    
    setCart(prevCart => {
      const existing = prevCart.find(c => c.menuItem.id === item.id && c.selectedSpice === (item.spiceLevel || 'medium'));
      if (existing) {
        return prevCart.map(c => 
          c.menuItem.id === item.id && c.selectedSpice === (item.spiceLevel || 'medium')
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prevCart, { menuItem: item, quantity: 1, selectedSpice: item.spiceLevel || 'medium', specialInstructions: '' }];
    });
  };

  const calculateAddedPrice = (item: MenuItem) => {
    let added = 0;
    if (item.category === 'Heritage Thalis') {
      if (thaliBread.includes('Garlic Naan')) added += 15;
      if (thaliBread.includes('Laccha Paratha')) added += 10;
      if (thaliExtraRice) added += 40;
    } else {
      selectedAddons.forEach(addonName => {
        if (addonName.includes('Cheese')) added += 20;
        if (addonName.includes('Butter')) added += 15;
        if (addonName.includes('Rice')) added += 50;
        if (addonName.includes('Garlic Dip')) added += 10;
      });
    }
    return added;
  };

  const handleOpenCustomizer = (item: MenuItem) => {
    setCustomizingItem(item);
    setCustomSpice(item.spiceLevel || 'medium');
    setCustomQty(1);
    setCustomInstructions('');
    setSelectedAddons([]);
    setThaliCurry('No swap (As per original Chef recipe)');
    setThaliBread('2 Tandoori Butter Rotis');
    setThaliDessert('Gulab Jamun (1pc)');
    setThaliExtraRice(false);
  };

  const handleAddCustomized = () => {
    if (!customizingItem) return;

    const addedPrice = calculateAddedPrice(customizingItem);

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(
        c => c.menuItem.id === customizingItem.id && 
             c.selectedSpice === customSpice && 
             c.specialInstructions === customInstructions &&
             JSON.stringify(c.selectedAddons || []) === JSON.stringify(selectedAddons) &&
             c.thaliCustomizations?.currySwap === thaliCurry &&
             c.thaliCustomizations?.breadSwap === thaliBread &&
             c.thaliCustomizations?.dessertChoice === thaliDessert &&
             c.thaliCustomizations?.extraRice === thaliExtraRice
      );

      if (existingIndex > -1) {
        return prevCart.map((c, idx) => 
          idx === existingIndex 
            ? { ...c, quantity: c.quantity + customQty }
            : c
        );
      }

      return [...prevCart, {
        menuItem: {
          ...customizingItem,
          price: customizingItem.price + addedPrice
        },
        quantity: customQty,
        selectedSpice: customSpice,
        specialInstructions: customInstructions,
        selectedAddons,
        thaliCustomizations: customizingItem.category === 'Heritage Thalis' ? {
          currySwap: thaliCurry,
          breadSwap: thaliBread,
          dessertChoice: thaliDessert,
          extraRice: thaliExtraRice
        } : undefined,
        addedPrice
      }];
    });

    setCustomizingItem(null);
    setIsCartOpen(true); // Guide user to their cart
  };

  const updateCartQty = (idx: number, delta: number) => {
    setCart(prev => {
      const item = prev[idx];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      return prev.map((c, i) => i === idx ? { ...c, quantity: newQty } : c);
    });
  };

  const removeFromCart = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  // --- Reservation handlers ---
  const handleReservationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reservationStep < 3) {
      setReservationStep(prev => prev + 1);
    } else {
      // Trigger WhatsApp API link for the reservation
      const message = `Namaste Curry Delight Kahalgaon! I would like to reserve a table:\n\n` +
        `• *Name:* ${reservationData.fullName}\n` +
        `• *Phone:* ${reservationData.phone}\n` +
        `• *Party Size:* ${reservationData.partySize} People\n` +
        `• *Date:* ${reservationData.date}\n` +
        `• *Time:* ${reservationData.timeSlot}\n` +
        (reservationData.specialRequests ? `• *Special Notes:* ${reservationData.specialRequests}\n` : '') +
        `\nPlease confirm availability. Thank you!`;

      const encodedMessage = encodeURIComponent(message);
      // Opens WhatsApp deep link with structured text
      window.open(`https://wa.me/917061591831?text=${encodedMessage}`, '_blank');
      
      // Reset step
      alert("Opening WhatsApp to send reservation details. Thank you for booking with Curry Delight!");
      setReservationStep(1);
      setReservationData({
        fullName: '',
        phone: '',
        partySize: 2,
        date: new Date().toISOString().split('T')[0],
        timeSlot: '19:30',
        specialRequests: ''
      });
    }
  };

  // --- Checkout / Order Submission ---
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutData.fullName || !checkoutData.phone || (checkoutData.deliveryType === 'delivery' && !checkoutData.address)) {
      alert("Please fill in all required fields.");
      return;
    }

    const mockOrderId = `CD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const kitchenBuffer = settings?.kitchenBufferMinutes || 0;
    const baseMin = checkoutData.deliveryType === 'delivery' ? 45 : 20;
    const baseMax = checkoutData.deliveryType === 'delivery' ? 55 : 25;
    const estimatedTime = `${baseMin + kitchenBuffer}-${baseMax + kitchenBuffer} mins`;

    const confirmation = {
      orderId: mockOrderId,
      estimatedTime,
      items: [...cart],
      summary: { ...checkoutData },
      subtotal: cartSubtotal,
      discount: discountAmount,
      deliveryFee,
      total: cartTotal
    };

    // Save to the Live Order Queue (adminStore)
    adminStore.addOrder({
      customerName: checkoutData.fullName,
      customerPhone: checkoutData.phone,
      customerAddress: checkoutData.deliveryType === 'delivery' ? checkoutData.address : 'Pickup Order',
      deliveryType: checkoutData.deliveryType,
      paymentMethod: checkoutData.paymentMethod,
      subtotal: cartSubtotal,
      discount: discountAmount,
      deliveryFee,
      total: cartTotal,
      items: [...cart],
      specialInstructions: checkoutData.specialInstructions
    });

    setOrderConfirmation(confirmation);
    setCart([]); // Clear cart
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
  };

  const handleSendOrderWhatsApp = (conf: typeof orderConfirmation) => {
    if (!conf) return;

    let itemsText = '';
    conf.items.forEach((item, idx) => {
      itemsText += `${idx + 1}. ${item.menuItem.name} x${item.quantity} [${item.selectedSpice || 'medium'}]` +
        (item.specialInstructions ? ` (Note: ${item.specialInstructions})` : '') + ` - ₹${item.menuItem.price * item.quantity}\n`;
    });

    const message = `*NEW ORDER - CURRY DELIGHT KAHALGAON*\n` +
      `----------------------------------------\n` +
      `*Order ID:* ${conf.orderId}\n` +
      `*Customer:* ${conf.summary.fullName}\n` +
      `*Phone:* ${conf.summary.phone}\n` +
      `*Type:* ${conf.summary.deliveryType === 'delivery' ? '📍 Home Delivery' : '🏪 Self Takeaway'}\n` +
      (conf.summary.deliveryType === 'delivery' ? `*Address:* ${conf.summary.address}\n` : '') +
      `*Payment:* ${conf.summary.paymentMethod.toUpperCase()} (on ${conf.summary.deliveryType === 'delivery' ? 'delivery' : 'pickup'})\n` +
      `----------------------------------------\n` +
      `*ITEMS ORDERED:*\n${itemsText}` +
      `----------------------------------------\n` +
      `*Subtotal:* ₹${conf.subtotal}\n` +
      (conf.discount > 0 ? `*Discount (DELIGHT15):* -₹${conf.discount}\n` : '') +
      `*Delivery Charge:* ₹${conf.deliveryFee}\n` +
      `*GRAND TOTAL:* ₹${conf.total}\n` +
      `----------------------------------------\n` +
      (conf.summary.specialInstructions ? `*Instructions:* ${conf.summary.specialInstructions}\n` : '') +
      `Please confirm receipt and initiate cooking!`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/917061591831?text=${encodedMessage}`, '_blank');
  };

  // --- Scroll Spy for sticky CTA header visibility ---
  const [showStickyBottomBar, setShowStickyBottomBar] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowStickyBottomBar(true);
      } else {
        setShowStickyBottomBar(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Filtering menu items ---
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, menuItems]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-charcoal flex flex-col items-center justify-center space-y-4 text-center p-6">
        <div className="bg-saffron p-4 rounded-full text-[#FFF9F2] flex items-center justify-center animate-bounce shadow-lg shadow-saffron/20">
          <Flame className="w-10 h-10 animate-pulse" />
        </div>
        <h2 className="font-display font-bold text-3xl text-[#FFF9F2] tracking-tight">Curry Delight</h2>
        <p className="text-cream/50 text-[10px] tracking-widest uppercase animate-pulse">Connecting to Live Kitchen Server...</p>
      </div>
    );
  }

  if (currentPath === '/admin') {
    return (
      <div className="min-h-screen bg-cream font-sans text-charcoal">
        <AdminDashboard navigateTo={navigateTo} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream font-sans text-ink selection:bg-saffron selection:text-white">
      
      {/* 1. STICKY / PERMANENT NAVIGATION */}
      <nav className="sticky top-0 z-40 bg-charcoal text-text-on-dark shadow-md px-6 py-4 md:py-5 transition-all duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <button 
            onClick={() => navigateTo('/')} 
            className="flex items-center space-x-3 text-left group cursor-pointer"
            id="brand-logo"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 bg-white border border-white/10 shadow-sm flex-shrink-0">
              <img src="/favicon.png" className="w-full h-full object-cover" alt="Curry Delight Logo" />
            </div>
            <div>
              <span className="font-display font-bold text-2xl text-[#FFF9F2] tracking-tight block">
                Curry Delight
              </span>
              <span className="text-[9px] font-mono tracking-widest text-saffron uppercase block -mt-1 font-bold">
                A Delight In Every Bite
              </span>
            </div>
          </button>

          {/* Nav Links - Desktop */}
          <div className="hidden lg:flex items-center space-x-10 text-sm font-semibold tracking-wide text-[#FFF9F2]/75">
            <button 
              onClick={() => navigateTo('/')} 
              className={`hover:text-saffron transition-colors cursor-pointer ${currentPath === '/' ? 'text-saffron border-b-2 border-saffron pb-1' : 'text-[#FFF9F2]/80'}`}
              id="nav-link-home"
            >
              Home
            </button>
            <button 
              onClick={() => navigateTo('/order')} 
              className={`hover:text-saffron transition-colors cursor-pointer ${currentPath === '/order' ? 'text-saffron border-b-2 border-saffron pb-1' : 'text-[#FFF9F2]/80'}`}
              id="nav-link-order"
            >
              Our Menu
            </button>
            <button 
              onClick={() => navigateTo('/reserve')} 
              className={`hover:text-saffron transition-colors cursor-pointer ${currentPath === '/reserve' ? 'text-saffron border-b-2 border-saffron pb-1' : 'text-[#FFF9F2]/80'}`}
              id="nav-link-reserve"
            >
              Reserve a Table
            </button>
            <button 
              onClick={() => navigateTo('/celebrations')} 
              className={`hover:text-saffron transition-colors cursor-pointer ${currentPath === '/celebrations' ? 'text-saffron border-b-2 border-saffron pb-1' : 'text-[#FFF9F2]/80'}`}
              id="nav-link-celebrations"
            >
              Celebrations
            </button>
            <button 
              onClick={() => {
                if (currentPath !== '/') {
                  navigateTo('/', () => scrollToRef(galleryRef));
                } else {
                  scrollToRef(galleryRef);
                }
              }} 
              className={`hover:text-saffron transition-colors cursor-pointer ${currentPath === '/' ? 'text-saffron border-b-2 border-saffron pb-1' : 'text-[#FFF9F2]/80'}`}
              id="nav-link-gallery"
            >
              Gallery
            </button>
            <button 
              onClick={() => {
                if (currentPath !== '/') {
                  navigateTo('/', () => scrollToRef(contactRef));
                } else {
                  scrollToRef(contactRef);
                }
              }} 
              className={`hover:text-saffron transition-colors cursor-pointer ${currentPath === '/' ? 'text-saffron border-b-2 border-saffron pb-1' : 'text-[#FFF9F2]/80'}`}
              id="nav-link-contact"
            >
              Contact
            </button>
          </div>

          {/* Action Hub - Cart & Primary CTA */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Cart Trigger Button */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 text-[#FFF9F2] hover:text-saffron transition-all bg-white/5 hover:bg-white/10 rounded-full cursor-pointer focus:outline-none shadow-sm"
              aria-label="Shopping Cart"
              id="nav-cart-btn"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 bg-saffron text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center font-tabular-nums shadow-md"
                >
                  {cartItemsCount}
                </motion.span>
              )}
            </button>

            {/* Saffron Filled Primary CTA - Order Now */}
            <button 
              onClick={() => navigateTo('/order')}
              className="hidden sm:flex bg-saffron text-white hover:bg-[#d15423] font-bold text-xs md:text-sm px-6 py-2.5 rounded-full transition-all flex items-center space-x-1.5 cursor-pointer shadow-md focus:outline-none hover:scale-102 active:scale-98"
              id="nav-order-online-cta"
            >
              <span>Order Online</span>
              <ChevronRight className="w-3.5 h-3.5 hidden sm:inline" />
            </button>

            {/* Hamburger Mobile Menu Trigger */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2.5 text-[#FFF9F2] hover:text-saffron transition-all bg-white/5 hover:bg-white/10 rounded-full cursor-pointer focus:outline-none shadow-sm"
              aria-label="Toggle Navigation Menu"
              id="mobile-nav-toggle-btn"
            >
              <Menu className="w-5 h-5" />
            </button>

          </div>
        </div>
      </nav>

      {/* MOBILE NAV DRAWER (Visible on lg:hidden) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden lg:hidden" id="mobile-nav-drawer">
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-charcoal/85 backdrop-blur-xs"
            />

            {/* Drawer Content */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-full max-w-[300px] bg-charcoal border-l border-white/10 shadow-2xl flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <span className="font-display font-bold text-lg text-[#FFF9F2] tracking-tight">Navigation</span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full cursor-pointer text-white/70 hover:text-white"
                  id="mobile-nav-close-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Links */}
              <div className="flex-1 overflow-y-auto py-6 px-6 space-y-6">
                <nav className="flex flex-col space-y-4">
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('/');
                    }} 
                    className={`text-left text-base font-bold py-2 transition-colors ${currentPath === '/' && !isFullMenuSubpageActive ? 'text-saffron' : 'text-[#FFF9F2]/80 hover:text-saffron'}`}
                    id="mobile-nav-home"
                  >
                    Home
                  </button>
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('/order');
                    }} 
                    className={`text-left text-base font-bold py-2 transition-colors ${currentPath === '/order' ? 'text-saffron' : 'text-[#FFF9F2]/80 hover:text-saffron'}`}
                    id="mobile-nav-menu"
                  >
                    Our Menu
                  </button>
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('/reserve');
                    }} 
                    className={`text-left text-base font-bold py-2 transition-colors ${currentPath === '/reserve' ? 'text-saffron' : 'text-[#FFF9F2]/80 hover:text-saffron'}`}
                    id="mobile-nav-reserve"
                  >
                    Reserve a Table
                  </button>
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('/celebrations');
                    }} 
                    className={`text-left text-base font-bold py-2 transition-colors ${currentPath === '/celebrations' ? 'text-saffron' : 'text-[#FFF9F2]/80 hover:text-saffron'}`}
                    id="mobile-nav-celebrations"
                  >
                    Celebrations
                  </button>
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (currentPath !== '/') {
                        navigateTo('/', () => scrollToRef(galleryRef));
                      } else {
                        scrollToRef(galleryRef);
                      }
                    }} 
                    className="text-left text-base font-bold py-2 text-[#FFF9F2]/80 hover:text-saffron transition-colors"
                    id="mobile-nav-gallery"
                  >
                    Gallery
                  </button>
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (currentPath !== '/') {
                        navigateTo('/', () => scrollToRef(contactRef));
                      } else {
                        scrollToRef(contactRef);
                      }
                    }} 
                    className="text-left text-base font-bold py-2 text-[#FFF9F2]/80 hover:text-saffron transition-colors"
                    id="mobile-nav-contact"
                  >
                    Contact
                  </button>
                </nav>
              </div>

              {/* Footer / Admin Staff Access */}
              <div className="p-6 border-t border-white/10 bg-black/10 space-y-4">
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigateTo('/admin');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-[#FFF9F2] uppercase tracking-wider transition-all"
                >
                  🔑 Staff Portal
                </button>
                <div className="text-center text-[10px] text-cream/40">
                  Curry Delight Kahalgaon
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {currentPath === '/' && (
          <motion.div
            key="homepage-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {!isFullMenuSubpageActive && (
              <>
                {/* 2. PHOTOGRAPHY-FORWARD HERO (Charcoal Background) */}
          <section ref={homeRef} className="bg-charcoal text-text-on-dark py-12 px-6 md:py-24 relative overflow-hidden" id="section-hero">
            
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(232,98,44,0.12)_0%,transparent_75%)] pointer-events-none" />

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
              
              {/* Hero Copy (Left side on desktop) */}
              <div className="lg:col-span-5 text-left space-y-6">
                <div className="inline-flex items-center space-x-2 bg-saffron/15 text-saffron px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Food, Cooked Like Home</span>
                </div>
                
                <h1 className="font-display font-bold text-5xl md:text-6xl text-white leading-[1.1] tracking-tight">
                  Aromatic Heritage <br />
                  from <span className="text-saffron italic font-normal">Kahalgaon</span>
                </h1>

                <p className="text-[#FFF9F2]/80 text-lg leading-relaxed max-w-xl font-normal">
                  Home-style Indian curries, straight off the tandoor — with Chinese, pizza, and everyday favorites for the rest of the table.
                </p>

                {/* CTA block - strictly visible above fold on mobile as per requirement */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  {/* PRIMARY --saffron filled CTA */}
                  <button 
                    onClick={() => scrollToSection(menuRef, 'menu')}
                    className="bg-saffron text-white hover:bg-[#d15423] text-center font-bold text-base px-8 py-4 rounded-full transition-transform active:scale-95 flex items-center justify-center space-x-2 shadow-lg shadow-saffron/20 cursor-pointer focus:outline-none"
                    id="hero-primary-order-cta"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>Order Online</span>
                  </button>

                  {/* SECONDARY white outline CTA - Book Table */}
                  <button 
                    onClick={() => navigateTo('/reserve')}
                    className="border border-[#FFF9F2]/30 text-[#FFF9F2] hover:bg-[#FFF9F2]/10 text-center font-bold text-base px-8 py-4 rounded-full transition-colors flex items-center justify-center space-x-1 cursor-pointer focus:outline-none"
                    id="hero-secondary-reserve-cta"
                  >
                    <span>Book a Table</span>
                  </button>
                </div>

                {/* Quick trust metrics - completely clean human text, no fake simulated server data */}
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10 max-w-md">
                  <div>
                    <span className="block font-display font-bold text-3xl text-saffron leading-none">180+</span>
                    <span className="block font-display font-bold text-xs text-saffron uppercase tracking-widest mt-1">Authentic</span>
                    <span className="text-[10px] text-[#FFF9F2]/50 font-mono tracking-wider uppercase font-bold block mt-1">Menu Items</span>
                  </div>
                  <div>
                    <span className="block font-display font-bold text-3xl text-saffron leading-none">100%</span>
                    <span className="block font-display font-bold text-xs text-saffron uppercase tracking-widest mt-1">Fresh</span>
                    <span className="text-[10px] text-[#FFF9F2]/50 font-mono tracking-wider uppercase font-bold block mt-1">Spices Daily</span>
                  </div>
                  <div>
                    <span className="block font-display font-bold text-3xl text-saffron leading-none">Fast &</span>
                    <span className="block font-display font-bold text-xs text-saffron uppercase tracking-widest mt-1">Hot</span>
                    <span className="text-[10px] text-[#FFF9F2]/50 font-mono tracking-wider uppercase font-bold block mt-1">Local Delivery</span>
                  </div>
                </div>
              </div>

              {/* Hero Restaurant Interior Image */}
              <div className="lg:col-span-7 mt-8 lg:mt-0">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 aspect-[4/3] group bg-charcoal/30">
                  {siteContent.heroImageUrl ? (
                    <img 
                      src={siteContent.heroImageUrl} 
                      alt="Curry Delight Restaurant Interior" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/30 gap-3">
                      <img src="/favicon.png" className="w-20 h-20 opacity-20" alt="" />
                      <span className="text-xs font-mono uppercase tracking-widest font-bold opacity-50">Add hero image from Admin Panel</span>
                    </div>
                  )}

                  {siteContent.heroImageUrl && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent p-6 pt-24">
                      <div className="flex items-center space-x-1.5 text-saffron font-bold text-xs uppercase font-mono tracking-wider">
                        <Award className="w-4 h-4" />
                        <span>Kahalgaon's Finest Dining</span>
                      </div>
                      <h3 className="text-white font-display font-bold text-xl md:text-2xl mt-1">Our Elegant Warm Dining Room</h3>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </section>

          {/* HOMEPAGE CONVERSION PATHS SECTION */}
          <section className="bg-white py-16 px-6 border-b border-charcoal/5" id="section-conversion-cards">
            <div className="max-w-7xl mx-auto space-y-10">
              <div className="text-center max-w-xl mx-auto space-y-1.5">
                <span className="text-xs font-bold text-saffron tracking-wider uppercase font-mono">How Can We Serve You?</span>
                <h2 className="font-display font-bold text-3xl text-charcoal leading-tight">Three Unique Curry Delight Experiences</h2>
                <p className="text-sm text-charcoal/60 font-normal">Select a dining experience customized specifically to your requirements.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Order Online */}
                <div className="bg-[#FFF9F2] rounded-3xl p-6 md:p-8 border border-charcoal/5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow group text-left">
                  <div className="space-y-4">
                    <div className="bg-saffron/10 text-saffron p-3.5 rounded-2xl w-fit flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-display font-bold text-xl text-charcoal group-hover:text-saffron transition-colors">Order Online</h3>
                      <p className="text-xs md:text-sm text-charcoal/70 leading-relaxed font-normal">
                        Freshly roasted family recipes delivered hot to your doorstep.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigateTo('/order')}
                    className="mt-6 bg-saffron text-white hover:bg-[#d15423] font-bold text-xs py-3.5 px-6 rounded-full w-full flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    id="homepage-card-order-online-btn"
                  >
                    <span>Start Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card 2: Book a Table */}
                <div className="bg-[#FFF9F2] rounded-3xl p-6 md:p-8 border border-charcoal/5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow group text-left">
                  <div className="space-y-4">
                    <div className="bg-saffron/10 text-saffron p-3.5 rounded-2xl w-fit flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-display font-bold text-xl text-charcoal group-hover:text-saffron transition-colors">Book a Table</h3>
                      <p className="text-xs md:text-sm text-charcoal/70 leading-relaxed font-normal">
                        Instant self-serve reservations for up to 8 guests.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigateTo('/reserve')}
                    className="mt-6 bg-charcoal text-white hover:bg-charcoal/90 font-bold text-xs py-3.5 px-6 rounded-full w-full flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    id="homepage-card-book-table-btn"
                  >
                    <span>Find a Table</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card 3: Host a Celebration */}
                <div className="bg-[#FFF9F2] rounded-3xl p-6 md:p-8 border border-charcoal/5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow group text-left">
                  <div className="space-y-4">
                    <div className="bg-saffron/10 text-saffron p-3.5 rounded-2xl w-fit flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-display font-bold text-xl text-charcoal group-hover:text-saffron transition-colors">Host a Celebration</h3>
                      <p className="text-xs md:text-sm text-charcoal/70 leading-relaxed font-normal">
                        Birthdays, anniversaries & corporate banquets curated with love.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigateTo('/celebrations')}
                    className="mt-6 border border-charcoal/20 hover:bg-charcoal/5 font-bold text-xs py-3.5 px-6 rounded-full w-full flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    id="homepage-card-celebrations-btn"
                  >
                    <span>Inquire Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 3. BROWSE CATEGORIES (Cream Background, high touch targets) */}
          <section className="bg-cream py-12 px-6 border-b border-charcoal/5" id="section-categories">
            <div className="max-w-7xl mx-auto">
              <div className="text-center max-w-xl mx-auto mb-10">
                <span className="text-xs font-bold text-saffron tracking-wider uppercase font-mono">Curated Collections</span>
                <h2 className="font-display font-bold text-3xl text-charcoal mt-1">Explore Our Family Kitchen</h2>
              </div>

              <div className="flex gap-6 overflow-x-auto pb-4 justify-start scrollbar-hide py-2 px-1">
                
                {/* Category: All */}
                <div 
                  onClick={() => handleCategoryClick('all')}
                  className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
                  id="category-btn-all"
                >
                  <div className={`w-16 h-16 rounded-full bg-white p-1 shadow-sm transition-all duration-300 ${selectedCategory === 'all' ? 'border-2 border-saffron scale-105 shadow-md' : 'border border-charcoal/10 group-hover:border-charcoal/30'}`}>
                    <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=120&h=120" className="w-full h-full rounded-full object-cover" alt="All Dishes" />
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors duration-200 ${selectedCategory === 'all' ? 'text-saffron font-extrabold' : 'text-charcoal/60 group-hover:text-charcoal'}`}>
                    All Dishes
                  </span>
                </div>

                {/* Dynamic Categories */}
                {Array.from(new Set(menuItems.map(item => item.category as string))).map((cat: string) => {
                  const firstItem = menuItems.find(item => item.category === cat);
                  const catImg = firstItem ? firstItem.image : 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=120&h=120';
                  return (
                    <div 
                      key={cat}
                      onClick={() => handleCategoryClick(cat)}
                      className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
                      id={`category-btn-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    >
                      <div className={`w-16 h-16 rounded-full bg-white p-1 shadow-sm transition-all duration-300 ${selectedCategory === cat ? 'border-2 border-saffron scale-105 shadow-md' : 'border border-charcoal/10 group-hover:border-charcoal/30'}`}>
                        <img src={catImg} className="w-full h-full rounded-full object-cover" alt={cat} />
                      </div>
                      <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors duration-200 ${selectedCategory === cat ? 'text-saffron font-extrabold' : 'text-charcoal/60 group-hover:text-charcoal'}`}>
                        {cat}
                      </span>
                    </div>
                  );
                })}

              </div>
            </div>
          </section>
        </>
      )}

      {/* 4. POPULAR DISHES / MENU ENGINE or FULL MENU SUBPAGE */}
      <section ref={menuRef} className="bg-cream py-16 px-6" id="section-popular-menu">
        <div className="max-w-7xl mx-auto">
          {/* --- HOMEPAGE HIGHLIGHTS VIEW (MAX 6 ITEMS) --- */}
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-charcoal/10">
              <div className="text-left">
                <span className="text-xs font-bold text-saffron tracking-wider uppercase font-mono">Chef's Handpicked Favourites</span>
                <h2 className="font-display font-bold text-4xl text-charcoal mt-1">Today's Most Ordered</h2>
                <p className="text-xs text-charcoal/60 mt-1 max-w-xl font-normal">
                  These 6 signature recipes represent the beating heart of Curry Delight. They get ordered continuously every single day!
                </p>
              </div>
              
              {/* Secondary navigation action to Full Menu */}
              <button 
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  navigateTo('/order');
                }}
                className="mt-4 md:mt-0 flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-saffron hover:text-[#d15423] transition-colors cursor-pointer"
                id="browse-all-link-top"
              >
                <span>Browse Our Menu (180+ Dishes)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Grid Layout of Exactly 6 Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {bestsellerMenuItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleOpenCustomizer(item)}
                  className="bg-white rounded-3xl overflow-hidden border border-charcoal/10 hover:border-saffron/40 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between cursor-pointer focus-within:ring-2 focus-within:ring-saffron"
                >
                  <div>
                    {/* Visual Card Media */}
                    <div className="relative aspect-[4/3] bg-charcoal/5 overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      
                      {/* AI tag */}
                      <div className="absolute bottom-2.5 right-2.5 bg-charcoal/70 backdrop-blur-xs text-[8px] text-white px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold z-10 select-none">
                        AI Generated
                      </div>

                      {/* Veg / Non-Veg Overlay */}
                      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 bg-charcoal/65 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
                        <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'} border border-white`} />
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider">{item.isVeg ? 'Veg' : 'Non-Veg'}</span>
                      </div>

                      {/* Bestseller Badge */}
                      <div className="absolute top-2.5 left-2.5 bg-saffron text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-md flex items-center space-x-1 uppercase tracking-wider font-sans">
                        <Award className="w-3.5 h-3.5" />
                        <span>Bestseller</span>
                      </div>
                    </div>

                    {/* Card Content details */}
                    <div className="p-5 space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal/50 font-bold">
                          {item.category}
                        </span>

                        {/* Spice Level shorthand */}
                        {item.spiceLevel && (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider flex-shrink-0 ${
                            item.spiceLevel === 'mild' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            item.spiceLevel === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                            🌶️ {item.spiceLevel}
                          </span>
                        )}
                      </div>

                      <h3 className="font-display font-bold text-xl text-charcoal tracking-tight group-hover:text-saffron transition-colors">
                        {item.name}
                      </h3>

                      <p className="text-xs text-charcoal/70 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Pricing and Action quick-buy */}
                  <div className="p-5 pt-0 flex items-center justify-between border-t border-charcoal/5 mt-auto">
                    <div>
                      <span className="text-[9px] text-charcoal/40 block font-bold uppercase tracking-wider">Price</span>
                      <span className="font-sans font-extrabold text-xl text-saffron font-tabular-nums">
                        ₹{item.price}
                      </span>
                    </div>

                    {/* Quick Add Button */}
                    <button 
                      onClick={(e) => handleQuickAdd(item, e)}
                      className="bg-charcoal text-white hover:bg-saffron p-2.5 rounded-full transition-all duration-300 cursor-pointer shadow-sm focus:outline-none hover:scale-105 active:scale-95"
                      title="Quick Add to Cart"
                      id={`quick-add-${item.id}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* GORGEOUS PROMINENT CTA CARD for Full Master Menu */}
            <div className="mt-14 bg-gradient-to-br from-charcoal to-[#1a1a1a] rounded-3xl p-8 md:p-12 text-white border border-white/5 relative overflow-hidden shadow-xl text-center md:text-left">
              <div className="absolute top-0 right-0 w-64 h-64 bg-saffron/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div className="space-y-3 max-w-2xl text-left">
                  <span className="text-xs font-mono font-bold text-saffron uppercase tracking-widest block">The Master Kitchen Menu</span>
                  <h3 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight">
                    Craving Something Else?
                  </h3>
                  <p className="text-sm text-cream/70 leading-relaxed font-normal">
                    Discover our entire menu featuring over 150 dishes, including our sizzling appetizers, slow-simmered regional curries, tandoor-baked flatbreads, and handcrafted milkshakes.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    navigateTo('/order');
                  }}
                  className="bg-saffron hover:bg-[#d15423] text-white font-bold text-sm px-8 py-4 rounded-full transition-all flex items-center space-x-2 cursor-pointer shadow-md hover:scale-102 active:scale-98 whitespace-nowrap"
                  id="cta-explore-full-menu"
                >
                  <span>Browse Our Menu (180+ Items)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!isFullMenuSubpageActive && (
        <>
          {/* 6. COHESIVE ROOT: ABOUT / ROOTS SECTION (Cream background, photo forward) */}
      <section ref={aboutRef} className="bg-cream py-20 px-6 border-b border-charcoal/10" id="section-our-roots">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Single portrait image */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden aspect-[3/4] max-h-[550px] w-full shadow-lg border border-charcoal/5 group bg-charcoal/5">
              <img 
                src="/src/assets/images/royal_thali_1783109108597.jpg" 
                alt="Our Heritage Royal Thali" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
              />
            </div>
          </div>

          {/* Text narrative */}
          <div className="lg:col-span-6 text-left space-y-6">
            <div>
              <span className="text-xs font-bold text-saffron tracking-wider uppercase font-mono">Our Roots & Heritage</span>
              <h2 className="font-display font-bold text-4xl text-charcoal mt-1">From Our Clay Tandoor to Your Dining Table</h2>
            </div>

            <p className="text-sm md:text-base text-charcoal/80 leading-relaxed font-normal">
              Walk into our kitchen and it smells the way a real Indian kitchen should - cumin blooming in hot oil, garlic and ginger going in first, spices ground fresh, not poured from a packet.
            </p>

            <p className="text-sm md:text-base text-charcoal/80 leading-relaxed font-normal">
              Our food follow recipes that started in the family kitchen long before they reached a restaurant plate - the same dal, the same gravies, made the same way at home.
            </p>

            <p className="text-sm md:text-base text-charcoal/80 leading-relaxed font-normal">
              Every curry is made to order, slow enough to build real flavor, never rushed just to turn a table. That's the whole idea - food that tastes like it was made for you, not assembled for a menu.
            </p>

            <p className="text-sm md:text-base text-charcoal/80 leading-relaxed font-normal">
              And because every family's cravings don't stop at curry, we've built out the rest of the menu too - tandoori kebabs, Chinese-style noodles and gravies, wood-fired pizza, rolls, shakes, and more. One table, everyone fed.
            </p>

            <div className="pt-2 flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="bg-saffron/10 p-2.5 rounded-full text-saffron">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-charcoal uppercase tracking-wider font-mono">Hygienic Kitchen</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-saffron/10 p-2.5 rounded-full text-saffron">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-charcoal uppercase tracking-wider font-mono">Local Deliveries</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 7. GALLERY SECTION */}
      <Gallery galleryRef={galleryRef} images={siteContent.galleryImages} />


            </>
          )}
        </motion.div>
      )}

        {currentPath === '/order' && (
          <motion.div
            key="order-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
          >
            <OnlineOrdering 
              cart={cart}
              setCart={setCart}
              onOpenCustomizer={handleOpenCustomizer}
              navigateTo={navigateTo}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          </motion.div>
        )}

        {currentPath === '/reserve' && (
          <motion.div
            key="reserve-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
          >
            <TableReservation navigateTo={navigateTo} />
          </motion.div>
        )}

        {currentPath === '/celebrations' && (
          <motion.div
            key="celebrations-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
          >
            <Celebrations navigateTo={navigateTo} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. FOOTER SECTION (Charcoal Background) */}
      <footer ref={contactRef} className="bg-charcoal text-text-on-dark pt-16 pb-20 px-6 border-t border-white/5 relative z-10" id="section-footer">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Col 1: About wordmark */}
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white flex items-center justify-center border border-white/10 shadow-sm flex-shrink-0">
                <img src="/favicon.png" className="w-full h-full object-cover" alt="Curry Delight Logo" />
              </div>
              <span className="font-display font-bold text-2xl text-white block">Curry Delight</span>
            </div>
            <p className="text-cream/70 text-xs leading-relaxed max-w-xs font-normal">
              Proudly family-owned and serving real, freshly roasted food recipes in Kahalgaon, Bihar. Experience the warm, true comfort of home-cooked Indian culinary excellence.
            </p>
            <div className="pt-2 text-[10px] text-cream/45 font-mono tracking-wider uppercase font-semibold">
              A delight in every bite
            </div>
          </div>

          {/* Col 2: Business details */}
          <div className="space-y-4 text-left">
            <span className="text-[11px] text-saffron font-bold uppercase tracking-widest font-mono block">Our Location</span>
            
            <div className="space-y-3.5 text-xs text-cream/85">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-saffron mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">Shiv Parvati Nagar, Block Rd, Kahalgaon, Bihar 813214</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-saffron flex-shrink-0" />
                <span>+91 70615 91831 (Local Orders)</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Clock className="w-4 h-4 text-saffron flex-shrink-0" />
                <span>Open Daily: 11:30 AM — 10:30 PM</span>
              </div>
            </div>
          </div>

          {/* Col 3: Delivery Zones */}
          <div className="space-y-4 text-left">
            <span className="text-[11px] text-saffron font-bold uppercase tracking-widest font-mono block">Delivery & Pickup</span>
            <p className="text-cream/70 text-xs leading-relaxed font-normal">
              We deliver hot within Kahalgaon proper, including NTPC Township, Block Road, and surrounding neighborhoods.
            </p>
          </div>

          {/* Col 4: Action Buttons */}
          <div className="space-y-4 text-left flex flex-col justify-start">
            <span className="text-[11px] text-saffron font-bold uppercase tracking-widest font-mono block">Our Experiences</span>
            
            <div className="space-y-3 pt-1">
              <button 
                onClick={() => navigateTo('/order')}
                className="w-full text-center bg-saffron text-white hover:bg-[#d15423] font-bold text-xs py-3.5 px-4 rounded-full shadow-md transition-colors cursor-pointer focus:outline-none"
                id="footer-order-cta"
              >
                Our Full Menu
              </button>
              
              <button 
                onClick={() => navigateTo('/reserve')}
                className="w-full text-center border border-white/20 hover:border-white hover:bg-white/5 text-white font-semibold text-xs py-3.5 px-4 rounded-full transition-colors cursor-pointer focus:outline-none"
                id="footer-reserve-cta"
              >
                Reserve a Table
              </button>

              <button 
                onClick={() => navigateTo('/celebrations')}
                className="w-full text-center border border-white/20 hover:border-white hover:bg-white/5 text-white font-semibold text-xs py-3.5 px-4 rounded-full transition-colors cursor-pointer focus:outline-none"
                id="footer-celebrations-cta"
              >
                Host a Celebration
              </button>

              <button 
                onClick={() => {
                  if (currentPath !== '/') {
                    navigateTo('/', () => scrollToRef(galleryRef));
                  } else {
                    scrollToRef(galleryRef);
                  }
                }} 
                className="w-full text-center border border-white/20 hover:border-white hover:bg-white/5 text-white font-semibold text-xs py-3.5 px-4 rounded-full transition-colors cursor-pointer focus:outline-none"
                id="footer-gallery-cta"
              >
                View Gallery
              </button>
            </div>
          </div>

        </div>

        {/* Outer credit lines */}
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-cream/40">
          <p>© {new Date().getFullYear()} Curry Delight Kahalgaon. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 sm:mt-0 font-medium font-mono items-center">
            <button 
              onClick={() => navigateTo('/admin')} 
              className="hover:text-saffron transition-colors font-bold tracking-wider uppercase cursor-pointer"
              title="Internal Staff Control & Live Order Queue"
            >
              🔑 Staff Portal
            </button>
            <span>•</span>
            <span className="hover:text-cream/65 cursor-help" title="Local heritage curation">Bihar Culinary Pride</span>
            <span>•</span>
            <a href="https://www.aaravworld.tech/" target="_blank" rel="noopener noreferrer" className="hover:text-saffron transition-colors font-bold tracking-wider" title="Aarav World Tech">
              BUILT BY AARAV WORLD
            </a>
          </div>
        </div>
      </footer>


      {/* 9. STICKY MOBILE BOTTOM BAR (Required for reachability within one tap on phone) */}
      <div className="fixed bottom-0 inset-x-0 bg-charcoal border-t border-white/10 py-3 px-2 z-35 flex items-center justify-around lg:hidden shadow-2xl">
        <button 
          onClick={() => navigateTo('/order')}
          className={`flex flex-col items-center space-y-1 text-center cursor-pointer focus:outline-none transition-colors ${currentPath === '/order' ? 'text-saffron' : 'text-cream/70 hover:text-white'}`}
          id="mobile-bottom-order-btn"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Order Online</span>
        </button>

        <button 
          onClick={() => navigateTo('/reserve')}
          className={`flex flex-col items-center space-y-1 text-center cursor-pointer focus:outline-none transition-colors ${currentPath === '/reserve' ? 'text-saffron' : 'text-cream/70 hover:text-white'}`}
          id="mobile-bottom-reserve-btn"
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Book Table</span>
        </button>

        <button 
          onClick={() => navigateTo('/celebrations')}
          className={`flex flex-col items-center space-y-1 text-center cursor-pointer focus:outline-none transition-colors ${currentPath === '/celebrations' ? 'text-saffron' : 'text-cream/70 hover:text-white'}`}
          id="mobile-bottom-celebrations-btn"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Celebrations</span>
        </button>
      </div>

      {/* FLOATING CART BUTTON FOR MOBILE (Shows when there are items in the cart) */}
      {cartItemsCount > 0 && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-20 right-5 bg-saffron text-white rounded-full p-4 shadow-xl z-35 flex items-center justify-center cursor-pointer focus:outline-none border border-white/10 hover:scale-105 transition-transform"
          id="mobile-floating-cart-btn"
        >
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute -top-2.5 -right-2.5 bg-white text-saffron text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center font-tabular-nums border border-saffron shadow-xs">
              {cartItemsCount}
            </span>
          </div>
        </button>
      )}


      {/* --- CART SLIDE-IN PANEL --- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-charcoal z-50 cursor-pointer"
            />

            {/* Panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col justify-between"
              id="cart-slide-panel"
            >
              {/* Header */}
              <div className="bg-charcoal text-text-on-dark p-5 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 text-left">
                  <ShoppingBag className="w-5 h-5 text-saffron" />
                  <span className="font-display font-semibold text-lg text-white">Your Selection</span>
                  <span className="bg-white/10 text-white/80 text-xs px-2 py-0.5 rounded-full font-bold font-tabular-nums">
                    {cartItemsCount}
                  </span>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 hover:text-saffron transition-colors cursor-pointer text-cream/70 focus:outline-none"
                  aria-label="Close Cart"
                  id="close-cart-btn"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Scrollable Body (Items + Summary + Checkout) */}
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-charcoal/10">
                
                <div className="p-5 space-y-6">
                  {/* Status/Discount Banner */}
                  {cart.length > 0 && (
                    cartSubtotal >= SPECIAL_OFFER.minOrder ? (
                      <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-2xl flex items-start space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider block font-mono">DELIGHT15 Applied!</span>
                          <span className="text-xs font-normal text-emerald-800/95 mt-0.5 block">Congrats! You've unlocked 15% OFF on your Kahalgaon order.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-2xl flex items-start space-x-3">
                        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider block font-mono">Unlock 15% Savings</span>
                          <span className="text-xs font-normal text-amber-800/95 mt-0.5 block">Add ₹{SPECIAL_OFFER.minOrder - cartSubtotal} more to receive 15% off with code DELIGHT15.</span>
                        </div>
                      </div>
                    )
                  )}

                  {cart.length === 0 ? (
                    <div className="text-center py-20 space-y-4">
                      <ShoppingBag className="w-16 h-16 text-charcoal/15 mx-auto" />
                      <h3 className="font-display font-semibold text-lg text-charcoal">Your cart is empty</h3>
                      <p className="text-xs text-charcoal/50 max-w-xs mx-auto">
                        Explore our rich family recipe menu, tap quick add, or customize your spice preferences.
                      </p>
                      <button 
                        onClick={() => { setIsCartOpen(false); scrollToSection(menuRef, 'menu'); }}
                        className="bg-saffron text-white hover:bg-[#d15423] font-bold text-xs px-6 py-3 rounded-full cursor-pointer shadow-md"
                      >
                        Browse Our Menu
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-left">
                      {cart.map((item, idx) => (
                        <div key={`${item.menuItem.id}-${idx}`} className="flex items-start justify-between p-4 bg-cream/35 border border-charcoal/5 rounded-2xl space-x-4">
                          <div className="w-16 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-charcoal/5 relative shadow-inner">
                            <img src={item.menuItem.image} alt={item.menuItem.name} className="w-full h-full object-cover" />
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="text-xs font-bold text-charcoal truncate">{item.menuItem.name}</h4>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-charcoal/55">
                              <span className="font-semibold uppercase font-mono bg-charcoal/5 px-1.5 py-0.5 rounded text-[9px]">
                                🌶️ {item.selectedSpice === 'hot' ? 'Bihari Spicy' : item.selectedSpice === 'medium' ? 'Medium' : 'Mild'}
                              </span>
                              {item.specialInstructions && <span className="italic truncate max-w-[120px]">"{item.specialInstructions}"</span>}
                            </div>

                            {/* Thali selections list */}
                            {item.thaliCustomizations && (
                              <div className="text-[9px] text-charcoal/70 bg-saffron/5 p-2 rounded-xl space-y-0.5 border border-saffron/10 mt-1">
                                <div className="font-bold text-saffron uppercase tracking-wider text-[8px] font-mono">Thali Customisations:</div>
                                <div>• Curry: <span className="font-semibold text-charcoal">{item.thaliCustomizations.currySwap}</span></div>
                                <div>• Bread: <span className="font-semibold text-charcoal">{item.thaliCustomizations.breadSwap}</span></div>
                                <div>• Sweet: <span className="font-semibold text-charcoal">{item.thaliCustomizations.dessertChoice}</span></div>
                                {item.thaliCustomizations.extraRice && <div className="text-saffron font-semibold">• Extra Rice added</div>}
                              </div>
                            )}

                            {/* Addons selection list */}
                            {item.selectedAddons && item.selectedAddons.length > 0 && (
                              <div className="text-[9px] text-charcoal/70 bg-charcoal/5 p-2 rounded-xl space-y-0.5 mt-1">
                                <div className="font-bold text-charcoal/60 uppercase tracking-wider text-[8px] font-mono">Add-ons:</div>
                                {item.selectedAddons.map((addon, aIdx) => (
                                  <div key={aIdx}>• <span className="font-semibold text-charcoal">{addon}</span></div>
                                ))}
                              </div>
                            )}
                            
                            {/* Qty Steppers */}
                            <div className="flex items-center space-x-2 pt-1.5">
                              <button 
                                onClick={() => updateCartQty(idx, -1)}
                                className="p-1.5 bg-white rounded-lg border border-charcoal/10 hover:bg-charcoal/5 cursor-pointer shadow-xs"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="text-xs font-bold font-tabular-nums w-5 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateCartQty(idx, 1)}
                                className="p-1.5 bg-white rounded-lg border border-charcoal/10 hover:bg-charcoal/5 cursor-pointer shadow-xs"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>

                          <div className="text-right flex flex-col justify-between items-end h-full">
                            <button 
                              onClick={() => removeFromCart(idx)}
                              className="text-charcoal/40 hover:text-red-500 p-0.5 cursor-pointer focus:outline-none transition-colors"
                              aria-label="Delete item"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold text-saffron font-tabular-nums block mt-2">
                              ₹{item.menuItem.price * item.quantity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Summary / Checkout action (Now inside scrollable area) */}
                {cart.length > 0 && (
                  <div className="border-t border-charcoal/10 p-6 bg-cream/30 space-y-6 text-left">
                    
                    {/* Summary math */}
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center text-charcoal/75">
                        <span>Subtotal</span>
                        <span className="font-bold font-tabular-nums">₹{cartSubtotal}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between items-center text-emerald-700 font-bold">
                          <span>DELIGHT15 Offer (15% OFF)</span>
                          <span className="font-bold font-tabular-nums">-₹{discountAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-charcoal/75">
                        <span>Delivery Fee</span>
                        <span className="font-bold font-tabular-nums">{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                      </div>
                      <div className="flex justify-between items-center text-base font-bold text-charcoal pt-4 border-t border-charcoal/10">
                        <span>Grand Total</span>
                        <span className="text-saffron font-tabular-nums text-xl">₹{cartTotal}</span>
                      </div>
                    </div>

                    {/* Checkout Form Toggle */}
                    {!isCheckoutOpen ? (
                      <button 
                        onClick={() => setIsCheckoutOpen(true)}
                        className="w-full bg-saffron hover:bg-[#d15423] text-white font-bold text-base py-4 rounded-full flex items-center justify-center space-x-2 shadow-lg cursor-pointer focus:outline-none hover:scale-102 transition-all"
                        id="cart-checkout-toggle-btn"
                      >
                        <span>Proceed to Checkout</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <div className="space-y-5 pt-4 border-t border-charcoal/10">
                        <div className="flex items-center justify-between">
                          <h3 className="font-display font-bold text-sm text-charcoal uppercase tracking-wider">Delivery Details</h3>
                          <button 
                            onClick={() => setIsCheckoutOpen(false)}
                            className="text-xs font-bold text-saffron hover:underline cursor-pointer"
                          >
                            Back to Items
                          </button>
                        </div>

                        <form onSubmit={handlePlaceOrder} className="space-y-5">
                          
                          {/* Toggle delivery vs pickup */}
                          <div className="grid grid-cols-2 gap-2 bg-charcoal/5 p-1 rounded-2xl">
                            <button
                              type="button"
                              onClick={() => setCheckoutData({ ...checkoutData, deliveryType: 'delivery' })}
                              className={`py-2.5 text-xs font-bold rounded-xl cursor-pointer transition-all ${checkoutData.deliveryType === 'delivery' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/60'}`}
                            >
                              📍 Home Delivery
                            </button>
                            <button
                              type="button"
                              onClick={() => setCheckoutData({ ...checkoutData, deliveryType: 'pickup' })}
                              className={`py-2.5 text-xs font-bold rounded-xl cursor-pointer transition-all ${checkoutData.deliveryType === 'pickup' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/60'}`}
                            >
                              🏪 Self Takeaway
                            </button>
                          </div>

                          {/* Live Estimated Time Display */}
                          <div className="bg-saffron/10 border border-saffron/30 rounded-2xl p-4 flex items-start space-x-3">
                            <Clock className="w-5 h-5 text-saffron shrink-0 mt-0.5 animate-pulse" />
                            <div>
                              <p className="text-xs font-bold text-charcoal">
                                Live Preparation/Delivery ETA: {' '}
                                <span className="text-saffron">
                                  {checkoutData.deliveryType === 'delivery' 
                                    ? `${45 + (settings?.kitchenBufferMinutes || 0)}-${55 + (settings?.kitchenBufferMinutes || 0)}` 
                                    : `${20 + (settings?.kitchenBufferMinutes || 0)}-${25 + (settings?.kitchenBufferMinutes || 0)}`
                                  } mins
                                </span>
                              </p>
                              {settings && settings.kitchenBufferMinutes > 0 && (
                                <p className="text-[10px] text-charcoal/70 mt-1 flex items-center gap-1 font-mono">
                                  ⚠️ +{settings.kitchenBufferMinutes}m rush hour delay added by chef
                                </p>
                              )}
                              {(!settings || settings.kitchenBufferMinutes === 0) && (
                                <p className="text-[10px] text-charcoal/50 mt-1 font-mono">
                                  ⚡ Kitchen is prep-ready. Zero delay.
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 block ml-1">Full Name</label>
                            <input 
                              type="text"
                              required
                              placeholder="e.g. Aarav Kumar"
                              value={checkoutData.fullName}
                              onChange={(e) => setCheckoutData({ ...checkoutData, fullName: e.target.value })}
                              className="w-full border border-charcoal/20 rounded-2xl px-5 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-white font-sans transition-all"
                              id="checkout-name-input"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 block ml-1">Mobile Phone Number</label>
                            <input 
                              type="tel"
                              required
                              placeholder="e.g. +91 70615 91831"
                              value={checkoutData.phone}
                              onChange={(e) => setCheckoutData({ ...checkoutData, phone: e.target.value })}
                              className="w-full border border-charcoal/20 rounded-2xl px-5 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-white font-sans transition-all"
                              id="checkout-phone-input"
                            />
                          </div>

                          {checkoutData.deliveryType === 'delivery' && (
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 block ml-1">Home Address in Kahalgaon</label>
                              <input 
                                type="text"
                                required
                                placeholder="e.g. Quarter No. B-45, NTPC Colony, Kahalgaon"
                                value={checkoutData.address}
                                onChange={(e) => setCheckoutData({ ...checkoutData, address: e.target.value })}
                                className="w-full border border-charcoal/20 rounded-2xl px-5 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-white font-sans transition-all"
                                id="checkout-address-input"
                              />
                            </div>
                          )}

                          {/* Payment Selection */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 block ml-1">Payment Method</label>
                            <div className="grid grid-cols-2 gap-3">
                              <label className={`border-2 rounded-2xl p-4 flex flex-col items-center justify-center space-y-1 cursor-pointer text-[11px] transition-all ${checkoutData.paymentMethod === 'cod' ? 'border-saffron bg-saffron/5 font-bold text-saffron shadow-sm' : 'border-charcoal/10 text-charcoal/70 bg-white hover:border-charcoal/20'}`}>
                                <input 
                                  type="radio" 
                                  name="payment" 
                                  checked={checkoutData.paymentMethod === 'cod'}
                                  onChange={() => setCheckoutData({ ...checkoutData, paymentMethod: 'cod' })}
                                  className="accent-saffron h-4 w-4"
                                />
                                <span className="pt-1">Cash on {checkoutData.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                              </label>
                              
                              <label className={`border-2 rounded-2xl p-4 flex flex-col items-center justify-center space-y-1 cursor-pointer text-[11px] transition-all ${checkoutData.paymentMethod === 'upi' ? 'border-saffron bg-saffron/5 font-bold text-saffron shadow-sm' : 'border-charcoal/10 text-charcoal/70 bg-white hover:border-charcoal/20'}`}>
                                <input 
                                  type="radio" 
                                  name="payment" 
                                  checked={checkoutData.paymentMethod === 'upi'}
                                  onChange={() => setCheckoutData({ ...checkoutData, paymentMethod: 'upi' })}
                                  className="accent-saffron h-4 w-4"
                                />
                                <span className="pt-1">Pay with UPI</span>
                              </label>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 block ml-1">Special Instructions (Optional)</label>
                            <input 
                              type="text"
                              placeholder="e.g. ring bell, please deliver before 8 PM..."
                              value={checkoutData.specialInstructions}
                              onChange={(e) => setCheckoutData({ ...checkoutData, specialInstructions: e.target.value })}
                              className="w-full border border-charcoal/20 rounded-2xl px-5 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-saffron/20 bg-white font-sans transition-all"
                              id="checkout-instructions-input"
                            />
                          </div>

                          {/* Order Placement Trigger */}
                          <button 
                            type="submit"
                            className="w-full bg-charcoal hover:bg-charcoal/90 text-white font-bold text-base py-4.5 rounded-full flex items-center justify-center space-x-2 shadow-xl mt-6 cursor-pointer focus:outline-none hover:scale-102 active:scale-98 transition-all"
                            id="place-order-submit-btn"
                          >
                            <span>Confirm & Place Order (₹{cartTotal})</span>
                          </button>

                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* --- MENU ITEM CUSTOMIZATION MODAL --- */}
      <AnimatePresence>
        {customizingItem && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setCustomizingItem(null)}
              className="fixed inset-0 bg-charcoal z-55 cursor-pointer"
            />

            {/* Modal */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-xl w-full max-h-[90vh] md:w-full bg-white z-55 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left border border-charcoal/10"
              id="customizer-modal"
            >
              
              {/* Cover Photo */}
              <div className="relative h-48 md:h-56 bg-charcoal/5">
                <img src={customizingItem.image} alt={customizingItem.name} className="w-full h-full object-cover" />
                
                {/* AI tag */}
                <div className="absolute top-3 right-3 bg-charcoal/80 backdrop-blur-xs text-[8px] text-cream px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold z-10">
                  AI Generated
                </div>

                <button 
                  onClick={() => setCustomizingItem(null)}
                  className="absolute top-3 left-3 bg-charcoal/70 text-cream hover:bg-saffron p-1.5 rounded-full cursor-pointer focus:outline-none"
                  aria-label="Close"
                  id="close-customizer-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Details & options scrollable body */}
              <div className="p-6 overflow-y-auto space-y-6">
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${customizingItem.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-charcoal/60 font-bold">
                      {customizingItem.isVeg ? 'Vegetarian Heritage' : 'Non-Vegetarian'}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-2xl text-charcoal tracking-tight">
                    {customizingItem.name}
                  </h3>
                  <p className="text-xs md:text-sm text-charcoal/70 leading-relaxed font-normal">
                    {customizingItem.description}
                  </p>
                </div>

                {/* Option selection: Spice level */}
                {(customizingItem.category.toLowerCase().includes('gravies') || 
                  customizingItem.category.toLowerCase().includes('biryani') || 
                  customizingItem.category.toLowerCase().includes('starters') || 
                  customizingItem.category === 'Heritage Thalis') && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-charcoal/60 block">Specify Heat/Spice Level</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['mild', 'medium', 'hot'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setCustomSpice(level)}
                          className={`border rounded-xl p-3 text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                            customSpice === level 
                              ? 'border-saffron bg-saffron/5 text-saffron' 
                              : 'border-charcoal/10 text-charcoal/70 hover:bg-charcoal/5'
                          }`}
                        >
                          <span className="text-base">
                            {level === 'mild' ? '🌶️' : level === 'medium' ? '🌶️🌶️' : '🌶️🌶️🌶️'}
                          </span>
                          <span>
                            {level === 'mild' ? 'Mild' : level === 'medium' ? 'Medium' : 'Bihari Spicy'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- HERITAGE THALI CUSTOMIZER --- */}
                {customizingItem.category === 'Heritage Thalis' && (
                  <div className="space-y-4 border-t border-charcoal/5 pt-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-charcoal/60 block">Customise Your Thali Platter</span>
                    
                    {/* 1. Swap Curry Option */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-charcoal flex justify-between">
                        <span>Swap Main Curry:</span>
                        <span className="text-emerald-600 font-bold text-[10px] uppercase font-mono">Free Swap</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          'No swap (Original recipe)',
                          'Swap Paneer to Mix Veg',
                          'Swap Paneer to Dum Aloo',
                          'Swap Dal Makhani to Dal Fry',
                          'Swap Chicken to Fish Curry',
                          'Swap Paneer to Mushroom Masala'
                        ].filter(opt => {
                          if (customizingItem.id === 'thali-royal-veg' && opt.includes('Chicken')) return false;
                          if (customizingItem.id === 'thali-dehati-nonveg' && (opt.includes('Paneer to Mix Veg') || opt.includes('Paneer to Dum Aloo') || opt.includes('Paneer to Mushroom'))) return false;
                          return true;
                        }).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setThaliCurry(opt)}
                            className={`border text-[11px] p-2.5 rounded-xl text-left transition-all leading-snug ${
                              thaliCurry === opt 
                                ? 'border-saffron bg-saffron/5 text-saffron font-bold' 
                                : 'border-charcoal/10 text-charcoal/70 hover:bg-charcoal/5'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Swap Bread Option */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-charcoal flex justify-between">
                        <span>Tandoori Bread Selection:</span>
                        <span className="text-emerald-600 font-bold text-[10px] uppercase font-mono">Select One</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          '2 Tandoori Butter Rotis',
                          '2 Plain Rotis',
                          '1 Butter Naan',
                          '1 Garlic Naan (+₹15)',
                          '1 Laccha Paratha (+₹10)'
                        ].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setThaliBread(opt)}
                            className={`border text-[11px] p-2.5 rounded-xl text-left transition-all leading-snug ${
                              thaliBread === opt 
                                ? 'border-saffron bg-saffron/5 text-saffron font-bold' 
                                : 'border-charcoal/10 text-charcoal/70 hover:bg-charcoal/5'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Dessert Selection */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-charcoal flex justify-between">
                        <span>Select Sweet Treat:</span>
                        <span className="text-emerald-600 font-bold text-[10px] uppercase font-mono">Included</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Gulab Jamun (1pc)', 'Rasgulla (1pc)', 'Vanilla Cup'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setThaliDessert(opt)}
                            className={`border text-[11px] p-2 rounded-xl text-center transition-all leading-snug ${
                              thaliDessert === opt 
                                ? 'border-saffron bg-saffron/5 text-saffron font-bold' 
                                : 'border-charcoal/10 text-charcoal/70 hover:bg-charcoal/5'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4. Add Extra Rice Upgrade */}
                    <div className="flex items-center justify-between bg-cream/30 p-3 rounded-2xl border border-charcoal/5">
                      <div className="text-left pr-2">
                        <span className="text-xs font-bold text-charcoal block">Extra Basmati Rice portion</span>
                        <span className="text-[10px] text-charcoal/50 leading-none">Add double portion of premium long-grain rice</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setThaliExtraRice(!thaliExtraRice)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                          thaliExtraRice 
                            ? 'bg-saffron text-white shadow-xs' 
                            : 'bg-white text-charcoal/60 border border-charcoal/15'
                        }`}
                      >
                        {thaliExtraRice ? 'Added (+₹40)' : 'Add +₹40'}
                      </button>
                    </div>
                  </div>
                )}

                {/* --- NON-THALI ADDONS --- */}
                {customizingItem.category !== 'Heritage Thalis' && 
                 customizingItem.category !== 'Mocktails, Shakes & Beverages' && 
                 customizingItem.category !== 'Desserts & Accompaniments' && (
                  <div className="space-y-3 border-t border-charcoal/5 pt-4">
                    <label className="text-xs font-bold uppercase tracking-wider text-charcoal/60 block">Add-ons & Extra Upgrades</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: 'Extra Amul Cheese', price: 20 },
                        { name: 'Extra Cooking Butter', price: 15 },
                        { name: 'Extra Rice portion', price: 50 },
                        { name: 'Chef Special Garlic Dip', price: 10 },
                        { name: 'Mint Chutney & Salad', price: 0 }
                      ].filter(addon => {
                        if (customizingItem.category.includes('Breads') && addon.name.includes('Rice')) return false;
                        return true;
                      }).map((addon) => {
                        const isSelected = selectedAddons.includes(addon.name);
                        return (
                          <button
                            key={addon.name}
                            type="button"
                            onClick={() => {
                              setSelectedAddons(prev => 
                                prev.includes(addon.name) 
                                  ? prev.filter(a => a !== addon.name) 
                                  : [...prev, addon.name]
                              );
                            }}
                            className={`border text-[11px] p-2.5 rounded-xl text-left transition-all flex items-center justify-between leading-snug ${
                              isSelected 
                                ? 'border-saffron bg-saffron/5 text-saffron font-bold' 
                                : 'border-charcoal/10 text-charcoal/70 hover:bg-charcoal/5'
                            }`}
                          >
                            <span>{addon.name}</span>
                            <span className="text-[10px] text-saffron font-bold">{addon.price > 0 ? `+₹${addon.price}` : 'FREE'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-charcoal/60 block">Kitchen Instructions (Optional)</label>
                  <input 
                    type="text"
                    placeholder="e.g. make it extra creamy, extra green chutney, no butter on naan..."
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    className="w-full border border-charcoal/20 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-saffron bg-cream/10 font-sans"
                    id="customizer-notes-input"
                  />
                </div>

                {/* Quantity selection */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-charcoal/60 block">Quantity</label>
                    <div className="flex items-center space-x-3.5 mt-2 bg-charcoal/5 p-1 rounded-xl w-32 justify-between">
                      <button 
                        onClick={() => setCustomQty(prev => Math.max(1, prev - 1))}
                        className="p-1.5 bg-white rounded-lg shadow-xs hover:bg-charcoal/5 cursor-pointer text-charcoal"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-bold font-tabular-nums">{customQty}</span>
                      <button 
                        onClick={() => setCustomQty(prev => prev + 1)}
                        className="p-1.5 bg-white rounded-lg shadow-xs hover:bg-charcoal/5 cursor-pointer text-charcoal"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-charcoal/50 block font-sans">Total Price</span>
                    <span className="font-display font-bold text-2xl text-saffron font-tabular-nums">
                      ₹{(customizingItem.price + calculateAddedPrice(customizingItem)) * customQty}
                    </span>
                  </div>
                </div>

              </div>

              {/* CTA slide-panel buttons */}
              <div className="border-t border-charcoal/10 p-5 bg-cream/15 flex gap-3">
                <button 
                  onClick={() => setCustomizingItem(null)}
                  className="flex-1 text-center border border-charcoal/20 hover:border-charcoal text-charcoal font-bold text-xs py-3.5 rounded-full cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddCustomized}
                  className="flex-1 text-center bg-saffron hover:bg-[#d15423] text-white font-bold text-xs py-3.5 rounded-full cursor-pointer focus:outline-none transition-colors"
                  id="confirm-customized-add-btn"
                >
                  Add {customQty} Item(s)
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* --- ORDER CONFIRMATION SCREEN MODAL --- */}
      <AnimatePresence>
        {orderConfirmation && (
          <div className="fixed inset-0 z-55 overflow-y-auto bg-charcoal/70 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 text-left space-y-6 relative border border-charcoal/5"
              id="confirmation-modal"
            >
              
              <div className="text-center space-y-2">
                <div className="bg-emerald-100 p-3.5 rounded-full text-emerald-600 inline-flex items-center justify-center mb-1">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <h3 className="font-display font-bold text-2xl text-charcoal">
                  Your Order is Cooking!
                </h3>
                <p className="text-xs text-emerald-800 font-bold bg-emerald-50 px-3.5 py-1.5 rounded-full inline-block font-mono">
                  Order Code: {orderConfirmation.orderId}
                </p>
                <p className="text-xs text-charcoal/50 font-normal">
                  Estimated Ready Time: <strong className="text-charcoal font-bold">{orderConfirmation.estimatedTime}</strong>
                </p>
              </div>

              {/* Order breakdown summary */}
              <div className="border-y border-charcoal/10 py-5 space-y-4 text-xs text-charcoal/90">
                <h4 className="font-bold text-charcoal uppercase tracking-wider text-[10px] font-mono">Order Summary</h4>
                
                <div className="max-h-36 overflow-y-auto space-y-2.5">
                  {orderConfirmation.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between font-medium">
                      <span>
                        {item.menuItem.name} <strong className="text-charcoal">x{item.quantity}</strong>
                        <span className="text-[10px] text-charcoal/50 ml-1.5">({item.selectedSpice})</span>
                      </span>
                      <span className="font-bold font-tabular-nums text-charcoal">₹{item.menuItem.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-charcoal/10 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-charcoal/70">
                    <span>Subtotal</span>
                    <span className="font-tabular-nums">₹{orderConfirmation.subtotal}</span>
                  </div>
                  {orderConfirmation.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>DELIGHT15 Discount (15%)</span>
                      <span className="font-tabular-nums">-₹{orderConfirmation.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-charcoal/70">
                    <span>Delivery Charge</span>
                    <span className="font-tabular-nums">
                      {orderConfirmation.deliveryFee === 0 ? 'FREE' : `₹${orderConfirmation.deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-charcoal border-t border-charcoal/10 pt-3">
                    <span>Grand Total Paid via {orderConfirmation.summary.paymentMethod.toUpperCase()}</span>
                    <span className="text-saffron font-tabular-nums text-lg">₹{orderConfirmation.total}</span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="bg-cream/40 p-4 rounded-2xl border border-charcoal/5 space-y-1.5 mt-2 text-[11px] leading-relaxed">
                  <div><strong>Customer Name:</strong> {orderConfirmation.summary.fullName}</div>
                  <div><strong>Phone Line:</strong> {orderConfirmation.summary.phone}</div>
                  {orderConfirmation.summary.deliveryType === 'delivery' ? (
                    <div><strong>Home Address:</strong> {orderConfirmation.summary.address}</div>
                  ) : (
                    <div><strong>Takeaway Type:</strong> Self Pickup at Curry Delight, Shiv Parvati Nagar (Block Rd)</div>
                  )}
                  {orderConfirmation.summary.specialInstructions && (
                    <div className="italic mt-1 text-charcoal/65"><strong>Note:</strong> "{orderConfirmation.summary.specialInstructions}"</div>
                  )}
                </div>
              </div>

              {/* Order completion deep links */}
              <div className="space-y-3.5">
                <button 
                  onClick={() => handleSendOrderWhatsApp(orderConfirmation)}
                  className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm py-4 rounded-full flex items-center justify-center space-x-2 shadow-md cursor-pointer focus:outline-none hover:scale-101 transition-all"
                  id="whatsapp-send-order-btn"
                >
                  <MessageSquare className="w-4 h-4 fill-white text-[#25D366]" />
                  <span>Send Order to WhatsApp (Recommended)</span>
                </button>
                
                <button 
                  onClick={() => setOrderConfirmation(null)}
                  className="w-full bg-charcoal hover:bg-charcoal/90 text-white font-bold text-xs py-3 rounded-full cursor-pointer focus:outline-none text-center"
                  id="close-confirmation-modal-btn"
                >
                  Dismiss & Back to Site
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
