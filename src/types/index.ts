export type ItemCategory = 'food' | 'drink';

export interface MenuItem {
  id: string;
  name: string;
  nameEn: string;
  category: ItemCategory;
  price: number; // ราคาขาย
  cost: number;  // ต้นทุน
  emoji: string;
  isAvailable: boolean;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  unitPrice: number;
  unitCost: number;
  quantity: number;
  subtotal: number;
  totalCost: number;
  totalProfit: number;
  note?: string;
}

export type PaymentMethod = 'cash' | 'transfer';

export interface Order {
  id: string;
  orderNumber: number;
  timestamp: string; // ISO 8601
  date: string;      // YYYY-MM-DD
  items: OrderItem[];
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  customerNote?: string;
}

export interface ItemSalesSummary {
  menuItemId: string;
  name: string;
  category: ItemCategory;
  unitPrice: number;
  unitCost: number;
  quantitySold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMarginPercent: number;
  percentageOfTotalSales: number;
}

export interface SalesReport {
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalOrders: number;
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMarginPercent: number;
  averageOrderValue: number;
  itemSummaries: ItemSalesSummary[];
  dailyBreakdown?: {
    date: string;
    dayOfMonth: number;
    dayOfWeek: string;
    orderCount: number;
    totalQuantity: number;
    revenue: number;
    cost: number;
    profit: number;
  }[];
}

export type FontSizeSetting = 'normal' | 'large' | 'xlarge';
