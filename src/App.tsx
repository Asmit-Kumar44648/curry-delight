import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Phone, 
  Clock, 
  ArrowRight, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  Flame, 
  X, 
  Menu, 
  Users, 
  PhoneCall, 
  Calendar, 
  Utensils, 
  BookOpen,
  ZoomIn,
  MessageCircle
} from 'lucide-react';

import { MenuItem } from './types';
import Gallery from './components/Gallery';
import OnlineOrdering from './components/OnlineOrdering';
import TableReservation from './components/TableReservation';
import Celebrations from './components/Celebrations';
import POSModule from './components/POSModule';
import { adminStore, AdminSettings } from './lib/adminStore';

const RESTAURANT_PHONES = {
  primary: '+917061591831',
  primaryDisplay: '+91 70615 91831',
  secondary: '+919122421316',
  secondaryDisplay: '+91 91224 21316',
  landline: '+919431498112',
  landlineDisplay: '+91 94314 98112'
};

const getNormalizedPath = (path: string) => {
  let clean = (path || '/').split('?')[0].split('#')[0].trim();
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  if (clean === '/index.html') return '/';
  if (clean === '/menu') return '/order';
  return clean || '/';
};

export default function App() {
  // --- Routing State with robust normalization ---
  const [currentPath, setCurrentPath] = useState(() => getNormalizedPath(window.location.pathname));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigateTo = (path: string, callback?: () => void) => {
    const normalized = getNormalizedPath(path);
    window.history.pushState(null, '', normalized);
    setCurrentPath(normalized);
    if (callback) {
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
      setCurrentPath(getNormalizedPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // --- Dynamic Menu Items & Settings from localStorage-backed adminStore ---
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => adminStore.getMenuItems());
  const [settings, setSettings] = useState<AdminSettings>(() => adminStore.getSettings());
  
  useEffect(() => {
    setMenuItems(adminStore.getMenuItems());
    setSettings(adminStore.getSettings());
    const handleStoreChange = () => {
      setMenuItems([...adminStore.getMenuItems()]);
      setSettings({ ...adminStore.getSettings() });
    };
    window.addEventListener('storage', handleStoreChange);
    window.addEventListener('adminStoreUpdate', handleStoreChange);
    return () => {
      window.removeEventListener('storage', handleStoreChange);
      window.removeEventListener('adminStoreUpdate', handleStoreChange);
    };
  }, []);

  // --- Phone Order Modal State ---
  const [orderCallDish, setOrderCallDish] = useState<MenuItem | null>(null);
  const [isOrderCallModalOpen, setIsOrderCallModalOpen] = useState(false);
  const [isMocktailPosterModalOpen, setIsMocktailPosterModalOpen] = useState(false);

  const handleOpenOrderCall = (dish?: MenuItem) => {
    setOrderCallDish(dish || null);
    setIsOrderCallModalOpen(true);
  };

  // --- Category and Search State ---
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
    return (menuItems || []).filter(item => item && item.id && BESTSELLER_IDS.includes(item.id));
  }, [BESTSELLER_IDS, menuItems]);

  const categories = useMemo(() => {
    return Array.from(new Set(
      (menuItems || [])
        .map(item => item?.category)
        .filter((cat): cat is string => Boolean(cat && typeof cat === 'string'))
    ));
  }, [menuItems]);

  // Section references for in-page navigation
  const homeRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    navigateTo('/order');
  };

  // Early return for POS terminal
  if (currentPath === '/admin' || currentPath === '/pos') {
    return (
      <div className="min-h-screen bg-[#FFF9F2] font-sans text-charcoal">
        <POSModule navigateTo={navigateTo} />
      </div>
    );
  }

  // Determine if on known subpage
  const isSubpage = currentPath === '/order' || currentPath === '/reserve' || currentPath === '/celebrations';

  return (
    <div className="min-h-screen bg-[#FFF9F2] font-sans text-ink selection:bg-saffron selection:text-white">
      
      {/* Dynamic Flash Announcement Banner (Weather / Festival / Rush Alert) */}
      {settings?.announcementBanner?.enabled && (
        <div 
          className={`py-2 px-4 text-xs font-bold text-center tracking-wide flex items-center justify-center gap-2 shadow-sm ${
            settings.announcementBanner.type === 'weather'
              ? 'bg-blue-600 text-white'
              : settings.announcementBanner.type === 'festival'
              ? 'bg-amber-600 text-white'
              : settings.announcementBanner.type === 'rush'
              ? 'bg-rose-700 text-white'
              : 'bg-saffron text-white'
          }`}
          id="flash-announcement-banner"
        >
          <span>{settings.announcementBanner.text}</span>
        </div>
      )}

      {/* 1. STICKY / PERMANENT NAVIGATION */}
      <nav className="sticky top-0 z-40 bg-charcoal text-text-on-dark shadow-md px-6 py-4 md:py-5 transition-all duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <button 
            onClick={() => navigateTo('/')} 
            className="flex items-center space-x-3 text-left group cursor-pointer"
            id="brand-logo"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 bg-black border border-white/10 shadow-sm shrink-0">
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
              className={`hover:text-saffron transition-colors cursor-pointer ${currentPath === '/' ? 'text-saffron' : 'text-[#FFF9F2]/80'}`}
              id="nav-link-home"
            >
              Home
            </button>
            <button 
              onClick={() => navigateTo('/order')} 
              className={`hover:text-saffron transition-colors cursor-pointer ${currentPath === '/order' ? 'text-saffron' : 'text-[#FFF9F2]/80'}`}
              id="nav-link-order"
            >
              Our Menu
            </button>
            <button 
              onClick={() => navigateTo('/reserve')} 
              className={`hover:text-saffron transition-colors cursor-pointer ${currentPath === '/reserve' ? 'text-saffron' : 'text-[#FFF9F2]/80'}`}
              id="nav-link-reserve"
            >
              Reserve a Table
            </button>
            <button 
              onClick={() => navigateTo('/celebrations')} 
              className={`hover:text-saffron transition-colors cursor-pointer ${currentPath === '/celebrations' ? 'text-saffron' : 'text-[#FFF9F2]/80'}`}
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
              className="hover:text-saffron transition-colors cursor-pointer text-[#FFF9F2]/80"
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
              className="hover:text-saffron transition-colors cursor-pointer text-[#FFF9F2]/80"
              id="nav-link-contact"
            >
              Contact
            </button>
          </div>

          {/* Action Hub - Direct Phone Call CTA */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Primary Order Action: Tap to Call */}
            <button 
              onClick={() => handleOpenOrderCall()}
              className="bg-saffron text-white hover:bg-[#d15423] font-bold text-xs md:text-sm px-5 py-2.5 rounded-full transition-all flex items-center space-x-2 cursor-pointer shadow-md focus:outline-none hover:scale-102 active:scale-98"
              id="nav-call-order-btn"
            >
              <PhoneCall className="w-4 h-4 animate-pulse" />
              <span>Call to Order</span>
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
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-charcoal/85 backdrop-blur-xs"
            />

            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-full max-w-[300px] bg-charcoal border-l border-white/10 shadow-2xl flex flex-col justify-between"
            >
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

              <div className="flex-1 overflow-y-auto py-6 px-6 space-y-6">
                <nav className="flex flex-col space-y-4">
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('/');
                    }} 
                    className={`text-left text-base font-bold py-2 transition-colors ${currentPath === '/' ? 'text-saffron' : 'text-[#FFF9F2]/80 hover:text-saffron'}`}
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

                {/* Direct Call Action Inside Drawer */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <a 
                    href={`tel:${RESTAURANT_PHONES.primary}`}
                    className="w-full bg-saffron hover:bg-[#d15423] text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call to Order ({RESTAURANT_PHONES.primaryDisplay})</span>
                  </a>
                </div>
              </div>

              {/* Staff Portal Link */}
              <div className="p-6 border-t border-white/10 bg-black/10 space-y-4">
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigateTo('/admin');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-[#FFF9F2] uppercase tracking-wider transition-all cursor-pointer"
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

      {/* MAIN VIEW CONTENT CONTAINER */}
      <AnimatePresence mode="wait">
        {(!isSubpage || currentPath === '/') && (
          <motion.div
            key="homepage-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* 2. PHOTOGRAPHY-FORWARD HERO (Charcoal Background) */}
            <section ref={homeRef} className="bg-charcoal text-text-on-dark py-12 px-6 md:py-24 relative overflow-hidden" id="section-hero">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(232,98,44,0.12)_0%,transparent_75%)] pointer-events-none" />

              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
                {/* Hero Copy */}
                <div className="lg:col-span-5 text-left space-y-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center space-x-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold tracking-wider font-mono">
                      <span>⭐ 4.6 / 5.0</span>
                      <span className="text-white/60">·</span>
                      <span className="text-[#FFF9F2]/90">280+ Google Reviews</span>
                    </div>
                    <div className="inline-flex items-center space-x-1 bg-white/10 text-[#FFF9F2]/90 border border-white/15 px-3 py-1 rounded-full text-xs font-medium font-mono">
                      <MapPin className="w-3 h-3 text-saffron" />
                      <span>Kahalgaon & NTPC Township</span>
                    </div>
                  </div>
                  
                  <h1 className="font-display font-bold text-5xl md:text-6xl text-white leading-[1.1] tracking-tight">
                    Aromatic Heritage <br />
                    from <span className="text-saffron italic font-normal">Kahalgaon</span>
                  </h1>

                  <p className="text-[#FFF9F2]/80 text-lg leading-relaxed max-w-xl font-normal">
                    Home-style Indian curries, straight off the tandoor — with Chinese, pizza, and everyday favorites for the rest of the table.
                  </p>

                  {/* Delivery Radius & Speed Note */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-[#FFF9F2]/90 max-w-md">
                    <div className="bg-saffron/20 p-2.5 rounded-xl text-saffron shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-white block font-medium">Delivering across Kahalgaon Town & NTPC Township</strong>
                      <p className="text-[11px] text-[#FFF9F2]/60 mt-0.5">Dispatched hot to your doorstep within 35–45 mins • Call to Order</p>
                    </div>
                  </div>

                  {/* CTA block */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <button 
                      onClick={() => handleOpenOrderCall()}
                      className="bg-saffron text-white hover:bg-[#d15423] text-center font-bold text-base px-8 py-4 rounded-full transition-transform active:scale-95 flex items-center justify-center space-x-2 shadow-lg shadow-saffron/20 cursor-pointer focus:outline-none"
                      id="hero-primary-call-cta"
                    >
                      <PhoneCall className="w-5 h-5" />
                      <span>Call to Order Now</span>
                    </button>

                    <button 
                      onClick={() => navigateTo('/order')}
                      className="border border-[#FFF9F2]/30 text-[#FFF9F2] hover:bg-[#FFF9F2]/10 text-center font-bold text-base px-8 py-4 rounded-full transition-colors flex items-center justify-center space-x-1 cursor-pointer focus:outline-none"
                      id="hero-secondary-menu-cta"
                    >
                      <BookOpen className="w-4 h-4 mr-1.5" />
                      <span>View Menu</span>
                    </button>
                  </div>

                  {/* Quick trust metrics */}
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
                    <img 
                      src="/real_interior_wide.png" 
                      alt="Curry Delight Restaurant Dining Space in Kahalgaon" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent p-6 pt-24">
                      <div className="flex items-center space-x-1.5 text-saffron font-bold text-xs uppercase font-mono tracking-wider">
                        <Award className="w-4 h-4" />
                        <span>Kahalgaon's Finest Dining</span>
                      </div>
                      <h3 className="text-white font-display font-bold text-xl md:text-2xl mt-1">Our Elegant Warm Dining Room</h3>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* 3. HOMEPAGE CONVERSION PATHS SECTION */}
            <section className="bg-white py-16 px-6 border-b border-charcoal/5" id="section-conversion-cards">
              <div className="max-w-7xl mx-auto space-y-10">
                <div className="text-center max-w-xl mx-auto space-y-1.5">
                  <span className="text-xs font-bold text-saffron tracking-wider uppercase font-mono">How Can We Serve You?</span>
                  <h2 className="font-display font-bold text-3xl text-charcoal leading-tight">Three Unique Curry Delight Experiences</h2>
                  <p className="text-sm text-charcoal/60 font-normal">Select a dining experience customized specifically to your requirements.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Order via Phone Call */}
                  <div className="bg-[#FFF9F2] rounded-3xl p-6 md:p-8 border border-charcoal/5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow group text-left">
                    <div className="space-y-4">
                      <div className="bg-saffron/10 text-saffron p-3.5 rounded-2xl w-fit flex items-center justify-center">
                        <PhoneCall className="w-6 h-6" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-display font-bold text-xl text-charcoal group-hover:text-saffron transition-colors">Order via Phone Call</h3>
                        <p className="text-xs md:text-sm text-charcoal/70 leading-relaxed font-normal">
                          Fast home delivery across Kahalgaon & NTPC Township. Call directly to place your order with our friendly counter team!
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleOpenOrderCall()}
                      className="mt-6 bg-saffron text-white hover:bg-[#d15423] font-bold text-xs py-3.5 px-6 rounded-full w-full flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      id="homepage-card-call-order-btn"
                    >
                      <PhoneCall className="w-3.5 h-3.5 mr-1" />
                      <span>Call: {RESTAURANT_PHONES.primaryDisplay}</span>
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
                          Instant reservations for families and intimate dining up to 8 guests.
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

            {/* 4. OCTOBER SPECIAL PROMOTIONAL SPOTLIGHT: 30% OFF MOCKTAILS */}
            <section className="bg-charcoal text-white py-16 px-6 border-b border-white/10 relative overflow-hidden" id="section-mocktail-special">
              <div className="max-w-7xl mx-auto">
                <div className="bg-gradient-to-br from-[#231d18] to-[#161311] rounded-3xl border border-saffron/30 p-8 md:p-12 shadow-2xl relative overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                    
                    {/* Poster Image Display */}
                    <div className="lg:col-span-5 flex justify-center">
                      <div 
                        onClick={() => setIsMocktailPosterModalOpen(true)}
                        className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-saffron/40 max-w-sm w-full group cursor-pointer bg-black"
                        title="Click to view full promo poster"
                      >
                        <img 
                          src="/mocktail-special-october.jpg" 
                          alt="Curry Delight 30% Discount on Mocktails - Virgin Mint Mojito & Blue Lagoon" 
                          className="w-full h-auto object-cover group-hover:scale-103 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-charcoal/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-saffron text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5">
                            <ZoomIn className="w-4 h-4" /> Tap to Enlarge Poster
                          </span>
                        </div>
                        <div className="absolute top-3 left-3 bg-red-600 text-white font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                          30% OFF
                        </div>
                      </div>
                    </div>

                    {/* Promotional Narrative & Call CTA */}
                    <div className="lg:col-span-7 space-y-6 text-left">
                      <div className="space-y-2">
                        <div className="inline-flex items-center space-x-2 bg-saffron/20 text-saffron border border-saffron/30 px-3 py-1 rounded-full text-xs font-bold tracking-wider font-mono uppercase">
                          <Sparkles className="w-3.5 h-3.5 text-saffron" />
                          <span>Special Festival Offer • October Month Only</span>
                        </div>
                        <h2 className="font-display font-bold text-3xl md:text-5xl text-white tracking-tight leading-tight">
                          30% Flat Discount <br />
                          on <span className="text-saffron italic">Crafted Mocktails</span>
                        </h2>
                      </div>

                      <p className="text-cream/80 text-base leading-relaxed font-normal">
                        Beat the heat with our signature refreshing drinks! Prepared with fresh garden mint, zesty lemons, chilled crushed ice, and premium fruit syrups:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                          <span className="text-xs font-bold text-emerald-400 font-mono uppercase block">🍃 Signature</span>
                          <h4 className="font-display font-bold text-lg text-white">Virgin Mint Mojito</h4>
                          <p className="text-xs text-cream/60">Crisp crushed mint, lemon wedges, and chilled sparkling soda.</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                          <span className="text-xs font-bold text-sky-400 font-mono uppercase block">🌊 Cool Waves</span>
                          <h4 className="font-display font-bold text-lg text-white">Electric Blue Lagoon</h4>
                          <p className="text-xs text-cream/60">Vibrant citrus curaçao notes shaken with chilled ice and fizz.</p>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-cream/80 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-saffron shrink-0" />
                          <span>Shiv Parvati Nagar, Block Road, Near Judge's Colony, Kahalgaon</span>
                        </div>
                        <a 
                          href="https://www.instagram.com/curry.delight_restaurant"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <span>📸 Follow @curry.delight_restaurant</span>
                        </a>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <a 
                          href={`tel:${RESTAURANT_PHONES.primary}`}
                          className="bg-saffron hover:bg-[#d15423] text-white font-bold text-sm px-8 py-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg shadow-saffron/20"
                        >
                          <PhoneCall className="w-4 h-4" />
                          <span>Call {RESTAURANT_PHONES.primaryDisplay} to Order</span>
                        </a>

                        <button 
                          onClick={() => {
                            setSelectedCategory('Mocktails, Shakes & Beverages');
                            navigateTo('/order');
                          }}
                          className="border border-white/20 hover:bg-white/10 text-white font-bold text-sm px-7 py-4 rounded-full transition-colors flex items-center justify-center gap-2"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>View All Drinks</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </section>

            {/* 5. BROWSE CATEGORIES */}
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
                    <div className="w-16 h-16 rounded-full bg-white p-1 shadow-sm transition-all duration-300 border border-charcoal/10 group-hover:border-charcoal/30">
                      <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=120&h=120" className="w-full h-full rounded-full object-cover" alt="All Dishes" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal/60 group-hover:text-charcoal transition-colors duration-200">
                      All Dishes
                    </span>
                  </div>

                  {/* Dynamic Categories */}
                  {categories.map((cat: string) => {
                    const firstItem = (menuItems || []).find(item => item && item.category === cat);
                    const catImg = firstItem?.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=120&h=120';
                    return (
                      <div 
                        key={cat}
                        onClick={() => handleCategoryClick(cat)}
                        className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
                        id={`category-btn-${String(cat).toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      >
                        <div className="w-16 h-16 rounded-full bg-white p-1 shadow-sm transition-all duration-300 border border-charcoal/10 group-hover:border-charcoal/30">
                          <img src={catImg} className="w-full h-full rounded-full object-cover" alt={cat} />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal/60 group-hover:text-charcoal transition-colors duration-200">
                          {cat}
                        </span>
                      </div>
                    );
                  })}

                </div>
              </div>
            </section>

            {/* 6. POPULAR DISHES (Chef's Handpicked Favourites) */}
            <section ref={menuRef} className="bg-cream py-16 px-6" id="section-popular-menu">
              <div className="max-w-7xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-charcoal/10">
                  <div className="text-left">
                    <span className="text-xs font-bold text-saffron tracking-wider uppercase font-mono">Chef's Handpicked Favourites</span>
                    <h2 className="font-display font-bold text-4xl text-charcoal mt-1">Today's Most Ordered</h2>
                    <p className="text-xs text-charcoal/60 mt-1 max-w-xl font-normal">
                      These 6 signature recipes represent the beating heart of Curry Delight. Call to order for immediate dispatch!
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                      navigateTo('/order');
                    }}
                    className="mt-4 md:mt-0 flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-saffron hover:text-[#d15423] transition-colors cursor-pointer"
                    id="browse-all-link-top"
                  >
                    <span>Browse Master Menu (180+ Dishes)</span>
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
                      onClick={() => handleOpenOrderCall(item)}
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
                          
                          <div className="absolute bottom-2.5 right-2.5 bg-charcoal/70 backdrop-blur-xs text-[8px] text-white px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold z-10 select-none">
                            Freshly Prepared
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

                      {/* Pricing and Action: Call to Order */}
                      <div className="p-5 pt-0 flex items-center justify-between border-t border-charcoal/5 mt-auto">
                        <div>
                          <span className="text-[9px] text-charcoal/40 block font-bold uppercase tracking-wider">Price</span>
                          <span className="font-sans font-extrabold text-xl text-saffron font-tabular-nums">
                            ₹{item.price}
                          </span>
                        </div>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenOrderCall(item);
                          }}
                          className="bg-saffron text-white hover:bg-[#d15423] px-4 py-2 rounded-full font-bold text-xs transition-all duration-300 cursor-pointer shadow-sm flex items-center gap-1.5 hover:scale-105 active:scale-95"
                          title={`Call to order ${item.name}`}
                          id={`call-order-${item.id}`}
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Order</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Master Menu Promo Banner */}
                <div className="mt-14 bg-gradient-to-br from-charcoal to-[#1a1a1a] rounded-3xl p-8 md:p-12 text-white border border-white/5 relative overflow-hidden shadow-xl text-center md:text-left">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-saffron/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="space-y-3 max-w-2xl text-left">
                      <span className="text-xs font-mono font-bold text-saffron uppercase tracking-widest block">The Master Kitchen Menu</span>
                      <h3 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight">
                        Craving Something Else?
                      </h3>
                      <p className="text-sm text-cream/70 leading-relaxed font-normal">
                        Discover our entire menu featuring over 180 dishes, including sizzling appetizers, slow-simmered regional curries, tandoor flatbreads, Chinese gravies, and handcrafted milkshakes.
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
                      <span>Browse Master Menu (180+ Items)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            </section>

            {/* 7. ABOUT / ROOTS SECTION */}
            <section ref={aboutRef} className="bg-cream py-20 px-6 border-b border-charcoal/10" id="section-our-roots">
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                <div className="lg:col-span-6">
                  <div className="relative rounded-3xl overflow-hidden aspect-[3/4] max-h-[550px] w-full shadow-lg border border-charcoal/5 group bg-charcoal/5">
                    <img 
                      src="/real_interior_2.png" 
                      alt="Curry Delight Restaurant Authentic Seating in Kahalgaon" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
                    />
                  </div>
                </div>

                <div className="lg:col-span-6 text-left space-y-6">
                  <div>
                    <span className="text-xs font-bold text-saffron tracking-wider uppercase font-mono">Our Roots & Heritage</span>
                    <h2 className="font-display font-bold text-4xl text-charcoal mt-1">From Our Clay Tandoor to Your Dining Table</h2>
                  </div>

                  <p className="text-sm text-charcoal/80 leading-relaxed font-normal">
                    Curry Delight was born with a single mission: to bring honest, authentic North Indian, Mughlai, and Tandoori culinary magic to the families of Kahalgaon and NTPC Township.
                  </p>

                  <p className="text-sm text-charcoal/80 leading-relaxed font-normal">
                    Every dish is prepared using fresh ground whole spices, unadulterated dairy, and centuries-old slow cooking techniques. Whether you dine in our tranquil air-conditioned restaurant or call for hot doorstep delivery, you taste the genuine spirit of Indian hospitality.
                  </p>

                  <div className="pt-2">
                    <button 
                      onClick={() => navigateTo('/reserve')}
                      className="bg-charcoal text-white hover:bg-black font-bold text-xs py-3.5 px-7 rounded-full inline-flex items-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <span>Reserve Your Table</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 8. GALLERY COMPONENT */}
            <Gallery galleryRef={galleryRef} />

          </motion.div>
        )}

        {/* SUBPAGE: DIGITAL MENU & PHONE ORDER */}
        {currentPath === '/order' && (
          <motion.div
            key="order-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
          >
            <OnlineOrdering 
              navigateTo={navigateTo}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              onCallToOrder={handleOpenOrderCall}
            />
          </motion.div>
        )}

        {/* SUBPAGE: TABLE RESERVATION */}
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

        {/* SUBPAGE: CELEBRATIONS */}
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

      {/* 9. FOOTER SECTION (Charcoal Background) */}
      <footer ref={contactRef} className="bg-charcoal text-text-on-dark pt-16 pb-20 px-6 border-t border-white/5 relative z-10" id="section-footer">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Col 1: About wordmark */}
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-black border border-white/10 shrink-0">
                <img src="/favicon.png" className="w-full h-full object-cover" alt="Curry Delight Logo" />
              </div>
              <span className="font-display font-bold text-2xl text-[#FFF9F2] tracking-tight">Curry Delight</span>
            </div>
            <p className="text-xs text-[#FFF9F2]/70 leading-relaxed font-normal">
              Kahalgaon's favorite destination for authentic North Indian curries, fresh clay-tandoor flatbreads, sizzlers, Chinese & pizzas.
            </p>
            <div className="pt-2 text-xs font-mono text-saffron font-bold">
              Shiv Parvati Nagar, Block Road, Kahalgaon, Bihar 813203
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-4 text-left">
            <h4 className="font-display font-bold text-base text-[#FFF9F2] uppercase tracking-wider text-xs font-mono">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs text-[#FFF9F2]/75 font-normal">
              <li><button onClick={() => navigateTo('/')} className="hover:text-saffron transition-colors cursor-pointer">Home</button></li>
              <li><button onClick={() => navigateTo('/order')} className="hover:text-saffron transition-colors cursor-pointer">Digital Master Menu</button></li>
              <li><button onClick={() => navigateTo('/reserve')} className="hover:text-saffron transition-colors cursor-pointer">Book a Dining Table</button></li>
              <li><button onClick={() => navigateTo('/celebrations')} className="hover:text-saffron transition-colors cursor-pointer">Host Celebrations & Parties</button></li>
              <li><button onClick={() => navigateTo('/admin')} className="hover:text-saffron transition-colors cursor-pointer">Staff & POS Terminal</button></li>
            </ul>
          </div>

          {/* Col 3: Direct Phone Ordering */}
          <div className="space-y-4 text-left">
            <h4 className="font-display font-bold text-base text-[#FFF9F2] uppercase tracking-wider text-xs font-mono">
              Call to Order
            </h4>
            <div className="space-y-3 text-xs text-[#FFF9F2]/75">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-saffron shrink-0" />
                <a href={`tel:${RESTAURANT_PHONES.primary}`} className="text-white font-bold hover:text-saffron transition-colors">
                  {RESTAURANT_PHONES.primaryDisplay} (Counter)
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-saffron shrink-0" />
                <a href={`tel:${RESTAURANT_PHONES.secondary}`} className="text-white/90 hover:text-saffron transition-colors">
                  {RESTAURANT_PHONES.secondaryDisplay} (Kitchen)
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-white/50 shrink-0" />
                <a href={`tel:${RESTAURANT_PHONES.landline}`} className="text-white/80 hover:text-saffron transition-colors">
                  {RESTAURANT_PHONES.landlineDisplay}
                </a>
              </div>
              <p className="text-[11px] text-cream/50 pt-1">
                Fast home delivery across Kahalgaon & NTPC Township within 35–45 minutes.
              </p>
            </div>
          </div>

          {/* Col 4: Timings & Social */}
          <div className="space-y-4 text-left">
            <h4 className="font-display font-bold text-base text-[#FFF9F2] uppercase tracking-wider text-xs font-mono">
              Operating Hours
            </h4>
            <div className="space-y-2 text-xs text-[#FFF9F2]/75">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-saffron shrink-0" />
                <span>Mon – Sun: 11:30 AM – 10:30 PM</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-bold">
                ✓ Open 7 Days a Week for Dining & Delivery
              </p>
              <div className="pt-2">
                <a 
                  href="https://www.instagram.com/curry.delight_restaurant" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                >
                  <span>📸 @curry.delight_restaurant</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom credits */}
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#FFF9F2]/50 gap-4">
          <p>© {new Date().getFullYear()} Curry Delight Kahalgaon. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigateTo('/admin')} 
              className="text-white/60 hover:text-saffron transition-colors cursor-pointer"
            >
              🔑 Staff Portal
            </button>
            <span>•</span>
            <span>Bihar Culinary Pride</span>
          </div>
        </div>
      </footer>

      {/* 10. STICKY MOBILE BOTTOM BAR */}
      <div className="fixed bottom-0 inset-x-0 bg-charcoal border-t border-white/10 py-2.5 px-3 z-35 flex items-center justify-around lg:hidden shadow-2xl">
        <button 
          onClick={() => navigateTo('/order')}
          className={`flex flex-col items-center space-y-1 text-center cursor-pointer focus:outline-none transition-colors ${currentPath === '/order' ? 'text-saffron' : 'text-cream/70 hover:text-white'}`}
          id="mobile-bottom-menu-btn"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Menu</span>
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
          <span className="text-[10px] font-bold uppercase tracking-wider">Events</span>
        </button>

        <a 
          href={`tel:${RESTAURANT_PHONES.primary}`}
          className="flex items-center gap-1.5 bg-saffron text-white py-2 px-3.5 rounded-full text-xs font-bold shadow-md cursor-pointer hover:bg-[#d15423] transition-all"
          id="mobile-bottom-call-btn"
        >
          <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
          <span>Call to Order</span>
        </a>
      </div>

      {/* --- DIRECT PHONE ORDER MODAL --- */}
      <AnimatePresence>
        {isOrderCallModalOpen && (
          <div className="fixed inset-0 z-55 overflow-y-auto bg-charcoal/75 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 md:p-8 text-left space-y-6 relative border border-charcoal/10"
              id="order-call-modal"
            >
              {/* Header with Close */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-saffron/10 border border-saffron/20 flex items-center justify-center text-saffron shrink-0">
                    <PhoneCall className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-2xl text-charcoal">Order via Direct Call</h3>
                    <p className="text-xs text-charcoal/60">Curry Delight Counter & Kitchen Terminal</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOrderCallModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-charcoal/5 text-charcoal/60 hover:text-charcoal cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Selected dish details card if opened from specific dish */}
              {orderCallDish && (
                <div className="bg-cream/40 rounded-2xl p-4 border border-charcoal/10 flex items-center gap-4">
                  {orderCallDish.image && (
                    <img 
                      src={orderCallDish.image} 
                      alt={orderCallDish.name} 
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-charcoal/10"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${orderCallDish.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                      <span className="text-[10px] font-mono uppercase font-bold text-charcoal/50">{orderCallDish.category}</span>
                    </div>
                    <h4 className="font-display font-bold text-base text-charcoal truncate">{orderCallDish.name}</h4>
                    <span className="text-sm font-extrabold text-saffron font-tabular-nums">₹{orderCallDish.price}</span>
                  </div>
                </div>
              )}

              {/* Direct Tap-To-Call Action Buttons */}
              <div className="space-y-3">
                <a 
                  href={`tel:${RESTAURANT_PHONES.primary}`}
                  className="w-full bg-saffron hover:bg-[#d15423] text-white font-bold text-sm py-4 px-6 rounded-2xl flex items-center justify-between shadow-md transition-all hover:scale-101 active:scale-99"
                  id="modal-call-primary-btn"
                >
                  <div className="flex items-center gap-3">
                    <PhoneCall className="w-5 h-5" />
                    <div className="text-left">
                      <span className="block text-xs uppercase font-mono tracking-wider text-white/80">Primary Counter Line</span>
                      <strong className="text-base font-sans">{RESTAURANT_PHONES.primaryDisplay}</strong>
                    </div>
                  </div>
                  <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-mono uppercase">
                    Tap to Call
                  </span>
                </a>

                <a 
                  href={`tel:${RESTAURANT_PHONES.secondary}`}
                  className="w-full bg-charcoal hover:bg-black text-white font-bold text-sm py-4 px-6 rounded-2xl flex items-center justify-between shadow-md transition-all hover:scale-101 active:scale-99"
                  id="modal-call-secondary-btn"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-saffron" />
                    <div className="text-left">
                      <span className="block text-xs uppercase font-mono tracking-wider text-white/80">Alternate Kitchen Line</span>
                      <strong className="text-base font-sans">{RESTAURANT_PHONES.secondaryDisplay}</strong>
                    </div>
                  </div>
                  <span className="bg-white/10 text-white text-xs px-3 py-1 rounded-full font-mono uppercase">
                    Tap to Call
                  </span>
                </a>
              </div>

              {/* Delivery Highlights Info */}
              <div className="bg-[#FFF9F2] rounded-2xl p-4 border border-charcoal/5 space-y-2 text-xs text-charcoal/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Free Delivery:</strong> On all orders above ₹500</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-saffron shrink-0" />
                  <span><strong>Delivery Time:</strong> 35–45 minutes in Kahalgaon Town & NTPC Township</span>
                </div>
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-charcoal/60 shrink-0" />
                  <span><strong>Operating Hours:</strong> 11:30 AM to 10:30 PM (7 Days)</span>
                </div>
              </div>

              <div className="text-center pt-1">
                <button 
                  onClick={() => setIsOrderCallModalOpen(false)}
                  className="text-xs text-charcoal/60 hover:text-charcoal font-semibold underline cursor-pointer"
                >
                  Close & Return to Menu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MOCKTAIL SPECIAL POSTER LIGHTBOX MODAL --- */}
      <AnimatePresence>
        {isMocktailPosterModalOpen && (
          <div className="fixed inset-0 z-55 overflow-y-auto bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="relative">
                <img 
                  src="/mocktail-special-october.jpg" 
                  alt="Curry Delight 30% Off on Mocktails Offer Poster" 
                  className="w-full h-auto max-h-[75vh] object-contain bg-black"
                />
                <button 
                  onClick={() => setIsMocktailPosterModalOpen(false)}
                  className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white p-2 rounded-full cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 text-center space-y-3 bg-white">
                <h3 className="font-display font-bold text-xl text-charcoal">
                  30% Discount on Mocktails
                </h3>
                <p className="text-xs text-charcoal/70">
                  Virgin Mint Mojito & Blue Lagoon • Valid for October Month only!
                </p>
                <div className="flex gap-3 justify-center pt-1">
                  <a 
                    href={`tel:${RESTAURANT_PHONES.primary}`}
                    className="bg-saffron hover:bg-[#d15423] text-white px-6 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-sm"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call to Order ({RESTAURANT_PHONES.primaryDisplay})</span>
                  </a>
                  <button 
                    onClick={() => setIsMocktailPosterModalOpen(false)}
                    className="border border-charcoal/20 hover:border-charcoal text-charcoal px-4 py-2.5 rounded-full font-bold text-xs"
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
