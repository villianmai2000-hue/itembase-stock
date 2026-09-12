import React, { useState, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Image as ImageIcon, 
  MapPin, 
  Layers, 
  AlertCircle,
  QrCode,
  Check,
  Navigation,
  ExternalLink,
  Loader2
} from 'lucide-react';

export default function AddItemModal({ 
  isOpen, 
  onClose, 
  onSave, 
  itemToEdit, 
  categories, 
  locations, 
  currentUser,
  isSaving = false
}) {
  const [name, setName] = useState('');
  const [customId, setCustomId] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('ชิ้น');
  const [minStock, setMinStock] = useState(2);
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  
  // Multi-image handling (up to 8 images per item)
  const [imageFiles, setImageFiles] = useState([]);       // File[] for new uploads
  const [imagePreviews, setImagePreviews] = useState([]); // string[] – data URLs or remote URLs
  const [error, setError] = useState('');

  // GPS Coordinates handling
  const [gpsData, setGpsData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      setGpsError('เบราว์เซอร์หรืออุปกรณ์นี้ไม่รองรับการดึงพิกัด GPS');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy);
        setGpsData({ lat, lng, accuracy });
        setGpsLoading(false);

        // Auto append or set GPS tag into location
        const gpsTag = `[GPS: ${lat}, ${lng}]`;
        if (!location || location === 'โกดังใหญ่ ( ออฟฟิศ )') {
          setLocation(`ไซต์งาน ${gpsTag}`);
        } else if (!location.includes(gpsTag)) {
          setLocation(`${location.trim()} ${gpsTag}`);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          setGpsError('กรุณาอนุญาต (Allow) การเข้าถึงตำแหน่งพิกัด GPS บนเบราว์เซอร์');
        } else if (err.code === 2) {
          setGpsError('ไม่สามารถจับสัญญาณพิกัด GPS ได้');
        } else {
          setGpsError('หมดเวลาในการค้นหาพิกัด GPS กรุณาลองใหม่อีกครั้ง');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Sample quick images for construction
  const sampleImages = [
    { label: 'สว่าน/เครื่องมือ', url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=60' },
    { label: 'หมวกนิรภัย', url: 'https://images.unsplash.com/photo-1578873375969-d65274944d18?w=500&auto=format&fit=crop&q=60' },
    { label: 'เหล็ก/ลวด', url: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=500&auto=format&fit=crop&q=60' },
    { label: 'สปอร์ตไลท์', url: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=500&auto=format&fit=crop&q=60' },
    { label: 'บันไดช่าง', url: 'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=500&auto=format&fit=crop&q=60' },
    { label: 'ตลับเมตร/วัด', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60' }
  ];

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || '');
      setCustomId(itemToEdit.id || '');
      setCategory(itemToEdit.category || (categories[0] || 'หมวดเครื่องมือไฟฟ้าและอุปกรณ์มูลค่าสูง (High-Value Power Tools)'));
      setQuantity(itemToEdit.quantity !== undefined ? itemToEdit.quantity : 1);
      setUnit(itemToEdit.unit || 'ชิ้น');
      setMinStock(itemToEdit.minStock !== undefined ? itemToEdit.minStock : 2);
      setLocation(itemToEdit.location || (locations[0] || 'โกดังใหญ่ ( ออฟฟิศ )'));
      setNote(itemToEdit.note || '');
      // Support both images[] array (new) and legacy single image field
      const existing = itemToEdit.images && itemToEdit.images.length > 0
        ? itemToEdit.images
        : itemToEdit.image ? [itemToEdit.image] : [];
      setImagePreviews(existing);
      setImageFiles([]);
      setGpsData(itemToEdit.gps || null);
    } else {
      setName('');
      setCustomId('');
      setCategory(categories[0] || 'หมวดเครื่องมือไฟฟ้าและอุปกรณ์มูลค่าสูง (High-Value Power Tools)');
      setQuantity(1);
      setUnit('ชิ้น');
      setMinStock(2);
      setLocation(locations[0] || 'โกดังใหญ่ ( ออฟฟิศ )');
      setNote('');
      setImagePreviews([]);
      setImageFiles([]);
      setGpsData(null);
    }
    setGpsError('');
    setError('');
  }, [itemToEdit, isOpen, categories, locations]);

  if (!isOpen) return null;

  const MAX_IMAGES = 8;

  // Add images from file input (supports multiple selection)
  const handleImageFilesChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const remaining = MAX_IMAGES - imagePreviews.length;
    if (remaining <= 0) {
      setError(`อัพโหลดรูปได้สูงสุด ${MAX_IMAGES} รูปต่อรายการ`);
      e.target.value = '';
      return;
    }
    const toAdd = files.slice(0, remaining);
    setError('');
    // Read each file as data URL for preview
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
    setImageFiles(prev => [...prev, ...toAdd]);
    e.target.value = '';
  };

  // Add a sample preset image URL
  const handleSelectSampleImage = (url) => {
    if (imagePreviews.length >= MAX_IMAGES) {
      setError(`อัพโหลดรูปได้สูงสุด ${MAX_IMAGES} รูปต่อรายการ`);
      return;
    }
    setImagePreviews(prev => [...prev, url]);
    setError('');
  };

  // Remove image at index
  const handleRemoveImage = (idx) => {
    const preview = imagePreviews[idx];
    const isFileUpload = preview.startsWith('data:');
    if (isFileUpload) {
      // Find which File in imageFiles[] corresponds to this data: preview
      const fileIdx = imagePreviews.slice(0, idx).filter(p => p.startsWith('data:')).length;
      setImageFiles(prev => prev.filter((_, i) => i !== fileIdx));
    }
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // Submit – use JS validation only (no HTML `required` attrs) to prevent mobile browser native
  // validation popups that can silently block form submission on iOS/Android
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('กรุณาระบุชื่อวัสดุอุปกรณ์');
      return;
    }
    if (!location.trim()) {
      setError('กรุณาระบุสถานที่จัดเก็บ');
      return;
    }

    // URL-based images (sample or existing from server)
    const existingImageUrls = imagePreviews.filter(p => !p.startsWith('data:') && p.trim());

    const formData = {
      name: name.trim(),
      customId: customId.trim() || undefined,
      category,
      quantity: Number(quantity) || 0,
      unit,
      minStock: Number(minStock) || 1,
      location: location.trim(),
      gps: gpsData || undefined,
      note: note.trim(),
      imageFiles: imageFiles.length > 0 ? imageFiles : undefined,
      existingImageUrls: existingImageUrls.length > 0 ? existingImageUrls : undefined,
      user: currentUser
    };

    onSave(formData, itemToEdit ? itemToEdit.id : null);
  };


  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-6 border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              {itemToEdit ? `แก้ไขข้อมูลวัสดุอุปกรณ์ [${itemToEdit.id}]` : 'ลงทะเบียนวัสดุอุปกรณ์ใหม่พร้อมรูปถ่าย'}
            </h2>
            <p className="text-xs text-slate-400">
              ถ่ายรูปสินค้า กำหนดจำนวน และสร้าง QR Code สติ๊กเกอร์เข้าสู่ระบบ
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} noValidate className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* MULTI-PHOTO UPLOAD & CAMERA SECTION */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold text-slate-800">
                ภาพถ่ายวัสดุอุปกรณ์
              </span>
              <span className="text-xs text-slate-400">
                ({imagePreviews.length}/{MAX_IMAGES} รูป)
              </span>
            </div>

            {/* Thumbnail grid */}
            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative w-[70px] h-[70px] sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm shrink-0">
                    <img src={src} alt={`รูป ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow leading-none hover:bg-red-600"
                      title="ลบรูปนี้"
                    >
                      ✕
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 text-[9px] text-center bg-orange-600 text-white py-0.5 font-bold">รูปหลัก</span>
                    )}
                  </div>
                ))}
                {/* Add-more tile */}
                {imagePreviews.length < MAX_IMAGES && (
                  <label className="w-[70px] h-[70px] sm:w-20 sm:h-20 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition shrink-0">
                    <span className="text-xl leading-none text-slate-400">+</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">เพิ่มรูป</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageFilesChange} className="hidden" />
                  </label>
                )}
              </div>
            )}

            {/* Empty state */}
            {imagePreviews.length === 0 && (
              <div className="flex items-center gap-3 text-slate-400 py-2">
                <ImageIcon className="w-10 h-10 text-slate-200 shrink-0" />
                <span className="text-xs">ยังไม่มีรูปภาพ – กดถ่ายรูปหรือเลือกจากอัลบั้มด้านล่าง</span>
              </div>
            )}

            {/* Upload buttons */}
            {imagePreviews.length < MAX_IMAGES && (
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer shadow-sm transition active:scale-95">
                  <Camera className="w-4 h-4" />
                  <span>{imagePreviews.length > 0 ? 'ถ่ายรูปเพิ่ม' : 'ถ่ายรูปด้วยกล้อง'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handleImageFilesChange}
                    className="hidden"
                  />
                </label>
                <label className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer border border-slate-300 transition active:scale-95">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>{imagePreviews.length > 0 ? 'เลือกรูปเพิ่ม' : 'เลือกรูปจากเครื่อง'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFilesChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Preset quick images */}
            <div>
              <div className="text-[11px] text-slate-500 mb-1">หรือเลือกรูปตัวอย่างด่วน:</div>
              <div className="flex flex-wrap gap-1.5">
                {sampleImages.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSampleImage(s.url)}
                    disabled={imagePreviews.length >= MAX_IMAGES}
                    className="text-[10px] bg-white hover:bg-orange-50 hover:text-orange-600 text-slate-600 px-2 py-1 rounded border border-slate-200 transition disabled:opacity-40"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>


          {/* Item Name & Custom ID */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อวัสดุ / อุปกรณ์ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น ปูนซีเมนต์ปอร์ตแลนด์, ลวดผูกเหล็ก, สว่านกระแทก"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 focus:ring-2 focus:ring-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รหัสสินค้า (ID)
              </label>
              <input
                type="text"
                placeholder="เว้นว่างเพื่อสร้างให้อัตโนมัติ"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                disabled={!!itemToEdit}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-orange-500 disabled:bg-slate-200"
              />
            </div>
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-orange-500" />
                <span>หมวดหมู่สินค้า <span className="text-red-500">*</span></span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
              >
                {categories.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  <span>สถานที่จัดเก็บ (อยู่ไหน สถานที่อะไร) <span className="text-red-500">*</span></span>
                </label>

                {/* GPS Trigger Button */}
                <button
                  type="button"
                  onClick={handleGetGps}
                  disabled={gpsLoading}
                  className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 px-2 py-0.5 rounded-lg transition active:scale-95 disabled:opacity-50"
                  title="คลิกเพื่อดึงพิกัด GPS ปัจจุบันจากอุปกรณ์มือถือหรือคอมพิวเตอร์"
                >
                  <Navigation className={`w-3 h-3 text-emerald-600 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>{gpsLoading ? 'กำลังค้นหาพิกัด...' : '📍 ดึงพิกัด GPS หน้างาน'}</span>
                </button>
              </div>

              <input
                type="text"
                list="location-options-add"
                placeholder="ระบุสถานที่ เช่น โกดังใหญ่ ( ออฟฟิศ ), ไซต์งาน..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 focus:ring-2 focus:ring-orange-500 focus:bg-white"
              />

              <datalist id="location-options-add">
                {locations.map((l, i) => (
                  <option key={i} value={l} />
                ))}
              </datalist>

              {/* GPS Coordinates Badge & Maps Link */}
              {gpsData && (
                <div className="mt-1.5 p-2 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
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
                      className="text-[10px] text-slate-400 hover:text-red-500 font-bold ml-1"
                      title="ล้างพิกัด GPS"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {gpsError && (
                <div className="mt-1 text-[11px] text-red-600 flex items-center gap-1 bg-red-50 p-1.5 rounded border border-red-200">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{gpsError}</span>
                </div>
              )}

              {/* Quick Preset Location Pills */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {locations.map((l, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLocation(l)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                      location === l
                        ? 'bg-orange-600 text-white border-orange-600 font-bold shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quantity, Unit & Min Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                จำนวนเริ่มต้น <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
              />

            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หน่วยนับ
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
              >
                <option value="ชิ้น">ชิ้น</option>
                <option value="อัน">อัน</option>
                <option value="กล่อง">กล่อง</option>
                <option value="ม้วน">ม้วน</option>
                <option value="เมตร">เมตร</option>
                <option value="ถุง/กระสอบ">ถุง/กระสอบ</option>
                <option value="ตัว">ตัว</option>
                <option value="ชุด">ชุด</option>
                <option value="เส้น">เส้น</option>
                <option value="แผ่น">แผ่น</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                จุดแจ้งเตือนของใกล้หมด (Min Stock)
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              คำอธิบาย / รายละเอียดเพิ่มเติม
            </label>
            <textarea
              rows={2}
              placeholder="เช่น ยี่ห้อ, ขนาด, สเปก, อุปกรณ์เสริมในชุด..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* QR Code Auto-Generation Alert */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-3 text-xs text-amber-800">
            <QrCode className="w-6 h-6 text-orange-600 shrink-0" />
            <div>
              <div className="font-bold">ระบบจะสร้าง QR Code ประจำอุปกรณ์ให้อัตโนมัติ</div>
              <div className="text-[11px] text-amber-700">สามารถกดสั่งพิมพ์สติ๊กเกอร์ QR Code ไปติดที่กล่องหรืออุปกรณ์ได้ทันทีหลังบันทึก</div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 text-xs font-semibold bg-orange-600 hover:bg-orange-500 disabled:bg-orange-400 text-white rounded-lg shadow-md shadow-orange-600/20 transition flex items-center gap-1.5 active:scale-95 select-none"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังอัพโหลด...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{itemToEdit ? 'บันทึกการแก้ไข' : 'บันทึกและสร้าง QR Code'}</span>
                </>
              )}
            </button>
          </div>


        </form>

      </div>
    </div>
  );
}
