import React, { useState } from 'react';
import { 
  MenuItem, 
  Order, 
  SalesReport, 
} from '../types';
import { 
  calculateDailyReport, 
  formatCurrency 
} from '../utils/salesCalculator';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  Receipt, 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  Download, 
  ArrowUpDown,
  Clock,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { translations, Language } from '../utils/translations';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { PrintReportModal } from './PrintReportModal';

interface DailySalesViewProps {
  orders: Order[];
  menuItems: MenuItem[];
  onDeleteOrder: (orderId: string) => void;
  lang: Language;
}

export const DailySalesView: React.FC<DailySalesViewProps> = ({
  orders,
  menuItems,
  onDeleteOrder,
  lang,
}) => {
  const t = translations[lang];
  // Default to today (2026-10-23 based on metadata local time)
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-23');
  const [filterMode, setFilterMode] = useState<'all' | 'soldOnly' | 'food' | 'drink'>('all');
  const [sortBy, setSortBy] = useState<'quantity' | 'profit' | 'revenue'>('quantity');

  // In-app Delete Confirmation Modal State (replaces blocked window.confirm)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deletedToast, setDeletedToast] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Compute daily report
  const dailyReport: SalesReport = calculateDailyReport(orders, selectedDate, menuItems);
  const dailyOrders = orders.filter((o) => o.date === selectedDate);

  // Quick Date Navigation
  const handleShiftDay = (deltaDays: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + deltaDays);
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, '0');
    const nextD = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${nextY}-${nextM}-${nextD}`);
  };

  const handleSetToday = () => {
    setSelectedDate('2026-10-23');
  };

  const handleSetYesterday = () => {
    setSelectedDate('2026-10-22');
  };

  // Perform confirmed deletion
  const handleConfirmDelete = () => {
    if (!orderToDelete) return;
    const num = orderToDelete.orderNumber;
    onDeleteOrder(orderToDelete.id);
    setDeletedToast(lang === 'th' ? `ลบบิล #${num} ออกจากระบบเรียบร้อยแล้ว` : `Order #${num} successfully deleted`);
    setOrderToDelete(null);

    setTimeout(() => {
      setDeletedToast(null);
    }, 3500);
  };

  // Filter items in the breakdown table
  let displayItems = [...dailyReport.itemSummaries];
  if (filterMode === 'soldOnly') {
    displayItems = displayItems.filter((item) => item.quantitySold > 0);
  } else if (filterMode === 'food') {
    displayItems = displayItems.filter((item) => item.category === 'food');
  } else if (filterMode === 'drink') {
    displayItems = displayItems.filter((item) => item.category === 'drink');
  }

  // Sort items
  displayItems.sort((a, b) => {
    if (sortBy === 'quantity') return b.quantitySold - a.quantitySold;
    if (sortBy === 'profit') return b.totalProfit - a.totalProfit;
    if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
    return 0;
  });

  // Export Daily Report to CSV
  const handleExportCSV = () => {
    const headers = [
      t.thNo,
      t.thItem,
      t.categoryLabel,
      t.thPrice,
      t.thCost,
      t.thQtySold,
      t.thRevenue,
      t.kpiCost,
      t.thProfitMade,
      t.thMargin,
    ];
    const rows = dailyReport.itemSummaries.map((item, idx) => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId);
      const displayName = lang === 'en' ? (menuItem?.nameEn || item.name) : item.name;
      return [
        idx + 1,
        `"${displayName}"`,
        item.category === 'food' ? t.filterFood : t.filterDrink,
        item.unitPrice,
        item.unitCost,
        item.quantitySold,
        item.totalRevenue,
        item.totalCost,
        item.totalProfit,
        `${item.profitMarginPercent}%`,
      ];
    });

    // Add totals row
    rows.push([
      '',
      `"${t.grandTotalLabel}"`,
      '',
      '',
      '',
      dailyReport.totalQuantity,
      dailyReport.totalRevenue,
      dailyReport.totalCost,
      dailyReport.totalProfit,
      `${dailyReport.profitMarginPercent}%`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `daily_sales_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger print modal
  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification when deleted */}
      {deletedToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white border-2 border-rose-500 py-3 px-5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <Trash2 className="w-5 h-5 text-rose-400" />
          <span className="font-bold text-sm sm:text-base">{deletedToast}</span>
        </div>
      )}

      {/* Date Bar & Controls with Large Clear Display */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-200/90 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Date Selector with quick yesterday/today buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => handleShiftDay(-1)}
              className="p-2 sm:px-3 rounded-xl hover:bg-white text-slate-700 font-bold transition flex items-center gap-1 cursor-pointer"
              title={t.prevDay}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-bold">{t.prevDay}</span>
            </button>

            {/* Date Input with Large Font */}
            <div className="relative px-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-slate-900 font-black text-base sm:text-lg lg:text-xl py-1 px-1 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => handleShiftDay(1)}
              className="p-2 sm:px-3 rounded-xl hover:bg-white text-slate-700 font-bold transition flex items-center gap-1 cursor-pointer"
              title={t.nextDay}
            >
              <span className="hidden sm:inline text-xs font-bold">{t.nextDay}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Shortcuts */}
          <button
            type="button"
            onClick={handleSetToday}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
              selectedDate === '2026-10-23'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {t.todayBtn}
          </button>
          <button
            type="button"
            onClick={handleSetYesterday}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
              selectedDate === '2026-10-22'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {t.yesterdayBtn}
          </button>
        </div>

        {/* Action Buttons: Export & Print */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 border border-slate-300/80 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>{t.exportCSV}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printReport}</span>
          </button>
        </div>
      </div>

      {/* KPI CARDS: Daily Revenue, Total Cost, Net Profit, Quantities Sold */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Daily Revenue */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-4 sm:p-5 rounded-3xl shadow-md shadow-amber-500/20">
          <div className="flex items-center justify-between opacity-90 mb-1">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
              {t.kpiRevenue}
            </span>
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-black mt-1">
            ฿{formatCurrency(dailyReport.totalRevenue)}
          </div>
          <p className="text-xs sm:text-sm font-medium opacity-90 mt-1">
            {dailyReport.totalOrders} {t.kpiOrdersUnit} • {t.kpiAvgPerOrder} ฿{dailyReport.averageOrderValue}
          </p>
        </div>

        {/* 2. Total Cost */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
              {t.kpiCost}
            </span>
            <Package className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 mt-1">
            ฿{formatCurrency(dailyReport.totalCost)}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            {t.kpiCostNote}
          </p>
        </div>

        {/* 3. Net Profit */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 sm:p-5 rounded-3xl shadow-md shadow-emerald-600/25">
          <div className="flex items-center justify-between opacity-90 mb-1">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
              {t.kpiProfit}
            </span>
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-black mt-1">
            +฿{formatCurrency(dailyReport.totalProfit)}
          </div>
          <div className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold mt-1">
            <span>{t.kpiMarginLabel}</span>
            <span>{dailyReport.profitMarginPercent}%</span>
          </div>
        </div>

        {/* 4. Total Quantity Sold */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
              {t.kpiQtySold}
            </span>
            <Receipt className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 mt-1">
            {dailyReport.totalQuantity}
            <span className="text-sm font-bold text-slate-500 ml-1.5">{t.unitPlatesCombined}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            {t.kpiQtyNote}
          </p>
        </div>
      </div>

      {/* CORE SECTION: "what items were sold, in what quantities, and how much profit was made" */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden">
        {/* Table Title and Filter Tools */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>📋 {t.breakdownTitle}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {t.breakdownSubtitle} ({selectedDate})
            </p>
          </div>

          {/* Table Filters & Sorting */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Mode */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterMode === 'all' ? 'bg-white shadow text-slate-900' : 'hover:text-slate-900'
                }`}
              >
                {t.filterAll} ({menuItems.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('soldOnly')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterMode === 'soldOnly' ? 'bg-white shadow text-slate-900' : 'hover:text-slate-900'
                }`}
              >
                {t.filterSoldOnly}
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('food')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterMode === 'food' ? 'bg-white shadow text-slate-900' : 'hover:text-slate-900'
                }`}
              >
                {t.filterFood}
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('drink')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterMode === 'drink' ? 'bg-white shadow text-slate-900' : 'hover:text-slate-900'
                }`}
              >
                {t.filterDrink}
              </button>
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
              <button
                type="button"
                onClick={() => setSortBy('quantity')}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  sortBy === 'quantity' ? 'bg-amber-500 text-slate-950 font-black' : ''
                }`}
              >
                {t.sortByQty}
              </button>
              <button
                type="button"
                onClick={() => setSortBy('profit')}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  sortBy === 'profit' ? 'bg-amber-500 text-slate-950 font-black' : ''
                }`}
              >
                {t.sortByProfit}
              </button>
              <button
                type="button"
                onClick={() => setSortBy('revenue')}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  sortBy === 'revenue' ? 'bg-amber-500 text-slate-950 font-black' : ''
                }`}
              >
                {t.sortByRevenue}
              </button>
            </div>
          </div>
        </div>

        {/* ITEM SALES TABLE: Large Font, High Contrast, Crystal Clear Columns */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-12">{t.thNo}</th>
                <th className="py-3.5 px-4">{t.thItem}</th>
                <th className="py-3.5 px-3 text-right">{t.thPrice}</th>
                <th className="py-3.5 px-3 text-right">{t.thCost}</th>
                {/* Highlighted Column: Quantity Sold */}
                <th className="py-3.5 px-4 text-center bg-amber-50/70 text-amber-900 border-x border-amber-200/50">
                  {t.thQtySold}
                </th>
                {/* Highlighted Column: Total Revenue */}
                <th className="py-3.5 px-4 text-right">
                  {t.thRevenue}
                </th>
                {/* Highlighted Column: Total Profit Made */}
                <th className="py-3.5 px-4 text-right bg-emerald-50/70 text-emerald-900 border-l border-emerald-200/50 font-black">
                  {t.thProfitMade}
                </th>
                <th className="py-3.5 px-3 text-center">{t.thMargin}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm sm:text-base">
              {displayItems.map((item, idx) => {
                const menuItem = menuItems.find((m) => m.id === item.menuItemId);
                const emoji = menuItem?.emoji || '🍽️';
                const hasSales = item.quantitySold > 0;
                const primaryName = lang === 'en' ? (menuItem?.nameEn || item.name) : item.name;
                const secondaryName = lang === 'en' ? item.name : menuItem?.nameEn;

                return (
                  <tr
                    key={item.menuItemId}
                    className={`hover:bg-amber-50/30 transition-colors ${
                      hasSales ? 'font-semibold text-slate-900' : 'text-slate-400 bg-slate-50/30'
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-xs">
                      {idx + 1}
                    </td>

                    {/* Item Name with Emoji and Category Pill */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl">{emoji}</span>
                        <div>
                          <div className="font-extrabold text-base sm:text-lg text-slate-900">
                            {primaryName}
                          </div>
                          {secondaryName && (
                            <div className="text-xs text-slate-400">
                              {secondaryName}
                            </div>
                          )}
                          <span
                            className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                              item.category === 'drink'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {item.category === 'drink' ? t.filterDrink : t.filterFood}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Unit Price */}
                    <td className="py-3.5 px-3 text-right font-medium text-slate-600">
                      ฿{item.unitPrice}
                    </td>

                    {/* Unit Cost */}
                    <td className="py-3.5 px-3 text-right font-medium text-slate-400 text-xs sm:text-sm">
                      ฿{item.unitCost}
                    </td>

                    {/* QUANTITY SOLD: Prominent Highlight */}
                    <td className="py-3.5 px-4 text-center bg-amber-50/50 border-x border-amber-200/50">
                      {hasSales ? (
                        <span className="inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-base sm:text-lg shadow-sm">
                          {item.quantitySold}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-bold">0</span>
                      )}
                    </td>

                    {/* TOTAL REVENUE */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-base sm:text-lg text-slate-900">
                        {hasSales ? `฿${formatCurrency(item.totalRevenue)}` : '-'}
                      </span>
                    </td>

                    {/* TOTAL PROFIT MADE: Prominent Highlight */}
                    <td className="py-3.5 px-4 text-right bg-emerald-50/50 border-l border-emerald-200/50">
                      {hasSales ? (
                        <span className="font-black text-emerald-700 text-base sm:text-lg">
                          +฿${formatCurrency(item.totalProfit)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Margin % */}
                    <td className="py-3.5 px-3 text-center">
                      {hasSales ? (
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {item.profitMarginPercent}%
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Grand Total Row */}
              <tr className="bg-slate-900 text-white font-black text-sm sm:text-lg">
                <td colSpan={4} className="py-4 px-4 text-right">
                  {t.grandTotalLabel}
                </td>
                <td className="py-4 px-4 text-center bg-amber-600 text-slate-950 font-black text-lg sm:text-xl">
                  {dailyReport.totalQuantity} {t.unitPlatesCombined}
                </td>
                <td className="py-4 px-4 text-right text-amber-300 text-lg sm:text-xl">
                  ฿{formatCurrency(dailyReport.totalRevenue)}
                </td>
                <td className="py-4 px-4 text-right text-emerald-400 text-lg sm:text-xl">
                  +฿{formatCurrency(dailyReport.totalProfit)}
                </td>
                <td className="py-4 px-3 text-center text-xs font-bold text-slate-300">
                  {dailyReport.profitMarginPercent}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED ORDERS LIST (Bill by Bill for this day) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-600" />
              <span>{t.ordersHistoryTitle}</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                {dailyOrders.length} {t.ordersUnit}
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              {t.ordersHistorySub}
            </p>
          </div>
        </div>

        {dailyOrders.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <p className="text-sm font-semibold">{t.noOrdersOnDate}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dailyOrders.map((order) => {
              const timeStr = new Date(order.timestamp).toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div
                  key={order.id}
                  className="bg-slate-50 hover:bg-white border-2 border-slate-200/80 hover:border-amber-300 p-4 rounded-2xl transition hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    {/* Bill Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-base sm:text-lg">
                          #{order.orderNumber}
                        </span>
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {timeStr}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          order.paymentMethod === 'cash'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {order.paymentMethod === 'cash' ? `💵 ${t.cashMethod}` : `📱 ${t.qrMethod}`}
                      </span>
                    </div>

                    {/* Item list */}
                    <div className="py-2.5 space-y-1.5 text-xs sm:text-sm text-slate-700">
                      {order.items.map((it) => (
                        <div key={it.menuItemId} className="flex justify-between">
                          <span className="font-medium text-slate-800">
                            {it.name} <span className="font-bold text-amber-700">x{it.quantity}</span>
                          </span>
                          <span className="font-bold text-slate-900">
                            ฿{formatCurrency(it.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bill Footer with Revenue, Profit and Functional Delete Button */}
                  <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block font-medium">
                        {t.revenueSummary}: <strong className="text-slate-800">฿{formatCurrency(order.totalRevenue)}</strong>
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        {t.profitSummary}: +฿{formatCurrency(order.totalProfit)}
                      </span>
                    </div>
                    {/* Big Accessible Delete Button that triggers custom modal */}
                    <button
                      type="button"
                      onClick={() => setOrderToDelete(order)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
                      title={t.deleteOrderTitle}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === 'th' ? 'ลบบิล' : 'Void'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* In-App Delete Confirmation Modal (Guaranteed to work in iframe!) */}
      <DeleteConfirmModal
        order={orderToDelete}
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={handleConfirmDelete}
        lang={lang}
      />

      {/* Print Report Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportType="daily"
        periodTitle={selectedDate}
        report={dailyReport}
        lang={lang}
      />
    </div>
  );
};
