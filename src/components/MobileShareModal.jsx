import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Wifi, 
  Globe, 
  Loader2,
  Camera
} from 'lucide-react';

export default function MobileShareModal({ isOpen, onClose }) {
  const [tunnelInfo, setTunnelInfo] = useState({
    publicUrl: null,
    qrCode: null,
    ready: false
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let intervalId = null;

    const fetchTunnelInfo = async () => {
      try {
        const res = await fetch('/api/tunnel-info');
        const data = await res.json();
        setTunnelInfo(data);
        if (data.ready) {
          setLoading(false);
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Failed to fetch tunnel info:', err);
      }
    };

    fetchTunnelInfo();
    // Poll until ready
    intervalId = setInterval(fetchTunnelInfo, 2000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const displayUrl = tunnelInfo.publicUrl || 'กำลังเชื่อมต่อเครือข่าย...';

  const handleCopy = async () => {
    if (!tunnelInfo.publicUrl) return;
    try {
      await navigator.clipboard.writeText(tunnelInfo.publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback
      const input = document.createElement('input');
      input.value = tunnelInfo.publicUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">เปิดใช้งานบนมือถือ / แท็บเล็ต</h3>
              <p className="text-xs text-emerald-100">ItemBase พร้อมเปิดได้ทุกอุปกรณ์ผ่านลิงก์เว็บไซต์</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            {loading && !tunnelInfo.qrCode ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <span className="text-sm font-medium">กำลังสร้างลิงก์เว็บไซต์ HTTPS และ QR Code...</span>
              </div>
            ) : (
              <>
                <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200">
                  {tunnelInfo.qrCode ? (
                    <img 
                      src={tunnelInfo.qrCode} 
                      alt="ItemBase Mobile QR Code" 
                      className="w-48 h-48 object-contain"
                    />
                  ) : (
                    <QrCode className="w-48 h-48 text-slate-400" />
                  )}
                </div>
                <div className="mt-3 text-center">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                    <Camera className="w-3.5 h-3.5" />
                    ยกกล้องมือถือ / iPad สแกนเพื่อเปิดได้ทันที
                  </span>
                </div>
              </>
            )}
          </div>

          {/* URL Box & Copy */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-teal-600" />
              ลิงก์เว็บไซต์สำหรับแชร์ให้ทีมงาน (HTTPS):
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 bg-slate-100 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 truncate select-all">
                {displayUrl}
              </div>
              <button
                onClick={handleCopy}
                disabled={!tunnelInfo.publicUrl}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
              </button>
              {tunnelInfo.publicUrl && (
                <a
                  href={tunnelInfo.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="เปิดในหน้าต่างใหม่"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Advantages list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>ความปลอดภัย HTTPS</strong> รองรับเปิดกล้องสแกน QR สดบนมือถือได้ 100%</span>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <Wifi className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span><strong>เปิดได้ทุกที่</strong> ไม่จำเป็นต้องต่อ Wi-Fi เดียวกัน ใช้ผ่านเน็ต 4G/5G ได้ทันที</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
