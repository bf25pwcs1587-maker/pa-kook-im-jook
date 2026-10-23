import React, { useState } from 'react';
import { ItemSalesSummary, SalesReport } from '../types';
import { formatCurrency } from '../utils/salesCalculator';
import { Language, translations } from '../utils/translations';
import { 
  Printer, 
  Download, 
  X, 
  FileText, 
  Check, 
  ExternalLink,
  Receipt
} from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'daily' | 'monthly';
  periodTitle: string; // e.g. "2026-10-23" or "ตุลาคม 2569"
  report: SalesReport;
  lang: Language;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  reportType,
  periodTitle,
  report,
  lang,
}) => {
  const t = translations[lang];
  const [printFormat, setPrintFormat] = useState<'a4' | 'thermal'>('thermal');
  const [printedFeedback, setPrintedFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const isDaily = reportType === 'daily';
  const reportHeaderTitle = isDaily
    ? (lang === 'th' ? `ใบสรุปยอดขายรายวัน` : `Daily Sales & Profit Summary`)
    : (lang === 'th' ? `ใบสรุปยอดขายรายเดือน` : `Monthly Sales & Profit Summary`);

  // Build standalone printer-friendly HTML
  const generatePrintableHTML = () => {
    const isThermal = printFormat === 'thermal';
    const rowsHtml = report.itemSummaries
      .filter((i) => i.quantitySold > 0)
      .map(
        (i, idx) => `
        <tr style="border-bottom: 1px dashed #e2e8f0;">
          <td style="padding: 6px 4px; font-size: 13px;">${idx + 1}. ${i.name}</td>
          <td style="padding: 6px 4px; text-align: center; font-weight: bold; font-size: 14px;">${i.quantitySold}</td>
          <td style="padding: 6px 4px; text-align: right; font-size: 13px;">฿${i.unitPrice}</td>
          <td style="padding: 6px 4px; text-align: right; font-weight: bold; font-size: 13px;">฿${formatCurrency(i.totalRevenue)}</td>
          <td style="padding: 6px 4px; text-align: right; color: #15803d; font-weight: bold; font-size: 13px;">+฿${formatCurrency(i.totalProfit)}</td>
        </tr>
      `
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Pa-Kook-Im-Jook - ${reportHeaderTitle} (${periodTitle})</title>
  <style>
    @page {
      margin: ${isThermal ? '5mm' : '12mm'};
      size: ${isThermal ? '80mm auto' : 'A4'};
    }
    body {
      font-family: 'Prompt', 'Kanit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: ${isThermal ? '8px' : '24px'};
      width: ${isThermal ? '72mm' : 'auto'};
      max-width: ${isThermal ? '72mm' : '780px'};
      margin-left: auto;
      margin-right: auto;
      font-size: 13px;
      line-height: 1.4;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .logo-title {
      font-size: 20px;
      font-weight: 900;
      margin: 0;
      color: #d97706;
    }
    .sub-title {
      font-size: 12px;
      color: #475569;
      margin-top: 2px;
    }
    .period-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      border-radius: 6px;
      margin-top: 6px;
      font-weight: bold;
      font-size: 13px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin: 12px 0;
    }
    .kpi-card {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      border-radius: 6px;
      text-align: center;
    }
    .kpi-label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: bold;
    }
    .kpi-value {
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
      margin-top: 2px;
    }
    .kpi-profit {
      color: #15803d;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }
    th {
      border-bottom: 2px solid #0f172a;
      padding: 6px 4px;
      font-size: 11px;
      text-transform: uppercase;
      color: #334155;
    }
    .total-row {
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      font-weight: 900;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      margin-top: 16px;
      padding-top: 10px;
      border-top: 1px dashed #cbd5e1;
      font-size: 11px;
      color: #64748b;
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
    <div class="logo-title">🍳 ป้ากุ๊กอิ่มจุก (Pa-Kook-Im-Jook)</div>
    <div class="sub-title">${reportHeaderTitle}</div>
    <div class="period-box">📅 ${periodTitle}</div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">${lang === 'th' ? 'ยอดขายรวม (Revenue)' : 'Total Revenue'}</div>
      <div class="kpi-value">฿${formatCurrency(report.totalRevenue)}</div>
    </div>
    <div class="kpi-card" style="background: #f0fdf4;">
      <div class="kpi-label" style="color: #15803d;">${lang === 'th' ? 'กำไรสุทธิ (Net Profit)' : 'Net Profit'}</div>
      <div class="kpi-value kpi-profit">+฿${formatCurrency(report.totalProfit)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">${lang === 'th' ? 'ต้นทุนรวม (Cost)' : 'Total Cost'}</div>
      <div class="kpi-value">฿${formatCurrency(report.totalCost)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">${lang === 'th' ? 'จำนวนขายรวม (Qty)' : 'Total Qty Sold'}</div>
      <div class="kpi-value">${report.totalQuantity} ${lang === 'th' ? 'จาน/แก้ว' : 'items'}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align: left;">${lang === 'th' ? 'รายการอาหาร/เครื่องดื่ม' : 'Item Name'}</th>
        <th style="text-align: center;">${lang === 'th' ? 'จำนวน' : 'Qty'}</th>
        <th style="text-align: right;">${lang === 'th' ? 'ราคา' : 'Price'}</th>
        <th style="text-align: right;">${lang === 'th' ? 'ยอดขาย' : 'Total'}</th>
        <th style="text-align: right;">${lang === 'th' ? 'กำไร' : 'Profit'}</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="5" style="text-align:center; padding: 12px; color: #94a3b8;">${lang === 'th' ? 'ไม่มีรายการขาย' : 'No sales recorded'}</td></tr>`}
      <tr class="total-row">
        <td style="padding: 8px 4px;">${lang === 'th' ? 'รวมยอดทั้งสิ้น' : 'Grand Total'}</td>
        <td style="padding: 8px 4px; text-align: center;">${report.totalQuantity}</td>
        <td style="padding: 8px 4px; text-align: right;">-</td>
        <td style="padding: 8px 4px; text-align: right;">฿${formatCurrency(report.totalRevenue)}</td>
        <td style="padding: 8px 4px; text-align: right; color: #15803d;">+฿${formatCurrency(report.totalProfit)}</td>
      </tr>
    </tbody>
  </table>

  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; font-size: 11px; margin-top: 8px;">
    <div><strong>${lang === 'th' ? 'อัตรากำไร (Profit Margin)' : 'Profit Margin'}:</strong> ${report.profitMarginPercent}%</div>
    <div><strong>${lang === 'th' ? 'จำนวนบิลที่ขาย' : 'Total Orders'}:</strong> ${report.totalOrders} ${lang === 'th' ? 'บิล' : 'orders'}</div>
    <div><strong>${lang === 'th' ? 'ยอดเฉลี่ยต่อบิล' : 'Avg per Order'}:</strong> ฿${report.averageOrderValue}</div>
  </div>

  <div class="footer">
    <div>พิมพ์เมื่อ: ${new Date().toLocaleString(lang === 'th' ? 'th-TH' : 'en-US')}</div>
    <div>ระบบร้านอาหาร Pa-Kook-Im-Jook (Cloud DB)</div>
  </div>
</body>
</html>`;
  };

  // 1. Direct Print via sandboxed-friendly hidden iframe
  const handlePrint = () => {
    try {
      const html = generatePrintableHTML();
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
            setPrintedFeedback(lang === 'th' ? 'ส่งคำสั่งพิมพ์เรียบร้อยแล้ว' : 'Print command sent');
          } catch (e) {
            console.warn('Iframe print blocked, falling back to download', e);
            handleDownloadHTML();
          } finally {
            setTimeout(() => {
              document.body.removeChild(iframe);
              setTimeout(() => setPrintedFeedback(null), 3000);
            }, 3000);
          }
        }, 400);
      }
    } catch (err) {
      console.warn('Printing error, downloading printable slip instead', err);
      handleDownloadHTML();
    }
  };

  // 2. Download Printable HTML Receipt Slip
  const handleDownloadHTML = () => {
    const html = generatePrintableHTML();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PaKookImJook_${reportType}_${periodTitle.replace(/[\s\/\\]+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setPrintedFeedback(lang === 'th' ? 'ดาวน์โหลดไฟล์ใบเสร็จสำหรับพิมพ์สำเร็จ (.html)' : 'Printable HTML receipt downloaded');
    setTimeout(() => setPrintedFeedback(null), 4000);
  };

  // 3. Download CSV
  const handleDownloadCSV = () => {
    const headers = [
      '#',
      lang === 'th' ? 'รายการอาหาร/เครื่องดื่ม' : 'Item Name',
      lang === 'th' ? 'ราคาขาย' : 'Price',
      lang === 'th' ? 'ต้นทุน' : 'Cost',
      lang === 'th' ? 'จำนวนที่ขาย' : 'Quantity Sold',
      lang === 'th' ? 'ยอดขายรวม' : 'Total Revenue',
      lang === 'th' ? 'ต้นทุนรวม' : 'Total Cost',
      lang === 'th' ? 'กำไรที่ได้' : 'Profit Made',
      lang === 'th' ? 'สัดส่วนกำไร' : 'Margin %',
    ];

    const rows = report.itemSummaries.map((item, idx) => [
      idx + 1,
      `"${item.name}"`,
      item.unitPrice,
      item.unitCost,
      item.quantitySold,
      item.totalRevenue,
      item.totalCost,
      item.totalProfit,
      `${item.profitMarginPercent}%`,
    ]);

    rows.push([
      '',
      `"${lang === 'th' ? 'รวมยอดทั้งสิ้น' : 'Grand Total'}"`,
      '',
      '',
      report.totalQuantity,
      report.totalRevenue,
      report.totalCost,
      report.totalProfit,
      `${report.profitMarginPercent}%`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `PaKookImJook_${reportType}_${periodTitle.replace(/[\s\/\\]+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const soldItems = report.itemSummaries.filter((i) => i.quantitySold > 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Control Bar */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
              🖨️
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {lang === 'th' ? 'พิมพ์รายงาน & พิมพ์ใบเสร็จสรุปยอด' : 'Print Sales & Profit Report'}
              </h3>
              <p className="text-xs text-slate-400">
                Pa-Kook-Im-Jook • {periodTitle}
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

        {/* Format Selector & Feedback Banner */}
        <div className="bg-slate-100 p-3 sm:px-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">
              {lang === 'th' ? 'รูปแบบใบพิมพ์:' : 'Paper Format:'}
            </span>
            <div className="bg-white rounded-xl p-0.5 border border-slate-300 flex">
              <button
                type="button"
                onClick={() => setPrintFormat('thermal')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                  printFormat === 'thermal'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🧾 {lang === 'th' ? 'สลิป POS 80mm' : 'Thermal 80mm'}
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                  printFormat === 'a4'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📄 {lang === 'th' ? 'รายงานเต็มหน้า (A4)' : 'Full Sheet (A4)'}
              </button>
            </div>
          </div>

          {printedFeedback && (
            <div className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{printedFeedback}</span>
            </div>
          )}
        </div>

        {/* Paper Invoice Preview Container (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-200/60 flex justify-center flex-1">
          <div 
            className={`bg-white shadow-xl rounded-2xl p-5 sm:p-7 border border-slate-300 text-slate-900 transition-all ${
              printFormat === 'thermal' ? 'w-full max-w-[380px]' : 'w-full max-w-xl'
            }`}
          >
            {/* Store Banner */}
            <div className="text-center pb-4 border-b-2 border-slate-900">
              <h2 className="text-xl sm:text-2xl font-black text-amber-600 leading-tight">
                🍳 ป้ากุ๊กอิ่มจุก (Pa-Kook-Im-Jook)
              </h2>
              <p className="text-xs font-bold text-slate-600 mt-0.5">
                {reportHeaderTitle}
              </p>
              <div className="inline-block mt-2 bg-slate-100 border border-slate-300 rounded-lg px-3 py-1 text-xs font-black text-slate-800">
                📅 {periodTitle}
              </div>
            </div>

            {/* KPI Summary Block */}
            <div className="grid grid-cols-2 gap-2 my-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center">
                <span className="text-[11px] font-bold text-amber-800 uppercase block">
                  {lang === 'th' ? 'ยอดขายรวม' : 'Total Revenue'}
                </span>
                <span className="text-lg sm:text-xl font-black text-amber-950">
                  ฿{formatCurrency(report.totalRevenue)}
                </span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                  {lang === 'th' ? 'กำไรสุทธิ' : 'Net Profit'}
                </span>
                <span className="text-lg sm:text-xl font-black text-emerald-700">
                  +฿{formatCurrency(report.totalProfit)}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  {lang === 'th' ? 'ต้นทุนรวม' : 'Total Cost'}
                </span>
                <span className="text-sm sm:text-base font-black text-slate-700">
                  ฿{formatCurrency(report.totalCost)}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  {lang === 'th' ? 'จำนวนขายรวม' : 'Total Qty Sold'}
                </span>
                <span className="text-sm sm:text-base font-black text-slate-900">
                  {report.totalQuantity} {lang === 'th' ? 'จาน/แก้ว' : 'items'}
                </span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="mt-4">
              <div className="text-xs font-black uppercase text-slate-500 mb-1 flex justify-between border-b border-slate-900 pb-1">
                <span>{lang === 'th' ? 'รายการอาหาร/เครื่องดื่ม' : 'Item'}</span>
                <div className="flex gap-4">
                  <span>{lang === 'th' ? 'จน.' : 'Qty'}</span>
                  <span>{lang === 'th' ? 'ยอดขาย' : 'Total'}</span>
                  <span>{lang === 'th' ? 'กำไร' : 'Profit'}</span>
                </div>
              </div>

              <div className="divide-y divide-dashed divide-slate-200 text-xs sm:text-sm">
                {soldItems.map((item, idx) => (
                  <div key={item.menuItemId} className="py-2 flex items-center justify-between">
                    <div className="pr-2">
                      <span className="font-extrabold text-slate-900 block leading-tight">
                        {idx + 1}. {item.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        @{item.unitPrice}฿ (ทุน {item.unitCost}฿)
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-right whitespace-nowrap">
                      <span className="font-black text-slate-900 w-8 text-center bg-slate-100 rounded px-1">
                        {item.quantitySold}
                      </span>
                      <span className="font-bold text-slate-900 w-16">
                        ฿{formatCurrency(item.totalRevenue)}
                      </span>
                      <span className="font-black text-emerald-700 w-16">
                        +฿{formatCurrency(item.totalProfit)}
                      </span>
                    </div>
                  </div>
                ))}

                {soldItems.length === 0 && (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    {lang === 'th' ? 'ไม่มีรายการขายในรอบนี้' : 'No items sold during this period'}
                  </div>
                )}
              </div>

              {/* Total Summary Row */}
              <div className="mt-3 pt-2 border-t-2 border-slate-900 flex justify-between items-center font-black text-sm sm:text-base">
                <span>{lang === 'th' ? 'รวมยอดทั้งสิ้น:' : 'Grand Total:'}</span>
                <div className="text-right">
                  <span className="text-slate-900 block">
                    ฿{formatCurrency(report.totalRevenue)}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700">
                    +{lang === 'th' ? 'กำไร' : 'Profit'} ฿{formatCurrency(report.totalProfit)} ({report.profitMarginPercent}%)
                  </span>
                </div>
              </div>

              {/* Orders count & timestamp */}
              <div className="mt-4 pt-3 border-t border-dashed border-slate-300 text-center text-[11px] text-slate-500">
                <p>{lang === 'th' ? 'จำนวนบิลทั้งหมด' : 'Total Orders'}: {report.totalOrders} {lang === 'th' ? 'บิล' : 'orders'} • {lang === 'th' ? 'เฉลี่ยบิลละ' : 'Avg/Order'} ฿{report.averageOrderValue}</p>
                <p className="mt-1">{lang === 'th' ? 'พิมพ์เมื่อ' : 'Printed on'}: {new Date().toLocaleString(lang === 'th' ? 'th-TH' : 'en-US')}</p>
                <p className="font-bold text-slate-700 mt-0.5">ขอบคุณที่ใช้บริการ ป้ากุ๊กอิ่มจุก</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Buttons */}
        <div className="bg-white p-3 sm:p-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer border border-slate-300"
              title="Download CSV"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>{lang === 'th' ? 'ไฟล์ Excel/CSV' : 'Download CSV'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadHTML}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer border border-slate-300"
              title="Download Printable Receipt File"
            >
              <FileText className="w-4 h-4 text-amber-600" />
              <span>{lang === 'th' ? 'ดาวน์โหลดสลิปพิมพ์ (.html)' : 'Download Slip (.html)'}</span>
            </button>
          </div>

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
              <span>{lang === 'th' ? 'สั่งพิมพ์ทันที' : 'Print Now'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
