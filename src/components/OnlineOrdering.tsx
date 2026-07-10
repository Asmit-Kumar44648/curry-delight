import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Plus, Minus, X, AlertCircle, ShoppingBag, 
  MapPin, Phone, Clock, ArrowRight, ArrowLeft,
  CheckCircle2, Info, Flame, Award, HelpCircle, Send,
  Leaf, Utensils, Zap, Star, ChefHat, Coffee, Heart
} from 'lucide-react';
import { SPECIAL_OFFER } from '../data';
import { MenuItem, CartItem, OrderDetails } from '../types';
import { adminStore, AdminSettings } from '../lib/adminStore';

interface OnlineOrderingProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onOpenCustomizer: (item: MenuItem) => void;
  navigateTo: (path: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

export default function OnlineOrdering({ 
  cart, 
  setCart, 
  onOpenCustomizer, 
  navigateTo,
  selectedCategory,
  setSelectedCategory
}: OnlineOrderingProps) {
  // Sync sold out items and menu items in real-time
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
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [spiceFilter, setSpiceFilter] = useState<'all' | 'mild' | 'medium' | 'hot'>('all');

  // Checkout form State
  const [checkoutData, setCheckoutData] = useState<OrderDetails>({
    fullName: '',
    phone: '',
    address: '',
    deliveryType: 'delivery',
    paymentMethod: 'cod',
    specialInstructions: ''
  });

  // Local state for local order confirmation screen
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

  // Derive categories
  const categories = useMemo(() => {
    return Array.from(new Set(menuItems.map(item => item.category)));
  }, [menuItems]);

  // Filter Menu Items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDiet = dietFilter === 'all' || 
                          (dietFilter === 'veg' && item.isVeg) || 
                          (dietFilter === 'non-veg' && !item.isVeg);
                          
      const matchesSpice = spiceFilter === 'all' || item.spiceLevel === spiceFilter;
                              
      return matchesCategory && matchesSearch && matchesDiet && matchesSpice;
    });
  }, [selectedCategory, searchQuery, dietFilter, spiceFilter, menuItems]);

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

  const cartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

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

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutData.fullName || !checkoutData.phone || (checkoutData.deliveryType === 'delivery' && !checkoutData.address)) {
      alert("Please enter all required fields.");
      return;
    }

    // Phone validation
    const phoneDigits = checkoutData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    // Kitchen open check
    if (settings && settings.isKitchenOpen === false) {
      alert("Sorry, the kitchen is currently closed. We are not accepting online orders at this moment.");
      return;
    }

    const orderId = `CD-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
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

    try {
      // Save order to Firestore
      await adminStore.addOrder({
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
        specialInstructions: checkoutData.specialInstructions,
        source: 'online'
      }, orderId);

      setConfirmedOrder(confirmation);
      setCart([]); // Reset Cart
    } catch (err) {
      alert("Failed to submit order. Please try again.");
      console.error("OnlineOrdering addOrder failed:", err);
    }
  };

  const handleSendWhatsApp = () => {
    if (!confirmedOrder) return;

    let itemsText = '';
    confirmedOrder.items.forEach((item, idx) => {
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
    const message = `*NEW ORDER - CURRY DELIGHT KAHALGAON*\n` +
      `----------------------------------------\n` +
      `*Order ID:* ${confirmedOrder.orderId}\n` +
      `*Customer:* ${confirmedOrder.summary.fullName}\n` +
      `*Phone:* ${confirmedOrder.summary.phone}\n` +
      `*Type:* ${confirmedOrder.summary.deliveryType === 'delivery' ? '📍 Home Delivery' : '🏪 Self Takeaway'}\n` +
      (confirmedOrder.summary.deliveryType === 'delivery' ? `*Address:* ${confirmedOrder.summary.address}\n` : '') +
      `*Payment:* ${confirmedOrder.summary.paymentMethod.toUpperCase()} (on ${confirmedOrder.summary.deliveryType === 'delivery' ? 'delivery' : 'pickup'})\n` +
      `----------------------------------------\n` +
      `*ITEMS ORDERED:*\n${itemsText}` +
      `----------------------------------------\n` +
      `*Subtotal:* ₹${confirmedOrder.subtotal}\n` +
      (confirmedOrder.discount > 0 ? `*Discount (${promoCode}):* -₹${confirmedOrder.discount}\n` : '') +
      `*Delivery Charge:* ₹${confirmedOrder.deliveryFee}\n` +
      `*GRAND TOTAL:* ₹${confirmedOrder.total}\n` +
      `----------------------------------------\n` +
      (confirmedOrder.summary.specialInstructions ? `*Instructions:* ${confirmedOrder.summary.specialInstructions}\n` : '') +
      `Please confirm receipt and initiate cooking!`;

    const encoded = encodeURIComponent(message);
    const waNumber = settings?.whatsappNumber || '917061591831';
    window.open(`https://wa.me/${waNumber}?text=${encoded}`, '_blank');
  };

  return (
    <div className="py-8 px-4 md:px-6 max-w-7xl mx-auto" id="online-ordering-page">
      <AnimatePresence mode="wait">
        {confirmedOrder ? (
          /* --- ORDER CONFIRMATION VIEW --- */
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="max-w-2xl mx-auto bg-white rounded-3xl border border-charcoal/10 shadow-xl overflow-hidden p-6 md:p-10 space-y-8 text-left"
            id="order-confirmation-screen"
          >
            <div className="text-center space-y-3">
              <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 inline-flex items-center justify-center mb-1">
                <CheckCircle2 className="w-12 h-12 animate-bounce" />
              </div>
              <h1 className="font-display font-bold text-3xl text-charcoal">Order Placed Successfully!</h1>
              <p className="text-sm text-emerald-800 font-bold bg-emerald-50 px-4 py-1.5 rounded-full inline-block font-mono">
                Order ID: {confirmedOrder.orderId}
              </p>
              <p className="text-sm text-charcoal/60">
                Estimated Prep & Delivery Time: <strong className="text-charcoal font-bold">{confirmedOrder.estimatedTime}</strong>
              </p>
            </div>

            <div className="border-t border-b border-charcoal/10 py-6 space-y-4">
              <h2 className="font-display font-bold text-lg text-charcoal uppercase tracking-wider text-[11px] font-mono">Items Summary</h2>
              <div className="space-y-3">
                {confirmedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-sm border-b border-charcoal/5 pb-2.5">
                    <div className="space-y-1">
                      <span className="font-semibold text-charcoal">{item.menuItem.name} <strong className="text-saffron">x{item.quantity}</strong></span>
                      <div className="text-xs text-charcoal/50 flex flex-wrap gap-1.5">
                        <span className="bg-charcoal/5 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono">
                          🌶️ {item.selectedSpice === 'hot' ? 'Bihari Spicy' : item.selectedSpice === 'medium' ? 'Medium' : 'Mild'}
                        </span>
                        {item.specialInstructions && <span className="italic">"{item.specialInstructions}"</span>}
                      </div>
                      
                      {/* Thali Customizations confirmation */}
                      {item.thaliCustomizations && (
                        <div className="text-[10px] text-charcoal/70 bg-saffron/5 p-2 rounded-xl space-y-0.5 border border-saffron/10 mt-1 max-w-sm">
                          <div className="font-bold text-saffron uppercase text-[8px] tracking-wider font-mono">Thali Configuration:</div>
                          <div>• Curry: <span className="font-semibold text-charcoal">{item.thaliCustomizations.currySwap}</span></div>
                          <div>• Bread: <span className="font-semibold text-charcoal">{item.thaliCustomizations.breadSwap}</span></div>
                          <div>• Sweet: <span className="font-semibold text-charcoal">{item.thaliCustomizations.dessertChoice}</span></div>
                          {item.thaliCustomizations.extraRice && <div className="text-saffron font-bold">• Added Extra Rice portion</div>}
                        </div>
                      )}

                      {/* Extras confirmation */}
                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div className="text-[10px] text-charcoal/70 bg-charcoal/5 p-2 rounded-xl space-y-0.5 mt-1 max-w-sm">
                          <div className="font-bold text-charcoal/50 uppercase text-[8px] tracking-wider font-mono">Extras:</div>
                          {item.selectedAddons.map((addon, aIdx) => (
                            <div key={aIdx}>• <span className="font-semibold text-charcoal">{addon}</span></div>
                          ))}
                        </div>
                      )}
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
                  <span>Grand Total (Pay on {confirmedOrder.summary.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'})</span>
                  <span className="text-saffron font-tabular-nums text-xl">₹{confirmedOrder.total}</span>
                </div>
              </div>
            </div>

            {/* Customer Information Card */}
            <div className="bg-cream/40 p-5 rounded-2xl border border-charcoal/5 space-y-2 text-xs text-charcoal/85">
              <span className="text-[10px] font-mono uppercase tracking-widest text-charcoal/40 font-bold block mb-1">Delivery Details</span>
              <div><strong>Name:</strong> {confirmedOrder.summary.fullName}</div>
              <div><strong>Phone Number:</strong> {confirmedOrder.summary.phone}</div>
              {confirmedOrder.summary.deliveryType === 'delivery' ? (
                <div><strong>Delivery Address:</strong> {confirmedOrder.summary.address}</div>
              ) : (
                <div><strong>Takeaway Option:</strong> Self Pickup at Curry Delight, Block Road, Kahalgaon</div>
              )}
              {confirmedOrder.summary.specialInstructions && (
                <div className="italic mt-1 text-charcoal/65"><strong>Note:</strong> "{confirmedOrder.summary.specialInstructions}"</div>
              )}
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleSendWhatsApp}
                className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-base py-4 rounded-full flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all focus:outline-none"
                id="whatsapp-confirmation-btn"
              >
                <Send className="w-5 h-5 fill-white text-[#25D366]" />
                <span>Forward Order via WhatsApp (Recommended)</span>
              </button>

              <button 
                onClick={() => {
                  setConfirmedOrder(null);
                  navigateTo('/');
                }}
                className="w-full bg-charcoal hover:bg-charcoal/90 text-white font-bold text-sm py-3.5 rounded-full cursor-pointer focus:outline-none transition-all text-center"
              >
                Return to Homepage
              </button>
            </div>
          </motion.div>
        ) : (
          /* --- ONLINE ORDERING INTERFACE --- */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            
            {/* SINGLE COLUMN: Categories & Menu list (Full Width) */}
            <div className="lg:col-span-12 space-y-8 text-left max-w-5xl mx-auto w-full">
              
              {/* Header */}
              {settings?.isKitchenOpen === false && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-5 rounded-3xl text-sm flex items-start gap-3.5 font-bold shadow-xs">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-600 animate-pulse mt-0.5" />
                  <div>
                    <span className="text-red-700 font-extrabold uppercase font-mono tracking-wide text-[10px] block mb-0.5">🏪 Kitchen Currently Closed</span>
                    We are not accepting online orders right now. You can still browse our menu, but ordering/checkout is disabled.
                  </div>
                </div>
              )}

              <div className="space-y-3 text-center md:text-left">
                <div className="inline-flex items-center space-x-2 bg-saffron/10 px-3 py-1 rounded-full border border-saffron/20 mb-1">
                  <Flame className="w-3.5 h-3.5 text-saffron" />
                  <span className="text-[10px] font-bold text-saffron tracking-widest uppercase font-mono">Curry Delight Kitchen</span>
                </div>
                <h1 className="font-display font-bold text-4xl md:text-6xl text-charcoal tracking-tight">Our Full Menu</h1>
                <p className="text-sm md:text-base text-charcoal/60 max-w-2xl mx-auto md:mx-0 font-normal leading-relaxed">
                  Discover a rich heritage of flavor. From our family kitchen in Kahalgaon to your plate, explore 180+ authentic recipes freshly prepared for every order.
                </p>
              </div>

              {/* MUST-TRY RECOMMENDATIONS (Bento Style) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-saffron fill-saffron" />
                    <h2 className="font-display font-bold text-xl text-charcoal uppercase tracking-wider text-[13px] font-mono">Chef's Signature Recommendations</h2>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-charcoal text-white rounded-[2rem] p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden group cursor-pointer" onClick={() => onOpenCustomizer(menuItems.find(i => i.name.includes('Biryani')) || menuItems[0])}>
                      <div className="relative z-10 space-y-2">
                        <div className="bg-saffron text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase w-fit">Bestseller</div>
                        <h3 className="font-display font-bold text-3xl leading-tight">Authentic <br/>Kahalgaon Biryani</h3>
                        <p className="text-xs text-white/60 max-w-[180px]">Our signature slow-cooked rice layered with 24 hand-ground spices.</p>
                      </div>
                      <div className="relative z-10 flex items-center space-x-2 pt-4">
                        <span className="text-xl font-bold text-saffron">₹340</span>
                        <div className="h-4 w-px bg-white/20 mx-1" />
                        <button className="text-[11px] font-bold flex items-center space-x-1 hover:text-saffron transition-colors">
                          <span>Quick Customise</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <img src="https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?q=80&w=600&auto=format&fit=crop" className="absolute -right-10 -bottom-10 w-48 h-48 object-contain rotate-12 group-hover:scale-110 transition-transform duration-700 opacity-80" alt="Biryani" />
                   </div>

                    <div className="bg-white border border-charcoal/10 rounded-[2rem] p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden group cursor-pointer" onClick={() => onOpenCustomizer(menuItems.find(i => i.category.includes('Paneer')) || menuItems[1])}>
                      <div className="relative z-10 space-y-2">
                        <div className="bg-green-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase w-fit">Pure Veg</div>
                        <h3 className="font-display font-bold text-3xl text-charcoal leading-tight">Smoky Paneer <br/>Butter Masala</h3>
                        <p className="text-xs text-charcoal/50 max-w-[180px]">Soft cottage cheese cubes in a rich, creamy tomato gravy infused with smoke.</p>
                      </div>
                      <div className="relative z-10 flex items-center space-x-2 pt-4">
                        <span className="text-xl font-bold text-saffron">₹280</span>
                        <div className="h-4 w-px bg-charcoal/10 mx-1" />
                        <button className="text-[11px] font-bold flex items-center space-x-1 text-charcoal hover:text-saffron transition-colors">
                          <span>Quick Customise</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <img src="https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=600&auto=format&fit=crop" className="absolute -right-10 -bottom-10 w-48 h-48 object-contain -rotate-12 group-hover:scale-110 transition-transform duration-700" alt="Paneer" />
                   </div>
                </div>
              </div>

              {/* Filters Block */}
              <div className="bg-white rounded-3xl p-6 border border-charcoal/10 shadow-sm space-y-5">
                
                {/* Search Bar */}
                <div className="flex items-center bg-cream/30 border border-charcoal/15 rounded-2xl px-5 py-4 shadow-inner focus-within:ring-2 focus-within:ring-saffron transition-all">
                  <Search className="w-5 h-5 text-charcoal/40 mr-3" />
                  <input 
                    type="text" 
                    placeholder="Search dishes (e.g. Biryani, Paneer, Naan, Noodles...)" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none text-base text-ink focus:outline-none placeholder-charcoal/40 w-full"
                    id="order-search-input"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="p-1 text-charcoal/50 hover:text-charcoal cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Dietary & Spice Quick Filters */}
                <div className="flex flex-wrap gap-6 items-center justify-between pt-1">
                  
                  {/* Veg / Non-Veg toggle */}
                  <div className="flex items-center space-x-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal/55 font-mono">Diet:</span>
                    <div className="flex bg-cream/40 p-1.5 rounded-xl border border-charcoal/5 shadow-xs">
                      {(['all', 'veg', 'non-veg'] as const).map((diet) => (
                        <button
                          key={diet}
                          onClick={() => setDietFilter(diet)}
                          className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                            dietFilter === diet 
                              ? diet === 'veg' ? 'bg-green-600 text-white shadow-md' : diet === 'non-veg' ? 'bg-red-600 text-white shadow-md' : 'bg-charcoal text-white shadow-md'
                              : 'text-charcoal/60 hover:text-charcoal hover:bg-charcoal/5'
                          }`}
                        >
                          {diet === 'all' ? 'All' : diet === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spice Level toggle */}
                  <div className="flex items-center space-x-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal/55 font-mono">Heat Level:</span>
                    <div className="flex bg-cream/40 p-1.5 rounded-xl border border-charcoal/5 shadow-xs">
                      {(['all', 'mild', 'medium', 'hot'] as const).map((spice) => (
                        <button
                          key={spice}
                          onClick={() => setSpiceFilter(spice)}
                          className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                            spiceFilter === spice 
                              ? 'bg-saffron text-white shadow-md'
                              : 'text-charcoal/60 hover:text-charcoal hover:bg-charcoal/5'
                          }`}
                        >
                          {spice === 'all' ? 'All' : spice === 'mild' ? '🌶️ Mild' : spice === 'medium' ? '🌶️🌶️ Med' : '🌶️🌶️🌶️ Bihari Spicy'}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* Categories Scrollable Strip */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-charcoal/60 uppercase tracking-wider font-mono block">Browse Categories</span>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide py-1">
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shadow-xs flex items-center space-x-2 ${
                      selectedCategory === 'all' 
                        ? 'bg-charcoal text-white shadow-lg scale-105' 
                        : 'bg-white text-charcoal/70 border border-charcoal/10 hover:border-charcoal/30'
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>All Items</span>
                  </button>
                  {categories.map((cat) => {
                    const getIcon = (category: string) => {
                      const c = category.toLowerCase();
                      if (c.includes('veg')) return <Leaf className="w-3.5 h-3.5" />;
                      if (c.includes('chicken') || c.includes('mutton') || c.includes('non')) return <Utensils className="w-3.5 h-3.5" />;
                      if (c.includes('drink') || c.includes('beverage')) return <Coffee className="w-3.5 h-3.5" />;
                      if (c.includes('sweet') || c.includes('dessert')) return <Heart className="w-3.5 h-3.5" />;
                      return <Zap className="w-3.5 h-3.5" />;
                    };

                    return (
                      <button 
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shadow-xs flex items-center space-x-2 ${
                          selectedCategory === cat 
                            ? 'bg-charcoal text-white shadow-lg scale-105' 
                            : 'bg-white text-charcoal/70 border border-charcoal/10 hover:border-charcoal/30'
                        }`}
                      >
                        {getIcon(cat)}
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid of Food Items */}
              {filteredItems.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-charcoal/10 px-6 shadow-sm">
                  <AlertCircle className="w-16 h-16 text-saffron/70 mx-auto mb-4" />
                  <h3 className="font-display font-semibold text-2xl text-charcoal">No dishes match your filters</h3>
                  <p className="text-base text-charcoal/60 mt-2 max-w-sm mx-auto font-normal">
                    Try adjusting your search criteria or choosing a different spice/dietary combination.
                  </p>
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setDietFilter('all'); setSpiceFilter('all'); }}
                    className="mt-6 bg-charcoal text-white hover:bg-charcoal/95 text-xs px-8 py-3 rounded-full cursor-pointer font-bold transition-all shadow-md"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredItems.map((item) => {
                    const isSoldOut = soldOutIds.includes(item.id);
                    return (
                      <div 
                        key={item.id}
                        onClick={() => !isSoldOut && onOpenCustomizer(item)}
                        className={`bg-white rounded-3xl overflow-hidden border transition-all duration-300 group flex flex-col justify-between ${
                          isSoldOut 
                            ? 'border-charcoal/10 opacity-60 grayscale cursor-not-allowed' 
                            : 'border-charcoal/10 hover:border-saffron/40 hover:shadow-xl cursor-pointer transform hover:-translate-y-1'
                        }`}
                      >
                        <div>
                          {/* Media Cover */}
                          <div className="relative aspect-[16/11] bg-charcoal/5 overflow-hidden">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                            <div className="absolute top-3 right-3 z-10 bg-white/95 p-1 rounded-md shadow-sm border border-charcoal/10 flex items-center justify-center">
                              <div className={`w-4 h-4 border-2 flex items-center justify-center p-0.5 rounded-xs ${item.isVeg ? 'border-green-600' : 'border-red-600'}`} title={item.isVeg ? 'Veg' : 'Non-Veg'}>
                                <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                              </div>
                            </div>
                            {item.badge && !isSoldOut && (
                              <span className="absolute top-3 left-3 bg-saffron text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                                {item.badge}
                              </span>
                            )}
                            {isSoldOut && (
                              <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md font-mono z-10 animate-pulse">
                                SOLD OUT
                              </span>
                            )}
                            <div className="absolute bottom-3 left-3 flex items-center space-x-1">
                              {item.spiceLevel && (
                                 <span className="bg-white/95 backdrop-blur-xs text-charcoal text-[9px] font-bold px-2 py-0.5 rounded shadow-sm border border-charcoal/5 uppercase">
                                   {item.spiceLevel === 'mild' ? '🌶️ Mild' : item.spiceLevel === 'medium' ? '🌶️🌶️ Medium' : '🌶️🌶️🌶️ Bihari Spicy'}
                                 </span>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-5 space-y-2 text-left">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-charcoal/40 font-bold">{item.category}</span>
                            <h3 className="font-display font-bold text-xl text-charcoal leading-tight group-hover:text-saffron transition-colors">{item.name}</h3>
                            <p className="text-xs text-charcoal/60 line-clamp-2 leading-relaxed font-normal">{item.description}</p>
                          </div>
                        </div>

                        {/* Footer buying trigger */}
                        <div className="p-5 pt-0 mt-auto flex items-center justify-between border-t border-charcoal/5">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-charcoal/40 uppercase font-bold tracking-wider">Price</span>
                            <span className="font-sans font-extrabold text-xl text-saffron">₹{item.price}</span>
                          </div>
                          {isSoldOut ? (
                            <span className="bg-red-50 text-red-700 text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-full border border-red-100 font-mono">
                              Sold Out
                            </span>
                          ) : (
                            <button 
                              onClick={(e) => handleQuickAdd(item, e)}
                              className="bg-charcoal text-white hover:bg-saffron p-3 rounded-full transition-all duration-300 cursor-pointer shadow-sm hover:scale-110 active:scale-90"
                              title="Quick Add to Cart"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
