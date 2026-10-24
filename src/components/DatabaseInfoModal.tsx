import React, { useState } from 'react';
import { Database, ShieldCheck, RefreshCw, Trash2, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { Language } from '../utils/translations';
import { SHOP_LOGO_URL } from '../utils/constants';

interface DatabaseInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAllOrders: () => void;
  onResetSeedData: () => void;
  totalOrdersCount: number;
  lang: Language;
}

export const DatabaseInfoModal: React.FC<DatabaseInfoModalProps> = ({
  isOpen,
  onClose,
  onClearAllOrders,
  onResetSeedData,
  totalOrdersCount,
  lang,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmClearAll = () => {
    onClearAllOrders();
    setShowClearConfirm(false);
    setFeedbackMsg(
      lang === 'th'
        ? 'ล้างยอดขายทั้งหมดเรียบร้อยแล้ว! ระบบพร้อมส่งมอบให้ลูกค้าใช้งานจริง 0 บิล'
        : 'All sales records cleared! System is ready for customer handover with 0 sales.'
    );
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleConfirmResetSeed = () => {
    onResetSeedData();
    setFeedbackMsg(
      lang === 'th'
        ? 'เติมข้อมูลตัวอย่างสำหรับการสาธิตเรียบร้อยแล้ว'
        : 'Demo sample data restored for demonstration'
    );
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={SHOP_LOGO_URL}
              alt="Logo"
              className="w-11 h-11 rounded-2xl object-cover border border-amber-400 shadow-md"
            />
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{lang === 'th' ? 'ฐานข้อมูล & การส่งมอบ' : 'Cloud Database & Handover'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Pa-Kook-Im-Jook • Persistent Cloud Firestore
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 text-slate-800 text-sm">
          {feedbackMsg && (
            <div className="p-3 bg-emerald-100 text-emerald-900 font-bold rounded-xl flex items-center gap-2 border border-emerald-300 text-xs sm:text-sm animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Database Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-black text-sm sm:text-base">
              <ShieldCheck className="w-5 h-5" />
              <span>{lang === 'th' ? 'สถานะ: เชื่อมต่อฐานข้อมูลคลาวด์ถาวรแล้ว' : 'Status: Connected to Cloud Database'}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {lang === 'th' 
                ? 'ระบบนี้เชื่อมต่อกับ Google Cloud Firestore (Database ID: ai-studio-foodbeveragesale-3374acd1-7f59-48d1-9958-35aa6268bb3c) ทุกบิลและราคาต้นทุนจะถูกบันทึกลงฐานข้อมูลคลาวด์ถาวร ข้อมูลจะไม่สูญหายแม้ปิดเครื่อง ปิดแท็บ หรือเปลี่ยนเบราว์เซอร์ พร้อมระบบสำรองข้อมูลออฟไลน์ในเครื่อง'
                : 'Connected to Google Cloud Firestore. Every order, selling price, and ingredient cost is permanently saved to the cloud database. Data will never be lost even if browser is closed or refreshed, with automatic offline fallback.'}
            </p>
            <div className="text-xs font-bold text-slate-500 pt-1">
              {lang === 'th' ? 'จำนวนบิลที่บันทึกอยู่ในระบบขณะนี้:' : 'Total orders currently in database:'}{' '}
              <span className="text-slate-900 font-black text-sm">{totalOrdersCount}</span> {lang === 'th' ? 'บิล' : 'orders'}
            </div>
          </div>

          {/* Handover to customer guide */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <h4 className="font-extrabold text-amber-900 text-sm flex items-center gap-1.5 mb-1">
              <span>💼 {lang === 'th' ? 'คำแนะนำเมื่อนำไปขาย/ส่งมอบให้ลูกค้า:' : 'Customer Handover Guide:'}</span>
            </h4>
            <ul className="text-xs text-amber-950 space-y-1 list-disc pl-4 font-medium leading-relaxed">
              <li>
                {lang === 'th' 
                  ? 'ก่อนส่งมอบโปรแกรมให้ลูกค้าจริง แนะนำให้กดปุ่ม "ล้างข้อมูลยอดขายทั้งหมด (เริ่มร้านใหม่)" ด้านล่าง เพื่อให้ยอดขายรายวันและรายเดือนเริ่มต้นที่ 0 บาท 0 จาน'
                  : 'Before handing over to your customer, click "Clean Slate for Customer" below so daily and monthly sales start at 0 THB / 0 items.'}
              </li>
              <li>
                {lang === 'th'
                  ? 'รายการอาหาร 18 รายการและราคาต้นทุนจะยังคงอยู่ครบถ้วน ลูกค้าสามารถเปิดขายหน้าร้านได้ทันที'
                  : 'All 18 food and drink items with prices and costs will be preserved and ready for sales on day 1.'}
              </li>
            </ul>
          </div>

          {/* Clean Slate Action */}
          <div className="pt-2 space-y-2">
            {!showClearConfirm ? (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="w-full py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-sm border-2 border-rose-200 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>
                  {lang === 'th' ? 'ล้างยอดขายทั้งหมด เริ่มต้นร้านใหม่ 0 บิล (สำหรับส่งมอบลูกค้า)' : 'Clean Slate: Clear All Sales (0 Bills for Customer)'}
                </span>
              </button>
            ) : (
              <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-800 font-black text-sm mb-1">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <span>{lang === 'th' ? 'ยืนยันล้างข้อมูลยอดขายทั้งหมด?' : 'Confirm Clear All Sales Data?'}</span>
                </div>
                <p className="text-xs text-rose-700 mb-3">
                  {lang === 'th'
                    ? 'ยอดขาย บิล และสถิติรายวัน/รายเดือนทั้งหมดจะถูกลบเป็น 0 เหมาะสำหรับเตรียมส่งมอบโปรแกรมให้ลูกค้า'
                    : 'All order slips and daily/monthly stats will be reset to 0. Perfect for selling a brand new system to your customer.'}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="w-1/2 py-2 rounded-xl bg-white text-slate-700 font-bold text-xs border border-slate-300 cursor-pointer"
                  >
                    {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmClearAll}
                    className="w-1/2 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md cursor-pointer"
                  >
                    {lang === 'th' ? 'ยืนยันล้างทั้งหมด 0 บิล' : 'Confirm: Reset to 0'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirmResetSeed}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>{lang === 'th' ? 'เติมข้อมูลตัวอย่าง 15-23 ต.ค. (เพื่อทดลองใช้/สาธิต)' : 'Restore Sample Demo Orders (15-23 Oct)'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm cursor-pointer"
          >
            {lang === 'th' ? 'ปิด' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
