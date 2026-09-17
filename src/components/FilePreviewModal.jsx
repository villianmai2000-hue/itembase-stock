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
 * PdfViewerModal: Embedded PDF Viewer Modal with Open in New Tab, Google Docs Fallback & Download
 */
export function PdfViewerModal({ isOpen, pdf, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [isBlobLoading, setIsBlobLoading] = useState(false);
  const [viewMode, setViewMode] = useState('native'); // 'native' | 'google'

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    let createdUrl = null;
    if (isOpen && pdf) {
      setViewMode('native');
      const rawUrl = pdf.url || (typeof pdf === 'string' ? pdf : '');

      if (rawUrl && rawUrl.startsWith('data:')) {
        setIsBlobLoading(true);
        try {
          const parts = rawUrl.split(',');
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          createdUrl = URL.createObjectURL(blob);
          setBlobUrl(createdUrl);
        } catch (err) {
          console.error('Error converting data URL to blob:', err);
          setBlobUrl(rawUrl);
        } finally {
          setIsBlobLoading(false);
        }
      } else {
        setBlobUrl(rawUrl);
      }
    } else {
      setBlobUrl(null);
    }

    return () => {
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [isOpen, pdf]);

  if (!isOpen || !pdf) return null;

  const pdfName = pdf.name || 'เอกสารประกอบงาน.pdf';
  const activePdfUrl = blobUrl || pdf.url || '';

  // Check if we can construct an online Google Docs Viewer URL
  const isHttpUrl = activePdfUrl.startsWith('http://') || activePdfUrl.startsWith('https://');
  const isRelativeUrl = activePdfUrl.startsWith('/');
  const fullHttpUrl = isHttpUrl 
    ? activePdfUrl 
    : (isRelativeUrl && typeof window !== 'undefined' ? `${window.location.origin}${activePdfUrl}` : null);
  const isOnlineUrl = fullHttpUrl && !fullHttpUrl.includes('localhost') && !fullHttpUrl.includes('127.0.0.1');
  const googleViewerUrl = isOnlineUrl 
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(fullHttpUrl)}&embedded=true` 
    : null;

  const handleDownload = () => {
    if (!activePdfUrl) return;
    const a = document.createElement('a');
    a.href = activePdfUrl;
    a.download = pdfName.toLowerCase().endsWith('.pdf') ? pdfName : `${pdfName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenNewTab = () => {
    if (!activePdfUrl) return;
    window.open(activePdfUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn select-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2.5 truncate pr-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100 truncate">{pdfName}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 shrink-0">
                  PDF
                </span>
              </div>
              <p className="text-[11px] text-slate-400">เอกสารประกอบงานก่อสร้าง / แบบแปลน</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {googleViewerUrl && (
              <button
                type="button"
                onClick={() => setViewMode(prev => prev === 'native' ? 'google' : 'native')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  viewMode === 'google'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-blue-400 border-slate-700'
                }`}
                title="สลับโหมดเปิดดูผ่าน Google Docs Viewer"
              >
                <span>🌐</span>
                <span className="hidden sm:inline">Google Viewer</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-md shadow-red-600/30 transition transform active:scale-95"
              title="เปิดอ่าน PDF ในแท็บใหม่เต็มจอ"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดอ่านเต็มจอ</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition border border-slate-700/80"
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

        {/* Main PDF Display Area */}
        <div className="flex-1 w-full h-full bg-slate-950 relative flex flex-col overflow-hidden">
          {isBlobLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-8 h-8 border-3 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
              <p className="text-xs">กำลังเตรียมเปิดไฟล์ PDF...</p>
            </div>
          ) : viewMode === 'google' && googleViewerUrl ? (
            <iframe
              src={googleViewerUrl}
              title={pdfName}
              className="w-full h-full border-0 bg-white"
            />
          ) : activePdfUrl ? (
            <object
              data={`${activePdfUrl}#toolbar=1&navpanes=1`}
              type="application/pdf"
              className="w-full h-full border-0 bg-slate-900"
            >
              <embed
                src={`${activePdfUrl}#toolbar=1&navpanes=1`}
                type="application/pdf"
                className="w-full h-full"
              />
              <iframe
                src={`${activePdfUrl}#toolbar=1&navpanes=1`}
                title={pdfName}
                className="w-full h-full border-0 bg-slate-900"
              >
                {/* Fallback card if browser plugin is completely disabled or on mobile */}
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-white bg-slate-900">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 mb-3">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold mb-1 text-slate-100">{pdfName}</h4>
                  <p className="text-xs text-slate-400 max-w-md mb-5 leading-relaxed">
                    อุปกรณ์หรือเบราว์เซอร์ของคุณพร้อมเปิดไฟล์นี้ คลิกปุ่มด้านล่างเพื่อเปิดอ่าน PDF แบบเต็มจอ หรือดาวน์โหลดเก็บไว้ได้ทันที
                  </p>
                  <div className="flex items-center gap-3 flex-wrap justify-center">
                    <button
                      type="button"
                      onClick={handleOpenNewTab}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition transform active:scale-95"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>เปิดอ่าน PDF เต็มจอ</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>ดาวน์โหลดไฟล์ PDF</span>
                    </button>
                  </div>
                </div>
              </iframe>
            </object>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              ไม่พบที่อยู่ของไฟล์ PDF
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>📄 เอกสาร PDF พร้อมใช้งาน</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>💡 สามารถกดปุ่ม</span>
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="text-red-400 hover:text-red-300 font-bold underline"
            >
              "เปิดอ่านเต็มจอ"
            </button>
            <span>เพื่อดูแบบเต็มหน้าต่าง พิมพ์ หรือซูมรายละเอียดได้ทันที</span>
          </div>
        </div>

      </div>
    </div>
  );
}
