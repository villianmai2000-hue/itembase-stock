import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  MapPin, 
  User, 
  Clock, 
  Package,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  CheckCircle2,
  Navigation,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { LOG_TYPE_MAP, formatThaiDateTime } from '../utils/format';

export default function LogsPage({ logs, items, currentUser, onDeleteLog }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');

  const isAdmin = currentUser === 'ยุทธการ คำกลอน';

  const filteredLogs = logs.filter(log => {
    if (filterType && log.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = log.itemName?.toLowerCase().includes(q);
      const matchId = log.itemId?.toLowerCase().includes(q);
      const matchUser = log.user?.toLowerCase().includes(q);
      const matchNote = log.note?.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchUser && !matchNote) return false;
    }
    return true;
  });

  const handleDelete = (log) => {
    if (!window.confirm(`ลบรายการประวัติ "${log.itemName}" ใช่หรือไม่?\nรายการนี้จะถูกลบออกถาวร`)) return;
    onDeleteLog(log.id);
  };


  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>ประวัติความเคลื่อนไหวสต็อก (Audit & Activity Logs)</span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-semibold">
              {filteredLogs.length} รายการ
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            บันทึกประวัติการเบิกของ, ส่งคืน, สแกนตรวจนับสต็อกหน้างาน พร้อมวันเดือนปี เวลา และผู้ทำรายการอย่างละเอียด
          </p>
        </div>
        {isAdmin && (
          <div className="text-xs flex items-center gap-1.5 text-orange-700 bg-orange-50 border border-orange-200 px-3 py-2 rounded-xl shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
            <span>คุณมีสิทธิ์ลบรายการ (ผู้ควบคุมระบบ)</span>
          </div>
        )}
      </div>


      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="ค้นหาชื่อพัสดุ, รหัสสินค้า, ผู้ทำรายการ หรือหมายเหตุ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3.5 py-2 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
          >
            <option value="">ทุกประเภทรายการ</option>
            <option value="issue">เบิกของตัดสต็อก (Issue)</option>
            <option value="return">ส่งคืนของเข้าสต็อก (Return)</option>
            <option value="audit">สแกนตรวจนับสต็อก (Audit Count)</option>
            <option value="in">รับของเข้า (Stock In)</option>
            <option value="out">เบิกจ่ายทั่วไป (Stock Out)</option>
            <option value="move">ย้ายสถานที่จัดเก็บ (Move)</option>
            <option value="add">ลงทะเบียนใหม่ (New Item)</option>
          </select>
        </div>

        {(searchQuery || filterType) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterType('');
            }}
            className="text-xs text-slate-500 hover:text-slate-800 underline px-2 py-1"
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            ไม่พบประวัติการทำรายการตามเงื่อนไขที่เลือก
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="py-3 px-4">วัน-เดือน-ปี / เวลา</th>
                  <th className="py-3 px-4">ประเภทรายการ</th>
                  <th className="py-3 px-4">รหัส / ชื่อวัสดุอุปกรณ์</th>
                  <th className="py-3 px-4 text-center">จำนวนที่เปลี่ยน</th>
                  <th className="py-3 px-4 text-center">ยอดคงเหลือ</th>
                  <th className="py-3 px-4">สถานที่จัดเก็บ</th>
                  <th className="py-3 px-4">ผู้ทำรายการ</th>
                  <th className="py-3 px-4">หมายเหตุ / ผูกกับงาน</th>
                  {isAdmin && <th className="py-3 px-3 text-center w-12">ลบ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredLogs.map(log => {
                  const typeInfo = LOG_TYPE_MAP[log.type] || { label: log.type, color: 'bg-slate-100 text-slate-800' };

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono">
                        {formatThaiDateTime(log.timestamp)}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-md text-[11px] font-semibold border ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>

                      {/* Item */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] font-bold text-slate-400">{log.itemId}</div>
                        <div className="font-semibold text-slate-900">{log.itemName}</div>
                      </td>

                      {/* Change Qty */}
                      <td className="py-3 px-4 text-center font-bold">
                        {log.changeQty > 0 ? (
                          <span className="text-emerald-600">+{log.changeQty}</span>
                        ) : log.changeQty < 0 ? (
                          <span className="text-orange-600">{log.changeQty}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      {/* Balance Qty */}
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {log.balanceQty}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span className="truncate max-w-[160px]">{log.location}</span>
                        </div>
                        {log.gps && (
                          <a
                            href={`https://www.google.com/maps?q=${log.gps.lat},${log.gps.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1"
                            title="เปิดพิกัด GPS บน Google Maps"
                          >
                            <Navigation className="w-2.5 h-2.5 text-emerald-600" />
                            <span>GPS: {log.gps.lat}, {log.gps.lng}</span>
                            <ExternalLink className="w-2 h-2" />
                          </a>
                        )}
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.user}</span>
                        </div>
                      </td>

                      {/* Note */}
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={log.note}>
                        {log.note || '-'}
                      </td>

                      {/* Delete (admin only) */}
                      {isAdmin && (
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleDelete(log)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="ลบรายการนี้ (ผู้ควบคุมระบบเท่านั้น)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}
      </div>

    </div>
  );
}
