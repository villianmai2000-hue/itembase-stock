import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TaskBoard from './components/TaskBoard';
import TaskModal from './components/TaskModal';
import InventoryCatalog from './components/InventoryCatalog';
import QRScannerModal from './components/QRScannerModal';
import AddItemModal from './components/AddItemModal';
import QRPrintModal from './components/QRPrintModal';
import LogsPage from './components/LogsPage';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import MobileShareModal from './components/MobileShareModal';
import { CheckCircle2, AlertCircle, Info, QrCode, Plus } from 'lucide-react';

export default function App() {
  // Authentication State (ItemBase User Session)
  const [authUser, setAuthUser] = useState(() => {
    try {
      const saved = localStorage.getItem('itembase_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Navigation – persist active tab across page reloads
  const [activeTab, setActiveTab] = useState(() => {
    try { return localStorage.getItem('itembase_tab') || 'tasks'; } catch { return 'tasks'; }
  });
  const switchTab = (tab) => {
    setActiveTab(tab);
    try { localStorage.setItem('itembase_tab', tab); } catch {}
  };

  // Cache helpers for instant 0ms hydration
  const getOfflineSnapshot = () => {
    try {
      const raw = localStorage.getItem('itembase_offline_snapshot');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  };
  const offlineSnapshot = getOfflineSnapshot();

  const getCachedTasks = () => {
    try {
      const raw = localStorage.getItem('itembase_tasks_cache');
      if (raw) return JSON.parse(raw) || [];
    } catch (e) {}
    return [];
  };

  const getCachedSettings = () => {
    try {
      const raw = localStorage.getItem('itembase_settings_cache');
      if (raw) return JSON.parse(raw) || {};
    } catch (e) {}
    return {};
  };

  const getCachedBranding = () => {
    try {
      const raw = localStorage.getItem('itembase_branding_cache');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  };

  const initialSettings = getCachedSettings();
  const initialBranding = getCachedBranding() || { siteTitle: 'ItemBase', profileImage: '', coverImage: '' };
  const initialTasks = getCachedTasks();
  const initialItems = (offlineSnapshot?.items && Array.isArray(offlineSnapshot.items)) ? offlineSnapshot.items : [];
  const initialLogs = (offlineSnapshot?.logs && Array.isArray(offlineSnapshot.logs)) ? offlineSnapshot.logs : [];

  // Loading states to prevent double-submit & manual refresh state
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Branding (site title, profile image, cover image)
  const [branding, setBranding] = useState(initialBranding);
  
  // Data States (Preloaded synchronously from local storage cache)
  const [tasks, setTasks] = useState(initialTasks);
  const [items, setItems] = useState(initialItems);
  const [logs, setLogs] = useState(initialLogs);
  const [teamMembers, setTeamMembers] = useState(initialSettings.team_members || []);
  const [locations, setLocations] = useState(initialSettings.locations || []);
  const [categories, setCategories] = useState(initialSettings.categories || []);
  // Only block screen if device has zero cached items and zero cached tasks
  const [loading, setLoading] = useState(() => !(initialItems.length > 0 || initialTasks.length > 0));
  const [hasLoadedOnce, setHasLoadedOnce] = useState(() => initialItems.length > 0 || initialTasks.length > 0);
  const [serverOnline, setServerOnline] = useState(true);
  const [dbStatus, setDbStatus] = useState({ isCloud: false, persistent: false, mode: 'local_file' });
  const [restoreCandidate, setRestoreCandidate] = useState(null);

  // Active User (Strictly authenticated user from login)
  const [currentUser, setCurrentUser] = useState(() => authUser ? authUser.name : 'ยุทธการ คำกลอน');

  useEffect(() => {
    if (authUser) {
      setCurrentUser(authUser.name);
    }
  }, [authUser]);

  const isAdmin = Boolean(
    authUser?.isAdmin || 
    (currentUser && currentUser.replace(/\s+/g, ' ').trim() === 'ยุทธการ คำกลอน') ||
    (authUser?.name && authUser.name.replace(/\s+/g, ' ').trim() === 'ยุทธการ คำกลอน') ||
    authUser?.role === 'admin' || 
    authUser?.id === 'TM-01'
  );

  // Save offline mirror to browser localStorage
  const saveOfflineSnapshot = (currentItems, currentLogs) => {
    try {
      if (Array.isArray(currentItems) && currentItems.length > 0) {
        localStorage.setItem('itembase_offline_snapshot', JSON.stringify({
          items: currentItems,
          logs: currentLogs || logs,
          savedAt: Date.now()
        }));
      }
    } catch (e) {}
  };

  // Sync cache changes automatically
  useEffect(() => {
    if (items.length > 0) {
      saveOfflineSnapshot(items, logs);
    }
  }, [items, logs]);

  useEffect(() => {
    if (tasks.length > 0) {
      try {
        localStorage.setItem('itembase_tasks_cache', JSON.stringify(tasks));
      } catch (e) {}
    }
  }, [tasks]);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [preselectedItemForScan, setPreselectedItemForScan] = useState(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [singleItemForPrint, setSingleItemForPrint] = useState(null);

  const [isMobileShareOpen, setIsMobileShareOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Login handler
  const handleLoginSuccess = (userSession) => {
    setAuthUser(userSession);
    setCurrentUser(userSession.name);
    localStorage.setItem('itembase_user', JSON.stringify(userSession));
    showToast(`ยินดีต้อนรับคุณ ${userSession.name} เข้าสู่ระบบ ItemBase`);
    loadData(userSession.name);
  };

  // Logout handler
  const handleLogout = () => {
    if (!confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) return;
    setAuthUser(null);
    localStorage.removeItem('itembase_user');
    try { localStorage.removeItem('itembase_tab'); } catch {}
    showToast('ออกจากระบบเรียบร้อยแล้ว');
  };

  // Fetch initial or background data with fast timeout & offline cache guarantee
  const loadData = async (activeUserName, forceShowSpinner = false) => {
    try {
      if (forceShowSpinner) {
        setLoading(true);
      }
      const reqHeaders = {};
      const uName = activeUserName || (authUser ? authUser.name : currentUser);
      if (uName) {
        reqHeaders['x-user-name'] = encodeURIComponent(uName);
      }

      const t = Date.now();
      const fetchJson = async (url, opts = {}) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s fast timeout
        try {
          const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}_t=${t}`, {
            cache: 'no-store',
            signal: controller.signal,
            ...opts,
            headers: { ...(opts.headers || {}) }
          });
          clearTimeout(timeoutId);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const text = await res.text();
          try {
            return JSON.parse(text);
          } catch (pe) {
            console.warn(`Non-JSON response from ${url}`);
            return null;
          }
        } catch (err) {
          clearTimeout(timeoutId);
          return null;
        }
      };

      const [resTasks, resItems, resLogs, resSettings, resBranding, resDbStatus] = await Promise.all([
        fetchJson('/api/tasks'),
        fetchJson('/api/items'),
        fetchJson('/api/logs'),
        fetchJson('/api/settings', { headers: reqHeaders }),
        fetchJson('/api/settings/branding'),
        fetchJson('/api/db-status')
      ]);

      if (resDbStatus) setDbStatus(resDbStatus);

      if (Array.isArray(resTasks)) {
        setTasks(resTasks);
        try { localStorage.setItem('itembase_tasks_cache', JSON.stringify(resTasks)); } catch (e) {}
      }

      if (Array.isArray(resItems) && resItems.length > 0) {
        setItems(resItems);
        setServerOnline(true);
        saveOfflineSnapshot(resItems, resLogs || logs);
      } else if (Array.isArray(resItems)) {
        setItems(resItems);
        setServerOnline(true);
      } else {
        // Fallback to offline local snapshot if server is slow or offline
        try {
          const rawSnap = localStorage.getItem('itembase_offline_snapshot');
          if (rawSnap) {
            const snap = JSON.parse(rawSnap);
            if (snap && Array.isArray(snap.items) && snap.items.length > 0) {
              setItems(snap.items);
              if (Array.isArray(snap.logs)) setLogs(snap.logs);
            }
          }
        } catch (e) {}
        if (!resItems) setServerOnline(false);
      }

      if (Array.isArray(resLogs)) setLogs(resLogs);
      
      if (resSettings && typeof resSettings === 'object') {
        if (Array.isArray(resSettings.team_members)) setTeamMembers(resSettings.team_members);
        if (Array.isArray(resSettings.locations)) setLocations(resSettings.locations);
        if (Array.isArray(resSettings.categories)) setCategories(resSettings.categories);
        try { localStorage.setItem('itembase_settings_cache', JSON.stringify(resSettings)); } catch (e) {}
      }
      if (resBranding && typeof resBranding === 'object') {
        setBranding(prev => ({ ...prev, ...resBranding }));
        try { localStorage.setItem('itembase_branding_cache', JSON.stringify(resBranding)); } catch (e) {}
        if (resBranding.siteTitle) {
          document.title = `${resBranding.siteTitle} - ระบบคลังและจัดการงาน`;
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      // Ensure offline data is displayed on error
      try {
        const rawSnap = localStorage.getItem('itembase_offline_snapshot');
        if (rawSnap) {
          const snap = JSON.parse(rawSnap);
          if (snap && Array.isArray(snap.items)) setItems(snap.items);
        }
      } catch (e) {}
      setServerOnline(false);
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
      setIsRefreshing(false);
    }
  };

  // Manual one-click refresh button handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData(undefined, false);
      showToast('✅ รีเฟรชข้อมูลล่าสุดเรียบร้อยแล้ว');
    } catch (e) {
      showToast('⚠️ เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ แสดงข้อมูลล่าสุดในเครื่อง', 'warning');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRestoreFromSnapshot = async () => {
    if (!restoreCandidate || !restoreCandidate.items) return;
    try {
      showToast('กำลังกู้คืนข้อมูลล่าสุดขึ้นเซิร์ฟเวอร์...');
      const res = await fetch('/api/items/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: restoreCandidate.items,
          logs: restoreCandidate.logs || []
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'กู้คืนไม่สำเร็จ');
      showToast(result.message || 'กู้คืนข้อมูลสำเร็จ!');
      setRestoreCandidate(null);
      await loadData();
    } catch (err) {
      alert(`⚠️ ${err.message}`);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      fetch(`/api/settings/branding?_t=${Date.now()}`, { cache: 'no-store' })
        .then(r => setServerOnline(r.ok))
        .catch(() => setServerOnline(false));
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  // ------------------------------------
  // TASK ACTIONS (Todo & Kanban)
  // ------------------------------------

  const handleSaveTask = async (taskData) => {
    try {
      const isEdit = !!taskData.id;
      const url = isEdit ? `/api/tasks/${taskData.id}` : '/api/tasks';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskData, user: currentUser })
      });

      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(text.startsWith('<') ? 'เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' : text);
      }
      if (!res.ok) throw new Error(result.error || 'บันทึกงานไม่สำเร็จ');

      setIsTaskModalOpen(false);
      setTaskToEdit(null);
      showToast(isEdit ? 'แก้ไขข้อมูลงานเรียบร้อย' : 'สร้างงานใหม่ของทีมสำเร็จ');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('คุณต้องการลบงานนี้ใช่หรือไม่?')) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'ลบงานไม่สำเร็จ');
      showToast('ลบงานเรียบร้อย');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('อัปเดตสถานะงานไม่สำเร็จ');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Issue material & deduct stock
  const handleIssueMaterial = async (taskId, materialIndex) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/issue-materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialIndex, user: currentUser })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'เบิกของไม่สำเร็จ');

      showToast(`เบิกของสำเร็จ! ตัดสต็อก ${result.item.name} เรียบร้อยแล้ว`);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Return material & restore stock
  const handleReturnMaterial = async (taskId, materialIndex, returnQty, note) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/return-materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialIndex, returnQty, user: currentUser, note })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'ส่งคืนของไม่สำเร็จ');

      showToast(`ส่งคืนของสำเร็จ! ยอดคงเหลือเพิ่มกลับเข้าคลังเรียบร้อย`);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ------------------------------------
  // ITEM ACTIONS (วัสดุอุปกรณ์ & สต็อก)
  // ------------------------------------

  // Compress an image File to max ~900KB before upload (prevents Vercel 413 error)
  const compressImage = (file, maxSizeKB = 900) => new Promise((resolve) => {
    if (file.size <= maxSizeKB * 1024) { resolve(file); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 1920;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        let quality = 0.85;
        const tryCompress = () => {
          canvas.toBlob((blob) => {
            if (!blob) { resolve(file); return; }
            if (blob.size <= maxSizeKB * 1024 || quality <= 0.3) {
              resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
            } else {
              quality -= 0.1;
              tryCompress();
            }
          }, 'image/jpeg', quality);
        };
        tryCompress();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  const handleSaveItem = async (formData, itemId = null) => {
    if (isSavingItem) return; // prevent double-submit
    setIsSavingItem(true);
    try {
      const isEdit = !!itemId;
      const url = isEdit ? `/api/items/${itemId}` : '/api/items';
      const method = isEdit ? 'PUT' : 'POST';

      const hasFiles = formData.imageFiles && formData.imageFiles.length > 0;

      let bodyData;
      let headers = {};

      if (hasFiles) {
        const data = new FormData();
        const skip = new Set(['imageFiles', 'existingImageUrls', 'gps', 'imageFile', 'imageUrl']);
        Object.keys(formData).forEach(key => {
          if (!skip.has(key) && formData[key] !== undefined) {
            data.append(key, formData[key]);
          }
        });
        if (formData.gps) {
          data.append('gps', JSON.stringify(formData.gps));
        }
        // Compress each image to ≤900KB before uploading (Vercel limit is 4.5MB total)
        const compressedFiles = await Promise.all(
          formData.imageFiles.map(f => compressImage(f, 900))
        );
        compressedFiles.forEach(file => {
          data.append('imageFiles', file);
        });
        if (formData.existingImageUrls && formData.existingImageUrls.length > 0) {
          data.append('existingImageUrls', JSON.stringify(formData.existingImageUrls));
        }
        bodyData = data;
      } else {
        headers['Content-Type'] = 'application/json';
        const payload = { ...formData };
        delete payload.imageFiles;
        if (formData.existingImageUrls && formData.existingImageUrls.length > 0) {
          payload.imageUrl = formData.existingImageUrls[0];
          payload.existingImageUrls = formData.existingImageUrls;
        }
        delete payload.imageFile;
        bodyData = JSON.stringify(payload);
      }

      const res = await fetch(url, { method, headers, body: bodyData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'บันทึกข้อมูลไม่สำเร็จ');

      // Optimistically update React state immediately with confirmed response
      if (result && result.id) {
        setItems(prev => {
          const idx = prev.findIndex(i => i.id.toLowerCase() === result.id.toLowerCase());
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = result;
            return copy;
          }
          return [result, ...prev];
        });
      }

      setIsAddModalOpen(false);
      setItemToEdit(null);
      showToast(isEdit ? 'แก้ไขข้อมูลพัสดุเรียบร้อย' : `ลงทะเบียน ${result.name} สำเร็จและสร้าง QR Code แล้ว!`);
      await loadData();
    } catch (err) {
      console.error('handleSaveItem error:', err);
      showToast(err.message, 'error');
      alert(`⚠️ บันทึกข้อมูลไม่สำเร็จ: ${err.message}\n\nกรุณาตรวจสอบว่าเซิร์ฟเวอร์เปิดอยู่`);
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('คุณต้องการลบวัสดุอุปกรณ์นี้ออกจากสต็อกใช่หรือไม่?')) return;
    // Optimistic delete from UI
    setItems(prev => prev.filter(i => i.id.toLowerCase() !== itemId.toLowerCase()));
    try {
      const res = await fetch(`/api/items/${itemId}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'ลบรายการไม่สำเร็จ');
      showToast('ลบรายการพัสดุเรียบร้อย');
      await loadData();
    } catch (err) {
      console.error('handleDeleteItem error:', err);
      showToast(err.message, 'error');
      await loadData(); // revert
    }
  };

  const handleUpdateAudit = async (itemId, actualQuantity, location, note, gps) => {
    const count = Number(actualQuantity);
    const newLocation = (location && location.trim()) || '';

    // 1. Optimistically update local React state immediately (0 ms delay)
    setItems(prev => prev.map(item => {
      if (item.id.toLowerCase() === itemId.toLowerCase()) {
        return {
          ...item,
          quantity: count,
          location: newLocation || item.location,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser || item.updatedBy
        };
      }
      return item;
    }));

    try {
      const res = await fetch(`/api/items/${itemId}/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualQuantity: count, location: newLocation, user: currentUser, note, gps })
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'ตรวจนับสต็อกไม่สำเร็จ');
      }
      showToast(`✅ ตรวจนับสต็อกสำเร็จ! อัปเดตยอดคงเหลือเป็น ${count} เรียบร้อยแล้ว`);
      if (result.item) {
        setItems(prev => prev.map(item => item.id.toLowerCase() === itemId.toLowerCase() ? result.item : item));
      }
      // Non-blocking background sync
      loadData();
      return result;
    } catch (err) {
      console.error('handleUpdateAudit error:', err);
      showToast(err.message, 'error');
      // Revert from server
      await loadData();
      alert(`⚠️ ตรวจนับสต็อกไม่สำเร็จ: ${err.message}\n\nกรุณาตรวจสอบว่าเซิร์ฟเวอร์เปิดอยู่ และลองใหม่อีกครั้ง`);
      throw err;
    }
  };

  const handleTransaction = async (itemId, type, amount, targetLocation, note, gps) => {
    const qty = Number(amount) || 0;

    // 1. Optimistically update local React state immediately (0 ms delay)
    setItems(prev => prev.map(item => {
      if (item.id.toLowerCase() === itemId.toLowerCase()) {
        let newQty = item.quantity;
        if (type === 'in') newQty += qty;
        else if (type === 'out') newQty = Math.max(0, newQty - qty);
        return {
          ...item,
          quantity: newQty,
          location: (type === 'move' && targetLocation) ? targetLocation.trim() : item.location,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser || item.updatedBy
        };
      }
      return item;
    }));

    try {
      const res = await fetch(`/api/items/${itemId}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount, targetLocation, user: currentUser, note, gps })
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'ทำรายการไม่สำเร็จ');
      }
      const actionThai = type === 'in' ? 'รับของเข้าสต็อก' : type === 'out' ? 'เบิกของออก' : 'ย้ายสถานที่';
      showToast(`✅ บันทึก${actionThai}สำเร็จ!`);
      if (result && result.item) {
        setItems(prev => prev.map(i => i.id.toLowerCase() === itemId.toLowerCase() ? result.item : i));
      }
      // Non-blocking background sync
      loadData();
      return result;
    } catch (err) {
      console.error('handleTransaction error:', err);
      showToast(err.message, 'error');
      await loadData();
      alert(`⚠️ ทำรายการไม่สำเร็จ: ${err.message}`);
      throw err;
    }
  };


  // ------------------------------------
  // SETTINGS ACTIONS
  // ------------------------------------

  const handleAddMember = async (memberData) => {
    try {
      const res = await fetch('/api/settings/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-name': encodeURIComponent(currentUser)
        },
        body: JSON.stringify({ ...memberData, requester: currentUser })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'เพิ่มสมาชิกไม่สำเร็จ');
      if (result.team_members) {
        setTeamMembers(result.team_members);
      }
      showToast(result.message || 'เพิ่มสมาชิกใหม่เรียบร้อยแล้ว');
      await loadData(currentUser);
      return result;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleUpdateMember = async (id, memberData) => {
    try {
      const res = await fetch(`/api/settings/members/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-name': encodeURIComponent(currentUser)
        },
        body: JSON.stringify({ ...memberData, requester: currentUser })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'บันทึกการแก้ไขไม่สำเร็จ');
      const updatedMembers = result.team_members;
      if (updatedMembers) {
        setTeamMembers(updatedMembers);
        if (authUser) {
          const myRecord = updatedMembers.find(m => m.id === authUser.id);
          if (myRecord && myRecord.name !== authUser.name) {
            const updatedSession = { ...authUser, name: myRecord.name, role: myRecord.role, phone: myRecord.phone };
            setAuthUser(updatedSession);
            setCurrentUser(myRecord.name);
            try { localStorage.setItem('itembase_user', JSON.stringify(updatedSession)); } catch (e) {}
          }
        }
      }
      showToast(result.message || 'บันทึกการแก้ไขข้อมูลเรียบร้อย');
      await loadData(currentUser);
      return result;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleDeleteMember = async (id) => {
    try {
      const res = await fetch(`/api/settings/members/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'x-user-name': encodeURIComponent(currentUser)
        }
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'ลบสมาชิกไม่สำเร็จ');
      if (result.team_members) {
        setTeamMembers(result.team_members);
      }
      showToast(result.message || 'ลบสมาชิกเรียบร้อยแล้ว');
      await loadData(currentUser);
      return result;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleSaveMembers = async (members) => {
    try {
      const res = await fetch('/api/settings/members', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-name': encodeURIComponent(currentUser)
        },
        body: JSON.stringify({ members, requester: currentUser })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'บันทึกรายชื่อพนักงานไม่สำเร็จ');
      const updatedMembers = result.team_members || members;
      setTeamMembers(updatedMembers);

      // If current logged-in user was renamed, update authUser and currentUser
      if (authUser) {
        const myRecord = updatedMembers.find(m => m.id === authUser.id);
        if (myRecord && myRecord.name !== authUser.name) {
          const updatedSession = { ...authUser, name: myRecord.name, role: myRecord.role, phone: myRecord.phone };
          setAuthUser(updatedSession);
          setCurrentUser(myRecord.name);
          try { localStorage.setItem('itembase_user', JSON.stringify(updatedSession)); } catch (e) {}
        }
      }

      // Reload tasks & settings so cascaded assignee updates reflect in UI
      loadData(currentUser);
      showToast('บันทึกรายชื่อพนักงานและรหัสผ่านเรียบร้อย');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveLocations = async (locs) => {
    try {
      const res = await fetch('/api/settings/locations', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-name': encodeURIComponent(currentUser)
        },
        body: JSON.stringify({ locations: locs, requester: currentUser })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'บันทึกสถานที่จัดเก็บไม่สำเร็จ');
      setLocations(locs);
      showToast('บันทึกสถานที่จัดเก็บเรียบร้อย');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveCategories = async (cats) => {
    try {
      const res = await fetch('/api/settings/categories', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-name': encodeURIComponent(currentUser)
        },
        body: JSON.stringify({ categories: cats, requester: currentUser })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'บันทึกหมวดหมู่ไม่สำเร็จ');
      setCategories(cats);
      showToast('บันทึกหมวดหมู่เรียบร้อย');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleResetData = async () => {
    try {
      const res = await fetch('/api/reset', { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-name': encodeURIComponent(currentUser) 
        },
        body: JSON.stringify({ requester: currentUser })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'รีเซ็ตข้อมูลไม่สำเร็จ');
      showToast('รีเซ็ตข้อมูลระบบกลับสู่ค่าเริ่มต้นเรียบร้อยแล้ว');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleImportData = async (jsonData) => {
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-name': encodeURIComponent(currentUser)
        },
        body: JSON.stringify({ ...jsonData, requester: currentUser })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'นำเข้าข้อมูลไม่สำเร็จ');
      showToast('นำเข้าข้อมูลสำรองสำเร็จ!');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveBranding = async (brandingData) => {
    try {
      const data = new FormData();
      data.append('requester', currentUser);
      if (brandingData.siteTitle !== undefined) data.append('siteTitle', brandingData.siteTitle);
      if (brandingData.profileImageFile) data.append('profileImage', brandingData.profileImageFile);
      else if (brandingData.profileImageUrl !== undefined) data.append('profileImageUrl', brandingData.profileImageUrl);
      if (brandingData.coverImageFile) data.append('coverImage', brandingData.coverImageFile);
      else if (brandingData.coverImageUrl !== undefined) data.append('coverImageUrl', brandingData.coverImageUrl);

      // Super Admin security & binding fields
      if (brandingData.phone !== undefined) data.append('phone', brandingData.phone);
      if (brandingData.recoveryPhone !== undefined) data.append('recoveryPhone', brandingData.recoveryPhone);
      if (brandingData.email !== undefined) data.append('email', brandingData.email);
      if (brandingData.securityPin !== undefined) data.append('securityPin', brandingData.securityPin);
      if (brandingData.currentPassword) data.append('currentPassword', brandingData.currentPassword);
      if (brandingData.masterPassword) data.append('masterPassword', brandingData.masterPassword);
      if (brandingData.bannerHeight !== undefined) data.append('bannerHeight', brandingData.bannerHeight);
      if (brandingData.bannerFit !== undefined) data.append('bannerFit', brandingData.bannerFit);
      if (brandingData.bannerPosition !== undefined) data.append('bannerPosition', brandingData.bannerPosition);

      const res = await fetch('/api/settings/branding', {
        method: 'PUT',
        headers: { 'x-user-name': encodeURIComponent(currentUser) },
        body: data
      });

      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(text.startsWith('<') ? 'เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' : text);
      }
      if (!res.ok) throw new Error(result.error || 'บันทึกการตั้งค่าเว็บไซต์ไม่สำเร็จ');
      if (result.branding) {
        setBranding(prev => ({ ...prev, ...result.branding }));
        try { localStorage.setItem('itembase_branding_cache', JSON.stringify(result.branding)); } catch (e) {}
        if (result.branding.siteTitle) {
          document.title = `${result.branding.siteTitle} - ระบบคลังและจัดการงาน`;
        }
      }
      showToast(result.message || 'บันทึกการตั้งค่าหน้าปกและระบบเรียบร้อย');
      loadData(currentUser);
      return result;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  // Helpers
  const lowStockCount = items.filter(i => i.quantity <= i.minStock).length;


  // If user is not authenticated, display the Login Wall
  if (!authUser) {
    return (
      <>
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 animate-bounce">
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-semibold text-white ${
              toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
            }`}>
              {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
        <LoginPage 
          onLoginSuccess={handleLoginSuccess} 
          teamMembers={teamMembers} 
          openMobileShareModal={() => setIsMobileShareOpen(true)} 
          branding={branding}
        />
        <MobileShareModal
          isOpen={isMobileShareOpen}
          onClose={() => setIsMobileShareOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-semibold text-white ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={switchTab}
        currentUser={currentUser}
        authUser={authUser}
        onLogout={handleLogout}
        lowStockCount={lowStockCount}
        branding={branding}
        serverOnline={serverOnline}
        dbStatus={dbStatus}
        onReconnect={() => loadData()}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        openAddModal={() => {
          setItemToEdit(null);
          setIsAddModalOpen(true);
        }}
        openScanModal={() => {
          setPreselectedItemForScan(null);
          setIsScanModalOpen(true);
        }}
        openMobileShareModal={() => setIsMobileShareOpen(true)}
      />

      {/* Auto-Restore Banner when offline snapshot has newer edits than server */}
      {restoreCandidate && (
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-3 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-medium z-30 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <span>
              <strong>ตรวจพบข้อมูลที่คุณเคยบันทึกไว้ในเครื่อง:</strong> เซิร์ฟเวอร์เพิ่งรีสตาร์ต ข้อมูลบางส่วนอาจยังไม่ซิงค์ ต้องการกู้คืนข้อมูลล่าสุด ({restoreCandidate.items.length} รายการ) หรือไม่?
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreFromSnapshot}
              className="bg-white text-orange-700 hover:bg-orange-50 font-bold px-3 py-1.5 rounded-lg shadow transition text-xs"
            >
              กู้คืนและบันทึกขึ้นเซิร์ฟเวอร์ทันที
            </button>
            <button
              onClick={() => setRestoreCandidate(null)}
              className="text-amber-100 hover:text-white px-2 py-1 text-xs"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}


      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading && items.length === 0 && tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-sm gap-3">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span>กำลังโหลดข้อมูลระบบงานและสต็อก ItemBase...</span>
          </div>
        ) : (
          <>
            {activeTab === 'tasks' && (
              <TaskBoard
                tasks={tasks}
                items={items}
                teamMembers={teamMembers}
                currentUser={currentUser}
                isAdmin={isAdmin}
                branding={branding}
                onSaveBranding={handleSaveBranding}
                onOpenNewTaskModal={() => {
                  setTaskToEdit(null);
                  setIsTaskModalOpen(true);
                }}
                onEditTask={(t) => {
                  setTaskToEdit(t);
                  setIsTaskModalOpen(true);
                }}
                onDeleteTask={handleDeleteTask}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onIssueMaterial={handleIssueMaterial}
                onReturnMaterial={handleReturnMaterial}
              />
            )}

            {activeTab === 'catalog' && (
              <InventoryCatalog
                items={items}
                categories={categories}
                locations={locations}
                onOpenAddModal={() => {
                  setItemToEdit(null);
                  setIsAddModalOpen(true);
                }}
                onOpenEditModal={(item) => {
                  setItemToEdit(item);
                  setIsAddModalOpen(true);
                }}
                onDeleteItem={handleDeleteItem}
                onOpenPrintModal={(item) => {
                  setSingleItemForPrint(item);
                  setIsPrintModalOpen(true);
                }}
                onOpenAuditModal={(item) => {
                  setPreselectedItemForScan(item);
                  setIsScanModalOpen(true);
                }}
                onOpenItemLogs={(item) => {
                  switchTab('logs');
                }}
              />
            )}

            {activeTab === 'logs' && (
              <LogsPage
                logs={logs}
                items={items}
                currentUser={currentUser}
                onDeleteLog={async (logId) => {
                  try {
                    const res = await fetch(`/api/logs/${logId}`, {
                      method: 'DELETE',
                      headers: { 'x-user-name': encodeURIComponent(currentUser) }
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.error || 'ลบรายการไม่สำเร็จ');
                    showToast('ลบรายการประวัติเรียบร้อย');
                    loadData();
                  } catch (err) {
                    showToast(err.message, 'error');
                  }
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPage
                teamMembers={teamMembers}
                locations={locations}
                categories={categories}
                onSaveMembers={handleSaveMembers}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
                onSaveLocations={handleSaveLocations}
                onSaveCategories={handleSaveCategories}
                onResetData={handleResetData}
                onImportData={handleImportData}
                onSaveBranding={handleSaveBranding}
                branding={branding}
                currentUser={currentUser}
                authUser={authUser}
                dbStatus={dbStatus}
              />
            )}
          </>
        )}
      </main>

      {/* MODALS */}

      {/* Task Modal (Create / Edit Task & Requisition) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        teamMembers={teamMembers}
        items={items}
      />

      {/* Add / Edit Item Modal (With Photo & Live QR Generation) */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => {
          if (!isSavingItem) { setIsAddModalOpen(false); setItemToEdit(null); }
        }}
        onSave={handleSaveItem}
        isSaving={isSavingItem}
        itemToEdit={itemToEdit}
        categories={categories}
        locations={locations}
        currentUser={currentUser}
      />

      {/* QR Scanner & Check-in Modal (Audit, In, Out, Move) */}
      <QRScannerModal
        isOpen={isScanModalOpen}
        onClose={() => {
          setIsScanModalOpen(false);
          setPreselectedItemForScan(null);
        }}
        items={items}
        locations={locations}
        currentUser={currentUser}
        onUpdateAudit={handleUpdateAudit}
        onTransaction={handleTransaction}
        preselectedItem={preselectedItemForScan}
      />

      {/* Print QR Sticker Modal */}
      <QRPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setSingleItemForPrint(null);
        }}
        items={items}
        singleItem={singleItemForPrint}
      />

      {/* Mobile / Tablet Link & QR Share Modal */}
      <MobileShareModal
        isOpen={isMobileShareOpen}
        onClose={() => setIsMobileShareOpen(false)}
      />

    </div>
  );
}
