import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOrderTotals,
  calculateItemsBreakdown,
  calculateDailyReport,
  calculateMonthlyReport,
  formatCurrency,
} from './salesCalculator';
import { MenuItem, Order, OrderItem } from '../types';

const mockMenuItems: MenuItem[] = [
  {
    id: 'f-1',
    name: 'ข้าวไข่เจียว',
    nameEn: 'Omelet Rice',
    category: 'food',
    price: 30,
    cost: 13,
    emoji: '🍳',
    isAvailable: true,
  },
  {
    id: 'f-2',
    name: 'ข้าวไข่เจียวพิเศษ',
    nameEn: 'Special Omelet',
    category: 'food',
    price: 40,
    cost: 17,
    emoji: '🍳✨',
    isAvailable: true,
  },
  {
    id: 'd-1',
    name: 'น้ำดื่ม',
    nameEn: 'Water',
    category: 'drink',
    price: 10,
    cost: 4,
    emoji: '💧',
    isAvailable: true,
  },
];

test('calculateOrderTotals correctly computes revenue, cost, profit and margin', () => {
  const items: OrderItem[] = [
    {
      menuItemId: 'f-1',
      name: 'ข้าวไข่เจียว',
      unitPrice: 30,
      unitCost: 13,
      quantity: 2,
      subtotal: 60,
      totalCost: 26,
      totalProfit: 34,
    },
    {
      menuItemId: 'd-1',
      name: 'น้ำดื่ม',
      unitPrice: 10,
      unitCost: 4,
      quantity: 1,
      subtotal: 10,
      totalCost: 4,
      totalProfit: 6,
    },
  ];

  const totals = calculateOrderTotals(items);
  assert.equal(totals.totalQuantity, 3);
  assert.equal(totals.totalRevenue, 70);
  assert.equal(totals.totalCost, 30);
  assert.equal(totals.totalProfit, 40);
  // Margin: (40 / 70) * 100 = 57.1%
  assert.equal(totals.profitMarginPercent, 57.1);
});

test('calculateItemsBreakdown groups items and sorts by quantity sold', () => {
  const orders: Order[] = [
    {
      id: 'ord-1',
      orderNumber: 1,
      timestamp: '2026-10-23T10:00:00.000Z',
      date: '2026-10-23',
      items: [
        {
          menuItemId: 'f-1',
          name: 'ข้าวไข่เจียว',
          unitPrice: 30,
          unitCost: 13,
          quantity: 3,
          subtotal: 90,
          totalCost: 39,
          totalProfit: 51,
        },
      ],
      totalQuantity: 3,
      totalRevenue: 90,
      totalCost: 39,
      totalProfit: 51,
      paymentMethod: 'cash',
      amountPaid: 100,
      change: 10,
    },
    {
      id: 'ord-2',
      orderNumber: 2,
      timestamp: '2026-10-23T11:00:00.000Z',
      date: '2026-10-23',
      items: [
        {
          menuItemId: 'f-2',
          name: 'ข้าวไข่เจียวพิเศษ',
          unitPrice: 40,
          unitCost: 17,
          quantity: 5,
          subtotal: 200,
          totalCost: 85,
          totalProfit: 115,
        },
        {
          menuItemId: 'f-1',
          name: 'ข้าวไข่เจียว',
          unitPrice: 30,
          unitCost: 13,
          quantity: 1,
          subtotal: 30,
          totalCost: 13,
          totalProfit: 17,
        },
      ],
      totalQuantity: 6,
      totalRevenue: 230,
      totalCost: 98,
      totalProfit: 132,
      paymentMethod: 'transfer',
      amountPaid: 230,
      change: 0,
    },
  ];

  const breakdown = calculateItemsBreakdown(orders, mockMenuItems);

  // Highest quantity sold should be 'ข้าวไข่เจียวพิเศษ' (5) or 'ข้าวไข่เจียว' (4)
  assert.equal(breakdown[0].menuItemId, 'f-2');
  assert.equal(breakdown[0].quantitySold, 5);
  assert.equal(breakdown[0].totalRevenue, 200);
  assert.equal(breakdown[0].totalProfit, 115);

  assert.equal(breakdown[1].menuItemId, 'f-1');
  assert.equal(breakdown[1].quantitySold, 4);
  assert.equal(breakdown[1].totalRevenue, 120);
  assert.equal(breakdown[1].totalProfit, 68);

  // Unsold item 'd-1' should have 0 quantity sold
  const drink = breakdown.find((b) => b.menuItemId === 'd-1');
  assert.ok(drink);
  assert.equal(drink?.quantitySold, 0);
});

test('calculateDailyReport filters by date and calculates exact totals', () => {
  const orders: Order[] = [
    {
      id: 'ord-1',
      orderNumber: 1,
      timestamp: '2026-10-23T10:00:00.000Z',
      date: '2026-10-23',
      items: [],
      totalQuantity: 2,
      totalRevenue: 80,
      totalCost: 34,
      totalProfit: 46,
      paymentMethod: 'cash',
      amountPaid: 100,
      change: 20,
    },
    {
      id: 'ord-2',
      orderNumber: 2,
      timestamp: '2026-10-22T10:00:00.000Z',
      date: '2026-10-22',
      items: [],
      totalQuantity: 10,
      totalRevenue: 400,
      totalCost: 150,
      totalProfit: 250,
      paymentMethod: 'cash',
      amountPaid: 400,
      change: 0,
    },
  ];

  const daily23 = calculateDailyReport(orders, '2026-10-23', mockMenuItems);
  assert.equal(daily23.totalOrders, 1);
  assert.equal(daily23.totalRevenue, 80);
  assert.equal(daily23.totalCost, 34);
  assert.equal(daily23.totalProfit, 46);

  const daily22 = calculateDailyReport(orders, '2026-10-22', mockMenuItems);
  assert.equal(daily22.totalOrders, 1);
  assert.equal(daily22.totalRevenue, 400);
  assert.equal(daily22.totalProfit, 250);
});

test('calculateMonthlyReport includes daily timeline', () => {
  const orders: Order[] = [
    {
      id: 'ord-1',
      orderNumber: 1,
      timestamp: '2026-10-05T12:00:00.000Z',
      date: '2026-10-05',
      items: [],
      totalQuantity: 4,
      totalRevenue: 160,
      totalCost: 70,
      totalProfit: 90,
      paymentMethod: 'cash',
      amountPaid: 200,
      change: 40,
    },
  ];

  const monthly = calculateMonthlyReport(orders, '2026-10', mockMenuItems);
  assert.equal(monthly.totalRevenue, 160);
  assert.equal(monthly.totalProfit, 90);
  assert.ok(monthly.dailyBreakdown);
  assert.equal(monthly.dailyBreakdown.length, 31); // October has 31 days
  const day5 = monthly.dailyBreakdown.find((d) => d.dayOfMonth === 5);
  assert.equal(day5?.revenue, 160);
  assert.equal(day5?.profit, 90);
});

test('formatCurrency formats Thai Baht nicely', () => {
  assert.equal(formatCurrency(1500), '1,500');
  assert.equal(formatCurrency(0), '0');
});
