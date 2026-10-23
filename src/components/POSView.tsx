import React, { useState } from 'react';
import { 
  MenuItem, 
  OrderItem, 
  PaymentMethod, 
  Order,
  DiningType
} from '../types';
import { 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Banknote, 
  QrCode, 
  Search, 
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  Printer,
  User,
  Utensils
} from 'lucide-react';
import { formatCurrency } from '../utils/salesCalculator';
import { translations, Language } from '../utils/translations';
import { PrintOrderSlipModal } from './PrintOrderSlipModal';

interface POSViewProps {
  menuItems: MenuItem[];
  cart: OrderItem[];
  setCart: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  onCompleteSale: (order: Order) => void;
  lang: Language;
}

export const POSView: React.FC<POSViewProps> = ({
  menuItems,
  cart,
  setCart,
  onCompleteSale,
  lang,
}) => {
  const t = translations[lang];
  const [activeCategory, setActiveCategory] = useState<'all' | 'food' | 'drink'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<number | ''>('');
  const [orderNote, setOrderNote] = useState('');
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);

  // Takeaway and customer name state
  const [diningType, setDiningType] = useState<DiningType>('take_away');
  const [customerName, setCustomerName] = useState<string>('');
  const [slipOrderToPrint, setSlipOrderToPrint] = useState<Order | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  // Cart Calculations
  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartTotalCost = cart.reduce((sum, item) => sum + item.totalCost, 0);
  const cartTotalProfit = cartSubtotal - cartTotalCost;
  const rawMargin = cartSubtotal > 0 ? (cartTotalProfit / cartSubtotal) * 100 : 0;
  const profitMarginPercent = Math.round(rawMargin * 10) / 10;

  // Add Item to Cart
  const handleAddToCart = (item: MenuItem) => {
    const itemName = lang === 'en' ? item.nameEn : item.name;
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                subtotal: (i.quantity + 1) * i.unitPrice,
                totalCost: (i.quantity + 1) * i.unitCost,
                totalProfit: (i.quantity + 1) * (i.unitPrice - i.unitCost),
              }
            : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: itemName,
          unitPrice: item.price,
          unitCost: item.cost,
          quantity: 1,
          subtotal: item.price,
          totalCost: item.cost,
          totalProfit: item.price - item.cost,
        },
      ];
    });
  };

  // Update Item Quantity
  const handleUpdateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.menuItemId === menuItemId) {
            const newQty = i.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...i,
              quantity: newQty,
              subtotal: newQty * i.unitPrice,
              totalCost: newQty * i.unitCost,
              totalProfit: newQty * (i.unitPrice - i.unitCost),
            };
          }
          return i;
        })
        .filter((i): i is OrderItem => i !== null)
    );
  };

  // Remove Item
  const handleRemoveItem = (menuItemId: string) => {
    setCart((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

  // Clear Cart
  const handleClearCart = () => {
    if (cart.length > 0) {
      setCart([]);
    }
  };

  // Open Checkout Modal
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setCashReceived(cartSubtotal);
    setPaymentMethod('cash');
    setIsCheckoutOpen(true);
  };

  // Quick Cash Preset Button
  const handleSelectCashPreset = (amount: number) => {
    setCashReceived(amount);
  };

  // Calculate Change
  const numericCash = typeof cashReceived === 'number' ? cashReceived : 0;
  const changeDue = Math.max(0, numericCash - cartSubtotal);
  const isCashSufficient = paymentMethod === 'transfer' || numericCash >= cartSubtotal;

  // Complete Order
  const handleFinalizeOrder = (shouldPrint: boolean = false) => {
    if (cart.length === 0) return;
    if (!isCashSufficient) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const timestampStr = now.toISOString();

    const orderNumber = Math.floor(100 + Math.random() * 900);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      timestamp: timestampStr,
      date: dateStr,
      items: [...cart],
      totalQuantity: cartQuantity,
      totalRevenue: cartSubtotal,
      totalCost: cartTotalCost,
      totalProfit: cartTotalProfit,
      paymentMethod,
      amountPaid: paymentMethod === 'cash' ? numericCash : cartSubtotal,
      change: paymentMethod === 'cash' ? changeDue : 0,
      customerNote: orderNote.trim() || undefined,
      diningType,
      customerName: customerName.trim() || undefined,
    };

    onCompleteSale(newOrder);
    setLastCompletedOrder(newOrder);
    setCart([]);
    setIsCheckoutOpen(false);
    setOrderNote('');
    setCustomerName('');

    if (shouldPrint) {
      setSlipOrderToPrint(newOrder);
      setIsSlipModalOpen(true);
    }
  };

  // Quick print current cart as check/draft slip before checkout
  const handlePrintCurrentCartDraft = () => {
    if (cart.length === 0) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const draftOrder: Order = {
      id: `draft-${Date.now()}`,
      orderNumber: Math.floor(100 + Math.random() * 900),
      timestamp: now.toISOString(),
      date: `${year}-${month}-${day}`,
      items: [...cart],
      totalQuantity: cartQuantity,
      totalRevenue: cartSubtotal,
      totalCost: cartTotalCost,
      totalProfit: cartTotalProfit,
      paymentMethod,
      amountPaid: cartSubtotal,
      change: 0,
      customerNote: orderNote.trim() || undefined,
      diningType,
      customerName: customerName.trim() || undefined,
    };
    setSlipOrderToPrint(draftOrder);
    setIsSlipModalOpen(true);
  };

  // Filter Menu Items
  const filteredItems = menuItems.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.price.toString().includes(searchTerm);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pb-12">
      {/* LEFT/TOP: Menu Selection Grid (7 cols on desktop) */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        {/* Search & Category Filter with Big Targets */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base cursor-pointer transition ${
                activeCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              🍽️ {t.posAll} ({menuItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('food')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base cursor-pointer transition ${
                activeCategory === 'food'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              🍛 {t.posFood} ({menuItems.filter(i => i.category === 'food').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('drink')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base cursor-pointer transition ${
                activeCategory === 'drink'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              🥤 {t.posDrink} ({menuItems.filter(i => i.category === 'drink').length})
            </button>
          </div>

          {/* Quick Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Menu Cards Grid - Designed with Large Font & High Contrast */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4">
          {filteredItems.map((item) => {
            const inCart = cart.find((i) => i.menuItemId === item.id);
            const estProfit = item.price - item.cost;
            const primaryTitle = lang === 'en' ? item.nameEn : item.name;
            const secondaryTitle = lang === 'en' ? item.name : item.nameEn;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleAddToCart(item)}
                className={`relative group text-left p-3.5 sm:p-4 rounded-2xl bg-white border-2 transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between select-none ${
                  inCart
                    ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20'
                    : 'border-slate-200/90 hover:border-amber-400 hover:bg-amber-50/20'
                }`}
              >
                {/* Active in-cart quantity badge */}
                {inCart && (
                  <span className="absolute -top-2.5 -right-2.5 bg-amber-600 text-white font-extrabold text-sm sm:text-base px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                    x{inCart.quantity}
                  </span>
                )}

                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className="text-2xl sm:text-3xl">{item.emoji}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        item.category === 'drink'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.category === 'drink' ? t.filterDrink : t.filterFood}
                    </span>
                  </div>

                  {/* Item Name - Bold, Large Font */}
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg lg:text-xl leading-snug line-clamp-2">
                    {primaryTitle}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                    {secondaryTitle}
                  </p>
                </div>

                {/* Price and Profit Info */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-xl sm:text-2xl lg:text-3xl font-black text-amber-700">
                      ฿{item.price}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold ml-1">{t.baht}</span>
                  </div>

                  {/* Profit & Cost indicator */}
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-emerald-600 block">
                      {t.profitPerPlate} +฿{estProfit}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {t.costPerPlate} ฿{item.cost}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Current Order Cart & Real-time Profit Calculation */}
      <div className="lg:col-span-5 xl:col-span-4">
        <div className="bg-white rounded-3xl shadow-md border-2 border-slate-200/90 overflow-hidden sticky top-20 flex flex-col max-h-[calc(100vh-6rem)]">
          {/* Cart Header */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-amber-400" />
              <div>
                <h2 className="text-lg sm:text-xl font-black">
                  {t.cartTitle}
                </h2>
                <p className="text-xs text-slate-400">
                  {cartQuantity} {t.unitItems}
                </p>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                title={t.clearCart}
              >
                {t.clearCart}
              </button>
            )}
          </div>

          {/* Quick Dining Type & Customer Name on Top of Cart */}
          <div className="bg-amber-50/80 p-3 border-b border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-amber-950">
                {t.diningTypeLabel}
              </span>
              <div className="bg-white rounded-xl p-0.5 border border-amber-300 flex">
                <button
                  type="button"
                  onClick={() => setDiningType('take_away')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                    diningType === 'take_away'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🥡 {lang === 'th' ? 'สั่งกลับบ้าน' : 'Take Away'}
                </button>
                <button
                  type="button"
                  onClick={() => setDiningType('dine_in')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                    diningType === 'dine_in'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🍽️ {lang === 'th' ? 'ทานที่ร้าน' : 'Dine In'}
                </button>
              </div>
            </div>

            {/* Customer Name Input (To print on top of the slip) */}
            <div className="flex items-center gap-2 bg-white rounded-xl px-2.5 py-1.5 border border-amber-300 shadow-2xs">
              <User className="w-4 h-4 text-amber-600 shrink-0" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t.customerNamePlaceholder}
                className="w-full text-xs font-bold text-slate-900 focus:outline-none bg-transparent placeholder:font-normal"
              />
              {customerName && (
                <button
                  type="button"
                  onClick={() => setCustomerName('')}
                  className="text-slate-400 hover:text-slate-600 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="py-12 px-4 text-center text-slate-400 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl mb-3">
                  🛒
                </div>
                <p className="text-base sm:text-lg font-bold text-slate-600">
                  {t.cartEmptyTitle}
                </p>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs">
                  {t.cartEmptyDesc}
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.menuItemId} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mt-0.5">
                      <span>฿{item.unitPrice}</span>
                      <span className="text-emerald-600 font-bold">
                        +{t.profitSummary} ฿{item.totalProfit}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper with Large Buttons */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.menuItemId, -1)}
                      className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-amber-500 hover:text-white font-bold transition cursor-pointer"
                      title="Decrease"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-7 text-center font-black text-slate-900 text-base">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.menuItemId, 1)}
                      className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-amber-500 hover:text-white font-bold transition cursor-pointer"
                      title="Increase"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Item Subtotal in Large Bold */}
                  <div className="w-20 text-right">
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      ฿{formatCurrency(item.subtotal)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.menuItemId)}
                      className="block ml-auto text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer: Totals, Profit Made, and Big Checkout Button */}
          {cart.length > 0 && (
            <div className="bg-slate-50 p-4 border-t-2 border-slate-200 space-y-3">
              {/* Real-time Profit Summary for this bill */}
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>{t.cartProfitLabel}</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-700 text-base sm:text-lg">
                    +฿{formatCurrency(cartTotalProfit)}
                  </span>
                  <span className="text-emerald-600 text-xs ml-1 font-semibold">
                    ({profitMarginPercent}%)
                  </span>
                </div>
              </div>

              {/* Total Amount in Super Large Font */}
              <div className="flex items-baseline justify-between px-1">
                <span className="text-slate-600 text-base sm:text-lg font-bold">
                  {t.totalAmountLabel}
                </span>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-600">
                    ฿{formatCurrency(cartSubtotal)}
                  </span>
                  <span className="text-sm font-bold text-slate-500 ml-1">{t.baht}</span>
                </div>
              </div>

              {/* Checkout Trigger Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrintCurrentCartDraft}
                  className="px-3.5 py-3.5 sm:py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm border border-slate-300/80 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title={lang === 'th' ? 'พิมพ์ใบสรุปรายการสำหรับเช็คของ / ติดหน้าถุง' : 'Print Draft Slip'}
                >
                  <Printer className="w-5 h-5 text-amber-600" />
                  <span className="hidden sm:inline">{lang === 'th' ? 'พิมพ์สลิป' : 'Slip'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCheckout}
                  className="flex-1 py-3.5 sm:py-4 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base sm:text-xl shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-[0.98]"
                >
                  <Banknote className="w-6 h-6" />
                  <span>{t.checkoutBtn}</span>
                  <ArrowRight className="w-5 h-5 ml-auto" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CHECKOUT MODAL: Cash / PromptPay QR / Change calculation */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  🧾
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    {t.paymentTitle}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {cartQuantity} {t.paymentSub}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Dining Type and Customer Name on Top of Checkout */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 my-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {t.diningTypeLabel}
                </span>
                <div className="bg-white rounded-xl p-0.5 border border-slate-300 flex">
                  <button
                    type="button"
                    onClick={() => setDiningType('take_away')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                      diningType === 'take_away'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🥡 {lang === 'th' ? 'สั่งกลับบ้าน' : 'Take Away'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiningType('dine_in')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                      diningType === 'dine_in'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🍽️ {lang === 'th' ? 'ทานที่ร้าน' : 'Dine In'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  👤 {t.customerNameLabel}
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t.customerNamePlaceholder}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Total Due Banner with Extra Large Font */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 my-2 text-center">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-800">
                {t.totalDue}
              </span>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-amber-700 mt-1">
                ฿{formatCurrency(cartSubtotal)}
              </div>
            </div>

            {/* Payment Method Toggle: Cash vs Transfer */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-3 px-4 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 border-2 cursor-pointer transition ${
                  paymentMethod === 'cash'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span>{t.cashMethod}</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`py-3 px-4 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 border-2 cursor-pointer transition ${
                  paymentMethod === 'transfer'
                    ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-5 h-5 text-blue-600" />
                <span>{t.qrMethod}</span>
              </button>
            </div>

            {/* Cash Input & Change Calculation */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 mb-4">
                <label className="block text-xs sm:text-sm font-bold text-slate-700">
                  {t.cashReceivedLabel}
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-center text-3xl font-black py-2.5 px-3 rounded-xl bg-white border-2 border-slate-300 focus:border-amber-500 focus:outline-none"
                />

                {/* Quick Presets for Cash Bills */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSelectCashPreset(cartSubtotal)}
                    className="py-1.5 px-2 bg-slate-200 hover:bg-amber-400 hover:text-slate-950 font-bold rounded-lg text-xs text-slate-700 transition cursor-pointer"
                  >
                    {t.exactCash}
                  </button>
                  {[50, 100, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectCashPreset(preset)}
                      className="py-1.5 px-2 bg-slate-200 hover:bg-amber-400 hover:text-slate-950 font-bold rounded-lg text-xs text-slate-700 transition cursor-pointer"
                    >
                      ฿{preset}
                    </button>
                  ))}
                </div>

                {/* Change Due Display in Huge Prominent Typography */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-sm sm:text-base font-extrabold text-slate-700">
                    {t.changeDueLabel}
                  </span>
                  <span
                    className={`text-2xl sm:text-3xl font-black ${
                      changeDue > 0
                        ? 'text-emerald-600'
                        : numericCash < cartSubtotal
                        ? 'text-rose-500'
                        : 'text-slate-900'
                    }`}
                  >
                    {numericCash < cartSubtotal
                      ? `${t.shortAmount} ฿${formatCurrency(cartSubtotal - numericCash)}`
                      : `฿${formatCurrency(changeDue)}`}
                  </span>
                </div>
              </div>
            )}

            {/* Note input */}
            <div className="mb-4">
              <input
                type="text"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder={t.orderNotePlaceholder}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Confirm Payment Buttons: Cancel, Save & Print, Save Only */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer sm:w-1/4"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={!isCashSufficient}
                onClick={() => handleFinalizeOrder(true)}
                className={`py-3 px-3 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition sm:w-1/2 ${
                  isCashSufficient
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
                title="Save order and immediately open printable take away slip"
              >
                <Printer className="w-4 h-4" />
                <span>{t.completeSaleAndPrintBtn}</span>
              </button>
              <button
                type="button"
                disabled={!isCashSufficient}
                onClick={() => handleFinalizeOrder(false)}
                className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition sm:w-1/4 ${
                  isCashSufficient
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === 'th' ? 'บันทึก' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Banner if sale was just completed */}
      {lastCompletedOrder && (
        <div className="fixed bottom-4 right-4 z-40 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-amber-500 flex items-center gap-3 max-w-md animate-in slide-in-from-bottom duration-200">
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0">
            ✓
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="font-extrabold text-sm sm:text-base truncate">
              {lang === 'th' ? `บันทึกบิล #${lastCompletedOrder.orderNumber} สำเร็จ!` : `Order #${lastCompletedOrder.orderNumber} Saved!`}
            </h5>
            <p className="text-xs text-slate-300 truncate">
              {lastCompletedOrder.customerName ? `👤 ${lastCompletedOrder.customerName} • ` : ''}
              {lastCompletedOrder.diningType === 'take_away' ? '🥡 กลับบ้าน • ' : '🍽️ ทานที่ร้าน • '}
              ฿{formatCurrency(lastCompletedOrder.totalRevenue)}
            </p>
          </div>

          {/* Quick Print Slip Trigger */}
          <button
            type="button"
            onClick={() => {
              setSlipOrderToPrint(lastCompletedOrder);
              setIsSlipModalOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
            title="Print order summary slip"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{lang === 'th' ? 'พิมพ์สลิป' : 'Slip'}</span>
          </button>

          <button
            type="button"
            onClick={() => setLastCompletedOrder(null)}
            className="text-xs text-slate-400 hover:text-white cursor-pointer ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Printable Order Slip Modal (Takeaway & Dine In) */}
      <PrintOrderSlipModal
        order={slipOrderToPrint}
        isOpen={isSlipModalOpen}
        onClose={() => setIsSlipModalOpen(false)}
        lang={lang}
      />
    </div>
  );
};
