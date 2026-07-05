import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Calendar, Clock, User, Phone, Mail, 
  Gift, MessageSquare, ArrowRight, ArrowLeft, 
  CheckCircle2, AlertTriangle, HelpCircle, HeartHandshake,
  Plus
} from 'lucide-react';
import { adminStore } from '../lib/adminStore';

interface TableReservationProps {
  navigateTo: (path: string) => void;
}

export default function TableReservation({ navigateTo }: TableReservationProps) {
  const [step, setStep] = useState(1);
  const [partySize, setPartySize] = useState<number>(0);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>('');
  
  const [guestDetails, setGuestDetails] = useState({
    fullName: '',
    phone: '',
    email: '',
    occasion: 'none',
    specialRequests: ''
  });

  const [isConfirmed, setIsConfirmed] = useState(false);

  const availableTimeSlots = [
    { label: 'Lunch: 12:30 PM', value: '12:30 PM' },
    { label: 'Lunch: 1:30 PM', value: '1:30 PM' },
    { label: 'Lunch: 2:30 PM', value: '2:30 PM' },
    { label: 'Dinner: 7:30 PM', value: '7:30 PM' },
    { label: 'Dinner: 8:30 PM', value: '8:30 PM' },
    { label: 'Dinner: 9:30 PM', value: '9:30 PM' },
  ];

  const handleNextStep = () => {
    if (step === 1 && partySize === 0) {
      alert("Please select your party size first.");
      return;
    }
    if (step === 2 && (!bookingDate || !timeSlot)) {
      alert("Please select both a date and time slot first.");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleBookTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestDetails.fullName || !guestDetails.phone) {
      alert("Please enter your name and phone number to book.");
      return;
    }
    
    // Save to the adminStore
    adminStore.addReservation({
      fullName: guestDetails.fullName,
      phone: guestDetails.phone,
      partySize,
      date: bookingDate,
      timeSlot,
      specialRequests: guestDetails.specialRequests
    });

    setIsConfirmed(true);
  };

  const getWhatsAppLink = () => {
    const occasionText = guestDetails.occasion !== 'none' ? `\n• *Occasion:* ${guestDetails.occasion.toUpperCase()}` : '';
    const notesText = guestDetails.specialRequests ? `\n• *Notes:* ${guestDetails.specialRequests}` : '';

    const message = `Namaste Curry Delight Kahalgaon! I would like to reserve a table:\n\n` +
      `• *Name:* ${guestDetails.fullName}\n` +
      `• *Phone:* ${guestDetails.phone}\n` +
      `• *Email:* ${guestDetails.email || 'N/A'}\n` +
      `• *Party Size:* ${partySize} Guests\n` +
      `• *Date:* ${bookingDate}\n` +
      `• *Time:* ${timeSlot}` +
      occasionText +
      notesText +
      `\n\nPlease confirm availability for our table. Thank you!`;

    const encoded = encodeURIComponent(message);
    return `https://wa.me/917061591831?text=${encoded}`;
  };

  return (
    <div className="py-12 px-4 md:px-6 max-w-3xl mx-auto text-left" id="table-reservation-page">
      <AnimatePresence mode="wait">
        {isConfirmed ? (
          /* --- RESERVATION CONFIRMED VIEW --- */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl border border-charcoal/10 shadow-xl overflow-hidden p-6 md:p-10 space-y-8"
            id="reservation-confirmed-screen"
          >
            <div className="text-center space-y-3">
              <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 inline-flex items-center justify-center mb-1">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h1 className="font-display font-bold text-3xl text-charcoal">Table Requested Successfully!</h1>
              <p className="text-sm text-emerald-800 font-bold bg-emerald-50 px-4 py-1.5 rounded-full inline-block font-mono">
                Booking ID: CD-RES-{Math.floor(1000 + Math.random() * 9000)}
              </p>
              <p className="text-xs text-charcoal/50 leading-relaxed max-w-md mx-auto font-normal">
                Your instant self-serve reservation is drafted. Click the WhatsApp button below to instantly register your seat on our active guest log.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-cream/45 border border-charcoal/5 p-6 rounded-2xl space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-charcoal/40 font-bold block">Reservation Blueprint</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-charcoal/50 block mb-0.5">Primary Guest:</span>
                  <strong className="text-charcoal font-semibold text-sm">{guestDetails.fullName}</strong>
                </div>
                <div>
                  <span className="text-charcoal/50 block mb-0.5">Phone Contact:</span>
                  <strong className="text-charcoal font-semibold text-sm">{guestDetails.phone}</strong>
                </div>
                <div>
                  <span className="text-charcoal/50 block mb-0.5">Reservation Size:</span>
                  <strong className="text-saffron font-bold text-sm">{partySize} Guests</strong>
                </div>
                <div>
                  <span className="text-charcoal/50 block mb-0.5">Date & Time Slot:</span>
                  <strong className="text-charcoal font-semibold text-sm">{bookingDate} at {timeSlot}</strong>
                </div>
                {guestDetails.occasion !== 'none' && (
                  <div>
                    <span className="text-charcoal/50 block mb-0.5">Special Occasion:</span>
                    <strong className="text-charcoal font-semibold text-sm capitalize">{guestDetails.occasion}</strong>
                  </div>
                )}
                {guestDetails.specialRequests && (
                  <div className="md:col-span-2">
                    <span className="text-charcoal/50 block mb-0.5">Custom Requests:</span>
                    <p className="text-charcoal/75 italic leading-relaxed">"{guestDetails.specialRequests}"</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <a 
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-base py-4 rounded-full flex items-center justify-center space-x-2 shadow-md transition-all text-center"
                id="whatsapp-confirm-booking-btn"
              >
                <MessageSquare className="w-5 h-5 fill-white text-[#25D366]" />
                <span>Submit Reservation via WhatsApp</span>
              </a>

              <button 
                onClick={() => {
                  setIsConfirmed(false);
                  setStep(1);
                  setPartySize(0);
                  navigateTo('/');
                }}
                className="w-full bg-charcoal hover:bg-charcoal/90 text-white font-bold text-sm py-3.5 rounded-full cursor-pointer focus:outline-none transition-all text-center"
              >
                Back to Homepage
              </button>
            </div>
          </motion.div>
        ) : (
          /* --- 3-STEP RESERVATION WIZARD --- */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-3xl border border-charcoal/10 shadow-lg p-6 md:p-8 space-y-8"
          >
            {/* Header */}
            <div className="space-y-2 text-center md:text-left border-b border-charcoal/5 pb-6">
              <span className="text-xs font-bold text-saffron tracking-wider uppercase font-mono block">Dine With Us</span>
              <h1 className="font-display font-bold text-3xl md:text-4xl text-charcoal tracking-tight">Reserve a Table</h1>
              <p className="text-xs md:text-sm text-charcoal/60 max-w-xl font-normal leading-relaxed">
                Enjoy fresh, stone-ground clay oven meals served hot. Instant booking is available for parties up to 8 guests. For large celebrations, please use our events portal.
              </p>
            </div>

            {/* Stepper Progress Bar */}
            <div className="flex items-center justify-between max-w-md mx-auto md:mx-0">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    step >= num ? 'bg-saffron text-white shadow-xs' : 'bg-charcoal/5 text-charcoal/40'
                  }`}>
                    {num}
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider font-bold hidden sm:inline ${
                    step === num ? 'text-charcoal font-black' : 'text-charcoal/40'
                  }`}>
                    {num === 1 ? 'Party Size' : num === 2 ? 'Schedule' : 'Guest Details'}
                  </span>
                  {num < 3 && <div className="w-8 md:w-16 h-0.5 bg-charcoal/5" />}
                </div>
              ))}
            </div>

            {/* STEP 1: PARTY SIZE SELECTION */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-charcoal/50 block font-mono">Step 1: Select Number of Guests</label>
                  <h3 className="font-display font-bold text-xl text-charcoal">How many people are in your dining party?</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPartySize(num)}
                      className={`border rounded-2xl p-4 flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                        partySize === num 
                          ? 'border-saffron bg-saffron/5 text-saffron ring-1 ring-saffron' 
                          : 'border-charcoal/10 text-charcoal/70 hover:bg-cream/20'
                      }`}
                    >
                      <Users className={`w-5 h-5 ${partySize === num ? 'text-saffron' : 'text-charcoal/40'}`} />
                      <span className="font-extrabold text-sm">{num} {num === 1 ? 'Guest' : 'Guests'}</span>
                    </button>
                  ))}

                  {/* Redirection Trigger for Group Size > 8 */}
                  <button
                    type="button"
                    onClick={() => {
                      setPartySize(9);
                    }}
                    className={`border rounded-2xl p-4 flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer col-span-2 sm:col-span-4 border-dashed ${
                      partySize > 8
                        ? 'border-saffron bg-saffron/5 text-saffron ring-1 ring-saffron'
                        : 'border-charcoal/10 text-charcoal/70 hover:bg-cream/20'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <Users className="w-5 h-5 text-saffron" />
                      <Plus className="w-3 h-3 text-saffron -ml-1.5" />
                    </div>
                    <span className="font-extrabold text-sm text-charcoal">More than 8 Guests?</span>
                    <span className="text-[10px] text-charcoal/50 font-normal">Click to discover Celebrations & Private Events</span>
                  </button>
                </div>

                {/* Warning message if they specify/click on groups > 8 */}
                {partySize > 8 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start space-x-3.5 text-amber-900"
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 text-left">
                      <span className="text-xs font-black uppercase tracking-wider block font-mono">Large Dining Party Detected</span>
                      <p className="text-xs font-normal leading-relaxed text-amber-800">
                        Our instant dine-in tables are structurally capped at a maximum of 8 guests to maintain high culinary standard and cozy environment. For anniversaries, office meals, or family celebrations with 9+ guests, please utilize our exclusive event concierge path!
                      </p>
                      <button
                        type="button"
                        onClick={() => navigateTo('/celebrations')}
                        className="bg-saffron text-white hover:bg-[#d15423] font-bold text-xs px-5 py-2.5 rounded-full cursor-pointer flex items-center space-x-1.5 transition-colors mt-1"
                      >
                        <span>Navigate to Celebrations Page</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-end pt-4 border-t border-charcoal/5">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={partySize === 0 || partySize > 8}
                    className={`bg-charcoal text-white px-7 py-3 rounded-full font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer ${
                      (partySize === 0 || partySize > 8) ? 'opacity-40 cursor-not-allowed' : 'hover:bg-charcoal/90'
                    }`}
                  >
                    <span>Proceed to Schedule</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: BOOKING DETAILS (DATE & TIME) BEFORE PERSONAL DETAILS */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-charcoal/50 block font-mono">Step 2: Select Date & Time Slot</label>
                  <h3 className="font-display font-bold text-xl text-charcoal">When will you be joining us?</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Select Date */}
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/50 block font-mono">Select Booking Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                      <input 
                        type="date"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full border border-charcoal/25 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-saffron bg-white"
                      />
                    </div>
                  </div>

                  {/* Select Time Slot */}
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/50 block font-mono">Select Dining Time Slot</label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                      <select
                        required
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="w-full border border-charcoal/25 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-saffron bg-white"
                      >
                        <option value="">-- Choose Dining Hour --</option>
                        {availableTimeSlots.map((slot) => (
                          <option key={slot.value} value={slot.value}>{slot.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-charcoal/5">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="border border-charcoal/20 hover:border-charcoal/40 text-charcoal px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!bookingDate || !timeSlot}
                    className={`bg-charcoal text-white px-7 py-3 rounded-full font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer ${
                      (!bookingDate || !timeSlot) ? 'opacity-40 cursor-not-allowed' : 'hover:bg-charcoal/90'
                    }`}
                  >
                    <span>Proceed to Guest Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: GUEST PERSONAL DETAILS */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-charcoal/50 block font-mono">Step 3: Tell Us About Yourself</label>
                  <h3 className="font-display font-bold text-xl text-charcoal">Complete your table booking</h3>
                </div>

                <form onSubmit={handleBookTable} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Full Name */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/50 block font-mono">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                        <input 
                          type="text"
                          required
                          placeholder="e.g. Aarav Kumar"
                          value={guestDetails.fullName}
                          onChange={(e) => setGuestDetails({ ...guestDetails, fullName: e.target.value })}
                          className="w-full border border-charcoal/25 rounded-2xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-saffron bg-white"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/50 block font-mono">Mobile Contact Line</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                        <input 
                          type="tel"
                          required
                          placeholder="e.g. +91 70615 91831"
                          value={guestDetails.phone}
                          onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                          className="w-full border border-charcoal/25 rounded-2xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-saffron bg-white"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/50 block font-mono">Email Address (Optional)</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                        <input 
                          type="email"
                          placeholder="e.g. aarav@gmail.com"
                          value={guestDetails.email}
                          onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
                          className="w-full border border-charcoal/25 rounded-2xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-saffron bg-white"
                        />
                      </div>
                    </div>

                    {/* Occasion */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/50 block font-mono">Is it a Special Occasion?</label>
                      <div className="relative">
                        <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                        <select
                          value={guestDetails.occasion}
                          onChange={(e) => setGuestDetails({ ...guestDetails, occasion: e.target.value })}
                          className="w-full border border-charcoal/25 rounded-2xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-saffron bg-white"
                        >
                          <option value="none">No Special Occasion</option>
                          <option value="birthday">🎂 Birthday Dinner</option>
                          <option value="anniversary">💖 Anniversary Celebration</option>
                          <option value="business">💼 Business Dinner</option>
                          <option value="casual">🍽️ Cozy Family Gathering</option>
                        </select>
                      </div>
                    </div>

                    {/* Special Requests */}
                    <div className="space-y-1.5 text-left md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/50 block font-mono">Special Requests or Instructions (Optional)</label>
                      <textarea 
                        placeholder="e.g. prefer a quiet window side table, need high chair for kids, mild food..."
                        rows={3}
                        value={guestDetails.specialRequests}
                        onChange={(e) => setGuestDetails({ ...guestDetails, specialRequests: e.target.value })}
                        className="w-full border border-charcoal/25 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-saffron bg-white font-sans"
                      />
                    </div>

                  </div>

                  <div className="flex justify-between pt-6 border-t border-charcoal/5">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="border border-charcoal/20 hover:border-charcoal/40 text-charcoal px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <button
                      type="submit"
                      className="bg-saffron hover:bg-[#d15423] text-white px-8 py-3 rounded-full font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer shadow-lg transition-transform focus:outline-none hover:scale-101"
                      id="table-booking-submit-btn"
                    >
                      <span>Draft My Table Booking</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
