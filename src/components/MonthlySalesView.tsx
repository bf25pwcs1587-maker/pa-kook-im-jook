import React, { useState } from 'react';
import { 
  MenuItem, 
  Order, 
  SalesReport 
} from '../types';
import { 
  calculateMonthlyReport, 
  formatCurrency 
} from '../utils/salesCalculator';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Award, 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  Download, 
  BarChart,
  ArrowUpDown,
  Receipt,
  Trash2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { translations, Language } from '../utils/translations';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { PrintReportModal } from './PrintReportModal';

interface MonthlySalesViewProps {
  orders: Order[];
  menuItems: MenuItem[];
  onSelectDateFromCalendar?: (dateStr: string) => void;
  onDeleteOrder: (orderId: string) => void;
  onClearMonthOrders?: (yearMonth: string) => void;
  lang: Language;
}

export const MonthlySalesView: React.FC<MonthlySalesViewProps> = ({
  orders,
  menuItems,
  onSelectDateFromCalendar,
  onDeleteOrder,
  onClearMonthOrders,
  lang,
}) => {
  const t = translations[lang];
  // Default to 2026-10
  const [selectedYearMonth, setSelectedYearMonth] = useState<string>('2026-10');
  const [sortBy, setSortBy] = useState<'quantity' | 'profit' | 'revenue'>('quantity');
  const [filterCategory, setFilterCategory] = useState<'all' | 'food' | 'drink'>('all');

  // Slips pagination/view filter
  const [slipFilterDate, setSlipFilterDate] = useState<string>('all');
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [showClearMonthModal, setShowClearMonthModal] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const monthlyReport: SalesReport = calculateMonthlyReport(orders, selectedYearMonth, menuItems);

  // Month navigation
  const handleShiftMonth = (deltaMonths: number) => {
    const [y, m] = selectedYearMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + deltaMonths, 1);
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedYearMonth(`${nextY}-${nextM}`);
  };

  // Filter items
  let displayItems = [...monthlyReport.itemSummaries];
  if (filterCategory === 'food') {
    displayItems = displayItems.filter(i => i.category === 'food');
  } else if (filterCategory === 'drink') {
    displayItems = displayItems.filter(i => i.category === 'drink');
  }

  // Sort items
  displayItems.sort((a, b) => {
    if (sortBy === 'quantity') return b.quantitySold - a.quantitySold;
    if (sortBy === 'profit') return b.totalProfit - a.totalProfit;
    if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
    return 0;
  });

  // Calculate highest revenue day for relative bar heights
  const maxDayRevenue = Math.max(
    ...(monthlyReport.dailyBreakdown?.map(d => d.revenue) || [1]),
    1
  );

  // Slips for this selected month
  const monthOrders = orders.filter((o) => o.date && o.date.startsWith(selectedYearMonth));
  const filteredMonthOrders = slipFilterDate === 'all'
    ? monthOrders
    : monthOrders.filter(o => o.date === slipFilterDate);

  // Deletion logic
  const handleConfirmDelete = () => {
    if (!orderToDelete) return;
    const num = orderToDelete.orderNumber;
    onDeleteOrder(orderToDelete.id);
    setToastMsg(
      lang === 'th' 
        ? `ลบบิล #${num} และหักลบออกจากยอดขายรายเดือนเรียบร้อยแล้ว` 
        : `Order #${num} deleted and removed from monthly totals`
    );
    setOrderToDelete(null);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Clear all slips for this month
  const handleConfirmClearMonth = () => {
    if (onClearMonthOrders) {
      onClearMonthOrders(selectedYearMonth);
    }
    setShowClearMonthModal(false);
    setToastMsg(
      lang === 'th'
        ? `ล้างบิลทั้งหมดของเดือน ${selectedYearMonth} เรียบร้อยแล้ว (ยอดขายเป็น 0)`
        : `All slips for ${selectedYearMonth} cleared (totals reset to 0)`
    );
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Month Display formatting
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const englishMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const [currYearStr, currMonthStr] = selectedYearMonth.split('-');
  const monthIndex = parseInt(currMonthStr, 10) - 1;
  const thaiYear = parseInt(currYearStr, 10) + 543;
  const monthDisplayTitle = lang === 'th' 
    ? `เดือน ${thaiMonths[monthIndex]} พ.ศ. ${thaiYear}` 
    : `${englishMonths[monthIndex]} ${currYearStr}`;

  // Top 3 best selling items
  const topSellers = [...monthlyReport.itemSummaries].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 3);

  // Distinct dates in this month with orders
  const datesInMonth = Array.from(new Set(monthOrders.map(o => o.date))).sort();

  return (
    <div className="space-y-6 pb-16">
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white border-2 border-amber-500 py-3 px-5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <Trash2 className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-sm sm:text-base">{toastMsg}</span>
        </div>
      )}

      {/* Month Bar & Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-200/90 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Month Selector with Large Display */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => handleShiftMonth(-1)}
              className="p-2 sm:px-3 rounded-xl hover:bg-white text-slate-700 font-bold transition flex items-center gap-1 cursor-pointer"
              title={t.prevMonth}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-bold">{t.prevMonth}</span>
            </button>

            <div className="px-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <span className="text-slate-900 font-black text-lg sm:text-xl">
                {monthDisplayTitle}
              </span>
              <input
                type="month"
                value={selectedYearMonth}
                onChange={(e) => setSelectedYearMonth(e.target.value)}
                className="opacity-0 w-6 h-6 absolute cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => handleShiftMonth(1)}
              className="p-2 sm:px-3 rounded-xl hover:bg-white text-slate-700 font-bold transition flex items-center gap-1 cursor-pointer"
              title={t.nextMonth}
            >
              <span className="hidden sm:inline text-xs font-bold">{t.nextMonth}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedYearMonth('2026-10')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
              selectedYearMonth === '2026-10'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {t.currentMonthBtn}
          </button>
        </div>

        {/* Action Buttons: Clear Month, Print */}
        <div className="flex items-center gap-2 flex-wrap">
          {monthOrders.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearMonthModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer"
              title="Clear all slips for this month"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>{lang === 'th' ? 'ล้างบิลทั้งเดือน' : 'Clear Month Slips'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printReport}</span>
          </button>
        </div>
      </div>

      {/* MONTHLY SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Monthly Revenue */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-4 sm:p-5 rounded-3xl shadow-md shadow-amber-500/20">
          <div className="flex items-center justify-between opacity-90 mb-1">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
              {t.kpiMonthlyRevenue}
            </span>
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-black mt-1">
            ฿{formatCurrency(monthlyReport.totalRevenue)}
          </div>
          <p className="text-xs sm:text-sm font-medium opacity-90 mt-1">
            {monthlyReport.totalOrders} {t.kpiMonthlyOrdersNote}
          </p>
        </div>

        {/* Monthly Cost */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
              {t.kpiMonthlyCost}
            </span>
            <Package className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 mt-1">
            ฿{formatCurrency(monthlyReport.totalCost)}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            {t.kpiMonthlyCostNote}
          </p>
        </div>

        {/* Monthly Profit */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 sm:p-5 rounded-3xl shadow-md shadow-emerald-600/25">
          <div className="flex items-center justify-between opacity-90 mb-1">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
              {t.kpiMonthlyProfit}
            </span>
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-black mt-1">
            +฿{formatCurrency(monthlyReport.totalProfit)}
          </div>
          <div className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold mt-1">
            <span>{t.kpiMonthlyAvgMargin}</span>
            <span>{monthlyReport.profitMarginPercent}%</span>
          </div>
        </div>

        {/* Monthly Items Sold */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
              {t.kpiMonthlyQtySold}
            </span>
            <Award className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 mt-1">
            {monthlyReport.totalQuantity}
            <span className="text-sm font-bold text-slate-500 ml-1.5">{t.unitPlatesCombined}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            {t.kpiMonthlyQtyNote}
          </p>
        </div>
      </div>

      {/* TOP 3 BEST-SELLERS HIGHLIGHT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {topSellers.map((item, idx) => {
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
          const badgeText = idx === 0 ? t.bestSellerRank1 : idx === 1 ? t.bestSellerRank2 : t.bestSellerRank3;
          const menuItem = menuItems.find(m => m.id === item.menuItemId);
          const displayName = lang === 'en' ? (menuItem?.nameEn || item.name) : item.name;

          return (
            <div
              key={item.menuItemId}
              className="bg-white p-4 rounded-3xl border-2 border-amber-200/80 shadow-sm flex items-center justify-between gap-3 relative overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl">{medal}</span>
                <div>
                  <span className="text-[11px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full inline-block mb-1">
                    {badgeText}
                  </span>
                  <h4 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">
                    {displayName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {t.revenueSummary}: ฿{formatCurrency(item.totalRevenue)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-amber-600 block">
                  {item.quantitySold}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  {t.unitPlatesCombined}
                </span>
                <div className="text-[11px] font-black text-emerald-600 mt-0.5">
                  +{t.profitSummary} ฿{formatCurrency(item.totalProfit)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DAILY SALES & PROFIT BAR TIMELINE FOR THE WHOLE MONTH */}
      {monthlyReport.dailyBreakdown && monthlyReport.dailyBreakdown.length > 0 && (
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-200/90">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 flex items-center gap-2">
                <BarChart className="w-5 h-5 text-amber-600" />
                <span>{t.timelineTitle}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {t.timelineSub}
              </p>
            </div>
          </div>

          {/* Timeline Bar Chart Container */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[700px] flex items-end gap-1.5 h-44 pt-6 px-1">
              {monthlyReport.dailyBreakdown.map((day) => {
                const heightPercent = day.revenue > 0 ? Math.max(12, (day.revenue / maxDayRevenue) * 100) : 4;
                const isSelected = day.date === '2026-10-23';

                return (
                  <div
                    key={day.date}
                    onClick={() => onSelectDateFromCalendar && onSelectDateFromCalendar(day.date)}
                    className="flex-1 flex flex-col items-center group cursor-pointer relative"
                    title={`${day.date}: ${t.revenueSummary} ฿${formatCurrency(day.revenue)}, ${t.profitSummary} +฿${formatCurrency(day.profit)} (${day.totalQuantity} items)`}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[11px] font-bold py-1 px-2 rounded-lg whitespace-nowrap shadow-lg">
                      <span>Day {day.dayOfMonth}: ฿{formatCurrency(day.revenue)}</span>
                      <span className="text-emerald-400">+{t.profitSummary} ฿{formatCurrency(day.profit)}</span>
                    </div>

                    {/* Bar Container */}
                    <div className="w-full flex items-end justify-center h-32 bg-slate-50 rounded-t-lg relative overflow-hidden">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t transition-all ${
                          isSelected
                            ? 'bg-amber-500 ring-2 ring-amber-400'
                            : day.revenue > 0
                            ? 'bg-amber-400 group-hover:bg-amber-500'
                            : 'bg-slate-200'
                        }`}
                      >
                        {day.profit > 0 && (
                          <div
                            style={{ height: `${(day.profit / day.revenue) * 100}%` }}
                            className="w-full bg-emerald-600/80 rounded-t mt-auto"
                          />
                        )}
                      </div>
                    </div>

                    <span className={`text-[11px] mt-1 font-bold ${isSelected ? 'text-amber-700 font-black' : 'text-slate-600'}`}>
                      {day.dayOfMonth}
                    </span>
                    <span className="text-[9px] text-slate-400 -mt-0.5">
                      {day.dayOfWeek}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CORE REQUIREMENT: "what items were sold, in what quantities, and how much profit was made" */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden">
        {/* Table Title and Filter */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>📊 {t.monthlyBreakdownTitle}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {t.monthlyBreakdownSub} ({monthDisplayTitle})
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterCategory === 'all' ? 'bg-white shadow text-slate-900' : 'hover:text-slate-900'
                }`}
              >
                {t.filterAll} ({menuItems.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('food')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterCategory === 'food' ? 'bg-white shadow text-slate-900' : 'hover:text-slate-900'
                }`}
              >
                {t.filterFood} ({menuItems.filter(i => i.category === 'food').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('drink')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterCategory === 'drink' ? 'bg-white shadow text-slate-900' : 'hover:text-slate-900'
                }`}
              >
                {t.filterDrink} ({menuItems.filter(i => i.category === 'drink').length})
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

        {/* MONTHLY ITEM SALES TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-12">{t.thNo}</th>
                <th className="py-3.5 px-4">{t.thItem}</th>
                <th className="py-3.5 px-3 text-right">{t.thPrice}</th>
                <th className="py-3.5 px-3 text-right">{t.thCost}</th>
                {/* Highlighted Monthly Quantity Sold */}
                <th className="py-3.5 px-4 text-center bg-amber-50/70 text-amber-900 border-x border-amber-200/50">
                  {t.thMonthQtySold}
                </th>
                {/* Highlighted Monthly Revenue */}
                <th className="py-3.5 px-4 text-right">
                  {t.thMonthRevenue}
                </th>
                {/* Highlighted Monthly Profit Made */}
                <th className="py-3.5 px-4 text-right bg-emerald-50/70 text-emerald-900 border-l border-emerald-200/50 font-black">
                  {t.thMonthProfit}
                </th>
                <th className="py-3.5 px-3 text-center">{t.thMargin}</th>
                <th className="py-3.5 px-3 text-center">{t.thShare}</th>
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

                    {/* Item Name */}
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

                    {/* MONTH QUANTITY SOLD: Prominent Highlight */}
                    <td className="py-3.5 px-4 text-center bg-amber-50/50 border-x border-amber-200/50">
                      {hasSales ? (
                        <span className="inline-flex items-center justify-center min-w-[3rem] px-3.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-base sm:text-lg shadow-sm">
                          {item.quantitySold}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-bold">0</span>
                      )}
                    </td>

                    {/* MONTH TOTAL REVENUE */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-base sm:text-lg text-slate-900">
                        {hasSales ? `฿${formatCurrency(item.totalRevenue)}` : '-'}
                      </span>
                    </td>

                    {/* MONTH TOTAL PROFIT */}
                    <td className="py-3.5 px-4 text-right bg-emerald-50/50 border-l border-emerald-200/50">
                      {hasSales ? (
                        <span className="font-black text-emerald-700 text-base sm:text-lg">
                          +฿{formatCurrency(item.totalProfit)}
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

                    {/* Share % */}
                    <td className="py-3.5 px-3 text-center">
                      {hasSales ? (
                        <span className="text-xs font-bold text-slate-600">
                          {item.percentageOfTotalSales}%
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
                  {t.monthGrandTotalLabel}
                </td>
                <td className="py-4 px-4 text-center bg-amber-600 text-slate-950 font-black text-lg sm:text-xl">
                  {monthlyReport.totalQuantity} {t.unitPlatesCombined}
                </td>
                <td className="py-4 px-4 text-right text-amber-300 text-lg sm:text-xl">
                  ฿{formatCurrency(monthlyReport.totalRevenue)}
                </td>
                <td className="py-4 px-4 text-right text-emerald-400 text-lg sm:text-xl">
                  +฿{formatCurrency(monthlyReport.totalProfit)}
                </td>
                <td className="py-4 px-3 text-center text-xs font-bold text-slate-300">
                  {monthlyReport.profitMarginPercent}%
                </td>
                <td className="py-4 px-3 text-center text-xs font-bold text-slate-300">
                  100%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED MONTHLY SLIPS LIST WITH VOID/DELETE BUTTONS */}
      {/* Solves user request: "if i delet a slip so delet from monthly quantity sold as wewl" */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-600" />
              <span>{lang === 'th' ? 'รายการบิลขายทั้งหมดในเดือนนี้' : 'All Orders / Slips in This Month'}</span>
              <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-black">
                {monthOrders.length} {t.ordersUnit}
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              {lang === 'th' 
                ? 'ท่านสามารถกดลบบิลใดๆ ในเดือนนี้ได้ และระบบจะหักลบจำนวนจาน ยอดขาย และกำไรออกจากรายงานประจำเดือนทันที' 
                : 'You can void/delete any slip in this month; quantities, revenue, and cost will immediately update.'}
            </p>
          </div>

          {/* Filter by date within month */}
          {datesInMonth.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">
                {lang === 'th' ? 'กรองตามวัน:' : 'Filter date:'}
              </span>
              <select
                value={slipFilterDate}
                onChange={(e) => setSlipFilterDate(e.target.value)}
                className="bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-2.5 py-1.5 cursor-pointer"
              >
                <option value="all">{lang === 'th' ? 'ทุกวันในเดือนนี้' : 'All dates in month'}</option>
                {datesInMonth.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {filteredMonthOrders.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <p className="text-sm font-semibold">
              {lang === 'th' ? 'ไม่มีบิลการขายในเดือนนี้ (ยอดเป็น 0)' : 'No sales slips found for this month (totals are 0)'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredMonthOrders.map((order) => {
              const timeStr = new Date(order.timestamp).toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={order.id}
                  className="bg-slate-50 hover:bg-white border-2 border-slate-200 hover:border-amber-400 p-4 rounded-2xl transition hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-base sm:text-lg">
                          #{order.orderNumber}
                        </span>
                        <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {order.date} {timeStr}
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

                    {/* Items */}
                    <div className="py-2.5 space-y-1 text-xs sm:text-sm text-slate-700">
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

                  {/* Footer with Revenue, Profit and Void Button */}
                  <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block font-medium">
                        {t.revenueSummary}: <strong className="text-slate-900">฿{formatCurrency(order.totalRevenue)}</strong>
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        {t.profitSummary}: +฿{formatCurrency(order.totalProfit)}
                      </span>
                    </div>

                    {/* Delete Slip Button */}
                    <button
                      type="button"
                      onClick={() => setOrderToDelete(order)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
                      title={t.deleteOrderTitle}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === 'th' ? 'ลบบิลนี้' : 'Void Slip'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal for Single Slip */}
      <DeleteConfirmModal
        order={orderToDelete}
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={handleConfirmDelete}
        lang={lang}
      />

      {/* Clear Month Confirmation Modal */}
      {showClearMonthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-rose-300">
            <div className="flex items-center gap-2 text-rose-700 font-black text-lg mb-2">
              <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
              <span>{lang === 'th' ? 'ล้างบิลทั้งเดือน?' : 'Clear Month Slips?'}</span>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {lang === 'th'
                ? `ต้องการลบบิลขายทั้งหมด ${monthOrders.length} บิลในเดือน ${monthDisplayTitle} หรือไม่? สถิติและยอดขายของเดือนนี้จะกลายเป็น 0`
                : `Delete all ${monthOrders.length} order slips for ${selectedYearMonth}? Monthly sales and quantity will reset to 0.`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowClearMonthModal(false)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-700 text-xs cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmClearMonth}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-black text-white text-xs shadow-md cursor-pointer"
              >
                {lang === 'th' ? 'ยืนยันล้างทั้งเดือน' : 'Confirm Clear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Report Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportType="monthly"
        periodTitle={monthDisplayTitle}
        report={monthlyReport}
        lang={lang}
      />
    </div>
  );
};
