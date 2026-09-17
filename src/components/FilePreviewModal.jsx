import React, { useState, useEffect } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  ExternalLink, 
  FileText, 
  Maximize2 
} from 'lucide-react';

/**
 * ImageLightboxModal: Fullscreen Zoom & Pan Preview for Images
 */
export function ImageLightboxModal({ isOpen, image, onClose }) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, image, onClose]);

  if (!isOpen || !image) return null;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.3, 3.5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.3, 0.5));
  const handleResetZoom = () => { setScale(1); setRotation(0); };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = image.url || image.src || (typeof image === 'string' ? image : '');
    a.download = image.name || 'image-download.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const imageUrl = image.url || image.src || (typeof image === 'string' ? image : '');
  const imageName = image.name || 'รูปภาพประกอบงาน';

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-fadeIn select-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 text-white pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 truncate pr-4">
          <Maximize2 className="w-4 h-4 text-orange-400 shrink-0" />
          <span className="text-sm font-semibold truncate text-slate-200">{imageName}</span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            ({Math.round(scale * 100)}%)
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition"
            title="ซูมเข้า"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition"
            title="ซูมออก"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition"
            title="หมุนรูปภาพ 90 องศา"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition hidden sm:inline"
            title="รีเซ็ตขนาดปกติ"
          >
            100%
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition"
            title="ดาวน์โหลดภาพนี้"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 ml-2 rounded-xl bg-red-600/80 hover:bg-red-500 text-white transition shadow-md"
            title="ปิดหน้าต่าง (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Area with Zoom & Pan */}
      <div 
        className="flex-1 flex items-center justify-center overflow-hidden my-2 relative"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div 
          className="transition-transform duration-200 ease-out flex items-center justify-center"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`
          }}
        >
          <img
            src={imageUrl}
            alt={imageName}
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl pointer-events-auto"
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom Footer Hint */}
      <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
        <span>คลิกปุ่มซูมด้านบนเพื่อขยายดูรายละเอียด หรือคลิกพื้นที่ว่างเพื่อปิด</span>
      </div>
    </div>
  );
}

/**
 * PdfViewerModal: Embedded PDF Viewer Modal with Open in New Tab & Download
 */
export function PdfViewerModal({ isOpen, pdf, onClose }) {
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !pdf) return null;

  const pdfUrl = pdf.url || (typeof pdf === 'string' ? pdf : '');
  const pdfName = pdf.name || 'เอกสารประกอบงาน.pdf';

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = pdfName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenNewTab = () => {
    const win = window.open();
    if (win) {
      win.document.write(
        `<title>${pdfName}</title><body style="margin:0;background:#1e293b;"><iframe src="${pdfUrl}" frameborder="0" style="border:0; width:100%; height:100vh;" allowfullscreen></iframe></body>`
      );
    } else {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2.5 truncate pr-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h3 className="text-sm font-bold text-slate-100 truncate">{pdfName}</h3>
              <p className="text-[11px] text-slate-400">เปิดดูเอกสาร PDF แบบแปลน / สเปกงาน</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition"
              title="เปิดในแท็บใหม่ของเบราว์เซอร์"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">เปิดแท็บใหม่</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
              title="ดาวน์โหลดไฟล์ PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ดาวน์โหลด</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition ml-1"
              title="ปิดหน้าต่าง (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Embedded PDF iframe */}
        <div className="flex-1 w-full h-full bg-slate-950/60 relative">
          <iframe
            src={pdfUrl}
            title={pdfName}
            className="w-full h-full border-0 bg-slate-900"
          />
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>📄 โปรแกรมเปิดดูไฟล์ PDF</span>
          <span>หากไฟล์ไม่แสดง สามารถกด <b>"เปิดแท็บใหม่"</b> หรือ <b>"ดาวน์โหลด"</b> ด้านบนได้ทันที</span>
        </div>

      </div>
    </div>
  );
}
