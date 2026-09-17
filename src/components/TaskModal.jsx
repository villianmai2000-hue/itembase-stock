import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Package, 
  Calendar, 
  User, 
  AlertCircle,
  Paperclip,
  Upload,
  Eye,
  FileText,
  Maximize2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ImageLightboxModal, PdfViewerModal } from './FilePreviewModal';
import { compressImageFile } from '../utils/imageCompressor';

export default function TaskModal({ 
  isOpen, 
  onClose, 
  onSave, 
  taskToEdit, 
  teamMembers, 
  items 
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('normal');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [materials, setMaterials] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewPdf, setPreviewPdf] = useState(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setStatus(taskToEdit.status || 'todo');
      const matched = teamMembers.find(m => (m.name || '').replace(/\s+/g, ' ').trim() === (taskToEdit.assignee || '').replace(/\s+/g, ' ').trim());
      setAssignee(matched ? matched.name : (taskToEdit.assignee || (teamMembers[0]?.name || '')));
      setDueDate(taskToEdit.dueDate || '');
      setMaterials(taskToEdit.materials ? JSON.parse(JSON.stringify(taskToEdit.materials)) : []);
      setAttachments(taskToEdit.attachments && Array.isArray(taskToEdit.attachments) ? JSON.parse(JSON.stringify(taskToEdit.attachments)) : []);
    } else {
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('normal');
      setAssignee(teamMembers[0]?.name || 'ยุทธการ คำกลอน');
      // default due date: 3 days from now
      const d = new Date();
      d.setDate(d.getDate() + 3);
      setDueDate(d.toISOString().split('T')[0]);
      setMaterials([]);
      setAttachments([]);
    }
    setActiveImageIdx(0);
    setIsSubmitting(false);
    setError('');
  }, [taskToEdit, isOpen, teamMembers]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploadingFiles(true);
    try {
      const newAttachments = [];
      for (const file of files) {
        const compressed = await compressImageFile(file);
        if (compressed) {
          newAttachments.push({
            id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            name: compressed.name,
            type: compressed.type,
            size: compressed.size,
            isPdf: compressed.isPdf,
            url: compressed.url,
            uploadedAt: new Date().toISOString()
          });
        }
      }
      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (err) {
      console.error('Failed to process files:', err);
      setError('เกิดข้อผิดพลาดในการโหลดไฟล์รูปภาพหรือ PDF');
    } finally {
      setIsUploadingFiles(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setActiveImageIdx(0);
  };

  if (!isOpen) return null;

  const handleAddMaterial = () => {
    if (items.length === 0) return;
    const firstItem = items[0];
    setMaterials([
      ...materials,
      {
        itemId: firstItem.id,
        itemName: firstItem.name,
        quantity: 1,
        unit: firstItem.unit,
        status: 'pending'
      }
    ]);
  };

  const handleUpdateMaterialItem = (index, selectedItemId) => {
    const selectedItem = items.find(i => i.id === selectedItemId);
    if (!selectedItem) return;
    const updated = [...materials];
    updated[index] = {
      ...updated[index],
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      unit: selectedItem.unit
    };
    setMaterials(updated);
  };

  const handleUpdateMaterialQty = (index, qty) => {
    const updated = [...materials];
    updated[index].quantity = Math.max(1, Number(qty) || 1);
    setMaterials(updated);
  };

  const handleRemoveMaterial = (index) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submission!
    if (!title.trim()) {
      setError('กรุณากรอกชื่องาน');
      return;
    }
    if (!assignee) {
      setError('กรุณาเลือกผู้รับผิดชอบจากรายชื่อในองค์กร');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSave({
        id: taskToEdit ? taskToEdit.id : undefined,
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assignee,
        dueDate,
        materials,
        attachments
      });
    } catch (err) {
      console.error('Task save error:', err);
      setError(err.message || 'บันทึกงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {taskToEdit ? `แก้ไขงาน [${taskToEdit.id}]` : 'สร้างงานใหม่ของทีม'}
            </h2>
            <p className="text-xs text-slate-400">
              กำหนดรายละเอียดงาน ผู้รับผิดชอบ และระบุวัสดุอุปกรณ์ที่ต้องใช้
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่องาน / รายการที่ต้องทำ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น เทปูนพื้นชั้น 1, ติดตั้งท่อร้อยสายไฟอาคาร B"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500 focus:bg-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รายละเอียดงาน / บันทึกเพิ่มเติม
            </label>
            <textarea
              rows={3}
              placeholder="ระบุจุดที่ทำงาน ขั้นตอน ข้อควรระวังด้านความปลอดภัย..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 focus:ring-2 focus:ring-orange-500 focus:bg-white"
            />
          </div>

          {/* Grid: Assignee & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-orange-500" />
                <span>ผู้รับผิดชอบ (สมาชิกในองค์กร) <span className="text-red-500">*</span></span>
              </label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                required
              >
                {teamMembers.map(m => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                <span>กำหนดส่งงาน (Due Date)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Grid: Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สถานะงาน
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
              >
                <option value="todo">รอดำเนินการ (To Do)</option>
                <option value="in_progress">กำลังดำเนินการ (In Progress)</option>
                <option value="review">รอตรวจสอบ (Review)</option>
                <option value="done">เสร็จสมบูรณ์ (Done)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ความเร่งด่วน (Priority)
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
              >
                <option value="normal">ปกติ</option>
                <option value="high">ด่วน</option>
                <option value="urgent">ด่วนที่สุด</option>
                <option value="low">ไม่เร่งด่วน</option>
              </select>
            </div>
          </div>

          {/* Attachments Section (Large Image Gallery & PDFs) */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-orange-500" />
                <span>ภาพผลงานและเอกสารแนบ / แบบแปลน PDF ({attachments.length})</span>
              </label>
              <div>
                <input
                  type="file"
                  id="task-file-input"
                  multiple
                  accept="image/*,application/pdf,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="task-file-input"
                  className={`cursor-pointer text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl border border-orange-200 transition ${isUploadingFiles ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingFiles ? 'กำลังบีบอัดและอัปโหลด...' : '+ เพิ่มรูปภาพ / PDF'}</span>
                </label>
              </div>
            </div>

            {attachments.length === 0 ? (
              <div className="text-center py-5 px-3 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-xs text-slate-400 space-y-1">
                <p className="font-medium text-slate-500">ยังไม่มีรูปภาพหรือเอกสารแนบ</p>
                <p className="text-[11px]">รองรับไฟล์ภาพทุกสกุล และเอกสาร PDF (มีระบบบีบอัดภาพอัตโนมัติ รวดเร็ว ไม่ค้าง)</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 1. Large Image Showcase with Slide Arrows */}
                {(() => {
                  const imageFiles = attachments.filter(a => !a.isPdf);
                  if (imageFiles.length === 0) return null;
                  const safeIdx = Math.min(activeImageIdx, Math.max(0, imageFiles.length - 1));
                  const activeImg = imageFiles[safeIdx];

                  return (
                    <div className="space-y-2">
                      <div className="relative w-full h-64 sm:h-72 bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center group select-none border border-slate-800">
                        {/* Main Featured Image */}
                        <img
                          src={activeImg.url}
                          alt={activeImg.name}
                          className="w-full h-full object-contain cursor-pointer transition-transform duration-200"
                          onClick={() => setPreviewImage(activeImg)}
                        />

                        {/* Top Controls Bar */}
                        <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between pointer-events-auto">
                          <span className="text-xs bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white font-medium border border-white/20">
                            📷 รูปที่ {safeIdx + 1} จากทั้งหมด {imageFiles.length} รูป
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewImage(activeImg)}
                              className="px-2.5 py-1 bg-black/60 hover:bg-black/80 rounded-lg text-white text-xs backdrop-blur-md border border-white/20 flex items-center gap-1 transition shadow"
                              title="ขยายดูภาพขนาดเต็ม"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">ดูภาพขยาย</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const targetIdx = attachments.findIndex(a => a.id === activeImg.id);
                                if (targetIdx !== -1) handleRemoveAttachment(targetIdx);
                              }}
                              className="p-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg text-white backdrop-blur-md transition shadow"
                              title="ลบรูปนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Left / Right Slide Navigation Buttons */}
                        {imageFiles.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIdx(prev => (prev > 0 ? prev - 1 : imageFiles.length - 1));
                              }}
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm shadow-xl transition transform active:scale-90"
                              title="รูปก่อนหน้า (กดเลื่อนเพื่อดูผลงาน)"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIdx(prev => (prev < imageFiles.length - 1 ? prev + 1 : 0));
                              }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm shadow-xl transition transform active:scale-90"
                              title="รูปถัดไป (กดเลื่อนเพื่อดูผลงาน)"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </>
                        )}

                        {/* Bottom Bar: Title & Size */}
                        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs pointer-events-none">
                          <span className="truncate max-w-[70%] font-medium drop-shadow bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                            {activeImg.name}
                          </span>
                          <span className="text-[11px] text-slate-300 drop-shadow bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                            {activeImg.size ? (activeImg.size / 1024).toFixed(0) + ' KB' : ''} • คลิกเพื่อซูม
                          </span>
                        </div>
                      </div>

                      {/* Sequential Thumbnail Strip */}
                      {imageFiles.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 px-0.5">
                          {imageFiles.map((img, idx) => (
                            <button
                              key={img.id || idx}
                              type="button"
                              onClick={() => setActiveImageIdx(idx)}
                              className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                                idx === safeIdx ? 'border-orange-500 ring-2 ring-orange-400/50 scale-105 shadow-md' : 'border-slate-200 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 2. PDF Files List */}
                {(() => {
                  const pdfFiles = attachments.filter(a => a.isPdf);
                  if (pdfFiles.length === 0) return null;

                  return (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-red-500" />
                        <span>เอกสารแบบแปลน PDF ({pdfFiles.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {pdfFiles.map((pdf) => (
                          <div key={pdf.id} className="flex items-center justify-between p-2.5 bg-red-50/60 border border-red-200 rounded-xl text-xs">
                            <div className="flex items-center gap-2 truncate pr-2">
                              <FileText className="w-5 h-5 text-red-500 shrink-0" />
                              <div className="truncate">
                                <p className="font-semibold text-slate-800 truncate">{pdf.name}</p>
                                <p className="text-[10px] text-slate-400">{pdf.size ? (pdf.size / 1024).toFixed(0) + ' KB' : 'เอกสาร PDF'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPreviewPdf(pdf)}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg text-[11px] transition shadow-xs"
                              >
                                เปิดอ่าน PDF
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const targetIdx = attachments.findIndex(a => a.id === pdf.id);
                                  if (targetIdx !== -1) handleRemoveAttachment(targetIdx);
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                                title="ลบไฟล์"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Requisition Materials Section */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-orange-500" />
                <span>วัสดุ / อุปกรณ์ที่ต้องใช้ในงานนี้ (ผูกเบิกตัดสต็อก)</span>
              </label>
              <button
                type="button"
                onClick={handleAddMaterial}
                className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มอุปกรณ์</span>
              </button>
            </div>

            {materials.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                ยังไม่มีการผูกวัสดุอุปกรณ์กับงานนี้ (คลิก "+ เพิ่มอุปกรณ์" หากต้องการให้ช่างเบิกของจากคลัง)
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {materials.map((mat, idx) => {
                  const stockItem = items.find(i => i.id === mat.itemId);
                  return (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                      {/* Item Selector */}
                      <div className="flex-1">
                        <select
                          value={mat.itemId}
                          onChange={(e) => handleUpdateMaterialItem(idx, e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-orange-500"
                        >
                          {items.map(item => (
                            <option key={item.id} value={item.id}>
                              [{item.id}] {item.name} (คงเหลือ {item.quantity} {item.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Input */}
                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          max={stockItem ? stockItem.quantity : 999}
                          value={mat.quantity}
                          onChange={(e) => handleUpdateMaterialQty(idx, e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-center font-bold focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      {/* Unit */}
                      <div className="w-12 text-slate-500 text-center text-[11px] font-medium">
                        {mat.unit}
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="ลบรายการ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg shadow-md shadow-orange-600/20 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : (
                <span>{taskToEdit ? 'บันทึกการแก้ไข' : 'สร้างงาน'}</span>
              )}
            </button>
          </div>

        </form>
      </div>

      {/* Lightbox Modal for Images */}
      <ImageLightboxModal
        isOpen={!!previewImage}
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      {/* Embedded PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={!!previewPdf}
        pdf={previewPdf}
        onClose={() => setPreviewPdf(null)}
      />
    </div>
  );
}
