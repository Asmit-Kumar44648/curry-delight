import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { MenuItem } from '../types';
import { AdminSettings, AdminOrder, AdminReservation, AdminCelebrationEnquiry, DeliveryBoy } from './adminStore';

// Ensure database is initialized before making a call to prevent SDK-level crash
const ensureDb = () => {
  if (!db) {
    throw new Error("Firestore is not initialized. Please set your VITE_FIREBASE_* environment variables.");
  }
};

// Strip undefined values so Firestore doesn't reject the write
const cleanData = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanData(item)).filter(item => item !== undefined);
  }

  const newObj: any = {};
  Object.keys(obj).forEach(key => {
    const value = cleanData(obj[key]);
    if (value !== undefined) {
      newObj[key] = value;
    }
  });
  return newObj;
};

export const firebaseService = {
  // ─── Menu Items ──────────────────────────────────────────────────────────

  async getMenuItems(): Promise<MenuItem[]> {
    ensureDb();
    const querySnapshot = await getDocs(collection(db, 'menu_items'));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
  },

  /** Real-time subscription for menu items — keeps frontend in sync */
  subscribeToMenuItems(callback: (items: MenuItem[]) => void) {
    if (!db) {
      console.warn("Firestore not active. Falling back to offline menu.");
      return () => {};
    }
    return onSnapshot(collection(db, 'menu_items'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
      callback(items);
    }, (error) => {
      console.error('Menu items subscription error:', error);
    });
  },

  async updateMenuItem(item: MenuItem): Promise<void> {
    ensureDb();
    const { id, ...data } = item;
    await setDoc(doc(db, 'menu_items', id), cleanData(data));
  },

  async addMenuItem(item: Omit<MenuItem, 'id'>): Promise<string> {
    ensureDb();
    const docRef = await addDoc(collection(db, 'menu_items'), cleanData(item));
    return docRef.id;
  },

  async deleteMenuItem(id: string): Promise<void> {
    ensureDb();
    await deleteDoc(doc(db, 'menu_items', id));
  },

  /** Toggle the soldOut flag directly on the menu item document */
  async toggleSoldOut(itemId: string, soldOut: boolean): Promise<void> {
    ensureDb();
    await updateDoc(doc(db, 'menu_items', itemId), { soldOut });
  },

  // ─── Orders ──────────────────────────────────────────────────────────────

  async addOrder(order: AdminOrder): Promise<void> {
    ensureDb();
    const { id, ...data } = order;
    await setDoc(doc(db, 'orders', id), cleanData({
      ...data,
      syncId: id // Store the original ID
    }));
  },

  subscribeToOrders(callback: (orders: AdminOrder[]) => void) {
    if (!db) return () => {};
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100));
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminOrder));
      callback(orders);
    }, (error) => {
      console.error('Orders subscription error:', error);
    });
  },

  async updateOrderStatus(orderId: string, status: AdminOrder['status']): Promise<void> {
    ensureDb();
    await updateDoc(doc(db, 'orders', orderId), { status });
  },

  async assignDeliveryBoy(orderId: string, deliveryBoyId: string): Promise<void> {
    ensureDb();
    await updateDoc(doc(db, 'orders', orderId), { assignedDeliveryBoyId: deliveryBoyId });
  },

  // ─── Reservations ────────────────────────────────────────────────────────

  async addReservation(res: AdminReservation): Promise<void> {
    ensureDb();
    const { id, ...data } = res;
    await setDoc(doc(db, 'reservations', id), cleanData(data));
  },

  subscribeToReservations(callback: (res: AdminReservation[]) => void) {
    if (!db) return () => {};
    const q = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const res = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminReservation));
      callback(res);
    }, (error) => {
      console.error('Reservations subscription error:', error);
    });
  },

  async updateReservationStatus(resId: string, status: AdminReservation['status']): Promise<void> {
    ensureDb();
    await updateDoc(doc(db, 'reservations', resId), { status });
  },

  // ─── Celebrations ────────────────────────────────────────────────────────

  async addCelebrationEnquiry(enquiry: AdminCelebrationEnquiry): Promise<void> {
    ensureDb();
    const { id, ...data } = enquiry;
    await setDoc(doc(db, 'celebrations', id), cleanData(data));
  },

  subscribeToCelebrations(callback: (enquiries: AdminCelebrationEnquiry[]) => void) {
    if (!db) return () => {};
    const q = query(collection(db, 'celebrations'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const enquiries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminCelebrationEnquiry));
      callback(enquiries);
    }, (error) => {
      console.error('Celebrations subscription error:', error);
    });
  },

  async updateCelebrationStatus(enquiryId: string, status: AdminCelebrationEnquiry['status']): Promise<void> {
    ensureDb();
    await updateDoc(doc(db, 'celebrations', enquiryId), { status });
  },

  async updateCelebrationNotes(enquiryId: string, notes: string): Promise<void> {
    ensureDb();
    await updateDoc(doc(db, 'celebrations', enquiryId), { notes });
  },

  // ─── Delivery Boys ───────────────────────────────────────────────────────

  async getDeliveryBoys(): Promise<DeliveryBoy[]> {
    ensureDb();
    const querySnapshot = await getDocs(collection(db, 'delivery_boys'));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DeliveryBoy));
  },

  subscribeToDeliveryBoys(callback: (boys: DeliveryBoy[]) => void) {
    if (!db) return () => {};
    return onSnapshot(collection(db, 'delivery_boys'), (snapshot) => {
      const boys = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DeliveryBoy));
      callback(boys);
    }, (error) => {
      console.error('Delivery boys subscription error:', error);
    });
  },

  async addDeliveryBoy(boy: Omit<DeliveryBoy, 'id'>): Promise<string> {
    ensureDb();
    const docRef = await addDoc(collection(db, 'delivery_boys'), cleanData(boy));
    return docRef.id;
  },

  async removeDeliveryBoy(id: string): Promise<void> {
    ensureDb();
    await deleteDoc(doc(db, 'delivery_boys', id));
  },

  // ─── Settings ────────────────────────────────────────────────────────────

  async getSettings(): Promise<AdminSettings | null> {
    ensureDb();
    const docSnap = await getDoc(doc(db, 'settings', 'global'));
    return docSnap.exists() ? docSnap.data() as AdminSettings : null;
  },

  /** Real-time subscription for settings */
  subscribeToSettings(callback: (settings: AdminSettings | null) => void) {
    if (!db) return () => {};
    return onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      callback(docSnap.exists() ? docSnap.data() as AdminSettings : null);
    }, (error) => {
      console.error('Settings subscription error:', error);
    });
  },

  async updateSettings(settings: AdminSettings): Promise<void> {
    ensureDb();
    await setDoc(doc(db, 'settings', 'global'), cleanData(settings));
  }
};
