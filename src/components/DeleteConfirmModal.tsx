import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Language, translations } from '../utils/translations';
import { formatCurrency } from '../utils/salesCalculator';
import { Order } from '../types';

interface DeleteConfirmModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  lang: Language;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm,
  lang,
}) => {
  if (!isOpen || !order) return null;
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-200 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-2xl shadow-inner">
            <Trash2 className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            {lang === 'th' ? `ยืนยันการลบบิล #${order.orderNumber}` : `Void Order #${order.orderNumber}`}
          </h3>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {lang === 'th' 
              ? 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการขายนี้? ข้อมูลจะถูกลบออกจากฐานข้อมูลและยอดขายรายวัน/รายเดือนจะถูกคำนวณใหม่ทันที'
              : 'Are you sure you want to permanently delete this sale record? It will be removed from the database and daily/monthly totals will update immediately.'}
          </p>
        </div>

        {/* Order Details Preview */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 my-4 space-y-1.5 text-xs sm:text-sm">
          <div className="flex justify-between text-slate-600 font-semibold">
            <span>{lang === 'th' ? 'วันที่ / เวลา:' : 'Date / Time:'}</span>
            <span className="font-bold text-slate-900">
              {order.date} ({new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
            </span>
          </div>
          <div className="flex justify-between text-slate-600 font-semibold">
            <span>{lang === 'th' ? 'ยอดขาย:' : 'Revenue:'}</span>
            <span className="font-bold text-amber-700">฿{formatCurrency(order.totalRevenue)}</span>
          </div>
          <div className="flex justify-between text-slate-600 font-semibold">
            <span>{lang === 'th' ? 'กำไร:' : 'Profit:'}</span>
            <span className="font-bold text-emerald-700">+฿{formatCurrency(order.totalProfit)}</span>
          </div>
          <div className="flex justify-between text-slate-600 font-semibold pt-1 border-t border-slate-200">
            <span>{lang === 'th' ? 'จำนวนรายการ:' : 'Items Count:'}</span>
            <span className="font-bold text-slate-900">{order.totalQuantity} {t.unitPlatesCombined}</span>
          </div>
        </div>

        {/* Action Buttons with Big Click Targets */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm sm:text-base transition cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-1/2 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm sm:text-base shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{lang === 'th' ? 'ยืนยันลบ' : 'Delete Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
