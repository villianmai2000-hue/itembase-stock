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
  Maximize2
} from 'lucide-react';
import { ImageLightboxModal, PdfViewerModal } from './FilePreviewModal';

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
    setError('');
  }, [taskToEdit, isOpen, teamMembers]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploadingFiles(true);
    try {
      const newAttachments = await Promise.all(files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            resolve({
              id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
              name: file.name,
              type: isPdf ? 'application/pdf' : (file.type || 'image/jpeg'),
              size: file.size,
              isPdf,
              url: event.target.result,
              uploadedAt: new Date().toISOString()
            });
          };
          reader.readAsDataURL(file);
        });
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (err) {
      console.error('Failed to read files:', err);
    } finally {
      setIsUploadingFiles(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('กรุณากรอกชื่องาน');
      return;
    }
    if (!assignee) {
      setError('กรุณาเลือกผู้รับผิดชอบจากรายชื่อในองค์กร');
      return;
    }

    onSave({
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

          {/* Attachments Section (Images & PDFs) */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-orange-500" />
                <span>รูปภาพและเอกสารแนบ / แบบแปลน PDF ({attachments.length})</span>
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
                  className="cursor-pointer text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-200 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingFiles ? 'กำลังประมวลผล...' : '+ เพิ่มรูปภาพ / PDF'}</span>
                </label>
              </div>
            </div>

            {attachments.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                ยังไม่มีรูปภาพหรือไฟล์แนบ (รองรับภาพทุกนามสกุล และไฟล์ PDF หลายไฟล์ พร้อมระบบกดดูภาพขยายและเปิดอ่าน PDF ได้ทันที)
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto pr-1">
                {attachments.map((file, idx) => (
                  <div 
                    key={file.id || idx} 
                    className="group relative bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow transition flex flex-col"
                  >
                    {file.isPdf ? (
                      <div 
                        onClick={() => setPreviewPdf(file)}
                        className="p-3 flex flex-col items-center justify-center flex-1 min-h-[90px] bg-red-50/40 cursor-pointer hover:bg-red-50 transition"
                      >
                        <FileText className="w-7 h-7 text-red-500 mb-1" />
                        <span className="text-[11px] font-medium text-slate-700 text-center truncate w-full px-1">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {file.size ? (file.size / 1024).toFixed(0) + ' KB' : 'เอกสาร PDF'}
                        </span>
                      </div>
                    ) : (
                      <div 
                        onClick={() => setPreviewImage(file)}
                        className="relative h-24 w-full bg-slate-100 overflow-hidden cursor-pointer"
                      >
                        <img 
                          src={file.url} 
                          alt={file.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                        </div>
                      </div>
                    )}

                    <div className="p-1.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => file.isPdf ? setPreviewPdf(file) : setPreviewImage(file)}
                        className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 px-1.5 py-0.5 rounded transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{file.isPdf ? 'เปิดดู PDF' : 'ดูรูปขยาย'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="ลบไฟล์"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
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
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg shadow-md shadow-orange-600/20 transition"
            >
              {taskToEdit ? 'บันทึกการแก้ไข' : 'สร้างงาน'}
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
