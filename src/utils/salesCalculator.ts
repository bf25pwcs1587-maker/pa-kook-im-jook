import { MenuItem, Order, OrderItem, ItemSalesSummary, SalesReport } from '../types';

/**
 * Calculates financial totals from a list of items in a bill/cart
 */
export function calculateOrderTotals(items: OrderItem[]) {
  let totalQuantity = 0;
  let totalRevenue = 0;
  let totalCost = 0;

  for (const item of items) {
    const qty = Math.max(0, item.quantity);
    totalQuantity += qty;
    totalRevenue += qty * item.unitPrice;
    totalCost += qty * item.unitCost;
  }

  const totalProfit = totalRevenue - totalCost;
  const profitMarginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return {
    totalQuantity,
    totalRevenue,
    totalCost,
    totalProfit,
    profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
  };
}

/**
 * Breaks down all sold items, quantities, revenues, costs, and profits
 * across a set of orders.
 */
export function calculateItemsBreakdown(
  orders: Order[],
  menuItems: MenuItem[]
): ItemSalesSummary[] {
  // Aggregate sales by menuItemId
  const map = new Map<string, {
    name: string;
    category: 'food' | 'drink';
    unitPrice: number;
    unitCost: number;
    quantitySold: number;
    totalRevenue: number;
    totalCost: number;
  }>();

  // Initialize with all current menu items
  for (const item of menuItems) {
    map.set(item.id, {
      name: item.name,
      category: item.category,
      unitPrice: item.price,
      unitCost: item.cost,
      quantitySold: 0,
      totalRevenue: 0,
      totalCost: 0,
    });
  }

  let grandTotalRevenue = 0;

  for (const order of orders) {
    for (const item of order.items) {
      grandTotalRevenue += item.subtotal;
      const existing = map.get(item.menuItemId) || {
        name: item.name,
        category: 'food' as const,
        unitPrice: item.unitPrice,
        unitCost: item.unitCost,
        quantitySold: 0,
        totalRevenue: 0,
        totalCost: 0,
      };

      existing.quantitySold += item.quantity;
      existing.totalRevenue += item.subtotal;
      existing.totalCost += item.totalCost;

      map.set(item.menuItemId, existing);
    }
  }

  // Create list of summaries
  const summaries: ItemSalesSummary[] = [];

  map.forEach((stats, id) => {
    const profit = stats.totalRevenue - stats.totalCost;
    const margin = stats.totalRevenue > 0 ? (profit / stats.totalRevenue) * 100 : 0;
    const share = grandTotalRevenue > 0 ? (stats.totalRevenue / grandTotalRevenue) * 100 : 0;

    summaries.push({
      menuItemId: id,
      name: stats.name,
      category: stats.category,
      unitPrice: stats.unitPrice,
      unitCost: stats.unitCost,
      quantitySold: stats.quantitySold,
      totalRevenue: stats.totalRevenue,
      totalCost: stats.totalCost,
      totalProfit: profit,
      profitMarginPercent: Math.round(margin * 10) / 10,
      percentageOfTotalSales: Math.round(share * 10) / 10,
    });
  });

  // Sort by quantitySold descending, then by revenue
  summaries.sort((a, b) => {
    if (b.quantitySold !== a.quantitySold) {
      return b.quantitySold - a.quantitySold;
    }
    return b.totalRevenue - a.totalRevenue;
  });

  return summaries;
}

/**
 * Calculates daily report for a specific YYYY-MM-DD
 */
export function calculateDailyReport(
  orders: Order[],
  targetDate: string,
  menuItems: MenuItem[]
): SalesReport {
  const filtered = orders.filter((o) => o.date === targetDate);

  let totalRevenue = 0;
  let totalCost = 0;
  let totalQuantity = 0;

  for (const order of filtered) {
    totalRevenue += order.totalRevenue;
    totalCost += order.totalCost;
    totalQuantity += order.totalQuantity;
  }

  const totalProfit = totalRevenue - totalCost;
  const profitMarginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const averageOrderValue = filtered.length > 0 ? totalRevenue / filtered.length : 0;

  const itemSummaries = calculateItemsBreakdown(filtered, menuItems);

  return {
    periodLabel: `ประจำวันที่ ${targetDate}`,
    startDate: targetDate,
    endDate: targetDate,
    totalOrders: filtered.length,
    totalQuantity,
    totalRevenue,
    totalCost,
    totalProfit,
    profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
    averageOrderValue: Math.round(averageOrderValue * 10) / 10,
    itemSummaries,
  };
}

/**
 * Calculates monthly report for a specific YYYY-MM
 */
export function calculateMonthlyReport(
  orders: Order[],
  yearMonth: string, // '2026-10'
  menuItems: MenuItem[]
): SalesReport {
  const filtered = orders.filter((o) => o.date.startsWith(yearMonth));

  let totalRevenue = 0;
  let totalCost = 0;
  let totalQuantity = 0;

  // Track daily stats
  const dailyMap = new Map<string, {
    orderCount: number;
    totalQuantity: number;
    revenue: number;
    cost: number;
    profit: number;
  }>();

  for (const order of filtered) {
    totalRevenue += order.totalRevenue;
    totalCost += order.totalCost;
    totalQuantity += order.totalQuantity;

    const existing = dailyMap.get(order.date) || {
      orderCount: 0,
      totalQuantity: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
    };

    existing.orderCount += 1;
    existing.totalQuantity += order.totalQuantity;
    existing.revenue += order.totalRevenue;
    existing.cost += order.totalCost;
    existing.profit += order.totalProfit;

    dailyMap.set(order.date, existing);
  }

  const totalProfit = totalRevenue - totalCost;
  const profitMarginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const averageOrderValue = filtered.length > 0 ? totalRevenue / filtered.length : 0;

  // Build daily breakdown
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  const dailyBreakdown = [];
  const thaiDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `${yearMonth}-${dayStr}`;
    const d = new Date(year, month - 1, day);
    const dayOfWeek = thaiDays[d.getDay()];

    const stat = dailyMap.get(dateStr) || {
      orderCount: 0,
      totalQuantity: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
    };

    dailyBreakdown.push({
      date: dateStr,
      dayOfMonth: day,
      dayOfWeek,
      ...stat,
    });
  }

  const itemSummaries = calculateItemsBreakdown(filtered, menuItems);

  return {
    periodLabel: `ประจำเดือน ${yearMonth}`,
    startDate: `${yearMonth}-01`,
    endDate: `${yearMonth}-${daysInMonth}`,
    totalOrders: filtered.length,
    totalQuantity,
    totalRevenue,
    totalCost,
    totalProfit,
    profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
    averageOrderValue: Math.round(averageOrderValue * 10) / 10,
    itemSummaries,
    dailyBreakdown,
  };
}

/**
 * Format currency in Thai Baht format
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
