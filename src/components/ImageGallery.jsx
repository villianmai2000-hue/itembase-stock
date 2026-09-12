import React, { useState, useEffect, useCallback } from "react";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60";

export default function ImageGallery({ images, name = "รูปภาพ", className = "", compact = false }) {
  // Normalize: accept array or single string
  const imgList = React.useMemo(() => {
    if (Array.isArray(images) && images.length > 0) return images.filter(Boolean);
    if (typeof images === "string" && images) return [images];
    return [DEFAULT_IMAGE];
  }, [images]);

  const [lightboxIdx, setLightboxIdx] = useState(null); // null = closed
  const isOpen = lightboxIdx !== null;

  const prev = useCallback(() => {
    setLightboxIdx(i => (i - 1 + imgList.length) % imgList.length);
  }, [imgList.length]);

  const next = useCallback(() => {
    setLightboxIdx(i => (i + 1) % imgList.length);
  }, [imgList.length]);

  const close = useCallback(() => setLightboxIdx(null), []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape")     close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, prev, next, close]);

  // Swipe support (mobile)
  const [touchStart, setTouchStart] = useState(null);
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 50)  next();
    if (diff < -50) prev();
    setTouchStart(null);
  };

  const handleImgError = (e) => { e.target.src = DEFAULT_IMAGE; };

  return (
    <>
      {/* Thumbnail row / primary image */}
      <div className={`relative ${className}`}>
        {/* Main image – clickable */}
        <img
          src={imgList[0]}
          alt={name}
          onClick={() => setLightboxIdx(0)}
          onError={handleImgError}
          className="w-full h-full object-cover cursor-zoom-in"
        />

        {/* Compact Mode: tiny count badge */}
        {compact && imgList.length > 1 && (
          <span
            onClick={() => setLightboxIdx(0)}
            className="absolute -top-1 -right-1 bg-orange-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow border border-white cursor-pointer"
          >
            {imgList.length}
          </span>
        )}

        {/* Standard Mode: Multi-image badge */}
        {!compact && imgList.length > 1 && (
          <button
            type="button"
            onClick={() => setLightboxIdx(0)}
            className="absolute bottom-2 right-2 bg-black/75 hover:bg-black/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1.5 shadow transition z-10"
          >
            <span>🖼</span>
            <span>{imgList.length} รูป (กดขยาย)</span>
          </button>
        )}

        {/* Standard Mode: Thumbnail strip */}
        {!compact && imgList.length > 1 && (
          <div className="absolute bottom-2 left-2 flex gap-1 z-10">
            {imgList.slice(0, 4).map((src, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setLightboxIdx(idx)}
                className={`w-9 h-9 rounded-md border-2 overflow-hidden transition shrink-0 shadow ${
                  idx === 0 ? "border-orange-400 ring-2 ring-orange-500/40" : "border-white/80 hover:border-orange-300"
                }`}
              >
                <img src={src} alt={`thumb ${idx + 1}`} onError={handleImgError} className="w-full h-full object-cover" />
              </button>
            ))}
            {imgList.length > 4 && (
              <div 
                onClick={() => setLightboxIdx(4)}
                className="w-9 h-9 rounded-md border-2 border-white/80 bg-black/70 flex items-center justify-center text-white text-[10px] font-bold cursor-pointer hover:bg-black/90 shadow"
              >
                +{imgList.length - 4}
              </div>
            )}
          </div>
        )}
      </div>


      {/* LIGHTBOX OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/92 flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          {/* Close button */}
          <button
            onClick={close}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white text-xl flex items-center justify-center hover:bg-white/30 transition z-10"
          >
            ✕
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm font-semibold bg-black/40 px-3 py-1 rounded-full">
            {lightboxIdx + 1} / {imgList.length}
          </div>

          {/* Prev arrow */}
          {imgList.length > 1 && (
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 text-white text-xl flex items-center justify-center hover:bg-white/30 transition z-10 select-none"
            >
              ‹
            </button>
          )}

          {/* Image */}
          <img
            src={imgList[lightboxIdx]}
            alt={`${name} ${lightboxIdx + 1}`}
            onError={handleImgError}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl select-none"
            draggable={false}
          />

          {/* Next arrow */}
          {imgList.length > 1 && (
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 text-white text-xl flex items-center justify-center hover:bg-white/30 transition z-10 select-none"
            >
              ›
            </button>
          )}

          {/* Thumbnail strip at bottom */}
          {imgList.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 flex-wrap justify-center max-w-[90vw]">
              {imgList.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIdx(idx)}
                  className={`w-12 h-12 rounded-lg border-2 overflow-hidden shrink-0 transition ${
                    idx === lightboxIdx ? "border-orange-400 scale-110 shadow-lg" : "border-white/30 hover:border-white/70"
                  }`}
                >
                  <img src={src} alt={`thumb ${idx + 1}`} onError={handleImgError} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}