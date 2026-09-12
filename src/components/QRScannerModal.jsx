import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Boxes, 
  ArrowRight, 
  RotateCw, 
  Calendar, 
  User, 
  Clock,
  Search,
  Navigation,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { formatThaiDateTime } from '../utils/format';
import ImageGallery from './ImageGallery';


export default function QRScannerModal({ 
  isOpen, 
  onClose, 
  items, 
  locations, 
  currentUser, 
  onUpdateAudit, 
  onTransaction,
  preselectedItem
}) {
  const [activeMode, setActiveMode] = useState('audit');
  const [selectedItem, setSelectedItem] = useState(null);
  const [scannedCode, setScannedCode] = useState('');
  
  const [actualQty, setActualQty] = useState('');
  const [transAmount, setTransAmount] = useState(1);
  const [targetLocation, setTargetLocation] = useState('');
  const [note, setNote] = useState('');
  
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsData, setGpsData] = useState(null);
  const [gpsError, setGpsError] = useState('');

  const [scannerActive, setScannerActive] = useState(false);
  const [scanError, setScanError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // prevent double-submit
  const html5QrCodeRef = useRef(null);


  // Initialize with preselected item or reset
  useEffect(() => {
    if (preselectedItem) {
      handleSelectItem(preselectedItem);
    } else {
      setSelectedItem(null);
      setScannedCode('');
      setScanError('');
    }
  }, [preselectedItem, isOpen]);

  // Clean up scanner on unmount or close
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  if (!isOpen) return null;

  const startScanner = async () => {
    setScanError('');
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("reader");
      }
      setScannerActive(true);
      
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          handleCodeFound(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // Scanning frames, ignore continuous errors
        }
      );
    } catch (err) {
      console.warn("Camera start failed:", err);
      setScanError("ไม่สามารถเปิดกล้องได้ กรุณากดปุ่ม 'ถ่ายรูป/เลือกรูป QR' แทน หรือเลือกรายการจากช่องค้นหา");
      setScannerActive(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setScannerActive(false);
  };

  // Scan from photo file / camera capture (100% works on mobile via Wi-Fi)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScanError('');
    setIsProcessing(true);
    try {
      const html5QrCode = new Html5Qrcode("reader-hidden");
      const decodedText = await html5QrCode.scanFile(file, true);
      handleCodeFound(decodedText);
    } catch (err) {
      setScanError('ไม่พบ QR Code ในภาพที่เลือก กรุณาถ่ายใหม่อีกครั้งให้ภาพชัดเจนขึ้น');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCodeFound = (code) => {
    const trimmed = code.trim();
    setScannedCode(trimmed);
    const found = items.find(i => i.id.toLowerCase() === trimmed.toLowerCase() || i.name.toLowerCase() === trimmed.toLowerCase());
    if (found) {
      handleSelectItem(found);
      setScanError('');
    } else {
      setScanError(`อ่านรหัส "${trimmed}" ได้ แต่ไม่พบวัสดุอุปกรณ์นี้ในระบบ`);
    }
  };

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      setGpsError('อุปกรณ์นี้ไม่รองรับการดึงพิกัด GPS');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const accuracy = Math.round(position.coords.accuracy);
        setGpsData({ lat, lng, accuracy });
        setGpsLoading(false);
      },
      (error) => {
        setGpsLoading(false);
        let msg = 'ไม่สามารถระบุพิกัดได้';
        if (error.code === 1) msg = 'กรุณาอนุญาตการเข้าถึงตำแหน่งพิกัด GPS ในเบราว์เซอร์';
        else if (error.code === 2) msg = 'สัญญาณ GPS ขัดข้องหรือไม่พบตำแหน่ง';
        else if (error.code === 3) msg = 'หมดเวลาค้นหาพิกัด GPS';
        setGpsError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setActualQty(item.quantity);
    setTransAmount(1);
    setTargetLocation(item.location);
    setNote('');
    setGpsData(item.gps || null);
    setGpsError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (activeMode === 'audit') {
        await onUpdateAudit(selectedItem.id, Number(actualQty), targetLocation, note, gpsData);
      } else if (activeMode === 'in') {
        await onTransaction(selectedItem.id, 'in', Number(transAmount), null, note, gpsData);
      } else if (activeMode === 'out') {
        await onTransaction(selectedItem.id, 'out', Number(transAmount), null, note, gpsData);
      } else if (activeMode === 'move') {
        await onTransaction(selectedItem.id, 'move', 0, targetLocation, note, gpsData);
      }
      onClose();
    } catch (err) {
      // error already handled by parent's showToast
    } finally {
      setIsSubmitting(false);
    }
  };

  const now = new Date();
  const currentFormattedTime = formatThaiDateTime(now.toISOString());

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full my-6 border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Camera className="w-5 h-5 text-orange-400" />
              <span>สแกน QR Code ตรวจนับ & อัปเดตสต็อก</span>
            </h2>
            <p className="text-xs text-slate-400">
              ตรวจนับของ, เช็คยอดคงเหลือ, บันทึกวันเวลาและสถานที่จัดเก็บ
            </p>
          </div>
          <button 
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden element for file scanning */}
        <div id="reader-hidden" style={{ display: 'none' }}></div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* SCANNER CONTROLS */}
          {!selectedItem && (
            <div className="space-y-4">
              {/* Scanner Video Area */}
              <div className="bg-slate-900 rounded-xl overflow-hidden relative min-h-[220px] flex items-center justify-center text-white">
                <div id="reader" className="w-full"></div>
                {!scannerActive && (
                  <div className="text-center p-6 space-y-2">
                    <Camera className="w-12 h-12 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-400">กดปุ่มด้านล่างเพื่อเปิดกล้อง หรือถ่ายภาพ QR</p>
                  </div>
                )}
              </div>

              {scanError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

              {/* Action Buttons: Live Camera or Photo Upload */}
              <div className="grid grid-cols-2 gap-3">
                {!scannerActive ? (
                  <button
                    type="button"
                    onClick={startScanner}
                    className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold py-3 px-4 rounded-xl shadow transition"
                  >
                    <Camera className="w-4 h-4" />
                    <span>เปิดกล้องสแกนสด</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopScanner}
                    className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold py-3 px-4 rounded-xl transition"
                  >
                    <span>ปิดกล้อง</span>
                  </button>
                )}

                {/* File Upload / Snap Photo */}
                <label className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-3 px-4 rounded-xl shadow cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  <span>{isProcessing ? 'กำลังอ่านภาพ...' : 'ถ่ายรูป / เลือกภาพ QR'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Manual Selection Fallback */}
              <div className="pt-3 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>หรือค้นหา/เลือกจากรายการสินค้าโดยตรง:</span>
                </label>
                <select
                  onChange={(e) => {
                    const item = items.find(i => i.id === e.target.value);
                    if (item) handleSelectItem(item);
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500"
                  defaultValue=""
                >
                  <option value="" disabled>-- เลือกวัสดุอุปกรณ์ที่ต้องการตรวจนับ --</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      [{item.id}] {item.name} (คงเหลือ {item.quantity} {item.unit}) - {item.location}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ITEM SCANNED / SELECTED - DISPLAY & ACTION FORM */}
          {selectedItem && (
            <div className="space-y-4">
              
              {/* Item Card Banner */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center gap-3 relative">
                <ImageGallery
                  images={selectedItem.images || selectedItem.image}
                  name={selectedItem.name}
                  className="w-16 h-16 rounded-lg overflow-hidden border border-slate-300 shrink-0"
                  compact={true}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                      {selectedItem.id}
                    </span>
                    <span className="text-[11px] text-orange-600 font-medium">{selectedItem.category}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm truncate mt-0.5">{selectedItem.name}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-3 mt-1 flex-wrap">
                    <span>คงเหลือในระบบ: <b className="text-slate-800 font-bold">{selectedItem.quantity} {selectedItem.unit}</b></span>
                    <span className="truncate">ที่อยู่: <b className="text-slate-800">{selectedItem.location}</b></span>
                    {selectedItem.gps && (
                      <a
                        href={`https://www.google.com/maps?q=${selectedItem.gps.lat},${selectedItem.gps.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded font-medium hover:text-emerald-900"
                        title="เปิดพิกัด GPS ปัจจุบันของวัสดุอุปกรณ์บน Google Maps"
                      >
                        <Navigation className="w-2.5 h-2.5 text-emerald-600" />
                        <span>GPS: {selectedItem.gps.lat}, {selectedItem.gps.lng}</span>
                        <ExternalLink className="w-2 h-2" />
                      </a>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-2 right-2 text-xs text-slate-400 hover:text-orange-600 underline"
                >
                  สแกนชิ้นอื่น
                </button>
              </div>

              {/* Action Mode Tabs */}
              <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveMode('audit')}
                  className={`flex-1 py-2 rounded-md transition ${activeMode === 'audit' ? 'bg-white shadow text-orange-600 font-bold' : 'text-slate-600'}`}
                >
                  1. ตรวจนับสต็อกจริง
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('in')}
                  className={`flex-1 py-2 rounded-md transition ${activeMode === 'in' ? 'bg-white shadow text-teal-600 font-bold' : 'text-slate-600'}`}
                >
                  2. รับของเข้า
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('out')}
                  className={`flex-1 py-2 rounded-md transition ${activeMode === 'out' ? 'bg-white shadow text-rose-600 font-bold' : 'text-slate-600'}`}
                >
                  3. เบิกของออก
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('move')}
                  className={`flex-1 py-2 rounded-md transition ${activeMode === 'move' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-600'}`}
                >
                  4. ย้ายสถานที่
                </button>
              </div>

              {/* Form by Mode */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* AUDIT MODE */}
                {activeMode === 'audit' && (
                  <div className="space-y-3 bg-orange-50/40 p-3.5 rounded-xl border border-orange-200/60">
                    <div className="text-xs font-semibold text-orange-800">
                      นับสินค้าจริงที่จุดจัดเก็บ เพื่อปรับยอดให้ตรงกับหน้างาน
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          จำนวนที่นับได้จริง ({selectedItem.unit})
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={actualQty}
                          onChange={(e) => setActualQty(e.target.value)}
                          className="w-full text-base font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 text-center text-slate-900 focus:ring-2 focus:ring-orange-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          ผลต่างจากการนับ
                        </label>
                        <div className={`text-base font-bold h-10 flex items-center justify-center rounded-lg border bg-white ${
                          Number(actualQty) === selectedItem.quantity ? 'text-emerald-600 border-emerald-200' : 'text-amber-600 border-amber-200'
                        }`}>
                          {Number(actualQty) - selectedItem.quantity >= 0 ? `+${Number(actualQty) - selectedItem.quantity}` : Number(actualQty) - selectedItem.quantity} {selectedItem.unit}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-orange-500" />
                          <span>สถานที่จัดเก็บที่ตรวจนับ (อยู่ไหน สถานที่อะไร)</span>
                        </label>

                        {/* GPS Trigger Button */}
                        <button
                          type="button"
                          onClick={handleGetGps}
                          disabled={gpsLoading}
                          className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 px-2 py-0.5 rounded-lg transition active:scale-95 disabled:opacity-50"
                          title="คลิกเพื่อดึงพิกัด GPS หน้างานปัจจุบัน"
                        >
                          <Navigation className={`w-3 h-3 text-emerald-600 ${gpsLoading ? 'animate-spin' : ''}`} />
                          <span>{gpsLoading ? 'กำลังค้นหาพิกัด...' : '📍 ดึงพิกัด GPS หน้างาน'}</span>
                        </button>
                      </div>

                      <input
                        type="text"
                        list="audit-loc-list"
                        placeholder="ระบุสถานที่ เช่น โกดังใหญ่ ( ออฟฟิศ ), ไซต์งาน..."
                        value={targetLocation}
                        onChange={(e) => setTargetLocation(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 font-medium"
                        required
                      />
                      <datalist id="audit-loc-list">
                        {locations.map((loc, i) => (
                          <option key={i} value={loc} />
                        ))}
                      </datalist>

                      {/* Quick Location Pills */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {locations.map((loc, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setTargetLocation(loc)}
                            className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                              targetLocation === loc
                                ? 'bg-orange-600 text-white border-orange-600 font-bold shadow-sm'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {loc}
                          </button>
                        ))}
                      </div>

                      {/* GPS Error & Preview */}
                      {gpsError && (
                        <div className="mt-1.5 text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                          ⚠️ {gpsError}
                        </div>
                      )}
                      {gpsData && (
                        <div className="mt-1.5 p-2 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                          <div className="flex items-center gap-1.5 truncate">
                            <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-mono text-[11px] truncate">
                              พิกัด GPS: {gpsData.lat}, {gpsData.lng} (±{gpsData.accuracy}m)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <a
                              href={`https://www.google.com/maps?q=${gpsData.lat},${gpsData.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-emerald-700 underline font-bold flex items-center gap-0.5 hover:text-emerald-900"
                            >
                              <span>Google Maps</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => setGpsData(null)}
                              className="text-[10px] text-slate-400 hover:text-red-600"
                              title="ล้างพิกัด GPS"
                            >
                              ล้าง
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STOCK IN OR OUT MODE */}
                {(activeMode === 'in' || activeMode === 'out') && (
                  <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {activeMode === 'in' ? 'จำนวนที่รับเข้าสต็อก' : 'จำนวนที่เบิกจ่ายออก'} ({selectedItem.unit})
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={activeMode === 'out' ? selectedItem.quantity : 9999}
                        value={transAmount}
                        onChange={(e) => setTransAmount(Number(e.target.value))}
                        className="w-full text-base font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 text-center text-slate-900 focus:ring-2 focus:ring-orange-500"
                        required
                      />
                      <div className="text-[11px] text-slate-500 mt-1">
                        ยอดใหม่จะเป็น: <b className="text-slate-800">
                          {activeMode === 'in' ? selectedItem.quantity + Number(transAmount) : selectedItem.quantity - Number(transAmount)} {selectedItem.unit}
                        </b>
                      </div>
                    </div>
                  </div>
                )}

                {/* MOVE LOCATION MODE */}
                {activeMode === 'move' && (
                  <div className="space-y-3 bg-blue-50/50 p-3.5 rounded-xl border border-blue-200">
                    <div className="text-xs text-blue-700 font-semibold">
                      ย้ายพัสดุอุปกรณ์จากที่เดิม ({selectedItem.location}) ไปจุดจัดเก็บใหม่
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-500" />
                          <span>สถานที่จัดเก็บปลายทาง (อยู่ไหน สถานที่อะไร)</span>
                        </label>

                        {/* GPS Trigger Button */}
                        <button
                          type="button"
                          onClick={handleGetGps}
                          disabled={gpsLoading}
                          className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 px-2 py-0.5 rounded-lg transition active:scale-95 disabled:opacity-50"
                          title="คลิกเพื่อดึงพิกัด GPS จุดปลายทาง"
                        >
                          <Navigation className={`w-3 h-3 text-emerald-600 ${gpsLoading ? 'animate-spin' : ''}`} />
                          <span>{gpsLoading ? 'กำลังค้นหาพิกัด...' : '📍 ดึงพิกัด GPS หน้างาน'}</span>
                        </button>
                      </div>

                      <input
                        type="text"
                        list="move-loc-list"
                        placeholder="ระบุสถานที่ เช่น โกดังใหญ่ ( ออฟฟิศ ), ไซต์งาน..."
                        value={targetLocation}
                        onChange={(e) => setTargetLocation(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 font-medium"
                        required
                      />
                      <datalist id="move-loc-list">
                        {locations.map((loc, i) => (
                          <option key={i} value={loc} />
                        ))}
                      </datalist>

                      {/* Quick Location Pills */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {locations.map((loc, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setTargetLocation(loc)}
                            className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                              targetLocation === loc
                                ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {loc}
                          </button>
                        ))}
                      </div>

                      {/* GPS Error & Preview */}
                      {gpsError && (
                        <div className="mt-1.5 text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                          ⚠️ {gpsError}
                        </div>
                      )}
                      {gpsData && (
                        <div className="mt-1.5 p-2 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                          <div className="flex items-center gap-1.5 truncate">
                            <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-mono text-[11px] truncate">
                              พิกัด GPS ปลายทาง: {gpsData.lat}, {gpsData.lng} (±{gpsData.accuracy}m)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <a
                              href={`https://www.google.com/maps?q=${gpsData.lat},${gpsData.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-emerald-700 underline font-bold flex items-center gap-0.5 hover:text-emerald-900"
                            >
                              <span>Google Maps</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => setGpsData(null)}
                              className="text-[10px] text-slate-400 hover:text-red-600"
                              title="ล้างพิกัด GPS"
                            >
                              ล้าง
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Common Fields: Note */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หมายเหตุ / รายละเอียดเพิ่มเติม (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น สภาพดี ครบชุด, สแกนตรวจก่อนเริ่มงานกะเช้า"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Auto Timestamp & Acting User Meta info */}
                <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>วัน-เดือน-ปี เวลาบันทึก:</span>
                    </span>
                    <span className="font-semibold text-slate-800">{currentFormattedTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>ผู้ตรวจนับ/ทำรายการ:</span>
                    </span>
                    <span className="font-semibold text-orange-600">{currentUser}</span>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 text-xs font-semibold bg-orange-600 hover:bg-orange-500 disabled:bg-orange-400 text-white rounded-lg shadow-md shadow-orange-600/20 transition flex items-center gap-1.5 active:scale-95 select-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>กำลังอัพโหลด...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ยืนยันบันทึกข้อมูลเข้าสต็อก</span>
                      </>
                    )}
                  </button>
                </div>


              </form>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
