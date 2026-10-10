import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, X, AlertCircle, 
  MapPin, Phone, Clock, ArrowRight,
  Flame, Award, Sparkles, CheckCircle2,
  Utensils, PhoneCall, ChevronRight
} from 'lucide-react';
import { MenuItem } from '../types';
import { adminStore, AdminSettings } from '../lib/adminStore';
import { CATEGORY_IMAGES } from '../data';

interface OnlineOrderingProps {
  navigateTo: (path: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onCallToOrder: (item?: MenuItem) => void;
}

// Two-tier Category Hierarchy (Starters & Soups / Mains / Quick Bites / Drinks & Desserts)
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
  navigateTo,
  selectedCategory,
  setSelectedCategory,
  onCallToOrder
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
  const [selectedMocktailModal, setSelectedMocktailModal] = useState(false);

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

  // Group items by Tier and Category
  const groupedMenu = useMemo(() => {
    return MENU_TIERS.map(tier => {
      const tierCategories = tier.categories.map(catName => {
        const items = (menuItems || []).filter(item => {
          if (!item) return false;
          const matchesCat = item.category === catName;
          const matchesSearch = !searchQuery || 
            Boolean(item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
            Boolean(item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
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
              Our kitchen is currently taking a break. You can still browse all dishes, prices, and recipes. We will reopen shortly!
            </div>
          </div>
        )}

        {/* Page Title & Philosophy */}
        <div className="space-y-3 text-center md:text-left">
          <div className="inline-flex items-center space-x-2 bg-saffron/10 px-3 py-1 rounded-full border border-saffron/20 mb-1">
            <Flame className="w-3.5 h-3.5 text-saffron" />
            <span className="text-[10px] font-bold text-saffron tracking-widest uppercase font-mono">Curry Delight Kahalgaon</span>
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-charcoal tracking-tight">Our Master Menu</h1>
          <p className="text-sm md:text-base text-charcoal/60 max-w-2xl mx-auto md:mx-0 font-normal leading-relaxed">
            180+ authentic heritage dishes freshly made to order. Simply browse our curated menu and call us directly at <strong>+91 7061591831</strong> to place your order for fast delivery or takeaway!
          </p>
        </div>

        {/* DIRECT PHONE CALL ORDER PROMPT CARD */}
        <div className="bg-gradient-to-r from-charcoal via-[#231d18] to-charcoal text-white rounded-3xl p-6 md:p-8 shadow-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="bg-saffron text-white text-[10px] font-mono uppercase font-bold px-3 py-0.5 rounded-full">
                📞 Direct Phone Ordering
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono uppercase font-bold px-3 py-0.5 rounded-full">
                Free Delivery on ₹500+
              </span>
            </div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-white">
              Ready to Order? Call Us Directly
            </h2>
            <p className="text-xs md:text-sm text-cream/70 max-w-xl">
              Tell our counter staff your favorite dishes and delivery address. Delivery across Kahalgaon Town & NTPC Township in 35–45 minutes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <a 
              href="tel:+917061591831"
              className="bg-saffron hover:bg-[#d15423] text-white px-8 py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:scale-102 active:scale-98 transition-all"
              id="menu-header-call-primary"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call: +91 70615 91831</span>
            </a>
          </div>
        </div>

        {/* OCTOBER SPECIAL PROMOTION SPOTLIGHT: 30% OFF MOCKTAILS */}
        <div className="bg-[#FFF9F2] rounded-3xl p-6 md:p-8 border border-saffron/20 shadow-md relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Poster Thumbnail */}
            <div className="md:col-span-4 flex justify-center">
              <div 
                onClick={() => setSelectedMocktailModal(true)}
                className="relative rounded-2xl overflow-hidden shadow-lg border border-saffron/30 max-w-[240px] cursor-pointer group bg-black"
                title="Tap to enlarge offer poster"
              >
                <img 
                  src="/mocktail-special-october.jpg" 
                  alt="Curry Delight 30% Discount on Mocktails - Virgin Mint Mojito & Blue Lagoon" 
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider font-mono">
                  🔍 View Poster
                </div>
                <div className="absolute top-2 left-2 bg-saffron text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                  30% OFF
                </div>
              </div>
            </div>

            {/* Poster Details */}
            <div className="md:col-span-8 space-y-3 text-left">
              <div className="inline-flex items-center space-x-1.5 bg-saffron/10 text-saffron px-3 py-1 rounded-full text-xs font-bold font-mono uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Special Festive Offer • October Only</span>
              </div>
              <h2 className="font-display font-bold text-2xl md:text-3xl text-charcoal">
                30% Flat Discount on Handcrafted Mocktails
              </h2>
              <p className="text-xs md:text-sm text-charcoal/70 leading-relaxed">
                Quench your thirst with our signature <strong>Virgin Mint Mojito</strong> and the vibrant <strong>Blue Lagoon</strong>. Crisp mint, tangy lime, crushed ice, and premium fruit essences — specially discounted all month!
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a 
                  href="tel:+917061591831"
                  className="bg-saffron hover:bg-[#d15423] text-white px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Order Mocktails: 7061591831</span>
                </a>
                <a 
                  href="https://www.instagram.com/curry.delight_restaurant"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-charcoal/20 hover:border-charcoal text-charcoal px-4 py-2.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <span>📸 @curry.delight_restaurant</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Tier Navigation Strip */}
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
                placeholder="Search 180+ dishes (e.g. Paneer Butter Masala, Biryani, Naan)..." 
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

        {/* GROUPED LIST LAYOUT */}
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

                      {/* Clean Item List Underneath */}
                      <div className="divide-y divide-charcoal/5">
                        {catGroup.items.map((item) => {
                          const isSoldOut = soldOutIds.includes(item.id);
                          return (
                            <div 
                              key={item.id}
                              onClick={() => !isSoldOut && onCallToOrder(item)}
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

                                  {item.spiceLevel && (
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider shrink-0 ${
                                      item.spiceLevel === 'mild' ? 'bg-blue-50 text-blue-700' :
                                      item.spiceLevel === 'medium' ? 'bg-amber-50 text-amber-700' :
                                      'bg-red-50 text-red-700'
                                    }`}>
                                      🌶️ {item.spiceLevel}
                                    </span>
                                  )}

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

                                {/* Short description */}
                                <p className="text-xs text-charcoal/60 line-clamp-2 leading-relaxed font-normal pl-5.5">
                                  {item.description}
                                </p>
                              </div>

                              {/* Right: Price & Order Action */}
                              <div className="flex items-center gap-3 shrink-0 self-center">
                                <span className="font-sans font-bold text-base md:text-lg text-saffron tabular-nums">
                                  ₹{item.price}
                                </span>

                                {isSoldOut ? (
                                  <span className="text-[10px] text-charcoal/40 font-mono uppercase font-bold">
                                    Unavailable
                                  </span>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onCallToOrder(item);
                                    }}
                                    className="min-h-[40px] px-3.5 py-1.5 bg-charcoal text-white hover:bg-saffron rounded-full flex items-center gap-1.5 text-xs font-bold transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                                    title={`Call to Order ${item.name}`}
                                    aria-label={`Call to Order ${item.name}`}
                                  >
                                    <PhoneCall className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Order</span>
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

      {/* Floating Category Drawer button */}
      {groupedMenu.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => setIsCategorySheetOpen(true)}
            className="min-h-[44px] bg-charcoal hover:bg-black text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 border border-white/20 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer text-xs font-bold uppercase tracking-wider font-mono"
            aria-label="Open category sheet"
          >
            <Utensils className="w-4 h-4 text-saffron" />
            <span>Menu Categories</span>
          </button>
        </div>
      )}

      {/* Bottom Category Jump Sheet */}
      <AnimatePresence>
        {isCategorySheetOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategorySheetOpen(false)}
              className="absolute inset-0 bg-charcoal cursor-pointer"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-full max-w-xl bg-white rounded-t-3xl shadow-2xl p-6 max-h-[75vh] flex flex-col z-10 text-left"
            >
              <div className="flex items-center justify-between pb-4 border-b border-charcoal/10">
                <span className="font-display font-bold text-lg text-charcoal">Quick Jump to Category</span>
                <button
                  onClick={() => setIsCategorySheetOpen(false)}
                  className="p-1.5 hover:bg-charcoal/5 rounded-full text-charcoal/60 hover:text-charcoal cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto py-4 space-y-2 flex-1">
                {MENU_TIERS.map(tier => (
                  <div key={tier.id} className="space-y-1 py-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-saffron block px-2">
                      {tier.name}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {tier.categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => scrollToCategory(cat)}
                          className="min-h-[44px] text-left p-2.5 rounded-xl hover:bg-cream text-xs font-semibold text-charcoal flex items-center justify-between transition-colors border border-transparent hover:border-charcoal/10 cursor-pointer"
                        >
                          <span className="truncate">{cat}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-charcoal/30 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mocktail Poster Lightbox Modal */}
      <AnimatePresence>
        {selectedMocktailModal && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMocktailModal(false)}
              className="absolute inset-0 bg-black cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col"
            >
              <div className="relative">
                <img 
                  src="/mocktail-special-october.jpg" 
                  alt="Curry Delight 30% Off on Mocktails Offer" 
                  className="w-full h-auto max-h-[70vh] object-contain bg-black"
                />
                <button
                  onClick={() => setSelectedMocktailModal(false)}
                  className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-2 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 bg-white text-center space-y-3">
                <h3 className="font-display font-bold text-xl text-charcoal">
                  30% Discount on Mocktails (October Month Special)
                </h3>
                <p className="text-xs text-charcoal/70">
                  Virgin Mint Mojito & Blue Lagoon • Shiv Parvati Nagar, Block Road, Kahalgaon
                </p>
                <div className="flex gap-3 justify-center pt-1">
                  <a 
                    href="tel:+917061591831"
                    className="bg-saffron hover:bg-[#d15423] text-white px-6 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-sm"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call 7061591831</span>
                  </a>
                  <button
                    onClick={() => setSelectedMocktailModal(false)}
                    className="border border-charcoal/20 hover:border-charcoal text-charcoal px-5 py-2.5 rounded-full font-bold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
