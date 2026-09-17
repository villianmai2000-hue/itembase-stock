import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  ExternalLink, 
  FileText, 
  Maximize2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * ImageLightboxModal: Fullscreen Zoom, Pan & Slide Navigation Preview for Images
 */
export function ImageLightboxModal({ 
  isOpen, 
  images = [], 
  image = null, 
  currentIndex = 0, 
  onClose,
  onIndexChange 
}) {
  // Normalize incoming images to standard array of objects
  const imageList = useMemo(() => {
    if (Array.isArray(images) && images.length > 0) {
      return images.map((img, i) => (
        typeof img === 'string' 
          ? { url: img, name: `รูปภาพที่ ${i + 1}` } 
          : { ...img, name: img.name || `รูปภาพที่ ${i + 1}` }
      ));
    }
    if (image) {
      return [
        typeof image === 'string' 
          ? { url: image, name: 'รูปภาพ' } 
          : { ...image, name: image.name || 'รูปภาพ' }
      ];
    }
    return [];
  }, [images, image]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);

  useEffect(() => {
    if (isOpen && imageList.length > 0) {
      const initIdx = typeof currentIndex === 'number' && currentIndex >= 0 && currentIndex < imageList.length 
        ? currentIndex 
        : (image ? Math.max(0, imageList.findIndex(img => (img.url || img.src || img) === (image.url || image.src || image))) : 0);
      setActiveIdx(Math.max(0, initIdx));
      setScale(1);
      setRotation(0);
    }
  }, [isOpen, currentIndex, imageList, image]);

  const goToIndex = (newIdx) => {
    if (newIdx < 0 || newIdx >= imageList.length) return;
    setActiveIdx(newIdx);
    setScale(1);
    setRotation(0);
    if (onIndexChange) onIndexChange(newIdx);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (imageList.length <= 1) return;
    goToIndex(activeIdx > 0 ? activeIdx - 1 : imageList.length - 1);
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (imageList.length <= 1) return;
    goToIndex(activeIdx < imageList.length - 1 ? activeIdx + 1 : 0);
  };

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        } else if (e.key === 'ArrowLeft') {
          handlePrev();
        } else if (e.key === 'ArrowRight') {
          handleNext();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, activeIdx, imageList.length, onClose]);

  if (!isOpen || imageList.length === 0) return null;

  const currentImg = imageList[activeIdx] || imageList[0];
  const imageUrl = currentImg ? (currentImg.url || currentImg.src || (typeof currentImg === 'string' ? currentImg : '')) : '';
  const imageName = currentImg?.name || `รูปภาพที่ ${activeIdx + 1}`;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.3, 3.5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.3, 0.5));
  const handleResetZoom = () => { setScale(1); setRotation(0); };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = currentImg.name || `image-${activeIdx + 1}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartX !== null && e.changedTouches && e.changedTouches.length === 1) {
      const diffX = e.changedTouches[0].clientX - touchStartX;
      if (diffX > 50) {
        handlePrev();
      } else if (diffX < -50) {
        handleNext();
      }
      setTouchStartX(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-2 sm:p-4 animate-fadeIn select-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 text-white pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2 truncate pr-2">
          <Maximize2 className="w-4 h-4 text-orange-400 shrink-0" />
          <span className="text-sm font-semibold truncate text-slate-200">{imageName}</span>
          {imageList.length > 1 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/20 border border-orange-500/40 text-orange-300 shrink-0">
              รูปที่ {activeIdx + 1} / {imageList.length}
            </span>
          )}
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
            className="p-2 ml-1 sm:ml-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white transition shadow-md"
            title="ปิดหน้าต่าง (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Image Area with Navigation Buttons & Touch Swipe */}
      <div 
        className="flex-1 flex items-center justify-center overflow-hidden my-1 relative"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Previous Image Button (<) */}
        {imageList.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-3 sm:p-4 rounded-full bg-black/75 hover:bg-black/95 text-white border border-white/20 shadow-2xl backdrop-blur-md transition-all transform hover:scale-110 active:scale-95 group focus:outline-none"
            title="รูปก่อนหน้า (กดลูกศรซ้าย ←)"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Main Image with Zoom & Pan */}
        <div 
          className="transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-full"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`
          }}
        >
          <img
            src={imageUrl}
            alt={imageName}
            className="max-h-[72vh] sm:max-h-[76vh] max-w-[88vw] object-contain rounded-xl shadow-2xl pointer-events-auto"
            draggable={false}
          />
        </div>

        {/* Next Image Button (>) */}
        {imageList.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-3 sm:p-4 rounded-full bg-black/75 hover:bg-black/95 text-white border border-white/20 shadow-2xl backdrop-blur-md transition-all transform hover:scale-110 active:scale-95 group focus:outline-none"
            title="รูปถัดไป (กดลูกศรขวา →)"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Bottom Footer: Thumbnails Strip + Hint */}
      {imageList.length > 1 ? (
        <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-slate-800/80">
          {/* Sequential Thumbnail Strip */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto max-w-full py-1 px-2">
            {imageList.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => goToIndex(idx)}
                className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                  idx === activeIdx
                    ? 'border-orange-500 ring-2 ring-orange-400/80 scale-105 shadow-lg opacity-100'
                    : 'border-slate-700/80 opacity-50 hover:opacity-100'
                }`}
                title={img.name || `รูปที่ ${idx + 1}`}
              >
                <img 
                  src={img.url || img.src || (typeof img === 'string' ? img : '')} 
                  alt={img.name || ''} 
                  className="w-full h-full object-cover" 
                />
              </button>
            ))}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>⬅️ ➡️ ใช้ปุ่มลูกศรบนแป้นพิมพ์ หรือกดปุ่ม &lt; &gt; ด้านข้างเพื่อเลื่อนดูรูป</span>
            <span className="hidden sm:inline">• ปิด (Esc)</span>
          </div>
        </div>
      ) : (
        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <span>คลิกปุ่มซูมด้านบนเพื่อขยายดูรายละเอียด หรือคลิกพื้นที่ว่างเพื่อปิด (Esc)</span>
        </div>
      )}
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
