import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Printer, 
  QrCode, 
  MapPin, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  Layers, 
  FileText,
  Boxes,
  TrendingDown,
  LayoutGrid,
  List,
  Navigation,
  ExternalLink
} from 'lucide-react';
import { formatThaiDateTime } from '../utils/format';
import ImageGallery from './ImageGallery';

export default function InventoryCatalog({ 
  items, 
  categories, 
  locations, 
  onOpenAddModal, 
  onOpenEditModal, 
  onDeleteItem, 
  onOpenPrintModal, 
  onOpenAuditModal,
  onOpenItemLogs
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Filter items
  const filteredItems = items.filter(item => {
    if (selectedCategory && item.category !== selectedCategory) return false;
    if (selectedLocation && item.location !== selectedLocation) return false;
    if (showLowStockOnly && item.quantity > item.minStock) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(q);
      const matchId = item.id?.toLowerCase().includes(q);
      const matchNote = item.note?.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchNote) return false;
    }
    return true;
  });

  // Calculate Metrics
  const totalItemsCount = items.length;
  const totalStockUnits = items.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  const lowStockItems = items.filter(i => i.quantity <= i.minStock);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & KPI Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>คลังวัสดุและอุปกรณ์ก่อสร้าง</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-semibold">
              {items.length} รายการ
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            แสดงจำนวนคงเหลือ สถานที่จัดเก็บ พร้อมภาพถ่ายและ QR Code ประจำอุปกรณ์
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenPrintModal(null)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl transition border border-slate-300"
            title="พิมพ์สติ๊กเกอร์ QR Code ทั้งหมด"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ QR ทั้งหมด</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl shadow-md shadow-orange-600/20 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>ลงทะเบียนของใหม่</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Items */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">รายการอุปกรณ์</div>
            <div className="text-xl font-bold text-slate-900">{totalItemsCount} <span className="text-xs font-normal text-slate-400">รายการ</span></div>
          </div>
        </div>

        {/* Total Units */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">ยอดคงเหลือรวม</div>
            <div className="text-xl font-bold text-slate-900">{totalStockUnits.toLocaleString()} <span className="text-xs font-normal text-slate-400">หน่วย</span></div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div 
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`p-4 rounded-xl border shadow-sm flex items-center gap-3 cursor-pointer transition ${
            showLowStockOnly ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-500' : 'bg-white border-slate-200 hover:bg-amber-50/50'
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">ของใกล้หมด (Min Stock)</div>
            <div className="text-xl font-bold text-amber-600">{lowStockItems.length} <span className="text-xs font-normal text-slate-400">รายการ</span></div>
          </div>
        </div>

        {/* Storage Locations */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">จุดจัดเก็บ / ไซต์งาน</div>
            <div className="text-xl font-bold text-slate-900">{locations.length} <span className="text-xs font-normal text-slate-400">สถานที่</span></div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="ค้นหาชื่ออุปกรณ์, รหัสสินค้า, หรือคำอธิบาย..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3.5 py-2 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
          >
            <option value="">ทุกหมวดหมู่ ({categories.length})</option>
            {categories.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          {/* Location Filter */}
          {(() => {
            const allLocations = Array.from(new Set(['โกดังใหญ่ ( ออฟฟิศ )', ...locations, ...items.map(i => i.location).filter(Boolean)]));
            return (
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
              >
                <option value="">ทุกสถานที่จัดเก็บ ({allLocations.length})</option>
                {allLocations.map((l, i) => (
                  <option key={i} value={l}>{l}</option>
                ))}
              </select>
            );
          })()}

          {/* Low Stock Toggle */}
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`text-xs font-medium px-3 py-2 rounded-lg border transition ${
              showLowStockOnly 
                ? 'bg-amber-500 text-white border-amber-600' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {showLowStockOnly ? '✓ แสดงเฉพาะของใกล้หมด' : 'กรองของใกล้หมด'}
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow text-orange-600' : 'text-slate-500 hover:text-slate-800'}`}
            title="มุมมองการ์ดภาพใหญ่"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow text-orange-600' : 'text-slate-500 hover:text-slate-800'}`}
            title="มุมมองตาราง"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Items Display */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-1">ไม่พบรายการวัสดุอุปกรณ์</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            ลองปรับเปลี่ยนคำค้นหา หรือกดปุ่ม "ลงทะเบียนของใหม่" เพื่อเพิ่มอุปกรณ์เข้าสู่ระบบ
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold px-4 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มรายการใหม่</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW WITH LARGE PHOTOS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map(item => {
            const isLowStock = item.quantity <= item.minStock;

            return (
              <div 
                key={item.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-slate-200 overflow-hidden flex flex-col group"
              >
                {/* Image Container with Overlay Badges */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <ImageGallery
                    images={item.images || item.image}
                    name={item.name}
                    className="absolute inset-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none"></div>

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-md border border-white/20 shadow">
                      {item.id}
                    </span>
                    <span className="text-[11px] font-medium bg-orange-600/90 text-white px-2 py-0.5 rounded-md shadow">
                      {item.category}
                    </span>
                  </div>

                  {/* Low Stock Badge */}
                  {isLowStock && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded-md shadow animate-bounce">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>ใกล้หมด!</span>
                    </div>
                  )}

                  {/* Stock Quantity in corner */}
                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-slate-200/80 text-right">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">คงเหลือ</div>
                    <div className={`text-xl font-extrabold leading-none ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}>
                      {item.quantity} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                    </div>
                  </div>

                  {/* Location in bottom left */}
                  <div className="absolute bottom-3 left-3 text-white text-xs font-medium flex items-center gap-1 drop-shadow-md max-w-[180px] truncate">
                    <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug mb-1">
                      {item.name}
                    </h3>
                    
                    {/* Location & GPS Info Badge */}
                    <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                      <span className="text-slate-600 flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span>{item.location}</span>
                      </span>
                      {item.gps && (
                        <a
                          href={`https://www.google.com/maps?q=${item.gps.lat},${item.gps.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md transition"
                          title="เปิดพิกัด GPS บน Google Maps"
                        >
                          <Navigation className="w-3 h-3 text-emerald-600" />
                          <span>GPS: {item.gps.lat}, {item.gps.lng}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    {item.note && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                        {item.note}
                      </p>
                    )}
                  </div>

                  {/* Footer Meta & Actions */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>อัปเดต: {formatThaiDateTime(item.updatedAt)}</span>
                      <span>โดย: {item.updatedBy}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onOpenAuditModal(item)}
                        className="flex items-center justify-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium py-2 px-2.5 rounded-lg transition"
                      >
                        <QrCode className="w-3.5 h-3.5 text-orange-400" />
                        <span>ตรวจนับ / ปรับยอด</span>
                      </button>

                      <button
                        onClick={() => onOpenPrintModal(item)}
                        className="flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium py-2 px-2.5 rounded-lg transition border border-slate-200"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>พิมพ์ QR</span>
                      </button>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        onClick={() => onOpenItemLogs(item)}
                        className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>ดูประวัติการเบิก-คืน</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenEditModal(item)}
                          className="text-slate-400 hover:text-orange-600 p-1"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="ลบรายการ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="py-3 px-4">รูปถ่าย</th>
                  <th className="py-3 px-4">รหัส / ชื่อพัสดุ</th>
                  <th className="py-3 px-4">หมวดหมู่</th>
                  <th className="py-3 px-4 text-center">คงเหลือ</th>
                  <th className="py-3 px-4">สถานที่จัดเก็บ</th>
                  <th className="py-3 px-4">อัปเดตล่าสุด</th>
                  <th className="py-3 px-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredItems.map(item => {
                  const isLowStock = item.quantity <= item.minStock;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-4 w-16">
                        <ImageGallery
                          images={item.images || item.image}
                          name={item.name}
                          className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200"
                          compact={true}
                        />
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="font-mono text-[11px] font-bold text-slate-400">{item.id}</div>
                        <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        <span className="bg-slate-100 px-2 py-1 rounded text-[11px] font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`text-sm font-bold ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}>
                          {item.quantity} {item.unit}
                        </span>
                        {isLowStock && (
                          <div className="text-[10px] text-red-500 font-bold">ใกล้หมด!</div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span>{item.location}</span>
                        </div>
                        {item.gps && (
                          <a
                            href={`https://www.google.com/maps?q=${item.gps.lat},${item.gps.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1"
                            title="เปิดพิกัด GPS บน Google Maps"
                          >
                            <Navigation className="w-2.5 h-2.5 text-emerald-600" />
                            <span>GPS: {item.gps.lat}, {item.gps.lng}</span>
                            <ExternalLink className="w-2 h-2" />
                          </a>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                        <div>{formatThaiDateTime(item.updatedAt)}</div>
                        <div>โดย {item.updatedBy}</div>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenAuditModal(item)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                            title="สแกน/ตรวจนับ"
                          >
                            <QrCode className="w-4 h-4 text-orange-600" />
                          </button>
                          <button
                            onClick={() => onOpenPrintModal(item)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                            title="พิมพ์ QR Code"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenEditModal(item)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                            title="แก้ไข"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
