import React, { useState } from 'react';
import { Order, DiningType } from '../types';
import { formatCurrency } from '../utils/salesCalculator';
import { Language, translations } from '../utils/translations';
import { SHOP_LOGO_URL } from '../utils/constants';
import { 
  Printer, 
  Download, 
  X, 
  FileText, 
  Check, 
  ShoppingBag,
  User,
  Clock,
  Sparkles
} from 'lucide-react';

interface PrintOrderSlipModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const PrintOrderSlipModal: React.FC<PrintOrderSlipModalProps> = ({
  order,
  isOpen,
  onClose,
  lang,
}) => {
  const t = translations[lang];
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');
  const [printedFeedback, setPrintedFeedback] = useState<string | null>(null);

  // Editable fields in preview in case she wants to adjust customer name or dining type on the fly
  const [editableCustomerName, setEditableCustomerName] = useState<string>(order?.customerName || '');
  const [editableDiningType, setEditableDiningType] = useState<DiningType>(order?.diningType || 'take_away');

  // Keep state synced when a new order is passed
  React.useEffect(() => {
    if (order) {
      setEditableCustomerName(order.customerName || '');
      setEditableDiningType(order.diningType || 'take_away');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const isTakeAway = editableDiningType === 'take_away';
  const diningBadgeText = isTakeAway 
    ? (lang === 'th' ? '🥡 สั่งกลับบ้าน (Take Away to Home)' : '🥡 Take Away (To Home)')
    : (lang === 'th' ? '🍽️ ทานที่ร้าน (Dine In)' : '🍽️ Dine In');

  const customerDisplayName = editableCustomerName.trim() || (lang === 'th' ? 'ลูกค้าทั่วไป (Walk-in Customer)' : 'Walk-in Customer');

  const formattedDateTime = new Date(order.timestamp).toLocaleString(lang === 'th' ? 'th-TH' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Standalone Printable Slip HTML Generation
  const generateSlipHTML = () => {
    const isThermal = printFormat === 'thermal';

    const itemsHtml = order.items
      .map(
        (it, idx) => `
        <tr style="border-bottom: 1px dashed #e2e8f0;">
          <td style="padding: 6px 4px; font-size: 13px; font-weight: bold; color: #0f172a;">
            ${idx + 1}. ${it.name}
            ${it.note ? `<div style="font-size: 11px; color: #64748b; font-weight: normal;">* ${it.note}</div>` : ''}
          </td>
          <td style="padding: 6px 4px; text-align: center; font-weight: 900; font-size: 14px; color: #b45309;">
            x${it.quantity}
          </td>
          <td style="padding: 6px 4px; text-align: right; font-size: 12px; color: #475569;">
            ฿${it.unitPrice}
          </td>
          <td style="padding: 6px 4px; text-align: right; font-weight: 900; font-size: 14px; color: #0f172a;">
            ฿${formatCurrency(it.subtotal)}
          </td>
        </tr>
      `
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Pa-Kook-Im-Jook - Order #${order.orderNumber} - ${customerDisplayName}</title>
  <style>
    @page {
      margin: ${isThermal ? '3mm' : '12mm'};
      size: ${isThermal ? '80mm auto' : 'A4'};
    }
    body {
      font-family: 'Prompt', 'Kanit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: ${isThermal ? '10px' : '24px'};
      width: ${isThermal ? '72mm' : 'auto'};
      max-width: ${isThermal ? '72mm' : '780px'};
      margin-left: auto;
      margin-right: auto;
      font-size: 13px;
      line-height: 1.4;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #0f172a;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .shop-title {
      font-size: 20px;
      font-weight: 900;
      color: #d97706;
      margin: 0;
      line-height: 1.2;
    }
    .slip-doc-title {
      font-size: 13px;
      font-weight: 800;
      color: #334155;
      margin-top: 3px;
      text-transform: uppercase;
    }
    .takeaway-badge {
      display: inline-block;
      margin-top: 6px;
      background: #fef3c7;
      border: 1.5px solid #d97706;
      color: #92400e;
      font-size: 13px;
      font-weight: 900;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 0.3px;
    }
    .customer-header-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 10px;
      margin: 10px 0;
      font-size: 12px;
    }
    .customer-name-row {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .order-meta-row {
      display: flex;
      justify-content: space-between;
      color: #475569;
      font-size: 11px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
    }
    th {
      border-bottom: 2px solid #0f172a;
      padding: 6px 4px;
      font-size: 11px;
      text-transform: uppercase;
      color: #334155;
    }
    .totals-box {
      border-top: 2px solid #0f172a;
      border-bottom: 2px dashed #0f172a;
      padding: 8px 0;
      margin-top: 8px;
    }
    .grand-total-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
    }
    .payment-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #475569;
      margin-top: 4px;
    }
    .thankyou-section {
      text-align: center;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
    }
    .thankyou-line1 {
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 6px 0;
    }
    .thankyou-line2 {
      font-size: 11px;
      color: #334155;
      line-height: 1.45;
      margin: 0;
    }
    .order-summary-tag {
      margin-top: 10px;
      font-size: 12px;
      font-weight: 900;
      color: #b45309;
      letter-spacing: 0.5px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="${SHOP_LOGO_URL}" alt="Logo" style="width: 60px; height: 60px; object-fit: cover; border-radius: 12px; margin: 0 auto 6px auto; display: block; border: 1.5px solid #d97706;" />
    <div class="shop-title">ป้ากุ๊กอิ่มจุก (Pa-Kook-Im-Jook)</div>
    <div class="slip-doc-title">ใบสรุปรายการอาหาร (Order Summary)</div>
    <div class="takeaway-badge">${diningBadgeText}</div>
  </div>

  <div class="customer-header-box">
    <div class="customer-name-row">
      👤 <strong>ชื่อลูกค้า:</strong> ${customerDisplayName}
    </div>
    <div class="order-meta-row">
      <span><strong>เลขที่บิล:</strong> #${order.orderNumber}</span>
      <span><strong>เวลา:</strong> ${formattedDateTime}</span>
    </div>
    ${order.customerNote ? `<div style="margin-top: 4px; color: #b45309; font-weight: bold;">📝 หมายเหตุ: ${order.customerNote}</div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align: left;">รายการอาหาร/เครื่องดื่ม</th>
        <th style="text-align: center;">จน.</th>
        <th style="text-align: right;">ราคา</th>
        <th style="text-align: right;">รวม</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="totals-box">
    <div class="grand-total-row">
      <span>รวมยอดทั้งสิ้น (Total):</span>
      <span style="font-size: 18px; color: #b45309;">฿${formatCurrency(order.totalRevenue)}</span>
    </div>
    <div class="payment-row">
      <span>วิธีชำระ: ${order.paymentMethod === 'cash' ? 'เงินสด (Cash)' : 'สแกน QR / PromptPay'}</span>
      <span>รวม ${order.totalQuantity} รายการ</span>
    </div>
    ${order.paymentMethod === 'cash' ? `
    <div class="payment-row">
      <span>รับเงินมา: ฿${formatCurrency(order.amountPaid)}</span>
      <span style="font-weight: bold; color: #15803d;">เงินทอน: ฿${formatCurrency(order.change)}</span>
    </div>` : ''}
  </div>

  <!-- Mandatory Custom Thank-You Words & Order Summary Requested by Customer -->
  <div class="thankyou-section">
    <p class="thankyou-line1">
      ขอบคุณที่มาทานอาหารกับเรา !
    </p>
    <p class="thankyou-line2">
      หวังว่าคุณจะมีความสุขกับมื้ออาหารแสนอร่อย หากมีสิ่งใดผิดพลาดหรือขาดตกบกพร่อง โปรดแจ้งให้เราทราบได้เลยนะคะ ❤️😊
    </p>
    <div class="order-summary-tag">
      ใบสรุปรายการอาหาร (Order Summary)
    </div>
  </div>
</body>
</html>`;
  };

  // Direct Print via hidden sandbox-safe iframe
  const handlePrint = () => {
    try {
      const html = generateSlipHTML();
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(html);
        frameDoc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setPrintedFeedback(lang === 'th' ? 'ส่งคำสั่งพิมพ์สลิปเรียบร้อยแล้ว' : 'Print command sent');
          } catch (e) {
            console.warn('Iframe print blocked, downloading slip', e);
            handleDownloadHTML();
          } finally {
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
              setTimeout(() => setPrintedFeedback(null), 3500);
            }, 3000);
          }
        }, 400);
      }
    } catch (err) {
      console.warn('Printing error, falling back to download', err);
      handleDownloadHTML();
    }
  };

  // Download Standalone Printable HTML file
  const handleDownloadHTML = () => {
    const html = generateSlipHTML();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PaKookImJook_Order_${order.orderNumber}_Takeaway.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setPrintedFeedback(lang === 'th' ? 'ดาวน์โหลดสลิปสำเร็จ (.html)' : 'Slip file downloaded (.html)');
    setTimeout(() => setPrintedFeedback(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
              🥡
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                <span>{lang === 'th' ? 'พิมพ์ใบสรุปรายการอาหาร (บิลสั่งกลับบ้าน)' : 'Print Order Summary (Take Away Slip)'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Pa-Kook-Im-Jook • #{order.orderNumber}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Customization Toolbar: Customer Name on Top & Dining Type */}
        <div className="bg-slate-100 p-3 sm:px-6 border-b border-slate-200 space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Customer Name Input (To print right on top of paper) */}
            <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 border border-slate-300 shadow-sm">
              <User className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-slate-700 shrink-0">
                {lang === 'th' ? 'ชื่อลูกค้า:' : 'Name:'}
              </span>
              <input
                type="text"
                value={editableCustomerName}
                onChange={(e) => setEditableCustomerName(e.target.value)}
                placeholder={lang === 'th' ? 'พิมพ์ชื่อลูกค้าบนหัวบิล (เช่น คุณสมชาย)' : 'Customer Name on top'}
                className="w-full text-xs sm:text-sm font-bold text-slate-900 focus:outline-none bg-transparent"
              />
            </div>

            {/* Dining Type Toggle: Take Away vs Dine In */}
            <div className="bg-white rounded-xl p-0.5 border border-slate-300 flex shrink-0">
              <button
                type="button"
                onClick={() => setEditableDiningType('take_away')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                  isTakeAway
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🥡 {lang === 'th' ? 'สั่งกลับบ้าน' : 'Take Away'}
              </button>
              <button
                type="button"
                onClick={() => setEditableDiningType('dine_in')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                  !isTakeAway
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🍽️ {lang === 'th' ? 'ทานที่ร้าน' : 'Dine In'}
              </button>
            </div>
          </div>

          {/* Feedback banner if printed */}
          {printedFeedback && (
            <div className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{printedFeedback}</span>
            </div>
          )}
        </div>

        {/* Paper Receipt Preview (High fidelity) */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-200/60 flex justify-center flex-1">
          <div className="bg-white shadow-xl rounded-2xl p-5 sm:p-6 border border-slate-300 text-slate-900 w-full max-w-[360px] font-sans">
            
            {/* Header with Name & Order Type */}
            <div className="text-center pb-3 border-b-2 border-dashed border-slate-900">
              <img
                src={SHOP_LOGO_URL}
                alt="Pa-Kook-Im-Jook Logo"
                className="w-16 h-16 object-cover rounded-2xl border-2 border-amber-500 mx-auto mb-2 shadow-sm"
              />
              <h2 className="text-xl sm:text-2xl font-black text-amber-600 leading-tight">
                ป้ากุ๊กอิ่มจุก
              </h2>
              <div className="text-xs font-extrabold text-slate-700 tracking-wider uppercase mt-0.5">
                ใบสรุปรายการอาหาร (Order Summary)
              </div>
              
              {/* Take Away Badge */}
              <div className="inline-block mt-2 bg-amber-100 border border-amber-500 text-amber-900 text-xs font-black px-3 py-1 rounded-md shadow-xs">
                {diningBadgeText}
              </div>
            </div>

            {/* Customer Name on top */}
            <div className="my-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1">
                  👤 <span className="text-amber-700">{customerDisplayName}</span>
                </span>
                <span className="font-black text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                  #{order.orderNumber}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formattedDateTime}</span>
              </div>
              {order.customerNote && (
                <div className="text-xs font-bold text-amber-800 bg-amber-50 p-1.5 rounded mt-1 border border-amber-200">
                  📝 {order.customerNote}
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div className="mt-2">
              <div className="text-[11px] font-black uppercase text-slate-500 mb-1 flex justify-between border-b border-slate-900 pb-1">
                <span>{lang === 'th' ? 'รายการอาหาร/เครื่องดื่ม' : 'Item'}</span>
                <div className="flex gap-3">
                  <span>{lang === 'th' ? 'จน.' : 'Qty'}</span>
                  <span>{lang === 'th' ? 'ราคา' : 'Price'}</span>
                  <span>{lang === 'th' ? 'รวม' : 'Total'}</span>
                </div>
              </div>

              <div className="divide-y divide-dashed divide-slate-200 text-xs sm:text-sm">
                {order.items.map((it, idx) => (
                  <div key={it.menuItemId + idx} className="py-1.5 flex items-center justify-between">
                    <div className="pr-1 flex-1 min-w-0">
                      <span className="font-extrabold text-slate-900 block truncate">
                        {idx + 1}. {it.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-right whitespace-nowrap">
                      <span className="font-black text-amber-700 w-6 text-center">
                        x{it.quantity}
                      </span>
                      <span className="text-slate-500 w-10 text-right text-xs">
                        ฿{it.unitPrice}
                      </span>
                      <span className="font-black text-slate-900 w-14 text-right">
                        ฿{formatCurrency(it.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Grand Total */}
              <div className="mt-3 pt-2 border-t-2 border-slate-900 flex justify-between items-baseline font-black">
                <span className="text-sm text-slate-700">ยอดรวมทั้งสิ้น (Total):</span>
                <span className="text-xl text-amber-600">
                  ฿{formatCurrency(order.totalRevenue)}
                </span>
              </div>

              {/* Payment Details */}
              <div className="text-[11px] text-slate-500 pt-1 space-y-0.5">
                <div className="flex justify-between">
                  <span>การชำระเงิน:</span>
                  <span className="font-bold text-slate-700">
                    {order.paymentMethod === 'cash' ? '💵 เงินสด (Cash)' : '📱 QR PromptPay'}
                  </span>
                </div>
                {order.paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between">
                      <span>รับเงินมา:</span>
                      <span>฿{formatCurrency(order.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-700">
                      <span>เงินทอน:</span>
                      <span>฿{formatCurrency(order.change)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Exact User Requested Bottom Section */}
              <div className="mt-4 pt-3 border-t-2 border-dashed border-slate-300 text-center space-y-1.5">
                <p className="font-black text-slate-900 text-xs sm:text-sm">
                  ขอบคุณที่มาทานอาหารกับเรา !
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  หวังว่าคุณจะมีความสุขกับมื้ออาหารแสนอร่อย หากมีสิ่งใดผิดพลาดหรือขาดตกบกพร่อง โปรดแจ้งให้เราทราบได้เลยนะคะ ❤️😊
                </p>
                <div className="text-xs font-black text-amber-700 tracking-wide pt-1">
                  ใบสรุปรายการอาหาร (Order Summary)
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Modal Bottom Buttons */}
        <div className="bg-white p-3 sm:p-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleDownloadHTML}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer border border-slate-300"
            title="Download Slip File"
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>{lang === 'th' ? 'ดาวน์โหลดสลิป (.html)' : 'Download Slip (.html)'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'th' ? 'สั่งพิมพ์สลิปทันที' : 'Print Slip Now'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
