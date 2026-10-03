import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Plus, Minus, X, AlertCircle, ShoppingBag, 
  MapPin, Phone, Clock, ArrowRight, ArrowLeft,
  CheckCircle2, Info, Flame, Award, HelpCircle, Send,
  Leaf, Utensils, MessageSquare
} from 'lucide-react';
import { MenuItem, CartItem, OrderDetails } from '../types';
import { adminStore, AdminSettings } from '../lib/adminStore';
import { CATEGORY_IMAGES } from '../data';

interface OnlineOrderingProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onOpenCustomizer: (item: MenuItem) => void;
  navigateTo: (path: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

// Two-tier Category Hierarchy (Step 3: Starters & Soups / Mains / Quick Bites / Drinks & Desserts)
const MENU_TIERS = [
  {
    id: 'starters-soups',
    name: 'Starters & Soups',
    description: 'Crisp appetizers, comforting broths, and authentic clay oven specialties',
    categories: [
      'Soups',
      'Starters (Veg)',
      'Starters (Non-Veg)',
      'From the Tandoor (Veg)',
      'From the Tandoor (Non-Veg)'
    ]
  },
  {
    id: 'mains',
    name: 'Mains',
    description: 'Slow-simmered rich curries, fragrant biryanis, fresh tandoori breads & thalis',
    categories: [
      'Classic Indian Gravies (Veg)',
      'Classic Indian Gravies (Non-Veg)',
      'Chinese Gravies',
      'Rice & Biryani',
      'Indian Breads',
      'Heritage Thalis'
    ]
  },
  {
    id: 'quick-bites',
    name: 'Quick Bites',
    description: 'Freshly tossed pizzas, golden rolls, grilled sandwiches & noodles',
    categories: [
      'Pizza Hub',
      'Noodle Junction',
      'Rolls',
      'Sandwiches',
      'French Fries'
    ]
  },
  {
    id: 'drinks-desserts',
    name: 'Drinks & Desserts',
    description: 'Chilled shakes, craft mocktails, and traditional sweet delicacies',
    categories: [
      'Mocktails, Shakes & Beverages',
      'Desserts & Accompaniments'
    ]
  }
];

export default function OnlineOrdering({ 
  cart, 
  setCart, 
  onOpenCustomizer, 
  navigateTo,
  selectedCategory,
  setSelectedCategory
}: OnlineOrderingProps) {
  // Sync sold out items and menu items in real-time from localStorage
  const [soldOutIds, setSoldOutIds] = useState<string[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  
  useEffect(() => {
    setSoldOutIds(adminStore.getSoldOutIds());
    setMenuItems(adminStore.getMenuItems());
    setSettings(adminStore.getSettings());
    const handleStorageChange = () => {
      setSoldOutIds(adminStore.getSoldOutIds());
      setMenuItems(adminStore.getMenuItems());
      setSettings(adminStore.getSettings());
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('adminStoreUpdate', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('adminStoreUpdate', handleStorageChange);
    };
  }, []);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [activeTier, setActiveTier] = useState<string>('all');
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);

  const scrollToCategory = (catName: string) => {
    setIsCategorySheetOpen(false);
    const elementId = `cat-${catName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const el = document.getElementById(elementId);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const scrollToTier = (tierId: string) => {
    setIsCategorySheetOpen(false);
    const el = document.getElementById(`tier-${tierId}`);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Checkout form State
  const [checkoutData, setCheckoutData] = useState<OrderDetails>({
    fullName: '',
    phone: '',
    address: '',
    deliveryType: 'delivery',
    paymentMethod: 'cod',
    specialInstructions: ''
  });

  // Local state for simplified order confirmation screen (Step 2)
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    estimatedTime: string;
    items: CartItem[];
    summary: OrderDetails;
    subtotal: number;
    discount: number;
    deliveryFee: number;
    total: number;
  } | null>(null);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (settings?.offer?.enabled && cartSubtotal >= settings.offer.minOrder) {
      return Math.round(cartSubtotal * (settings.offer.discountPercent / 100));
    }
    return 0;
  }, [cartSubtotal, settings]);

  const deliveryFee = useMemo(() => {
    if (checkoutData.deliveryType === 'pickup' || cart.length === 0) return 0;
    return cartSubtotal >= (settings?.deliveryFeeThreshold || 500) ? 0 : (settings?.deliveryFeeAmount || 40);
  }, [cartSubtotal, checkoutData.deliveryType, cart, settings]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - discountAmount + deliveryFee);
  }, [cartSubtotal, discountAmount, deliveryFee]);

  const handleQuickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
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

  // STEP 2: Checkout handles order purely in local state — NO database write
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutData.fullName || !checkoutData.phone || (checkoutData.deliveryType === 'delivery' && !checkoutData.address)) {
      alert("Please enter all required fields.");
      return;
    }

    const phoneDigits = checkoutData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (settings && settings.isKitchenOpen === false) {
      alert("Sorry, the kitchen is currently closed. We are not accepting online orders at this moment.");
      return;
    }

    const orderId = `CD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const kitchenBuffer = settings?.kitchenBufferMinutes || 0;
    const baseMin = checkoutData.deliveryType === 'delivery' ? 40 : 15;
    const baseMax = checkoutData.deliveryType === 'delivery' ? 50 : 20;
    const estimatedTime = `${baseMin + kitchenBuffer}-${baseMax + kitchenBuffer} mins`;

    const confirmation = {
      orderId,
      estimatedTime,
      items: [...cart],
      summary: { ...checkoutData },
      subtotal: cartSubtotal,
      discount: discountAmount,
      deliveryFee,
      total: cartTotal
    };

    // No database write — order flows via WhatsApp or Call to Order
    setConfirmedOrder(confirmation);
    setCart([]);
  };

  const buildWhatsAppMessage = (order: typeof confirmedOrder) => {
    if (!order) return '';

    let itemsText = '';
    order.items.forEach((item, idx) => {
      let details = ` [${item.selectedSpice === 'hot' ? 'Bihari Spicy' : item.selectedSpice === 'medium' ? 'Medium' : 'Mild'}]`;
      if (item.thaliCustomizations) {
        details += `\n   - Curry Swap: ${item.thaliCustomizations.currySwap}`;
        details += `\n   - Bread Choice: ${item.thaliCustomizations.breadSwap}`;
        details += `\n   - Dessert Choice: ${item.thaliCustomizations.dessertChoice}`;
        if (item.thaliCustomizations.extraRice) details += `\n   - Added Extra Rice (+₹40)`;
      }
      if (item.selectedAddons && item.selectedAddons.length > 0) {
        details += `\n   - Extras: ${item.selectedAddons.join(', ')}`;
      }
      if (item.specialInstructions) {
        details += `\n   - Note: "${item.specialInstructions}"`;
      }
      itemsText += `${idx + 1}. *${item.menuItem.name}* x${item.quantity}${details} - ₹${item.menuItem.price * item.quantity}\n\n`;
    });

    const promoCode = settings?.offer?.code || 'PROMO';
    return `*NEW ORDER - CURRY DELIGHT KAHALGAON*\n` +
      `----------------------------------------\n` +
      `*Order ID:* ${order.orderId}\n` +
      `*Customer:* ${order.summary.fullName}\n` +
      `*Phone:* ${order.summary.phone}\n` +
      `*Type:* ${order.summary.deliveryType === 'delivery' ? '📍 Home Delivery' : '🏪 Self Takeaway'}\n` +
      (order.summary.deliveryType === 'delivery' ? `*Address:* ${order.summary.address}\n` : '') +
      `*Payment:* ${order.summary.paymentMethod.toUpperCase()} (on ${order.summary.deliveryType === 'delivery' ? 'delivery' : 'pickup'})\n` +
      `----------------------------------------\n` +
      `*ITEMS ORDERED:*\n${itemsText}` +
      `----------------------------------------\n` +
      `*Subtotal:* ₹${order.subtotal}\n` +
      (order.discount > 0 ? `*Discount (${promoCode}):* -₹${order.discount}\n` : '') +
      `*Delivery Charge:* ₹${order.deliveryFee}\n` +
      `*GRAND TOTAL:* ₹${order.total}\n` +
      `----------------------------------------\n` +
      (order.summary.specialInstructions ? `*Instructions:* ${order.summary.specialInstructions}\n` : '') +
      `Please confirm receipt and initiate cooking!`;
  };

  const handleSendWhatsApp = () => {
    if (!confirmedOrder) return;
    const message = buildWhatsAppMessage(confirmedOrder);
    const encoded = encodeURIComponent(message);
    const waNumber = settings?.whatsappNumber || '917061591831';
    window.open(`https://wa.me/${waNumber}?text=${encoded}`, '_blank');
  };

  // Group items by Tier and Category
  const groupedMenu = useMemo(() => {
    return MENU_TIERS.map(tier => {
      const tierCategories = tier.categories.map(catName => {
        const items = menuItems.filter(item => {
          const matchesCat = item.category === catName;
          const matchesSearch = !searchQuery || 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            item.description.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesDiet = dietFilter === 'all' || 
            (dietFilter === 'veg' && item.isVeg) || 
            (dietFilter === 'non-veg' && !item.isVeg);
          const matchesCategoryFilter = selectedCategory === 'all' || item.category === selectedCategory;

          return matchesCat && matchesSearch && matchesDiet && matchesCategoryFilter;
        });

        return {
          categoryName: catName,
          items
        };
      }).filter(group => group.items.length > 0);

      return {
        ...tier,
        categoryGroups: tierCategories
      };
    }).filter(tier => {
      if (activeTier !== 'all' && tier.id !== activeTier) return false;
      return tier.categoryGroups.length > 0;
    });
  }, [menuItems, searchQuery, dietFilter, selectedCategory, activeTier]);

  return (
    <div className="py-8 px-4 md:px-6 max-w-7xl mx-auto" id="online-ordering-page">
      <AnimatePresence mode="wait">
        {confirmedOrder ? (
          /* --- STEP 2: SIMPLIFIED ORDER CONFIRMATION VIEW --- */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto bg-white rounded-3xl border border-charcoal/10 shadow-xl overflow-hidden p-6 md:p-10 space-y-8 text-left"
            id="order-confirmation-screen"
          >
            <div className="text-center space-y-3">
              <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 inline-flex items-center justify-center mb-1">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <h1 className="font-display font-bold text-3xl text-charcoal">Order Summary Ready!</h1>
              <p className="text-sm text-emerald-800 font-bold bg-emerald-50 px-4 py-1.5 rounded-full inline-block font-mono">
                Order Reference: {confirmedOrder.orderId}
              </p>
              
              {/* Expected on-screen message per Step 2 */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center mt-3">
                <p className="text-sm font-semibold text-amber-900">
                  "We'll confirm your order on WhatsApp or by phone shortly."
                </p>
                <p className="text-xs text-amber-800/80 mt-1">
                  Please tap either Send via WhatsApp or Call to Order below to finalize your booking with our kitchen.
                </p>
              </div>
            </div>

            {/* Itemized Order Breakdown */}
            <div className="border-t border-b border-charcoal/10 py-6 space-y-4">
              <h2 className="font-display font-bold text-lg text-charcoal uppercase tracking-wider text-[11px] font-mono">Order Items</h2>
              <div className="space-y-3">
                {confirmedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-sm border-b border-charcoal/5 pb-2.5">
                    <div className="space-y-1">
                      <span className="font-semibold text-charcoal">{item.menuItem.name} <strong className="text-saffron">x{item.quantity}</strong></span>
                      <div className="text-xs text-charcoal/50 flex flex-wrap gap-1.5">
                        <span className="bg-charcoal/5 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono">
                          {item.selectedSpice === 'hot' ? '🌶️ Bihari Spicy' : item.selectedSpice === 'medium' ? '🌶️ Medium' : '🌶️ Mild'}
                        </span>
                        {item.specialInstructions && <span className="italic">"{item.specialInstructions}"</span>}
                      </div>
                    </div>
                    <span className="font-bold font-tabular-nums text-charcoal">₹{item.menuItem.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-charcoal/10 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-charcoal/70">
                  <span>Subtotal</span>
                  <span className="font-tabular-nums font-semibold">₹{confirmedOrder.subtotal}</span>
                </div>
                {confirmedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>{settings?.offer?.code || 'PROMO'} Discount ({settings?.offer?.discountPercent || 15}%)</span>
                    <span className="font-tabular-nums">-₹{confirmedOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-charcoal/70">
                  <span>Delivery Fee</span>
                  <span className="font-tabular-nums font-semibold">{confirmedOrder.deliveryFee === 0 ? 'FREE' : `₹${confirmedOrder.deliveryFee}`}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-charcoal border-t border-charcoal/10 pt-3">
                  <span>Total Amount</span>
                  <span className="text-saffron font-tabular-nums text-xl">₹{confirmedOrder.total}</span>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-cream/40 p-5 rounded-2xl border border-charcoal/5 space-y-2 text-xs text-charcoal/85">
              <span className="text-[10px] font-mono uppercase tracking-widest text-charcoal/40 font-bold block mb-1">Customer Details</span>
              <div><strong>Name:</strong> {confirmedOrder.summary.fullName}</div>
              <div><strong>Phone Number:</strong> {confirmedOrder.summary.phone}</div>
              {confirmedOrder.summary.deliveryType === 'delivery' ? (
                <div><strong>Delivery Address:</strong> {confirmedOrder.summary.address}</div>
              ) : (
                <div><strong>Takeaway:</strong> Self Pickup at Curry Delight, Block Road, Kahalgaon</div>
              )}
              {confirmedOrder.summary.specialInstructions && (
                <div className="italic mt-1 text-charcoal/65"><strong>Note:</strong> "{confirmedOrder.summary.specialInstructions}"</div>
              )}
            </div>

            {/* STEP 2: TWO CLEAR OPTIONS: Send via WhatsApp & Call to Order */}
            <div className="space-y-3.5">
              <button 
                onClick={handleSendWhatsApp}
                className="w-full min-h-[44px] bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-base py-4 rounded-full flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all duration-150 focus:outline-none"
                id="whatsapp-confirmation-btn"
              >
                <MessageSquare className="w-5 h-5 fill-white text-[#25D366]" />
                <span>Send via WhatsApp</span>
              </button>

              <a 
                href={`tel:${settings?.contactPhone || '+917061591831'}`}
                className="w-full min-h-[44px] bg-saffron hover:bg-[#d05220] text-white font-bold text-base py-4 rounded-full flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all duration-150 text-center"
                id="call-confirmation-btn"
              >
                <Phone className="w-5 h-5" />
                <span>Call to Order ({settings?.contactPhone || '+91 70615 91831'})</span>
              </a>

              <button 
                onClick={() => {
                  setConfirmedOrder(null);
                  navigateTo('/');
                }}
                className="w-full min-h-[44px] bg-charcoal hover:bg-charcoal/90 text-white font-bold text-xs py-3 rounded-full cursor-pointer focus:outline-none transition-all duration-150 text-center"
              >
                Back to Menu / Home
              </button>
            </div>
          </motion.div>
        ) : (
          /* --- STEP 3: TEXT-ONLY, GROUPED MENU DISPLAY (NO IMAGES ANYWHERE) --- */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8 text-left max-w-5xl mx-auto w-full"
          >
            {/* Kitchen Closed Banner */}
            {settings?.isKitchenOpen === false && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-5 rounded-3xl text-sm flex items-start gap-3.5 font-bold shadow-xs">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600 animate-pulse mt-0.5" />
                <div>
                  <span className="text-red-700 font-extrabold uppercase font-mono tracking-wide text-[10px] block mb-0.5">🏪 Kitchen Currently Closed</span>
                  We are not accepting online orders right now. You can still browse our menu, but ordering/checkout is disabled.
                </div>
              </div>
            )}

            {/* Page Title & Philosophy */}
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center space-x-2 bg-saffron/10 px-3 py-1 rounded-full border border-saffron/20 mb-1">
                <Flame className="w-3.5 h-3.5 text-saffron" />
                <span className="text-[10px] font-bold text-saffron tracking-widest uppercase font-mono">Curry Delight Menu</span>
              </div>
              <h1 className="font-display font-bold text-4xl md:text-5xl text-charcoal tracking-tight">Our Complete Menu</h1>
              <p className="text-sm md:text-base text-charcoal/60 max-w-2xl mx-auto md:mx-0 font-normal leading-relaxed">
                190+ authentic recipes freshly prepared for every order. Explore our two-tier category grouping below — tap any dish to customize and add to your order.
              </p>
            </div>

            {/* Step 3: Two-Tier Navigation Strip (Starters & Soups / Mains / Quick Bites / Drinks & Desserts) */}
            <div className="bg-white rounded-3xl p-5 border border-charcoal/10 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[11px] font-bold text-charcoal/60 uppercase tracking-wider font-mono">Major Group:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveTier('all')}
                    className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                      activeTier === 'all'
                        ? 'bg-charcoal text-white shadow-sm'
                        : 'bg-cream/50 text-charcoal/70 hover:bg-cream border border-charcoal/10'
                    }`}
                  >
                    All Groups
                  </button>
                  {MENU_TIERS.map(tier => (
                    <button
                      key={tier.id}
                      onClick={() => {
                        setActiveTier(tier.id);
                        setSelectedCategory('all');
                      }}
                      className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                        activeTier === tier.id
                          ? 'bg-saffron text-white shadow-sm'
                          : 'bg-cream/50 text-charcoal/70 hover:bg-cream border border-charcoal/10'
                      }`}
                    >
                      {tier.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search & Dietary Filters */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-charcoal/5">
                <div className="md:col-span-8 flex items-center bg-cream/30 border border-charcoal/15 rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-saffron transition-all">
                  <Search className="w-4 h-4 text-charcoal/40 mr-2.5 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Search 190+ dishes (e.g. Paneer Butter Masala, Biryani, Naan)..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none text-xs text-ink focus:outline-none placeholder-charcoal/40 w-full"
                    id="order-search-input"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="p-1 text-charcoal/50 hover:text-charcoal cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="md:col-span-4 flex items-center justify-end gap-1.5">
                  {(['all', 'veg', 'non-veg'] as const).map(diet => (
                    <button
                      key={diet}
                      onClick={() => setDietFilter(diet)}
                      className={`min-h-[44px] flex-1 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                        dietFilter === diet
                          ? diet === 'veg' ? 'bg-green-600 text-white shadow-xs' : diet === 'non-veg' ? 'bg-red-600 text-white shadow-xs' : 'bg-charcoal text-white shadow-xs'
                          : 'bg-cream/40 text-charcoal/60 hover:text-charcoal border border-charcoal/10'
                      }`}
                    >
                      {diet === 'all' ? 'All' : diet === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 3: TEXT-ONLY GROUPED LIST LAYOUT */}
            {groupedMenu.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-charcoal/10 px-6 shadow-sm">
                <AlertCircle className="w-12 h-12 text-saffron/70 mx-auto mb-3" />
                <h3 className="font-display font-semibold text-xl text-charcoal">No dishes match your filters</h3>
                <p className="text-xs text-charcoal/60 mt-1 max-w-sm mx-auto font-normal">
                  Try clearing your search query or switching dietary preferences.
                </p>
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setDietFilter('all'); setActiveTier('all'); }}
                  className="mt-5 min-h-[44px] bg-charcoal text-white hover:bg-charcoal/95 text-xs px-6 py-2.5 rounded-full cursor-pointer font-bold transition-all duration-150 shadow-md"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-12">
                {groupedMenu.map((tier) => (
                  <section key={tier.id} id={`tier-${tier.id}`} className="space-y-6 scroll-mt-24">
                    {/* Tier Level Header */}
                    <div className="border-b-2 border-saffron/40 pb-2">
                      <h2 className="font-display font-bold text-2xl md:text-3xl text-charcoal tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-saffron rounded-full inline-block" />
                        {tier.name}
                      </h2>
                      <p className="text-xs text-charcoal/60 mt-1 font-normal ml-5">
                        {tier.description}
                      </p>
                    </div>

                    {/* Subcategories inside this Tier */}
                    <div className="space-y-8">
                      {tier.categoryGroups.map((catGroup) => (
                        <div 
                          key={catGroup.categoryName} 
                          id={`cat-${catGroup.categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                          className="bg-white rounded-2xl border border-charcoal/10 shadow-xs overflow-hidden scroll-mt-24"
                        >
                          {/* Subcategory Header with Visual Anchor Thumbnail */}
                          <div className="bg-cream/40 px-4 sm:px-5 py-3 border-b border-charcoal/10 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {CATEGORY_IMAGES[catGroup.categoryName] && (
                                <img 
                                  src={CATEGORY_IMAGES[catGroup.categoryName]} 
                                  alt={catGroup.categoryName}
                                  className="w-11 h-11 rounded-xl object-cover border border-charcoal/10 shadow-xs shrink-0"
                                  loading="lazy"
                                />
                              )}
                              <div className="min-w-0">
                                <h3 className="font-display font-bold text-base md:text-lg text-charcoal leading-tight truncate">
                                  {catGroup.categoryName}
                                </h3>
                                <span className="text-[11px] text-charcoal/50 font-normal">
                                  Chef prepared to order
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] font-mono text-charcoal/60 font-semibold bg-white/80 px-2.5 py-1 rounded-full border border-charcoal/10 shrink-0">
                              {catGroup.items.length} {catGroup.items.length === 1 ? 'dish' : 'dishes'}
                            </span>
                          </div>

                          {/* Clean Text-Only List Underneath — Name, Description, Price Only */}
                          <div className="divide-y divide-charcoal/5">
                            {catGroup.items.map((item) => {
                              const isSoldOut = soldOutIds.includes(item.id);
                              return (
                                <div 
                                  key={item.id}
                                  onClick={() => !isSoldOut && onOpenCustomizer(item)}
                                  className={`p-4 md:px-6 md:py-4.5 flex items-start justify-between gap-4 transition-colors duration-150 cursor-pointer ${
                                    isSoldOut ? 'bg-charcoal/5 opacity-60 cursor-not-allowed' : 'hover:bg-cream/30'
                                  }`}
                                >
                                  {/* Left: Indicator, Name, Short Description */}
                                  <div className="space-y-1 text-left flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      {/* Veg / Non-Veg Indicator Dot */}
                                      <div className={`w-3.5 h-3.5 border-2 flex items-center justify-center p-0.5 rounded-xs shrink-0 ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                      </div>
                                      
                                      <h4 className="font-display font-bold text-sm md:text-base text-charcoal leading-snug truncate">
                                        {item.name}
                                      </h4>

                                      {item.badge && !isSoldOut && (
                                        <span className="bg-saffron/10 text-saffron border border-saffron/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono shrink-0">
                                          {item.badge}
                                        </span>
                                      )}

                                      {isSoldOut && (
                                        <span className="bg-red-50 text-red-700 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
                                          Sold Out
                                        </span>
                                      )}
                                    </div>

                                    {/* Short description only */}
                                    <p className="text-xs text-charcoal/60 line-clamp-2 leading-relaxed font-normal pl-5.5">
                                      {item.description}
                                    </p>
                                  </div>

                                  {/* Right: Price & Add Button */}
                                  <div className="flex items-center gap-4 shrink-0 self-center">
                                    <span className="font-sans font-bold text-base md:text-lg text-saffron tabular-nums">
                                      ₹{item.price}
                                    </span>

                                    {isSoldOut ? (
                                      <span className="text-[10px] text-charcoal/40 font-mono uppercase font-bold">
                                        Unavailable
                                      </span>
                                    ) : (
                                      <button
                                        onClick={(e) => handleQuickAdd(item, e)}
                                        className="min-h-[44px] min-w-[44px] bg-charcoal text-white hover:bg-saffron rounded-xl p-2.5 flex items-center justify-center transition-colors duration-150 cursor-pointer shadow-xs"
                                        title="Add to Cart"
                                        aria-label={`Add ${item.name} to cart`}
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Zomato/Swiggy-style "Menu Categories" pill */}
      {!confirmedOrder && groupedMenu.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => setIsCategorySheetOpen(true)}
            className="min-h-[44px] bg-charcoal hover:bg-black text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 border border-white/20 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer text-xs font-bold uppercase tracking-wider font-mono"
            id="floating-category-menu-btn"
          >
            <Utensils className="w-4 h-4 text-saffron" />
            <span>Menu Categories</span>
            <span className="bg-saffron text-white text-[10px] px-2 py-0.5 rounded-full">
              {groupedMenu.reduce((sum, t) => sum + t.categoryGroups.length, 0)}
            </span>
          </button>
        </div>
      )}

      {/* Floating Category Jump Drawer / Modal */}
      <AnimatePresence>
        {isCategorySheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategorySheetOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden z-10 text-left"
            >
              {/* Sheet Header */}
              <div className="p-5 border-b border-charcoal/10 flex items-center justify-between bg-cream/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-saffron/10 rounded-xl text-saffron">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-charcoal">Menu Index</h3>
                    <p className="text-xs text-charcoal/50">Jump straight to any category with 1 tap</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCategorySheetOpen(false)}
                  className="min-h-[44px] min-w-[44px] p-2 text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="Close category sheet"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sheet Category List */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 divide-y divide-charcoal/5">
                {groupedMenu.map((tier) => (
                  <div key={tier.id} className="pt-4 first:pt-0 space-y-2.5">
                    <div 
                      onClick={() => scrollToTier(tier.id)}
                      className="flex items-center justify-between cursor-pointer group"
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider text-saffron font-mono group-hover:underline">
                        {tier.name}
                      </span>
                      <span className="text-[10px] text-charcoal/40 font-mono">Jump to group →</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {tier.categoryGroups.map((catGroup) => (
                        <button
                          key={catGroup.categoryName}
                          onClick={() => scrollToCategory(catGroup.categoryName)}
                          className="min-h-[44px] flex items-center justify-between p-2.5 rounded-xl border border-charcoal/10 bg-cream/20 hover:bg-cream/70 hover:border-saffron/40 transition-all text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {CATEGORY_IMAGES[catGroup.categoryName] && (
                              <img 
                                src={CATEGORY_IMAGES[catGroup.categoryName]} 
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover shrink-0" 
                              />
                            )}
                            <span className="text-xs font-bold text-charcoal group-hover:text-saffron truncate">
                              {catGroup.categoryName}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-charcoal/50 font-semibold shrink-0 ml-2">
                            {catGroup.items.length}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sheet Footer */}
              <div className="p-4 border-t border-charcoal/10 bg-cream/30 text-center">
                <span className="text-[11px] text-charcoal/60 font-mono">
                  Curry Delight Kahalgaon · 190+ Fresh Recipes
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
