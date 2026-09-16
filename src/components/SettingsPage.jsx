import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  Layers, 
  Database, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  AlertTriangle,
  HardHat,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw
} from 'lucide-react';

export default function SettingsPage({ 
  teamMembers = [], 
  locations = [], 
  categories = [], 
  onSaveMembers, 
  onSaveLocations, 
  onSaveCategories,
  onResetData,
  onImportData,
  onSaveBranding,
  branding = {},
  currentUser,
  authUser,
  dbStatus = {}
}) {
  const isAdmin = authUser?.isAdmin || currentUser === 'ยุทธการ คำกลอน';
  const [activeSubTab, setActiveSubTab] = useState('members'); // 'members', 'locations', 'categories', 'backup', 'branding'

  // Branding state
  const [siteTitleInput, setSiteTitleInput] = useState(branding.siteTitle || 'ItemBase');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(branding.profileImage || '');
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(branding.coverImage || '');

  // Member editing state
  const [membersList, setMembersList] = useState([...teamMembers]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('1234');
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Location editing state
  const [locationsList, setLocationsList] = useState([...locations]);
  const [newLocation, setNewLocation] = useState('');

  // Category editing state
  const [categoriesList, setCategoriesList] = useState([...categories]);
  const [newCategory, setNewCategory] = useState('');

  // Keep internal state synchronized whenever parent props change (e.g. after reload or save)
  useEffect(() => {
    if (Array.isArray(teamMembers) && teamMembers.length > 0) {
      setMembersList([...teamMembers]);
    }
  }, [teamMembers]);

  useEffect(() => {
    if (Array.isArray(locations) && locations.length > 0) {
      setLocationsList([...locations]);
    }
  }, [locations]);

  useEffect(() => {
    if (Array.isArray(categories) && categories.length > 0) {
      setCategoriesList([...categories]);
    }
  }, [categories]);

  useEffect(() => {
    if (branding.siteTitle) setSiteTitleInput(branding.siteTitle);
    if (branding.profileImage) setProfilePreview(branding.profileImage);
    if (branding.coverImage) setCoverPreview(branding.coverImage);
  }, [branding]);

  // Success message
  const [saveMessage, setSaveMessage] = useState('');

  // GitHub sync state
  const [isSyncingGitHub, setIsSyncingGitHub] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  const handleManualSyncGitHub = async () => {
    setIsSyncingGitHub(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/github/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMessage({ type: 'success', text: '✅ ซิงค์ข้อมูลขึ้น GitHub สำเร็จแล้ว!' });
      } else {
        setSyncMessage({ type: 'error', text: `⚠️ ไม่สามารถซิงค์ได้: ${data.error || 'กรุณาตรวจสอบ GITHUB_TOKEN'}` });
      }
    } catch (e) {
      setSyncMessage({ type: 'error', text: `⚠️ การเชื่อมต่อล้มเหลว: ${e.message}` });
    } finally {
      setIsSyncingGitHub(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const showSaved = (msg) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // --- Members handlers ---
  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    const nextId = `TM-${(membersList.length + 1).toString().padStart(2, '0')}`;
    const updated = [
      ...membersList,
      {
        id: nextId,
        name: newMemberName.trim(),
        role: newMemberRole.trim() || 'ช่างหน้างาน',
        phone: newMemberPhone.trim() || '-',
        password: newMemberPassword.trim() || '1234',
        isAdmin: newMemberName.trim() === 'ยุทธการ คำกลอน',
        status: 'active'
      }
    ];
    setMembersList(updated);
    onSaveMembers(updated);
    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberPhone('');
    setNewMemberPassword('1234');
    showSaved('เพิ่มสมาชิกใหม่ในองค์กรเรียบร้อยแล้ว');
  };

  const handleStartEditMember = (m) => {
    setEditingMemberId(m.id);
    setEditName(m.name);
    setEditRole(m.role);
    setEditPhone(m.phone);
    setEditPassword(m.password || (m.name === 'ยุทธการ คำกลอน' ? '0962033005Maiiam2000' : '1234'));
  };

  const handleSaveEditMember = (id) => {
    const updated = membersList.map(m => {
      if (m.id === id) {
        const isSuper = m.name === 'ยุทธการ คำกลอน';
        return {
          ...m,
          name: editName.trim(),
          role: editRole.trim(),
          phone: editPhone.trim(),
          password: isSuper ? '0962033005Maiiam2000' : (editPassword.trim() || '1234')
        };
      }
      return m;
    });
    setMembersList(updated);
    onSaveMembers(updated);
    setEditingMemberId(null);
    showSaved('บันทึกการแก้ไขข้อมูลพนักงานและรหัสผ่านเรียบร้อย');
  };

  const handleDeleteMember = (id) => {
    if (membersList.length <= 1) {
      alert('ต้องมีรายชื่อสมาชิกในองค์กรอย่างน้อย 1 คน');
      return;
    }
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายชื่อพนักงานนี้ออกจากระบบ?')) {
      const updated = membersList.filter(m => m.id !== id);
      setMembersList(updated);
      onSaveMembers(updated);
      showSaved('ลบรายชื่อพนักงานเรียบร้อย');
    }
  };

  // --- Locations handlers ---
  const handleAddLocation = (e) => {
    e.preventDefault();
    if (!newLocation.trim()) return;
    if (locationsList.includes(newLocation.trim())) {
      alert('มีสถานที่นี้อยู่ในระบบแล้ว');
      return;
    }
    const updated = [...locationsList, newLocation.trim()];
    setLocationsList(updated);
    onSaveLocations(updated);
    setNewLocation('');
    showSaved('เพิ่มสถานที่จัดเก็บเรียบร้อย');
  };

  const handleDeleteLocation = (index) => {
    if (locationsList.length <= 1) {
      alert('ต้องมีสถานที่จัดเก็บอย่างน้อย 1 แห่ง');
      return;
    }
    const updated = locationsList.filter((_, i) => i !== index);
    setLocationsList(updated);
    onSaveLocations(updated);
    showSaved('ลบสถานที่จัดเก็บเรียบร้อย');
  };

  // --- Categories handlers ---
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    if (categoriesList.includes(newCategory.trim())) {
      alert('มีหมวดหมู่นี้อยู่ในระบบแล้ว');
      return;
    }
    const updated = [...categoriesList, newCategory.trim()];
    setCategoriesList(updated);
    onSaveCategories(updated);
    setNewCategory('');
    showSaved('เพิ่มหมวดหมู่เรียบร้อย');
  };

  const handleDeleteCategory = (index) => {
    if (categoriesList.length <= 1) {
      alert('ต้องมีหมวดหมู่อย่างน้อย 1 รายการ');
      return;
    }
    const updated = categoriesList.filter((_, i) => i !== index);
    setCategoriesList(updated);
    onSaveCategories(updated);
    showSaved('ลบหมวดหมู่เรียบร้อย');
  };

  // --- Backup handlers ---
  const handleExportJson = () => {
    window.location.href = '/api/export';
  };

  const handleImportJsonFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        onImportData(json);
        showSaved('นำเข้าข้อมูลสำรองสำเร็จ ระบบกำลังอัปเดต...');
      } catch (err) {
        alert('ไฟล์ข้อมูลสำรองไม่ถูกต้อง ไม่สามารถอ่าน JSON ได้');
      }
    };
    reader.readAsText(file);
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200 shadow-sm max-w-xl mx-auto my-12 space-y-4 animate-fadeIn">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-200 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">สงวนสิทธิ์การเข้าถึงการตั้งค่าระบบ ItemBase</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          ผู้ที่สามารถควบคุมระบบและเข้าถึงการตั้งค่าได้ทั้งหมดมีเพียงรายเดียว คือ{' '}
          <b className="text-orange-600 font-bold">ยุทธการ คำกลอน</b>
        </p>
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 max-w-sm mx-auto">
          ท่านกำลังเข้าสู่ระบบในชื่อ: <b className="text-slate-800">{currentUser}</b> (สิทธิ์พนักงานทั่วไป) หากต้องการแก้ไขโครงสร้างระบบ กรุณาติดต่อผู้ควบคุมระบบ
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>ตั้งค่าระบบ ItemBase และการจัดการ</span>
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-300">
                เฉพาะผู้ควบคุมระบบ ยุทธการ คำกลอน
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              แก้ไขรายชื่อสมาชิกในองค์กร, รหัสผ่านพนักงาน, สถานที่จัดเก็บ, หมวดหมู่วัสดุ และสำรองข้อมูล
            </p>
          </div>
        </div>

        {saveMessage && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('members')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
            activeSubTab === 'members'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>รายชื่อสมาชิก & รหัสผ่าน ({membersList.length} คน)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('locations')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
            activeSubTab === 'locations'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>สถานที่จัดเก็บ / ไซต์งาน ({locationsList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
            activeSubTab === 'categories'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>หมวดหมู่วัสดุอุปกรณ์ ({categoriesList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('backup')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
            activeSubTab === 'backup'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>สำรองข้อมูล & รีเซ็ต</span>
        </button>

        <button
          onClick={() => setActiveSubTab('branding')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
            activeSubTab === 'branding'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>🎨</span>
          <span>แบรนด์เว็บไซต์</span>
        </button>
      </div>

      {/* TAB CONTENT: MEMBERS */}
      {activeSubTab === 'members' && (
        <div className="bg-white p-6 rounded-b-2xl rounded-tr-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>รายชื่อพนักงานและรหัสผ่านเข้าสู่ระบบ ItemBase</span>
              </h2>
              <p className="text-xs text-slate-500">
                พนักงานต้องใช้ชื่อและรหัสผ่านตามรายการนี้เพื่อล็อคอินเข้าใช้งานระบบ
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl font-semibold border border-slate-300 transition"
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showPasswords ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่านทั้งหมด'}</span>
            </button>
          </div>

          {/* Members Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-4">รหัส</th>
                    <th className="py-2.5 px-4">ชื่อ - นามสกุล</th>
                    <th className="py-2.5 px-4">ตำแหน่ง / หน้าที่</th>
                    <th className="py-2.5 px-4">เบอร์โทรศัพท์</th>
                    <th className="py-2.5 px-4">รหัสผ่านเข้าสู่ระบบ</th>
                    <th className="py-2.5 px-4 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {membersList.map((m) => {
                    const isEditing = editingMemberId === m.id;
                    const isSystemAdmin = m.name === "ยุทธการ คำกลอน";
                    const currentPass = isSystemAdmin ? '0962033005Maiiam2000' : (m.password || '1234');

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono font-bold text-slate-400">
                          {m.id}
                        </td>

                        {/* Name */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{m.name}</span>
                              {isSystemAdmin && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold border border-amber-300">
                                  👑 ผู้ควบคุมระบบสูงสุด
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Role */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                            />
                          ) : (
                            <span className="text-slate-600">{m.role}</span>
                          )}
                        </td>

                        {/* Phone */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                            />
                          ) : (
                            <span className="text-slate-500 font-mono">{m.phone}</span>
                          )}
                        </td>

                        {/* Password */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            isSystemAdmin ? (
                              <div className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                0962033005Maiiam2000 (ล็อคสำหรับผู้ควบคุมระบบ)
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                placeholder="รหัสผ่านเข้าสู่ระบบ..."
                                className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                                required
                              />
                            )
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-medium">
                                {showPasswords ? currentPass : '••••••••'}
                              </span>
                              {isSystemAdmin && (
                                <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold">
                                  Master
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleSaveEditMember(m.id)}
                                className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500"
                                title="บันทึก"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingMemberId(null)}
                                className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                                title="ยกเลิก"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleStartEditMember(m)}
                                className="p-1 text-slate-400 hover:text-orange-600 rounded"
                                title="แก้ไขข้อมูล/เปลี่ยนรหัสผ่าน"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {!isSystemAdmin && (
                                <button
                                  onClick={() => handleDeleteMember(m.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded"
                                  title="ลบรายชื่อ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add New Member Form */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-orange-500" />
              <span>เพิ่มรายชื่อพนักงานใหม่และกำหนดรหัสผ่าน</span>
            </h3>

            <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="ชื่อ - นามสกุล *"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="ตำแหน่ง / หน้าที่"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="เบอร์โทรศัพท์"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="รหัสผ่าน (ค่าเริ่มต้น 1234)"
                  value={newMemberPassword}
                  onChange={(e) => setNewMemberPassword(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 font-mono"
                  required
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow transition flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>บันทึกสมาชิก</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB CONTENT: LOCATIONS */}
      {activeSubTab === 'locations' && (
        <div className="bg-white p-6 rounded-b-2xl rounded-tr-2xl shadow-sm border border-slate-200 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              <span>สถานที่จัดเก็บ / ไซต์งานก่อสร้าง</span>
            </h2>
            <p className="text-xs text-slate-500">
              กำหนดสถานที่จัดเก็บสำหรับเลือกในหน้าลงของใหม่, หน้าสแกนย้ายที่ และหน้าตรวจนับสต็อก
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {locationsList.map((loc, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span>{loc}</span>
                </div>
                <button
                  onClick={() => handleDeleteLocation(idx)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded"
                  title="ลบสถานที่"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Location Form */}
          <form onSubmit={handleAddLocation} className="flex gap-2 max-w-lg pt-4 border-t border-slate-200">
            <input
              type="text"
              placeholder="พิมพ์ชื่อสถานที่ใหม่ เช่น ไซต์งาน อาคาร C, ตู้เก็บอุปกรณ์ 2"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
              required
            />
            <button
              type="submit"
              className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow transition"
            >
              + เพิ่มสถานที่
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT: CATEGORIES */}
      {activeSubTab === 'categories' && (
        <div className="bg-white p-6 rounded-b-2xl rounded-tr-2xl shadow-sm border border-slate-200 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-500" />
              <span>หมวดหมู่วัสดุอุปกรณ์ก่อสร้าง</span>
            </h2>
            <p className="text-xs text-slate-500">
              จัดการหมวดหมู่สำหรับจัดกลุ่มอุปกรณ์และกรองดูสต็อก
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categoriesList.map((cat, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>{cat}</span>
                </div>
                <button
                  onClick={() => handleDeleteCategory(idx)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded"
                  title="ลบหมวดหมู่"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="flex gap-2 max-w-lg pt-4 border-t border-slate-200">
            <input
              type="text"
              placeholder="พิมพ์ชื่อหมวดหมู่ใหม่ เช่น อุปกรณ์ประปา, สีและเคมีภัณฑ์"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
              required
            />
            <button
              type="submit"
              className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow transition"
            >
              + เพิ่มหมวดหมู่
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT: BACKUP & RESTORE */}
      {activeSubTab === 'backup' && (
        <div className="bg-white p-6 rounded-b-2xl rounded-tr-2xl shadow-sm border border-slate-200 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              <span>สำรองข้อมูลและรีเซ็ตระบบ (Backup & Restore)</span>
            </h2>
            <p className="text-xs text-slate-500">
              ดาวน์โหลดข้อมูลทั้งหมดเก็บไว้ หรือนำเข้าไฟล์สำรองเพื่อย้ายเครื่องใช้งาน
            </p>
          </div>

          {/* Cloud Database Persistence Status (GitHub / MongoDB Atlas) */}
          <div className={`p-4 rounded-xl border ${
            dbStatus?.isCloud 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
              : 'bg-amber-50 border-amber-300 text-amber-900'
          } space-y-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                <span className="text-base">{dbStatus?.isCloud ? '🟢' : '⚠️'}</span>
                <span>
                  {dbStatus?.isCloud 
                    ? `ฐานข้อมูลคลาวด์ถาวร: เชื่อมต่อ ${dbStatus?.provider || 'GitHub'} สำเร็จ 100%` 
                    : 'สถานะฐานข้อมูล: จัดเก็บชั่วคราว (ยังไม่ได้เชื่อมต่อ GitHub เพื่อบันทึกถาวร)'}
                </span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                dbStatus?.isCloud ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
              }`}>
                {dbStatus?.isCloud ? `คลาวด์ถาวร (${dbStatus?.provider || 'GitHub'})` : 'โหมดชั่วคราว'}
              </span>
            </div>

            {dbStatus?.isCloud ? (
              <div className="space-y-2">
                <p className="text-xs text-emerald-700 leading-relaxed">
                  ข้อมูลสต็อก, การตรวจนับ, งานทีม และรูปภาพทั้งหมดถูกบันทึกอย่างปลอดภัยลงบน <strong>{dbStatus?.provider === 'GitHub' ? `GitHub (${dbStatus?.gitHubRepo || 'itembase-stock'} branch: ${dbStatus?.gitHubBranch || 'data'})` : 'MongoDB Atlas Cloud'}</strong> แบบถาวรเรียบร้อยแล้ว แม้เซิร์ฟเวอร์ Render.com จะปิด พักเครื่อง หรือรีสตาร์ต ข้อมูลก็จะยังคงอยู่อย่างสมบูรณ์ 100% ตลอดไป
                </p>
                {dbStatus?.gitHubLastSync && (
                  <p className="text-[11px] text-emerald-600">
                    🕒 ซิงค์กับ GitHub ล่าสุดเมื่อ: {new Date(dbStatus.gitHubLastSync).toLocaleString('th-TH')}
                  </p>
                )}
                {dbStatus?.provider === 'GitHub' && (
                  <div className="pt-1 flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleManualSyncGitHub}
                      disabled={isSyncingGitHub}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGitHub ? 'animate-spin' : ''}`} />
                      <span>{isSyncingGitHub ? 'กำลังซิงค์...' : 'กดซิงค์กับ GitHub เดี๋ยวนี้'}</span>
                    </button>
                    {syncMessage && (
                      <span className={`text-xs ${syncMessage.type === 'success' ? 'text-emerald-700 font-semibold' : 'text-red-600'}`}>
                        {syncMessage.text}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-amber-900 space-y-3 pt-1">
                <p className="leading-relaxed">
                  เนื่องจากเซิร์ฟเวอร์ Render.com จะล้างไฟล์ในเครื่องเมื่อระบบพักเครื่องหลังจากไม่มีคนเข้าใช้ 15 นาที เพื่อให้ข้อมูลที่อัปเดตออนไลน์ <strong>ไม่หายถาวร</strong> คุณสามารถใช้ <strong>GitHub เดิมของคุณเป็นฐานข้อมูลคลาวด์ถาวรได้ทันที (ไม่ต้องสมัครเว็บอื่นเพิ่ม!)</strong>:
                </p>

                {/* Option 1: GitHub (Recommended) */}
                <div className="bg-white/90 p-3.5 rounded-xl border border-amber-300 shadow-sm space-y-2.5 text-[12px]">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-xs sm:text-sm">
                    <span className="text-amber-600">🌟</span>
                    <span>วิธีใช้ GitHub เดิมเป็นฐานข้อมูลคลาวด์ถาวร (ทำเพียง 1 นาที):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-relaxed">
                    <li>
                      ไปที่ <a href="https://github.com/settings/tokens/new?scopes=repo&description=itembase-stock-cloud-db" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold underline hover:text-blue-700">คลิกที่นี่เพื่อสร้าง GitHub Token (เปิดหน้าตั้งค่าทันที)</a>
                    </li>
                    <li>
                      พิมพ์ชื่อ Note สั้นๆ เช่น <code>itembase-token</code> และเลือกติ๊กถูกที่ช่อง <strong>repo</strong> (เข้าถึงคลังโค้ดเพื่อบันทึกข้อมูล) จากนั้นเลื่อนลงล่างสุดแล้วกดปุ่มสีเขียว <strong>Generate token</strong>
                    </li>
                    <li>
                      คัดลอกรหัสโทเค็นที่ได้ (จะขึ้นต้นด้วย <code>ghp_...</code>)
                    </li>
                    <li>
                      เปิด <a href="https://dashboard.render.com" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold underline hover:text-blue-700">dashboard.render.com</a> &gt; คลิกที่เว็บ <strong>itembase-stock</strong> &gt; เมนู <strong>Environment</strong>
                    </li>
                    <li>
                      กด <strong>Add Environment Variable</strong> แล้วกรอก:
                      <div className="mt-1 ml-4 p-2.5 bg-slate-100 rounded-lg border border-slate-300 font-mono text-[11px] text-slate-800">
                        Key: <strong>GITHUB_TOKEN</strong><br/>
                        Value: <em>วางรหัส ghp_... ที่คัดลอกมา</em>
                      </div>
                    </li>
                    <li>
                      กดปุ่ม <strong>Save Changes</strong> — เสร็จเรียบร้อย! ระบบจะเชื่อมต่อ GitHub เดิมของคุณและบันทึกข้อมูลลง GitHub อัตโนมัติตลอด 24 ชม.
                    </li>
                  </ol>
                </div>

                {/* Option 2: MongoDB (Alternative) */}
                <details className="text-[11px] text-slate-600 pt-1">
                  <summary className="cursor-pointer font-semibold text-slate-700 hover:text-slate-900">
                    หรือต้องการเชื่อมต่อด้วย MongoDB Atlas แทน? (คลิกเพื่อดูวิธี)
                  </summary>
                  <div className="bg-white/70 p-3 rounded-lg border border-slate-200 space-y-1 mt-2">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>สมัครที่ <a href="https://www.mongodb.com/cloud/atlas/register" target="_blank" rel="noreferrer" className="text-blue-600 underline">mongodb.com/atlas</a> แล้วสร้าง Free M0 Cluster</li>
                      <li>คัดลอก Connection String (<code>mongodb+srv://...</code>)</li>
                      <li>ใส่ใน Render Dashboard เมนู Environment ตัวแปรชื่อ <code>MONGODB_URI</code></li>
                    </ol>
                  </div>
                </details>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-blue-600" />
                <span>ส่งออกไฟล์สำรองข้อมูล (Export JSON)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                ดาวน์โหลดข้อมูลงาน, สต็อกพัสดุ, รายชื่อพนักงาน และประวัติการทำรายการทั้งหมดเป็นไฟล์ JSON
              </p>
              <button
                onClick={handleExportJson}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow transition"
              >
                ดาวน์โหลดไฟล์สำรองข้อมูล
              </button>
            </div>

            {/* Import */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>นำเข้าไฟล์สำรองข้อมูล (Import JSON)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                เลือกไฟล์สำรองข้อมูล (.json) เพื่อกู้คืนข้อมูลหรือย้ายข้อมูลจากเครื่องอื่น
              </p>
              <label className="block w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow text-center cursor-pointer transition">
                เลือกไฟล์ JSON เพื่อนำเข้า
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJsonFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Danger Zone: Reset System */}
          <div className="pt-6 border-t border-slate-200">
            <div className="p-4 bg-red-50/60 rounded-xl border border-red-200 space-y-2">
              <div className="font-bold text-xs text-red-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>รีเซ็ตระบบเป็นค่าเริ่มต้น (Reset to Initial Seed)</span>
              </div>
              <p className="text-[11px] text-red-600">
                การดำเนินการนี้จะล้างข้อมูลงานและสต็อกที่สร้างใหม่ทั้งหมด และคืนค่าข้อมูลตัวอย่างเริ่มต้น 9 สมาชิกงานก่อสร้าง
              </p>
              <button
                onClick={() => {
                  if (confirm('คำเตือน: คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้นใช่หรือไม่?')) {
                    onResetData();
                  }
                }}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow transition"
              >
                ยืนยันรีเซ็ตข้อมูลระบบ
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: BRANDING */}
      {activeSubTab === 'branding' && (
        <div className="bg-white p-6 rounded-b-2xl rounded-tr-2xl shadow-sm border border-slate-200 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>🎨</span>
              <span>ตั้งค่าแบรนด์เว็บไซต์ ItemBase</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">เปลี่ยนชื่อเว็บไซต์, รูปโปรไฟล์ และรูปหน้าปก (เฉพาะ ยุทธการ คำกลอน)</p>
          </div>

          {/* Site title */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">ชื่อเว็บไซต์ (แสดงใน Navbar และหน้าล็อกอิน)</label>
            <input
              type="text"
              value={siteTitleInput}
              onChange={e => setSiteTitleInput(e.target.value)}
              placeholder="ItemBase"
              className="w-full max-w-sm text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Profile image */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">รูปโปรไฟล์ / โลโก้ระบบ</label>
            <div className="flex items-center gap-4">
              {profilePreview && (
                <img src={profilePreview} alt="profile" className="w-16 h-16 rounded-xl object-cover border border-slate-300 shadow-sm" />
              )}
              <label className="cursor-pointer flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition">
                <Upload className="w-4 h-4" />
                <span>อัพโหลดรูปโปรไฟล์</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files[0];
                    if (f) {
                      setProfileImageFile(f);
                      setProfilePreview(URL.createObjectURL(f));
                    }
                  }}
                />
              </label>
              {profilePreview && (
                <button
                  onClick={() => { setProfileImageFile(null); setProfilePreview(''); }}
                  className="text-xs text-red-500 hover:text-red-700"
                >ลบรูป</button>
              )}
            </div>
          </div>

          {/* Cover image */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">รูปหน้าปกเว็บไซต์ (แสดงในหน้าล็อกอิน)</label>
            <div className="flex items-center gap-4">
              {coverPreview && (
                <img src={coverPreview} alt="cover" className="w-32 h-16 rounded-xl object-cover border border-slate-300 shadow-sm" />
              )}
              <label className="cursor-pointer flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition">
                <Upload className="w-4 h-4" />
                <span>อัพโหลดรูปหน้าปก</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files[0];
                    if (f) {
                      setCoverImageFile(f);
                      setCoverPreview(URL.createObjectURL(f));
                    }
                  }}
                />
              </label>
              {coverPreview && (
                <button
                  onClick={() => { setCoverImageFile(null); setCoverPreview(''); }}
                  className="text-xs text-red-500 hover:text-red-700"
                >ลบรูป</button>
              )}
            </div>
          </div>

          {/* Save */}
          <div className="pt-2">
            <button
              onClick={() => {
                onSaveBranding({
                  siteTitle: siteTitleInput,
                  profileImageFile,
                  profileImageUrl: profileImageFile ? undefined : profilePreview,
                  coverImageFile,
                  coverImageUrl: coverImageFile ? undefined : coverPreview,
                });
                showSaved('บันทึกการตั้งค่าเว็บไซต์เรียบร้อย');
                setProfileImageFile(null);
                setCoverImageFile(null);
              }}
              className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold py-2.5 px-5 rounded-lg shadow-md shadow-orange-600/20 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              บันทึกการตั้งค่าเว็บไซต์
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
