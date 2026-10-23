import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { MenuItem, Order } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying the firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.warn('Firestore Operation:', JSON.stringify(errInfo));
}

// Test connection on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'status'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline mode. Local cache active.');
    }
    return true;
  }
}

// Subscribe to real-time orders (handles empty collection correctly!)
export function subscribeOrders(
  onOrdersUpdated: (orders: Order[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, 'orders');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Order;
        orders.push({
          ...data,
          id: docSnap.id,
        });
      });
      orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onOrdersUpdated(orders);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'orders');
      if (onError) onError(err);
    }
  );
}

// Save or Update Order
export async function saveOrderToFirestore(order: Order): Promise<void> {
  try {
    const docRef = doc(db, 'orders', order.id);
    await setDoc(docRef, order);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `orders/${order.id}`);
  }
}

// Delete Single Order (Void Sale)
export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  try {
    const docRef = doc(db, 'orders', orderId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
  }
}

// Clear all orders for a specific month (e.g. '2026-10')
export async function clearMonthOrdersFromFirestore(yearMonth: string): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, 'orders'));
    const batch = writeBatch(db);
    let count = 0;
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Order;
      if (data.date && data.date.startsWith(yearMonth)) {
        batch.delete(docSnap.ref);
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `orders/month-${yearMonth}`);
  }
}

// Clear ALL orders from database (Clean slate for customer)
export async function clearAllOrdersFromFirestore(): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, 'orders'));
    if (snapshot.empty) return;
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'orders/all');
  }
}

// Purge an item from all existing orders and recalculate
export async function purgeItemFromAllOrdersInFirestore(menuItemId: string): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, 'orders'));
    const batch = writeBatch(db);
    let mutated = 0;

    snapshot.forEach((docSnap) => {
      const ord = docSnap.data() as Order;
      if (ord.items && ord.items.some(it => it.menuItemId === menuItemId)) {
        const remainingItems = ord.items.filter(it => it.menuItemId !== menuItemId);
        if (remainingItems.length === 0) {
          // If slip had only this item, delete the slip
          batch.delete(docSnap.ref);
        } else {
          // Recalculate slip
          let qty = 0;
          let rev = 0;
          let cost = 0;
          remainingItems.forEach(it => {
            qty += it.quantity;
            rev += it.subtotal;
            cost += it.totalCost;
          });
          const prof = rev - cost;
          batch.update(docSnap.ref, {
            items: remainingItems,
            totalQuantity: qty,
            totalRevenue: rev,
            totalCost: cost,
            totalProfit: prof,
          });
        }
        mutated++;
      }
    });

    if (mutated > 0) {
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `orders/purge-${menuItemId}`);
  }
}

// Subscribe to Menu Items
export function subscribeMenuItems(
  onItemsUpdated: (items: MenuItem[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, 'menuItems');
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const items: MenuItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({
            ...(docSnap.data() as MenuItem),
            id: docSnap.id,
          });
        });
        onItemsUpdated(items);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'menuItems');
      if (onError) onError(err);
    }
  );
}

// Save or Update MenuItem
export async function saveMenuItemToFirestore(item: MenuItem): Promise<void> {
  try {
    const docRef = doc(db, 'menuItems', item.id);
    await setDoc(docRef, item);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `menuItems/${item.id}`);
  }
}

// Delete MenuItem
export async function deleteMenuItemFromFirestore(itemId: string): Promise<void> {
  try {
    const docRef = doc(db, 'menuItems', itemId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `menuItems/${itemId}`);
  }
}

// Fast batch seed to Firestore
export async function seedFirestoreIfEmpty(
  seedOrders: Order[],
  defaultMenu: MenuItem[]
): Promise<void> {
  try {
    const orderSnap = await getDocs(collection(db, 'orders'));
    if (orderSnap.empty && seedOrders.length > 0) {
      const batch = writeBatch(db);
      const toSeed = seedOrders.slice(0, 45);
      toSeed.forEach((ord) => {
        batch.set(doc(db, 'orders', ord.id), ord);
      });
      await batch.commit();
    }

    const menuSnap = await getDocs(collection(db, 'menuItems'));
    if (menuSnap.empty && defaultMenu.length > 0) {
      const menuBatch = writeBatch(db);
      defaultMenu.forEach((item) => {
        menuBatch.set(doc(db, 'menuItems', item.id), item);
      });
      await menuBatch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seeding');
  }
}
