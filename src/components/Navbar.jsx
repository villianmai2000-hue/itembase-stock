import React, { useState } from 'react';
import { 
  CheckSquare, 
  Boxes, 
  QrCode, 
  PlusCircle, 
  History, 
  Settings, 
  UserCheck, 
  AlertTriangle,
  Menu,
  X,
  HardHat,
  LogOut,
  ShieldCheck,
  Lock,
  Smartphone
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  authUser,
  onLogout,
  lowStockCount,
  branding = {},
  openAddModal,
  openScanModal,
  openMobileShareModal,
  serverOnline = true,
  onReconnect
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = authUser?.isAdmin || currentUser === 'ยุทธการ คำกลอน';
  const siteTitle = branding?.siteTitle || 'ItemBase';
  const isCloudHost = typeof window !== 'undefined' && (window.location.hostname.includes('onrender.com') || !window.location.hostname.includes('localhost'));

  const navItems = [
    { id: 'tasks', label: 'งานของทีม (Todo)', icon: CheckSquare },
    { 
      id: 'catalog', 
      label: 'คลังวัสดุอุปกรณ์', 
      icon: Boxes, 
      badge: lowStockCount > 0 ? lowStockCount : null,
      badgeColor: 'bg-red-500'
    },
    { id: 'logs', label: 'ประวัติเบิก-คืน', icon: History },
    ...(isAdmin ? [{ 
      id: 'settings', 
      label: 'ตั้งค่าระบบ', 
      icon: Settings,
      badge: 'แอดมิน',
      badgeColor: 'bg-orange-500'
    }] : [])
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title: ItemBase / Custom siteTitle */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('tasks')}>
            {branding?.profileImage ? (
              <img 
                src={branding.profileImage} 
                alt="Logo" 
                className="w-10 h-10 rounded-xl object-cover border border-orange-400/40 shadow-md shadow-orange-500/20" 
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20 border border-orange-400/30">
                <HardHat className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <div className="font-extrabold text-lg leading-tight flex items-center gap-2">
                <span className="tracking-tight text-white">{siteTitle}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  คลัง & งานทีม
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">ระบบจัดการงานทีม • สแกน QR • เบิกตัดสต็อก</p>
            </div>
          </div>


          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full text-white ${item.badgeColor || 'bg-red-500'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Action Buttons & Current User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Server Online/Offline Indicator */}
            {serverOnline ? (
              <div 
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 border border-slate-700/80 text-emerald-400"
                title={isCloudHost ? 'เชื่อมต่อระบบออนไลน์ 24 ชม. บนคลาวด์ Render สำเร็จ' : 'เชื่อมต่อเซิร์ฟเวอร์บนเครื่องนี้สำเร็จ'}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{isCloudHost ? 'ออนไลน์ 24 ชม.' : 'เชื่อมต่อปกติ'}</span>
              </div>
            ) : (
              <button
                onClick={onReconnect}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow animate-pulse transition"
                title="เซิร์ฟเวอร์ขาดการเชื่อมต่อ คลิกเพื่อพยายามเชื่อมต่อใหม่"
              >
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span>ขาดการเชื่อมต่อ (กดเชื่อมใหม่)</span>
              </button>
            )}

            {/* Scan QR Quick Button */}
            <button
              onClick={openScanModal}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-medium px-3 py-2 rounded-lg shadow transition transform active:scale-95"
              title="เปิดกล้องสแกน QR Code"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">สแกน QR</span>
            </button>

            {/* Add Item Quick Button */}
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-medium px-3 py-2 rounded-lg shadow transition transform active:scale-95"
              title="ลงทะเบียนของใหม่"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">ลงของใหม่</span>
            </button>

            {/* Mobile Link Quick Button */}
            <button
              onClick={openMobileShareModal}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-medium px-3 py-2 rounded-lg shadow transition transform active:scale-95"
              title="เปิดบนมือถือหรือแท็บเล็ตด้วยลิงก์เว็บไซต์ / QR Code"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">ลิงก์มือถือ</span>
            </button>

            {/* User Badge & Logout Button */}
            <div className="flex items-center gap-2 border-l border-slate-700 pl-2 sm:pl-3">
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isAdmin 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {isAdmin ? <ShieldCheck className="w-4 h-4 text-amber-400" /> : <UserCheck className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="text-left max-w-[100px] sm:max-w-[140px] truncate">
                  <div className="font-semibold text-slate-100 truncate">{currentUser}</div>
                  <div className="text-[10px] text-slate-400 leading-none truncate">
                    {isAdmin ? '👑 ผู้ควบคุมระบบ' : (authUser?.role || 'พนักงานในทีม')}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="flex items-center gap-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-semibold px-2.5 py-2 rounded-xl transition active:scale-95"
                title="ออกจากระบบ ItemBase"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ออก</span>
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700 px-4 pt-2 pb-4 space-y-2">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openMobileShareModal();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-teal-300 hover:bg-slate-700 transition"
            >
              <Smartphone className="w-5 h-5" />
              <span>📱 ลิงก์เปิดบนมือถือ / แท็บเล็ต</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
            <div className="text-xs text-slate-300">
              เข้าสู่ระบบโดย: <b className="text-white">{currentUser}</b>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="text-xs text-red-400 flex items-center gap-1 font-semibold hover:underline"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
