import React, { useState } from 'react';
import { X, Printer, QrCode, Check, Download, Layers } from 'lucide-react';

export default function QRPrintModal({ 
  isOpen, 
  onClose, 
  items, 
  singleItem 
}) {
  const [printAll, setPrintAll] = useState(!singleItem);

  if (!isOpen) return null;

  const itemsToPrint = printAll || !singleItem ? items : [singleItem];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-6 border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header (No Print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Printer className="w-5 h-5 text-orange-400" />
              <span>พิมพ์สติ๊กเกอร์ QR Code ติดวัสดุอุปกรณ์</span>
            </h2>
            <p className="text-xs text-slate-400">
              ขนาดสติ๊กเกอร์พอเหมาะสำหรับติดกล่อง, ชั้นวาง หรือเครื่องมือช่าง
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Toolbar (No Print) */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">โหมดการพิมพ์:</span>
            <button
              onClick={() => setPrintAll(false)}
              disabled={!singleItem}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                !printAll && singleItem 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-white text-slate-600 border border-slate-300 disabled:opacity-40'
              }`}
            >
              เฉพาะชิ้นนี้ {singleItem ? `(${singleItem.id})` : ''}
            </button>
            <button
              onClick={() => setPrintAll(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                printAll 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-white text-slate-600 border border-slate-300'
              }`}
            >
              พิมพ์ทั้งหมด ({items.length} รายการ)
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow transition"
          >
            <Printer className="w-4 h-4 text-orange-400" />
            <span>กดสั่งพิมพ์ทันที (Print)</span>
          </button>
        </div>

        {/* Printable Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100">
          <div id="print-area" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
            {itemsToPrint.map(item => (
              <div 
                key={item.id}
                className="bg-white p-4 rounded-xl border-2 border-slate-800 shadow-sm flex items-center gap-3 page-break-inside-avoid"
                style={{ breakInside: 'avoid' }}
              >
                {/* QR Code */}
                <div className="w-24 h-24 shrink-0 bg-white p-1 rounded-lg border border-slate-200 flex items-center justify-center">
                  {item.qrCode ? (
                    <img 
                      src={item.qrCode} 
                      alt={item.id} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <QrCode className="w-12 h-12 text-slate-400" />
                  )}
                </div>

                {/* Text Details */}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">
                    ItemBase • สติ๊กเกอร์พัสดุ
                  </div>
                  <div className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded inline-block my-0.5">
                    {item.id}
                  </div>
                  <div className="font-bold text-slate-900 text-xs leading-tight line-clamp-2">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 truncate">
                    หมวด: {item.category}
                  </div>
                  <div className="text-[10px] text-slate-600 font-medium truncate">
                    ที่เก็บ: {item.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer (No Print) */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 no-print">
          <span>รองรับกระดาษพิมพ์สติ๊กเกอร์ A4 หรือเครื่องพิมพ์บาร์โค้ดความร้อน</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
