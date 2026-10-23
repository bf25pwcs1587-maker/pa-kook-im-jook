import { MenuItem, Order, OrderItem } from '../types';
import { DEFAULT_MENU_ITEMS } from './defaultMenu';

export function generateSeedOrders(menuItems: MenuItem[] = DEFAULT_MENU_ITEMS): Order[] {
  const orders: Order[] = [];
  let orderCounter = 101;

  // Let's create orders for October 2026 (days 1 to 23)
  const days = [
    { day: 15, count: 18 },
    { day: 16, count: 24 },
    { day: 17, count: 32 }, // Saturday
    { day: 18, count: 28 }, // Sunday
    { day: 19, count: 20 },
    { day: 20, count: 22 },
    { day: 21, count: 25 },
    { day: 22, count: 27 },
    { day: 23, count: 19 }, // Today (2026-10-23)
  ];

  // Helper to pick items with realistic frequencies
  const popularItemIds = ['f-1', 'f-2', 'f-5', 'f-8', 'f-9', 'f-11', 'd-1', 'd-2', 'd-3'];
  const allItemIds = menuItems.map(m => m.id);

  days.forEach(({ day, count }) => {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `2026-10-${dayStr}`;

    for (let i = 0; i < count; i++) {
      const hour = 10 + Math.floor((i / count) * 10); // Between 10:00 and 20:00
      const minute = (i * 7) % 60;
      const timeStr = `${hour < 10 ? '0' : ''}${hour}:${minute < 10 ? '0' : ''}${minute}:00`;
      const timestamp = `${dateStr}T${timeStr}.000Z`;

      // Select 1 to 4 items per order
      const itemCount = 1 + (i % 3 === 0 ? 2 : (i % 2 === 0 ? 1 : 0));
      const orderItems: OrderItem[] = [];

      for (let j = 0; j < itemCount; j++) {
        // pick from popular or all
        const pickId = (j === 0 && (i % 2 === 0))
          ? popularItemIds[(i + j) % popularItemIds.length]
          : allItemIds[(i * 3 + j * 7) % allItemIds.length];

        const menuItem = menuItems.find(m => m.id === pickId) || menuItems[0];
        const qty = (j === 0 && i % 4 === 0) ? 2 : 1;
        const subtotal = qty * menuItem.price;
        const totalCost = qty * menuItem.cost;
        const totalProfit = subtotal - totalCost;

        // check if already in orderItems
        const existing = orderItems.find(it => it.menuItemId === menuItem.id);
        if (existing) {
          existing.quantity += qty;
          existing.subtotal += subtotal;
          existing.totalCost += totalCost;
          existing.totalProfit += totalProfit;
        } else {
          orderItems.push({
            menuItemId: menuItem.id,
            name: menuItem.name,
            unitPrice: menuItem.price,
            unitCost: menuItem.cost,
            quantity: qty,
            subtotal,
            totalCost,
            totalProfit,
          });
        }
      }

      // Add drink to 65% of orders
      if (i % 3 !== 0) {
        const drinkId = ['d-1', 'd-2', 'd-3'][i % 3];
        const drinkItem = menuItems.find(m => m.id === drinkId);
        if (drinkItem && !orderItems.some(it => it.menuItemId === drinkId)) {
          orderItems.push({
            menuItemId: drinkItem.id,
            name: drinkItem.name,
            unitPrice: drinkItem.price,
            unitCost: drinkItem.cost,
            quantity: 1,
            subtotal: drinkItem.price,
            totalCost: drinkItem.cost,
            totalProfit: drinkItem.price - drinkItem.cost,
          });
        }
      }

      let totalQuantity = 0;
      let totalRevenue = 0;
      let totalCost = 0;

      for (const item of orderItems) {
        totalQuantity += item.quantity;
        totalRevenue += item.subtotal;
        totalCost += item.totalCost;
      }

      const totalProfit = totalRevenue - totalCost;
      const paymentMethod = i % 3 === 0 ? 'transfer' : 'cash';
      const amountPaid = paymentMethod === 'cash' ? Math.ceil(totalRevenue / 50) * 50 : totalRevenue;

      orders.push({
        id: `ord-${orderCounter}`,
        orderNumber: orderCounter,
        timestamp,
        date: dateStr,
        items: orderItems,
        totalQuantity,
        totalRevenue,
        totalCost,
        totalProfit,
        paymentMethod,
        amountPaid: Math.max(amountPaid, totalRevenue),
        change: Math.max(0, amountPaid - totalRevenue),
      });

      orderCounter++;
    }
  });

  return orders;
}
