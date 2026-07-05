import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Calendar, Users, Landmark, Heart, 
  Briefcase, Send, MessageSquare, ArrowRight, 
  Award, CheckCircle2, DollarSign, PenTool
} from 'lucide-react';
import { adminStore } from '../lib/adminStore';

interface CelebrationsProps {
  navigateTo: (path: string) => void;
}

export default function Celebrations({ navigateTo }: CelebrationsProps) {
  const [enquirySubmitted, setEnquirySubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    eventDate: '',
    headcount: '',
    budget: '',
    occasionType: 'birthday',
    requirements: ''
  });

  const occasions = [
    {
      id: 'birthday',
      title: 'Birthdays & Milestones',
      description: 'Host memorable custom birthdays with custom-made multicourse menus, themed tablescapes, and curated dessert platters from our master pastry chefs.',
      capacity: '15 - 40 Guests',
      icon: Sparkles,
      color: 'bg-saffron/10 text-saffron'
    },
    {
      id: 'anniversary',
      title: 'Anniversaries & Romance',
      description: 'Celebrate elegant family gatherings and love milestones with romantic warm candlelit decor, soft sit-down plated services, and premium Indian recipe tasting dinners.',
      capacity: '10 - 25 Guests',
      icon: Heart,
      color: 'bg-rose-50 text-rose-600 border border-rose-100'
    },
    {
      id: 'corporate',
      title: 'Corporate Meets & Business dinners',
      description: 'Host team bonding meals, office parties, and client dinners. We offer reliable presentation-ready dining space, high-speed Wi-Fi, and quick multi-course buffets.',
      capacity: '12 - 50 Guests',
      icon: Briefcase,
      color: 'bg-blue-50 text-blue-600 border border-blue-100'
    },
    {
      id: 'banquets',
      title: 'Family Banquets & Traditional Festivities',
      description: 'The ultimate space for massive extended family reunions, Diwali meets, or Eid banquets with authentic family heritage recipes served in traditional copper vessels.',
      capacity: '20 - 60 Guests',
      icon: Landmark,
      color: 'bg-emerald-50 text-emerald-600 border border-emerald-100'
    }
  ];

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.eventDate || !formData.headcount) {
      alert("Please fill in all required fields to register your enquiry.");
      return;
    }

    // Save to the adminStore
    adminStore.addCelebration({
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      eventDate: formData.eventDate,
      headcount: parseInt(formData.headcount) || 10,
      occasionType: formData.occasionType,
      budget: formData.budget || undefined,
      requirements: formData.requirements
    });

    setEnquirySubmitted(true);
  };

  const getWhatsAppEnquiryLink = () => {
    const selectedOccasion = occasions.find(o => o.id === formData.occasionType)?.title || formData.occasionType;
    const budgetText = formData.budget ? `\n• *Estimated Budget:* ₹${formData.budget}` : '';
    const emailText = formData.email ? `\n• *Email:* ${formData.email}` : '';
    const reqsText = formData.requirements ? `\n• *Requirements:* ${formData.requirements}` : '';

    const message = `Namaste Curry Delight Kahalgaon! I would like to enquire about booking a private celebration event:\n\n` +
      `• *Name:* ${formData.fullName}\n` +
      `• *Phone:* ${formData.phone}` +
      emailText + `\n` +
      `• *Event Date:* ${formData.eventDate}\n` +
      `• *Estimated Headcount:* ${formData.headcount} Guests\n` +
      `• *Occasion Type:* ${selectedOccasion}` +
      budgetText +
      reqsText +
      `\n\nPlease let us know your availability and customized packages. Thank you!`;

    const encoded = encodeURIComponent(message);
    return `https://wa.me/917061591831?text=${encoded}`;
  };

  return (
    <div className="py-8 px-4 md:px-6 max-w-7xl mx-auto space-y-12 text-left" id="celebrations-page">
      
      {/* 1. HERO NARRATIVE SECTION */}
      <div className="relative rounded-3xl overflow-hidden bg-charcoal text-white p-6 md:p-12 lg:p-16 flex flex-col justify-between shadow-xl border border-white/5">
        <div className="absolute inset-0 bg-radial-gradient opacity-10" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="text-xs font-bold text-saffron uppercase tracking-widest font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Curry Delight Banquets
          </span>
          <h1 className="font-display font-bold text-3xl md:text-5xl text-white tracking-tight leading-none">
            Where Every Occasion <br />
            <span className="text-saffron">Becomes a Heritage Tale</span>
          </h1>
          <p className="text-xs md:text-sm text-cream/70 leading-relaxed font-normal max-w-lg">
            Host your next birthday, cozy anniversary dinner, or corporate meetup in Kahalgaon's premium private dining space. We blend traditional clay-oven culinary excellence with warm family hospitality.
          </p>
          <div className="pt-4 flex flex-wrap gap-3">
            <a 
              href="#enquiry-form-section" 
              className="bg-saffron text-white hover:bg-[#d15423] px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              Request Custom Package
            </a>
            <button 
              onClick={() => navigateTo('/reserve')}
              className="bg-white/10 text-white hover:bg-white/20 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Book Regular Table
            </button>
          </div>
        </div>
      </div>

      {/* 2. OCCASION LISTINGS */}
      <div className="space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-bold text-saffron uppercase tracking-wider font-mono">Bespoke Services</span>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-charcoal">Occasions We Host Excellently</h2>
          <p className="text-xs md:text-sm text-charcoal/60 max-w-xl font-normal leading-relaxed">
            Whether it is an intimate celebratory table of 10 or an exclusive complete restaurant takeover of 60 guests, we curate everything perfectly for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {occasions.map((occasion) => {
            const IconComponent = occasion.icon;
            return (
              <div 
                key={occasion.id}
                className="bg-white p-6 rounded-2xl border border-charcoal/10 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-4">
                  <div className="flex items-center space-x-3.5">
                    <div className={`p-3 rounded-xl ${occasion.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-charcoal leading-tight">{occasion.title}</h3>
                      <span className="text-[10px] text-charcoal/40 font-mono uppercase tracking-wider font-bold">Capacity: {occasion.capacity}</span>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-charcoal/75 leading-relaxed font-normal">
                    {occasion.description}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFormData({ ...formData, occasionType: occasion.id });
                    document.getElementById('enquiry-form-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-5 text-xs font-bold text-saffron hover:text-[#d15423] inline-flex items-center gap-1 cursor-pointer w-fit"
                >
                  <span>Inquire for this Event</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ENQUIRY LEAD CAPTURE FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-charcoal/10" id="enquiry-form-section">
        
        {/* Descriptive Pitch on Left */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-saffron uppercase tracking-wider font-mono">Custom Curation</span>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-charcoal">Host Your Event</h2>
            <p className="text-xs md:text-sm text-charcoal/65 leading-relaxed font-normal">
              Tell us about your estimated guest count, dates, and budget preference. Our family event coordinator will reach out directly with custom menu pricing, complimentary decorators, and customized packages!
            </p>
          </div>

          <div className="space-y-3.5 text-xs text-charcoal/80">
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>Complimentary basic balloons & flower decor for kids birthday requests.</span>
            </div>
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>Dedicated catering captain for smooth table hospitality.</span>
            </div>
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>Flexible pure vegetarian or mixed buffet menus tailored on request.</span>
            </div>
          </div>
        </div>

        {/* Form Container on Right */}
        <div className="lg:col-span-8 bg-white border border-charcoal/10 rounded-3xl p-6 md:p-8 shadow-md">
          <AnimatePresence mode="wait">
            {enquirySubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-8 text-center space-y-6"
                id="enquiry-success-block"
              >
                <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 inline-flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-bold text-2xl text-charcoal">Enquiry Successfully Drafted!</h3>
                  <p className="text-xs text-charcoal/50 max-w-sm mx-auto font-normal">
                    Namaste! Your event request is captured. Click the WhatsApp button below to instantly transmit your requirements directly to our family concierge line.
                  </p>
                </div>

                {/* Event Summary */}
                <div className="bg-cream/40 p-4 rounded-xl border border-charcoal/5 text-left text-xs max-w-md mx-auto space-y-1">
                  <div><strong>Occasion:</strong> <span className="capitalize">{formData.occasionType}</span></div>
                  <div><strong>Guest Headcount:</strong> {formData.headcount} guests</div>
                  <div><strong>Event Date:</strong> {formData.eventDate}</div>
                  {formData.budget && <div><strong>Estimated Budget:</strong> ₹{formData.budget}</div>}
                </div>

                <div className="space-y-3.5 max-w-md mx-auto">
                  <a 
                    href={getWhatsAppEnquiryLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm py-3.5 rounded-full flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all text-center"
                    id="whatsapp-enquiry-send-btn"
                  >
                    <MessageSquare className="w-4.5 h-4.5 fill-white text-[#25D366]" />
                    <span>Submit Enquiry via WhatsApp</span>
                  </a>

                  <button 
                    onClick={() => {
                      setEnquirySubmitted(false);
                      setFormData({
                        fullName: '',
                        phone: '',
                        email: '',
                        eventDate: '',
                        headcount: '',
                        budget: '',
                        occasionType: 'birthday',
                        requirements: ''
                      });
                    }}
                    className="w-full text-charcoal font-bold text-xs py-2 hover:underline cursor-pointer"
                  >
                    Register Another Enquiry
                  </button>
                </div>

              </motion.div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-4">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-charcoal/40 block">Step 1: Contact details</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 block">Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Aarav Kumar"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full border border-charcoal/20 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-saffron bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 block">Mobile Phone Number</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="e.g. +91 70615 91831"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-charcoal/20 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-saffron bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 block">Email (Optional)</label>
                    <input 
                      type="email" 
                      placeholder="e.g. aarav@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-charcoal/20 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-saffron bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 block">Date of Event</label>
                    <input 
                      type="date" 
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      className="w-full border border-charcoal/20 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-saffron bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 block">Occasion Type</label>
                    <select
                      value={formData.occasionType}
                      onChange={(e) => setFormData({ ...formData, occasionType: e.target.value })}
                      className="w-full border border-charcoal/20 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-saffron bg-white bg-no-repeat"
                    >
                      <option value="birthday">🎂 Birthday Party</option>
                      <option value="anniversary">💖 Anniversary / Romance</option>
                      <option value="corporate">💼 Corporate Meet / Dinner</option>
                      <option value="banquets">🏡 Large Family Feast / Reunion</option>
                      <option value="kitty">💃 Kitty Party</option>
                      <option value="other">✨ Other Custom Event</option>
                    </select>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-charcoal/40 block pt-3">Step 2: Celebration logistics</span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 block">Headcount / Number of Guests</label>
                    <input 
                      type="number" 
                      required
                      min="9"
                      placeholder="Minimum 9 guests"
                      value={formData.headcount}
                      onChange={(e) => setFormData({ ...formData, headcount: e.target.value })}
                      className="w-full border border-charcoal/20 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-saffron bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 block">Estimated Budget (INR, Optional)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 5000"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full border border-charcoal/20 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-saffron bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60 block">Custom Requirements & Catering Notes (Optional)</label>
                  <textarea 
                    placeholder="e.g. pure vegetarian setup, chocolate cake, music setup, flower themes, specific mocktails needed..."
                    rows={3}
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    className="w-full border border-charcoal/20 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-saffron bg-white font-sans"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-saffron hover:bg-[#d15423] text-white font-bold text-sm py-4 rounded-full flex items-center justify-center space-x-1.5 shadow-lg mt-4 cursor-pointer focus:outline-none hover:scale-101 transition-all"
                  id="celebrations-submit-btn"
                >
                  <span>Draft Celebration Enquiry</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
