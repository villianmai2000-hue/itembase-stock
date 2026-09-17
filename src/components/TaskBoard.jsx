import React, { useState } from 'react';
import { 
  Plus, 
  Clock, 
  Calendar, 
  User, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Send, 
  Edit3, 
  Trash2,
  Filter,
  Check,
  HardHat
} from 'lucide-react';
import { PRIORITY_MAP, STATUS_MAP, formatThaiDate } from '../utils/format';

export default function TaskBoard({ 
  tasks, 
  items, 
  teamMembers, 
  currentUser,
  branding = {},
  onOpenNewTaskModal, 
  onEditTask, 
  onDeleteTask, 
  onUpdateTaskStatus,
  onIssueMaterial,
  onReturnMaterial
}) {
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Return modal state
  const [returningInfo, setReturningInfo] = useState(null); // { taskId, materialIndex, mat }
  const [returnQty, setReturnQty] = useState(1);
  const [returnNote, setReturnNote] = useState('');

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (filterAssignee && (t.assignee || '').replace(/\s+/g, ' ').trim() !== filterAssignee.replace(/\s+/g, ' ').trim()) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchAssignee = t.assignee?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAssignee) return false;
    }
    return true;
  });

  const columns = [
    { id: 'todo', title: 'รอดำเนินการ', count: filteredTasks.filter(t => t.status === 'todo').length },
    { id: 'in_progress', title: 'กำลังทำ', count: filteredTasks.filter(t => t.status === 'in_progress').length },
    { id: 'review', title: 'รอตรวจสอบ', count: filteredTasks.filter(t => t.status === 'review').length },
    { id: 'done', title: 'เสร็จสมบูรณ์', count: filteredTasks.filter(t => t.status === 'done').length },
  ];

  const handleOpenReturnModal = (taskId, materialIndex, mat) => {
    setReturningInfo({ taskId, materialIndex, mat });
    setReturnQty(mat.quantity - (mat.returnedQuantity || 0));
    setReturnNote('');
  };

  const handleConfirmReturn = () => {
    if (!returningInfo) return;
    onReturnMaterial(returningInfo.taskId, returningInfo.materialIndex, returnQty, returnNote);
    setReturningInfo(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Actions with Profile & Cover Image */}
      <div className="relative overflow-hidden rounded-2xl shadow-sm border border-slate-200 bg-white">
        {branding?.coverImage ? (
          <div className="relative min-h-[140px] sm:min-h-[170px] bg-slate-900 flex items-end">
            {/* Cover Banner Image */}
            <img
              src={branding.coverImage}
              alt="Cover Banner"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Dark gradient overlay for crystal-clear readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/65 to-slate-950/30" />
            <div className="absolute inset-0 bg-black/20" />

            {/* Content over banner */}
            <div className="relative z-10 w-full p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
              <div className="flex items-center gap-3.5 sm:gap-4">
                {branding?.profileImage ? (
                  <img
                    src={branding.profileImage}
                    alt="Logo / Profile"
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-white/90 shadow-xl shrink-0 bg-white"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center border-2 border-white/90 shadow-xl shrink-0">
                    <HardHat className="w-7 h-7 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white flex flex-wrap items-center gap-2 drop-shadow-sm">
                    <span>กระดานภาพรวมงานทีม (Team Tasks)</span>
                    <span className="text-xs bg-orange-500/40 border border-orange-400/50 text-orange-100 px-2.5 py-0.5 rounded-full font-semibold backdrop-blur-sm">
                      {filteredTasks.length} งาน
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed drop-shadow-sm">
                    ติดตามงานก่อสร้าง มอบหมายช่างในทีม และเบิกจ่าย-ส่งคืนวัสดุอุปกรณ์แบบตัดสต็อกอัตโนมัติ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  onClick={onOpenNewTaskModal}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-orange-600/40 transition transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>สร้างงานใหม่</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 sm:gap-4">
              {branding?.profileImage ? (
                <img
                  src={branding.profileImage}
                  alt="Logo / Profile"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0 bg-slate-100"
                />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20 text-white shrink-0">
                  <HardHat className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <span>กระดานภาพรวมงานทีม (Team Tasks)</span>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-semibold">
                    {filteredTasks.length} งาน
                  </span>
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  ติดตามงานก่อสร้าง มอบหมายช่างในทีม และเบิกจ่าย-ส่งคืนวัสดุอุปกรณ์แบบตัดสต็อกอัตโนมัติ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenNewTaskModal}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-orange-600/20 transition transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>สร้างงานใหม่</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="ค้นหาชื่องาน, ผู้รับผิดชอบ หรือรายละเอียด..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Filter Assignee */}
        <div className="flex items-center gap-1.5 min-w-[160px]">
          <HardHat className="w-4 h-4 text-slate-400" />
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">ช่างทุกคน ({teamMembers.length} คน)</option>
            {teamMembers.map(m => (
              <option key={m.id} value={m.name}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Filter Priority */}
        <div className="min-w-[130px]">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">ทุกความเร่งด่วน</option>
            <option value="urgent">ด่วนที่สุด</option>
            <option value="high">ด่วน</option>
            <option value="normal">ปกติ</option>
            <option value="low">ไม่เร่งด่วน</option>
          </select>
        </div>

        {(filterAssignee || filterPriority || searchQuery) && (
          <button
            onClick={() => {
              setFilterAssignee('');
              setFilterPriority('');
              setSearchQuery('');
            }}
            className="text-xs text-slate-500 hover:text-slate-800 underline px-2 py-1"
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          const colStyle = STATUS_MAP[col.id];

          return (
            <div key={col.id} className="flex flex-col bg-slate-100/80 rounded-2xl p-3 sm:p-4 border border-slate-200/80 min-h-[500px]">
              
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${colStyle.badge.split(' ')[0]}`}></span>
                  <h3 className="font-bold text-slate-800 text-sm">{col.title}</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 shadow-sm border border-slate-200">
                  {col.count}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 flex-1">
                {colTasks.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400">
                    ไม่มีงานในช่องนี้
                  </div>
                ) : (
                  colTasks.map(task => {
                    const priority = PRIORITY_MAP[task.priority] || PRIORITY_MAP.normal;

                    return (
                      <div 
                        key={task.id}
                        className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-slate-200/90 relative group"
                      >
                        {/* Task Header: ID & Priority */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-mono font-bold text-slate-400">
                            {task.id}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priority.bg}`}>
                            {priority.label}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <h4 className="font-semibold text-slate-800 text-sm leading-snug mb-1">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                            {task.description}
                          </p>
                        )}

                        {/* Meta: Assignee & Due Date */}
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 mb-3">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700 truncate max-w-[150px]">
                            <User className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span className="truncate">{task.assignee}</span>
                          </div>
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{formatThaiDate(task.dueDate)}</span>
                            </div>
                          )}
                        </div>

                        {/* Attached Materials / Requisitions */}
                        {task.materials && task.materials.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 bg-slate-50/70 -mx-4 -mb-4 p-3 rounded-b-xl space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                              <span className="flex items-center gap-1">
                                <Package className="w-3.5 h-3.5 text-orange-500" />
                                <span>รายการเบิกของ ({task.materials.length})</span>
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              {task.materials.map((mat, idx) => {
                                const stockItem = items.find(i => i.id === mat.itemId);
                                const isIssued = mat.status === 'issued';
                                const isReturned = mat.status === 'returned';

                                return (
                                  <div 
                                    key={idx}
                                    className="bg-white p-2 rounded-lg border border-slate-200 text-xs flex flex-col gap-1.5"
                                  >
                                    <div className="flex items-start justify-between gap-1">
                                      <div>
                                        <div className="font-semibold text-slate-800 leading-tight">
                                          {mat.itemName}
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                          ต้องการ: <span className="font-bold text-slate-700">{mat.quantity} {mat.unit}</span>
                                          {stockItem && (
                                            <span className="ml-1 text-slate-400">
                                              (ในคลังมี {stockItem.quantity} {stockItem.unit})
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Status Badge */}
                                      {isReturned ? (
                                        <span className="shrink-0 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                          ส่งคืนแล้ว
                                        </span>
                                      ) : isIssued ? (
                                        <span className="shrink-0 text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                          เบิกตัดสต็อกแล้ว
                                        </span>
                                      ) : (
                                        <span className="shrink-0 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                          รอกดเบิก
                                        </span>
                                      )}
                                    </div>

                                    {/* Action Buttons for Materials */}
                                    <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                                      {!isIssued && !isReturned && (
                                        <button
                                          onClick={() => onIssueMaterial(task.id, idx)}
                                          className="flex items-center gap-1 text-[11px] bg-orange-600 hover:bg-orange-500 text-white font-medium px-2 py-1 rounded transition shadow-sm"
                                        >
                                          <Send className="w-3 h-3" />
                                          <span>กดเบิกของ (ตัดสต็อก)</span>
                                        </button>
                                      )}

                                      {isIssued && (
                                        <button
                                          onClick={() => handleOpenReturnModal(task.id, idx, mat)}
                                          className="flex items-center gap-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-2 py-1 rounded transition shadow-sm"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                          <span>ส่งคืนของ</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Card Hover Actions & Move Status */}
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          {/* Move Status buttons */}
                          <div className="flex items-center gap-1">
                            {col.id !== 'todo' && (
                              <button
                                title="ย้อนกลับสถานะ"
                                onClick={() => {
                                  const prev = col.id === 'done' ? 'review' : col.id === 'review' ? 'in_progress' : 'todo';
                                  onUpdateTaskStatus(task.id, prev);
                                }}
                                className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {col.id !== 'done' && (
                              <button
                                title="เลื่อนไปสถานะถัดไป"
                                onClick={() => {
                                  const next = col.id === 'todo' ? 'in_progress' : col.id === 'in_progress' ? 'review' : 'done';
                                  onUpdateTaskStatus(task.id, next);
                                }}
                                className="p-1 hover:bg-slate-100 text-orange-600 font-semibold rounded flex items-center gap-0.5 text-[11px]"
                              >
                                <span>เลื่อน</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Edit / Delete */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onEditTask(task)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                              title="แก้ไขงาน"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="ลบงาน"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Return Material Modal */}
      {returningInfo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-emerald-600" />
              <span>ส่งคืนวัสดุอุปกรณ์เข้าสต็อก</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              วัสดุ: <span className="font-bold text-slate-800">{returningInfo.mat.itemName}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  จำนวนที่ต้องการส่งคืน ({returningInfo.mat.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  max={returningInfo.mat.quantity - (returningInfo.mat.returnedQuantity || 0)}
                  value={returnQty}
                  onChange={(e) => setReturnQty(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  เบิกไป {returningInfo.mat.quantity} {returningInfo.mat.unit}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  บันทึกเพิ่มเติม (ถ้ามี)
                </label>
                <input
                  type="text"
                  placeholder="เช่น ใช้งานเสร็จเรียบร้อย สภาพสมบูรณ์"
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  onClick={() => setReturningInfo(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmReturn}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow"
                >
                  ยืนยันส่งคืนและรวมสต็อก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
