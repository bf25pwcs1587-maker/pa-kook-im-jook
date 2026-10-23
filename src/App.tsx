/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { POSView } from './components/POSView';
import { DailySalesView } from './components/DailySalesView';
import { MonthlySalesView } from './components/MonthlySalesView';
import { MenuCostManager } from './components/MenuCostManager';
import { DatabaseInfoModal } from './components/DatabaseInfoModal';
import { MenuItem, Order, OrderItem, FontSizeSetting } from './types';
import { DEFAULT_MENU_ITEMS } from './data/defaultMenu';
import { generateSeedOrders } from './data/seedData';
import { translations, Language } from './utils/translations';
import { 
  subscribeOrders, 
  saveOrderToFirestore, 
  deleteOrderFromFirestore,
  clearMonthOrdersFromFirestore,
  clearAllOrdersFromFirestore,
  purgeItemFromAllOrdersInFirestore,
  subscribeMenuItems,
  saveMenuItemToFirestore,
  seedFirestoreIfEmpty,
  testFirestoreConnection
} from './firebase/config';

const STORAGE_ORDERS_KEY = 'restaurant_pos_orders_v2';
const STORAGE_MENU_KEY = 'restaurant_pos_menu_v2';
const STORAGE_LANG_KEY = 'restaurant_pos_lang_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState<'pos' | 'daily' | 'monthly' | 'menu'>('daily');
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY);
      if (saved === 'en' || saved === 'th') return saved;
    } catch (e) {
      console.error(e);
    }
    return 'th';
  });

  // Default to 'large' as explicitly requested by user ("little bit larg fornt used")
  const [fontSize, setFontSize] = useState<FontSizeSetting>('large');

  // Menu items state with local storage fallback
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MENU_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading menu items', e);
    }
    return DEFAULT_MENU_ITEMS;
  });

  // Orders state with local storage fallback
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ORDERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading orders', e);
    }
    return generateSeedOrders(DEFAULT_MENU_ITEMS);
  });

  // Cart for POS
  const [cart, setCart] = useState<OrderItem[]>([]);

  // Initialize and connect to Firestore database
  useEffect(() => {
    testFirestoreConnection().then(() => {
      // Seed initial data if database is brand new
      const initialSeed = generateSeedOrders(DEFAULT_MENU_ITEMS);
      seedFirestoreIfEmpty(initialSeed, DEFAULT_MENU_ITEMS);
    });

    // Real-time Firestore sync for orders - updates state even when 0 records remain!
    const unsubscribeOrders = subscribeOrders((liveOrders) => {
      setOrders(liveOrders);
      try {
        localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(liveOrders));
      } catch (e) {
        console.error(e);
      }
    });

    // Real-time Firestore sync for menu items
    const unsubscribeMenu = subscribeMenuItems((liveMenu) => {
      if (liveMenu && liveMenu.length > 0) {
        setMenuItems(liveMenu);
        try {
          localStorage.setItem(STORAGE_MENU_KEY, JSON.stringify(liveMenu));
        } catch (e) {
          console.error(e);
        }
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeMenu();
    };
  }, []);

  // Persist language selection
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch (e) {
      console.error(e);
    }
  }, [lang]);

  // Persist to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MENU_KEY, JSON.stringify(menuItems));
    } catch (e) {
      console.error(e);
    }
  }, [menuItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  // Handle new completed sale -> update state, local storage and Firestore
  const handleCompleteSale = async (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    try {
      await saveOrderToFirestore(newOrder);
    } catch (err) {
      console.warn('Saved locally, Firestore sync pending', err);
    }
  };

  // Delete an individual order slip permanently
  // Immediately recalculates daily and monthly totals
  const handleDeleteOrder = async (orderId: string) => {
    // 1. Immediately update UI state & localStorage
    setOrders((prev) => {
      const updated = prev.filter((o) => o.id !== orderId);
      try {
        localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    // 2. Delete from Firestore database
    try {
      await deleteOrderFromFirestore(orderId);
      console.log(`Order ${orderId} permanently deleted from Firestore database`);
    } catch (err) {
      console.warn('Deleted locally, database delete error:', err);
    }
  };

  // Clear all orders for a specific month (e.g. '2026-10')
  const handleClearMonthOrders = async (yearMonth: string) => {
    setOrders((prev) => {
      const remaining = prev.filter((o) => !o.date || !o.date.startsWith(yearMonth));
      try {
        localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(remaining));
      } catch (e) {
        console.error(e);
      }
      return remaining;
    });

    try {
      await clearMonthOrdersFromFirestore(yearMonth);
    } catch (err) {
      console.warn('Clear month in Firestore error:', err);
    }
  };

  // Clear ALL orders from database (Customer Handover - 0 bills clean slate)
  const handleClearAllOrders = async () => {
    setOrders([]);
    setCart([]);
    try {
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }

    try {
      await clearAllOrdersFromFirestore();
    } catch (err) {
      console.warn('Clear all orders error:', err);
    }
  };

  // Purge an item from all existing orders and recalculate
  // Solves: "i delet a items detiles but still it show me monthely revenue why and monthly cost"
  const handlePurgeItemSales = async (menuItemId: string) => {
    setOrders((prev) => {
      const updated: Order[] = [];
      prev.forEach((order) => {
        if (!order.items.some((i) => i.menuItemId === menuItemId)) {
          updated.push(order);
          return;
        }

        const remainingItems = order.items.filter((i) => i.menuItemId !== menuItemId);
        if (remainingItems.length > 0) {
          let qty = 0;
          let rev = 0;
          let cost = 0;
          remainingItems.forEach((i) => {
            qty += i.quantity;
            rev += i.subtotal;
            cost += i.totalCost;
          });
          updated.push({
            ...order,
            items: remainingItems,
            totalQuantity: qty,
            totalRevenue: rev,
            totalCost: cost,
            totalProfit: rev - cost,
          });
        }
        // If order had only this item, it is removed entirely
      });

      try {
        localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    try {
      await purgeItemFromAllOrdersInFirestore(menuItemId);
    } catch (err) {
      console.warn('Purge item in Firestore error:', err);
    }
  };

  // Reset to initial demo seed data
  const handleResetData = () => {
    const freshOrders = generateSeedOrders(DEFAULT_MENU_ITEMS);
    setOrders(freshOrders);
    setMenuItems(DEFAULT_MENU_ITEMS);
    setCart([]);
    try {
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(freshOrders));
      localStorage.setItem(STORAGE_MENU_KEY, JSON.stringify(DEFAULT_MENU_ITEMS));
    } catch (e) {
      console.error(e);
    }
    seedFirestoreIfEmpty(freshOrders, DEFAULT_MENU_ITEMS);
  };

  // Font size multiplier class applied to main container
  const fontSizeClass =
    fontSize === 'xlarge'
      ? 'text-[19px] leading-relaxed'
      : fontSize === 'large'
      ? 'text-[17px] leading-normal font-[450]'
      : 'text-[15px] leading-normal';

  return (
    <div className={`min-h-screen bg-slate-100/90 text-slate-900 ${fontSizeClass} selection:bg-amber-500 selection:text-white`}>
      {/* Top Navigation & App Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        fontSize={fontSize}
        setFontSize={setFontSize}
        lang={lang}
        setLang={setLang}
        onResetData={handleResetData}
        onOpenDbModal={() => setIsDbModalOpen(true)}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
      />

      {/* Main App Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-5">
        {activeTab === 'pos' && (
          <POSView
            menuItems={menuItems}
            cart={cart}
            setCart={setCart}
            onCompleteSale={handleCompleteSale}
            lang={lang}
          />
        )}

        {activeTab === 'daily' && (
          <DailySalesView
            orders={orders}
            menuItems={menuItems}
            onDeleteOrder={handleDeleteOrder}
            lang={lang}
          />
        )}

        {activeTab === 'monthly' && (
          <MonthlySalesView
            orders={orders}
            menuItems={menuItems}
            onSelectDateFromCalendar={() => setActiveTab('daily')}
            onDeleteOrder={handleDeleteOrder}
            onClearMonthOrders={handleClearMonthOrders}
            lang={lang}
          />
        )}

        {activeTab === 'menu' && (
          <MenuCostManager
            menuItems={menuItems}
            setMenuItems={setMenuItems}
            onPurgeItemSales={handlePurgeItemSales}
            lang={lang}
          />
        )}
      </main>

      {/* Database Status & Customer Handover Guide Modal */}
      <DatabaseInfoModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        onClearAllOrders={handleClearAllOrders}
        onResetSeedData={handleResetData}
        totalOrdersCount={orders.length}
        lang={lang}
      />
    </div>
  );
}
