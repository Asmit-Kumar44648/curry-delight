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
    const querySnapshot = await getDocs(collection(db, 'menu_items'));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
  },

  /** Real-time subscription for menu items — keeps frontend in sync */
  subscribeToMenuItems(callback: (items: MenuItem[]) => void) {
    return onSnapshot(collection(db, 'menu_items'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
      callback(items);
    }, (error) => {
      console.error('Menu items subscription error:', error);
    });
  },

  async updateMenuItem(item: MenuItem): Promise<void> {
    const { id, ...data } = item;
    await setDoc(doc(db, 'menu_items', id), cleanData(data));
  },

  async addMenuItem(item: Omit<MenuItem, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'menu_items'), cleanData(item));
    return docRef.id;
  },

  async deleteMenuItem(id: string): Promise<void> {
    await deleteDoc(doc(db, 'menu_items', id));
  },

  /** Toggle the soldOut flag directly on the menu item document */
  async toggleSoldOut(itemId: string, soldOut: boolean): Promise<void> {
    await updateDoc(doc(db, 'menu_items', itemId), { soldOut });
  },

  // ─── Orders ──────────────────────────────────────────────────────────────

  async addOrder(order: AdminOrder): Promise<void> {
    const { id, ...data } = order;
    await setDoc(doc(db, 'orders', id), cleanData({
      ...data,
      syncId: id // Store the original ID
    }));
  },

  subscribeToOrders(callback: (orders: AdminOrder[]) => void) {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100));
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminOrder));
      callback(orders);
    }, (error) => {
      console.error('Orders subscription error:', error);
    });
  },

  async updateOrderStatus(orderId: string, status: AdminOrder['status']): Promise<void> {
    await updateDoc(doc(db, 'orders', orderId), { status });
  },

  async assignDeliveryBoy(orderId: string, deliveryBoyId: string): Promise<void> {
    await updateDoc(doc(db, 'orders', orderId), { assignedDeliveryBoyId: deliveryBoyId });
  },

  // ─── Reservations ────────────────────────────────────────────────────────

  async addReservation(res: AdminReservation): Promise<void> {
    const { id, ...data } = res;
    await setDoc(doc(db, 'reservations', id), cleanData(data));
  },

  subscribeToReservations(callback: (res: AdminReservation[]) => void) {
    const q = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const res = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminReservation));
      callback(res);
    }, (error) => {
      console.error('Reservations subscription error:', error);
    });
  },

  async updateReservationStatus(resId: string, status: AdminReservation['status']): Promise<void> {
    await updateDoc(doc(db, 'reservations', resId), { status });
  },

  // ─── Celebrations ────────────────────────────────────────────────────────

  async addCelebrationEnquiry(enquiry: AdminCelebrationEnquiry): Promise<void> {
    const { id, ...data } = enquiry;
    await setDoc(doc(db, 'celebrations', id), cleanData(data));
  },

  subscribeToCelebrations(callback: (enquiries: AdminCelebrationEnquiry[]) => void) {
    const q = query(collection(db, 'celebrations'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const enquiries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminCelebrationEnquiry));
      callback(enquiries);
    }, (error) => {
      console.error('Celebrations subscription error:', error);
    });
  },

  async updateCelebrationStatus(enquiryId: string, status: AdminCelebrationEnquiry['status']): Promise<void> {
    await updateDoc(doc(db, 'celebrations', enquiryId), { status });
  },

  async updateCelebrationNotes(enquiryId: string, notes: string): Promise<void> {
    await updateDoc(doc(db, 'celebrations', enquiryId), { notes });
  },

  // ─── Delivery Boys ───────────────────────────────────────────────────────

  async getDeliveryBoys(): Promise<DeliveryBoy[]> {
    const querySnapshot = await getDocs(collection(db, 'delivery_boys'));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DeliveryBoy));
  },

  subscribeToDeliveryBoys(callback: (boys: DeliveryBoy[]) => void) {
    return onSnapshot(collection(db, 'delivery_boys'), (snapshot) => {
      const boys = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DeliveryBoy));
      callback(boys);
    }, (error) => {
      console.error('Delivery boys subscription error:', error);
    });
  },

  async addDeliveryBoy(boy: Omit<DeliveryBoy, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'delivery_boys'), cleanData(boy));
    return docRef.id;
  },

  async removeDeliveryBoy(id: string): Promise<void> {
    await deleteDoc(doc(db, 'delivery_boys', id));
  },

  // ─── Settings ────────────────────────────────────────────────────────────

  async getSettings(): Promise<AdminSettings | null> {
    const docSnap = await getDoc(doc(db, 'settings', 'global'));
    return docSnap.exists() ? docSnap.data() as AdminSettings : null;
  },

  /** Real-time subscription for settings */
  subscribeToSettings(callback: (settings: AdminSettings | null) => void) {
    return onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      callback(docSnap.exists() ? docSnap.data() as AdminSettings : null);
    }, (error) => {
      console.error('Settings subscription error:', error);
    });
  },

  async updateSettings(settings: AdminSettings): Promise<void> {
    await setDoc(doc(db, 'settings', 'global'), cleanData(settings));
  }
};
