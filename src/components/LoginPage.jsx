import React, { useState, useEffect } from 'react';
import { 
  HardHat, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  Boxes,
  KeyRound,
  CheckCircle2,
  Smartphone
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess, teamMembers = [], openMobileShareModal, branding = {} }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [availableMembers, setAvailableMembers] = useState(teamMembers);

  const siteTitle = branding?.siteTitle || 'ItemBase';

  // Fetch safe member list if not provided
  useEffect(() => {
    if (availableMembers.length === 0) {
      fetch('/api/auth/members')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setAvailableMembers(data);
        })
        .catch(err => console.error('Failed to load members for login:', err));
    }
  }, []);

  const handleSelectQuickUser = (name) => {
    setUsername(name);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('กรุณาเลือกหรือระบุชื่อผู้ใช้งาน');
      return;
    }
    if (!password) {
      setErrorMessage('กรุณากรอกรหัสผ่านเข้าสู่ระบบ');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: username.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }

      // Success
      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Cover Image (if set) & Decorative Gradients */}
      {branding?.coverImage ? (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none filter blur-sm scale-105" 
          style={{ backgroundImage: `url(${branding.coverImage})` }}
        />
      ) : null}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          {branding?.profileImage ? (
            <div className="inline-block mb-3">
              <img 
                src={branding.profileImage} 
                alt="Logo" 
                className="w-16 h-16 rounded-2xl object-cover shadow-xl shadow-orange-500/25 border border-orange-400/30 mx-auto" 
              />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 shadow-xl shadow-orange-500/25 mb-3 border border-orange-400/30">
              <HardHat className="w-9 h-9 text-white" />
            </div>
          )}
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            <span>{siteTitle}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            ระบบบริหารคลังวัสดุ สแกนสต็อก และจัดการงานทีมก่อสร้าง
          </p>
        </div>


        {/* Card Form */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">เข้าสู่ระบบ (Sign In)</h2>
              <p className="text-xs text-slate-400">กรอกชื่อและรหัสผ่านเพื่อเข้าใช้งาน</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username / Name Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-400" />
                  <span>ชื่อผู้ใช้งาน / รายชื่อในระบบ</span>
                </span>
                <span className="text-[11px] text-slate-500 font-normal">เลือกหรือพิมพ์ชื่อ</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  list="registered-members-list"
                  placeholder="พิมพ์หรือเลือกรายชื่อพนักงาน..."
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-slate-500 transition"
                  required
                />
                <datalist id="registered-members-list">
                  {availableMembers.map((m) => (
                    <option key={m.id || m.name} value={m.name}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </datalist>
              </div>

              {/* Quick Select Buttons */}
              {availableMembers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {availableMembers.map((m) => {
                    const isSelected = username === m.name;
                    const isSuperAdmin = m.name === 'ยุทธการ คำกลอน';
                    return (
                      <button
                        key={m.id || m.name}
                        type="button"
                        onClick={() => handleSelectQuickUser(m.name)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                          isSelected
                            ? 'bg-orange-600 text-white border-orange-500 font-bold shadow'
                            : isSuperAdmin
                            ? 'bg-slate-800 text-orange-300 border-orange-500/40 hover:bg-slate-700 font-semibold'
                            : 'bg-slate-800/70 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {isSuperAdmin && <ShieldCheck className="w-3 h-3 text-orange-400" />}
                        <span>{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-orange-400" />
                  <span>รหัสผ่านเข้าสู่ระบบ</span>
                </span>
                {username === 'ยุทธการ คำกลอน' && (
                  <span className="text-[10px] text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 font-medium">
                    ผู้ควบคุมระบบ (Super Admin)
                  </span>
                )}
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="กรอกรหัสผ่านประจำตัว..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-slate-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-600/30 transition transform active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>กำลังตรวจสอบข้อมูล...</span>
                </>
              ) : (
                <>
                  <span>เข้าสู่ระบบ ItemBase</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Mobile Share Quick Button */}
            {openMobileShareModal && (
              <button
                type="button"
                onClick={openMobileShareModal}
                className="w-full mt-3 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-teal-400 hover:text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98"
              >
                <Smartphone className="w-4 h-4 text-teal-400" />
                <span>📱 เปิดใช้งานบนมือถือ / แท็บเล็ต (สแกน QR / ดูลิงก์)</span>
              </button>
            )}

          </form>

          {/* System Roles Notice */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-start gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-slate-200">ผู้ควบคุมระบบ:</span> มีเพียงรายเดียวคือ{' '}
                <span className="text-orange-400 font-bold">ยุทธการ คำกลอน</span>{' '}
                สามารถเข้าถึงการตั้งค่า จัดการพนักงาน และควบคุมระบบทั้งหมดได้
              </div>
            </div>
            <div className="text-slate-500 text-center text-[10px]">
              ItemBase System • Version 2.0 • ลิขสิทธิ์เฉพาะทีมงานก่อสร้าง
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
