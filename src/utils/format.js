// Format ISO timestamp to Thai Date Time
export function formatThaiDateTime(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    const day = d.getDate();
    const month = thaiMonths[d.getMonth()];
    const year = d.getFullYear() + 543; // Buddhist Era
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');

    return `${day} ${month} ${year}, ${hours}:${minutes} น.`;
  } catch (e) {
    return isoString;
  }
}

// Format Date Only
export function formatThaiDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    const day = d.getDate();
    const month = thaiMonths[d.getMonth()];
    const year = d.getFullYear() + 543;

    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateStr;
  }
}

// Priority translations and styles
export const PRIORITY_MAP = {
  urgent: {
    label: 'ด่วนที่สุด',
    bg: 'bg-red-100 text-red-800 border-red-200',
    dot: 'bg-red-500'
  },
  high: {
    label: 'ด่วน',
    bg: 'bg-amber-100 text-amber-800 border-amber-200',
    dot: 'bg-amber-500'
  },
  normal: {
    label: 'ปกติ',
    bg: 'bg-blue-100 text-blue-800 border-blue-200',
    dot: 'bg-blue-500'
  },
  low: {
    label: 'ไม่เร่งด่วน',
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400'
  }
};

// Task Status translations and styles
export const STATUS_MAP = {
  todo: {
    label: 'รอดำเนินการ',
    color: 'border-amber-400 bg-amber-50/50',
    badge: 'bg-amber-100 text-amber-800'
  },
  in_progress: {
    label: 'กำลังดำเนินการ',
    color: 'border-blue-400 bg-blue-50/50',
    badge: 'bg-blue-100 text-blue-800'
  },
  review: {
    label: 'รอตรวจสอบ/ทดสอบ',
    color: 'border-purple-400 bg-purple-50/50',
    badge: 'bg-purple-100 text-purple-800'
  },
  done: {
    label: 'เสร็จสมบูรณ์',
    color: 'border-emerald-400 bg-emerald-50/50',
    badge: 'bg-emerald-100 text-emerald-800'
  }
};

// Log Type translations
export const LOG_TYPE_MAP = {
  issue: { label: 'เบิกของตัดสต็อก', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  return: { label: 'ส่งคืนของเข้าสต็อก', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  audit: { label: 'สแกนตรวจนับสต็อก', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  in: { label: 'รับของเข้า', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  out: { label: 'เบิกจ่ายทั่วไป', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  move: { label: 'ย้ายสถานที่จัดเก็บ', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  add: { label: 'ลงทะเบียนใหม่', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  edit: { label: 'แก้ไขข้อมูล', color: 'bg-slate-100 text-slate-800 border-slate-200' }
};
