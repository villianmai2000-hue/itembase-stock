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
  Smartphone,
  Phone,
  Mail,
  ShieldAlert,
  X,
  RefreshCw,
  Check
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess, teamMembers = [], openMobileShareModal, branding = {} }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [availableMembers, setAvailableMembers] = useState(teamMembers);

  // Anti-Hack & Recovery states
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(null);

  // OTP Recovery states (เฉพาะ ยุทธการ คำกลอน)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryInfo, setRecoveryInfo] = useState(null);
  const [recoveryInfoLoading, setRecoveryInfoLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(1); // 1 = choose channel & send OTP, 2 = enter OTP & new password
  const [otpChannel, setOtpChannel] = useState('phone'); // 'phone' or 'email'
  const [otpTarget, setOtpTarget] = useState('');
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [otpReceivedCode, setOtpReceivedCode] = useState('');
  const [otpSentDisplay, setOtpSentDisplay] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  const siteTitle = branding?.siteTitle || 'ItemBase';

  // Fetch safe member list if not provided, and sync when teamMembers changes
  useEffect(() => {
    if (Array.isArray(teamMembers) && teamMembers.length > 0) {
      setAvailableMembers(teamMembers);
    } else if (availableMembers.length === 0) {
      fetch('/api/auth/members')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setAvailableMembers(data);
        })
        .catch(err => console.error('Failed to load members for login:', err));
    }
  }, [teamMembers]);

  const handleSelectQuickUser = (name) => {
    setUsername(name.trim());
    setErrorMessage('');
    setIsLocked(false);
  };

  const handleOpenRecovery = async () => {
    setRecoveryError('');
    setRecoverySuccess('');
    setOtpStep(1);
    setOtpCodeInput('');
    setOtpReceivedCode('');
    setOtpSentDisplay('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setShowRecoveryModal(true);
    setRecoveryInfoLoading(true);

    try {
      const res = await fetch('/api/auth/recovery/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'ยุทธการ คำกลอน' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถดึงข้อมูลกู้คืนบัญชีได้');
      setRecoveryInfo(data);
      // Default to locked primary phone from system
      const initialPhone = data.phone || '0643032859';
      setOtpChannel('phone');
      setOtpTarget(initialPhone);
    } catch (err) {
      setRecoveryError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลความปลอดภัย');
    } finally {
      setRecoveryInfoLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    const targetToSend = otpChannel === 'phone' 
      ? (otpTarget || recoveryInfo?.phone || '0643032859')
      : (recoveryInfo?.email || 'mai2000@gmail.com');

    if (!targetToSend || !targetToSend.trim()) {
      setRecoveryError(`ไม่พบข้อมูล${otpChannel === 'phone' ? 'เบอร์โทรศัพท์' : 'อีเมล'}ที่ผูกไว้ในระบบ`);
      return;
    }

    setRecoveryLoading(true);
    try {
      const res = await fetch('/api/auth/recovery/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'ยุทธการ คำกลอน',
          channel: otpChannel,
          target: targetToSend.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถส่งรหัส OTP ได้');

      setOtpReceivedCode(data.otpCode);
      setOtpSentDisplay(data.targetDisplay || targetToSend.trim());
      setOtpStep(2);
      setRecoverySuccess(`✅ ระบบได้ส่งรหัสยืนยัน OTP ไปยัง ${data.channel === 'phone' ? 'เบอร์' : 'อีเมล'} ${data.targetDisplay} เรียบร้อยแล้ว`);
    } catch (err) {
      setRecoveryError(err.message || 'เกิดข้อผิดพลาดในการส่งรหัส OTP');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleVerifyOtpAndReset = async (e) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (!otpCodeInput.trim()) {
      setRecoveryError('กรุณากรอกรหัส OTP 6 หลัก');
      return;
    }
    if (!newPasswordInput || newPasswordInput.trim().length < 6) {
      setRecoveryError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setRecoveryError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setRecoveryLoading(true);
    try {
      const res = await fetch('/api/auth/recovery/verify-otp-and-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'ยุทธการ คำกลอน',
          otp: otpCodeInput.trim(),
          newPassword: newPasswordInput.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'การยืนยันรหัส OTP ล้มเหลว');

      setRecoverySuccess(data.message || 'รีเซ็ตรหัสผ่านสำเร็จเรียบร้อยแล้ว!');
      setUsername('ยุทธการ คำกลอน');
      setPassword(newPasswordInput.trim());
      setIsLocked(false);
      setErrorMessage('');

      // Auto close modal after 2 seconds
      setTimeout(() => {
        setShowRecoveryModal(false);
      }, 2000);
    } catch (err) {
      setRecoveryError(err.message || 'เกิดข้อผิดพลาดในการกู้คืนบัญชี');
    } finally {
      setRecoveryLoading(false);
    }
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
        if (res.status === 423) {
          setIsLocked(true);
          setLockoutMinutes(data.remainingMinutes || 15);
        } else if (data.attemptsLeft !== undefined) {
          setAttemptsLeft(data.attemptsLeft);
        }
        throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }

      // Success
      setIsLocked(false);
      setAttemptsLeft(null);
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

              {/* Password Help & Forgot Password Link */}
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                {username === 'ยุทธการ คำกลอน' ? (
                  <span className="text-amber-400 font-medium flex items-center gap-1">
                    👑 ผู้ควบคุมระบบ
                  </span>
                ) : (
                  <span />
                )}

                {username === 'ยุทธการ คำกลอน' && (
                  <button
                    type="button"
                    onClick={handleOpenRecovery}
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition ml-auto hover:underline"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>ลืมรหัสผ่าน? (ส่งรหัส OTP กู้คืน)</span>
                  </button>
                )}
              </div>

              {/* Anti-Hack Attempts Alert */}
              {attemptsLeft !== null && attemptsLeft > 0 && (
                <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-amber-300 text-xs">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>ระบบความปลอดภัย: เหลือโอกาสลองอีก <strong className="text-white font-bold">{attemptsLeft}</strong> ครั้งก่อนระบบจะล็อกบัญชี 15 นาที</span>
                </div>
              )}

              {/* Account Lockout Banner */}
              {isLocked && (
                <div className="mt-2 p-3 bg-red-500/15 border border-red-500/40 rounded-xl space-y-2 text-red-300 text-xs">
                  <div className="flex items-center gap-2 font-bold text-red-400">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 animate-pulse" />
                    <span>⚠️ บัญชีถูกระงับชั่วคราว {lockoutMinutes} นาที (ป้องกันการแฮก)</span>
                  </div>
                  {username === 'ยุทธการ คำกลอน' ? (
                    <>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        บัญชีผู้ควบคุมระบบสามารถขอรับรหัสยืนยัน OTP ผ่านเบอร์หรืออีเมลที่ผูกไว้เพื่อตั้งรหัสผ่านใหม่และปลดล็อกได้ทันที:
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenRecovery}
                        className="w-full py-1.5 px-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-lg text-xs shadow hover:from-amber-500 hover:to-orange-500 transition flex items-center justify-center gap-1.5"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>ขอรหัส OTP ปลดล็อก & ตั้งรหัสผ่านใหม่</span>
                      </button>
                    </>
                  ) : (
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      กรุณาติดต่อผู้ควบคุมระบบสูงสุด (ยุทธการ คำกลอน) เพื่อทำการตรวจสอบและปลดล็อกบัญชี
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full mt-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-600/30 transition transform active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>กำลังตรวจสอบข้อมูล...</span>
                </>
              ) : isLocked ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>บัญชีถูกระงับชั่วคราว ({lockoutMinutes} นาที)</span>
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
                ผูกระบบกู้คืนผ่านเบอร์โทรศัพท์และอีเมล ป้องกันการแฮกตลอด 24 ชม.
              </div>
            </div>
            <div className="text-slate-500 text-center text-[10px]">
              ItemBase System • Version 2.0 • ระบบคลาวด์ความปลอดภัยสูง
            </div>
          </div>

        </div>

      </div>

      {/* ======================================================= */}
      {/* ACCOUNT RECOVERY & FORGOT PASSWORD MODAL (OTP ONLY FOR ยุทธการ คำกลอน) */}
      {/* ======================================================= */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl shadow-black/80 overflow-hidden text-white relative">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <span>กู้คืนรหัสผ่านด้วยรหัส OTP</span>
                  </h3>
                  <p className="text-xs text-amber-400/90 font-medium">👑 ผู้ควบคุมระบบสูงสุด (ยุทธการ คำกลอน)</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRecoveryModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Bar */}
            <div className="px-6 pt-4 pb-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs">
              <div className={`flex items-center gap-2 font-semibold ${otpStep === 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${otpStep === 1 ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-emerald-500 text-slate-950 font-bold'}`}>
                  {otpStep > 1 ? '✓' : '1'}
                </span>
                <span>1. เลือกช่องทางส่งรหัส OTP</span>
              </div>
              <div className="h-0.5 w-8 bg-slate-700 mx-2"></div>
              <div className={`flex items-center gap-2 font-semibold ${otpStep === 2 ? 'text-amber-400' : 'text-slate-500'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${otpStep === 2 ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                  2
                </span>
                <span>2. ยืนยัน OTP & ตั้งรหัสผ่านใหม่</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">

              {/* Status & Alerts in Modal */}
              {recoveryError && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span className="leading-relaxed">{recoveryError}</span>
                </div>
              )}

              {recoverySuccess && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span className="font-medium">{recoverySuccess}</span>
                </div>
              )}

              {/* STEP 1: Select Channel & Send OTP */}
              {otpStep === 1 && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  {/* Account Bound Info Preview */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                      <span className="text-slate-400">บัญชีที่ผูกข้อมูลความปลอดภัย:</span>
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        👑 ยุทธการ คำกลอน (TM-01)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">เบอร์หลัก: <strong className="text-white font-mono">{recoveryInfo?.phone || '0643032859'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="truncate">เบอร์สำรอง: <strong className="text-white font-mono">{recoveryInfo?.recoveryPhone || '0962033005'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300 sm:col-span-2">
                        <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">อีเมลกู้คืน: <strong className="text-white font-mono">{recoveryInfo?.email || 'mai2000@gmail.com'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Channel Selection Buttons */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      ต้องการรับรหัส OTP ทางไหน:
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpChannel('phone');
                          setOtpTarget(recoveryInfo?.phone || '0643032859');
                          setRecoveryError('');
                        }}
                        className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                          otpChannel === 'phone'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Smartphone className="w-5 h-5 text-emerald-400" />
                        <span>📱 ส่งทางเบอร์โทรศัพท์</span>
                        <span className="text-[10px] text-slate-400 font-normal">SMS รหัสยืนยัน OTP</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOtpChannel('email');
                          setOtpTarget(recoveryInfo?.email || 'mai2000@gmail.com');
                          setRecoveryError('');
                        }}
                        className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                          otpChannel === 'email'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Mail className="w-5 h-5 text-blue-400" />
                        <span>📧 ส่งทางอีเมล</span>
                        <span className="text-[10px] text-slate-400 font-normal">Email OTP Code</span>
                      </button>
                    </div>
                  </div>

                  {/* Locked Target Selection (Strictly locked to system data) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {otpChannel === 'phone' ? 'เบอร์โทรศัพท์ที่ผูกไว้ในระบบ:' : 'อีเมลที่ผูกไว้ในระบบ:'}
                        </span>
                      </span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                        🔒 ล็อคตามระบบ ไม่สามารถเปลี่ยนได้
                      </span>
                    </div>

                    {otpChannel === 'phone' ? (
                      <div className="space-y-2">
                        {/* เบอร์หลัก (ล็อคตามระบบ) */}
                        <div
                          onClick={() => {
                            const p = recoveryInfo?.phone || '0643032859';
                            setOtpTarget(p);
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                            otpTarget === (recoveryInfo?.phone || '0643032859')
                              ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              otpTarget === (recoveryInfo?.phone || '0643032859')
                                ? 'border-amber-400 bg-amber-400 text-slate-950'
                                : 'border-slate-600'
                            }`}>
                              {otpTarget === (recoveryInfo?.phone || '0643032859') && (
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                                <span>เบอร์หลัก:</span>
                                <span className="font-mono text-emerald-400 text-sm font-semibold">
                                  {recoveryInfo?.phone || '0643032859'}
                                </span>
                                <span className="text-[10px] text-amber-300/80 font-normal">(เบอร์เริ่มต้น)</span>
                              </div>
                              <div className="text-[10px] text-slate-400">เบอร์โทรศัพท์มือถือหลักของผู้ควบคุมระบบ</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            {recoveryInfo?.maskedPhone || '064-***-2859'}
                          </span>
                        </div>

                        {/* เบอร์สำรอง (ถ้ามี) */}
                        {recoveryInfo?.recoveryPhone && recoveryInfo.recoveryPhone !== '-' && (
                          <div
                            onClick={() => {
                              setOtpTarget(recoveryInfo.recoveryPhone);
                            }}
                            className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                              otpTarget === recoveryInfo.recoveryPhone
                                ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                otpTarget === recoveryInfo.recoveryPhone
                                  ? 'border-amber-400 bg-amber-400 text-slate-950'
                                  : 'border-slate-600'
                              }`}>
                                {otpTarget === recoveryInfo.recoveryPhone && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                                )}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                                  <span>เบอร์สำรอง:</span>
                                  <span className="font-mono text-teal-400 text-sm font-semibold">
                                    {recoveryInfo.recoveryPhone}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400">เบอร์สำรองสำหรับกู้คืนความปลอดภัย</div>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                              {recoveryInfo?.maskedBackupPhone || '096-***-3005'}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* อีเมล (ล็อคตามระบบ) */
                      <div className="p-3.5 rounded-xl border border-blue-500/50 bg-blue-950/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                              <span>อีเมลกู้คืน:</span>
                              <span className="font-mono text-blue-300 text-sm font-semibold">
                                {recoveryInfo?.email || 'mai2000@gmail.com'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">อีเมลทางการที่ลงทะเบียนไว้ในระบบความปลอดภัย</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                          {recoveryInfo?.maskedEmail || 'm***0@gmail.com'}
                        </span>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                      <span>ℹ️ ข้อมูลเบอร์และอีเมลถูกล็อคตามฐานข้อมูลระบบ เพื่อความปลอดภัยสูงสุดและป้องกันการแอบอ้าง</span>
                    </p>
                  </div>

                  {/* Step 1 Actions */}
                  <div className="pt-3 flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowRecoveryModal(false)}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={recoveryLoading || !otpTarget.trim()}
                      className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {recoveryLoading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>กำลังส่งรหัส OTP...</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4" />
                          <span>ส่งรหัสยืนยัน OTP</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: Verify OTP & Reset Password */}
              {otpStep === 2 && (
                <form onSubmit={handleVerifyOtpAndReset} className="space-y-4">
                  
                  {/* Sent Confirmation Box */}
                  <div className="p-3.5 bg-slate-950/80 border border-amber-500/40 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">ส่งรหัส OTP ไปยัง:</span>
                      <span className="font-bold text-amber-300 font-mono">{otpSentDisplay}</span>
                    </div>
                    {otpReceivedCode && (
                      <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-200">
                        <span>รหัส OTP สำหรับยืนยัน: <strong className="text-white font-mono text-sm tracking-widest">{otpReceivedCode}</strong></span>
                        <button
                          type="button"
                          onClick={() => setOtpCodeInput(otpReceivedCode)}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[11px] transition shadow"
                        >
                          ใส่รหัสนี้
                        </button>
                      </div>
                    )}
                  </div>

                  {/* OTP Code Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      กรอกรหัส OTP 6 หลัก:
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCodeInput}
                      onChange={(e) => setOtpCodeInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="กรอกรหัส 6 หลัก เช่น 583920"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-center text-lg font-mono tracking-widest text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  {/* New Password Inputs */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>ตั้งรหัสผ่านใหม่ (New Password)</span>
                        <span className="text-[10px] text-slate-500">อย่างน้อย 6 ตัวอักษร</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          placeholder="กรอกรหัสผ่านใหม่..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-white"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        ยืนยันรหัสผ่านใหม่อีกครั้ง (Confirm Password)
                      </label>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="กรอกรหัสผ่านใหม่อีกครั้ง..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  {/* Step 2 Actions */}
                  <div className="pt-2 flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep(1);
                        setRecoveryError('');
                        setRecoverySuccess('');
                      }}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
                    >
                      ← เปลี่ยนเบอร์/อีเมล
                    </button>
                    <button
                      type="submit"
                      disabled={recoveryLoading || !otpCodeInput.trim() || !newPasswordInput.trim()}
                      className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {recoveryLoading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>กำลังตรวจสอบ OTP...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>ยืนยันรหัส & ตั้งรหัสใหม่</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
