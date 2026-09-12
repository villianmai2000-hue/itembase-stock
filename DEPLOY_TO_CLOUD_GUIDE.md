# 🌐 คู่มือการนำ ItemBase ขึ้นออนไลน์ 24 ชั่วโมง (Cloud Deployment)

## 📌 สรุปหลักการ
เพื่อให้ระบบทำงานได้ตลอดเวลา **โดยไม่ต้องเปิดคอมพิวเตอร์ทิ้งไว้** และให้ค้นหาใน Google เจอ:
ระบบจะต้องย้ายจากคอมพิวเตอร์ของคุณ ขึ้นไปรันบน **Cloud Hosting (คลาวด์เซิร์ฟเวอร์)**

---

## 🚀 วิธีที่ 1: นำขึ้น Render.com (ฟรี 100% • ใช้เวลา 5 นาที)

### ขั้นตอนที่ 1: นำโค้ดขึ้น GitHub
1. เข้าเว็บ [github.com](https://github.com) และสร้างบัญชี (ฟรี)
2. สร้าง Repository ใหม่ ตั้งชื่อเช่น `itembase-stock`
3. อัปโหลดโค้ดทั้งหมดในโฟลเดอร์นี้ขึ้น GitHub

### ขั้นตอนที่ 2: เปิดบริการบน Render
1. เข้าเว็บ [render.com](https://render.com) สมัครสมาชิกด้วยบัญชี GitHub
2. กดปุ่ม **"New +"** แล้วเลือก **"Web Service"**
3. เลือก Repository `itembase-stock` ที่คุณเพิ่งสร้าง
4. ตั้งค่าดังนี้:
   - **Name**: `itembase-stock` (หรือชื่อที่คุณต้องการ)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. กดปุ่ม **"Deploy Web Service"**

🎉 **เสร็จสิ้น!** คุณจะได้ลิงก์ถาวร เช่น `https://itembase-stock.onrender.com`
- เปิดใช้งานผ่าน Google Chrome บนมือถือ/คอมพิวเตอร์ได้ตลอด 24 ชั่วโมง
- **ปิดคอมพิวเตอร์หลัก ปิดโปรแกรมได้เลย** ระบบยังคงทำงานและลงสต็อกได้ตลอดเวลา

---

## 🔍 วิธีที่ 2: มีชื่อเว็บไซต์เป็นของตัวเอง & ค้นหาใน Google เจอ (เช่น www.myitembase.com)

1. **จดโดเมนเนม (Domain Name)**:
   - ซื้อชื่อเว็บ เช่น `www.ชื่อบริษัทของคุณ.com` (ราคาประมาณ 300-400 บาท/ปี) จากผู้ให้บริการเช่น Namecheap, GoDaddy, หรือ Hostatom
2. **ผูกโดเมนกับ Render**:
   - ในหน้าจัดการของ Render เข้าเมนู **Settings -> Custom Domains** แล้วใส่ชื่อโดเมนของคุณ
3. **ลงทะเบียนกับ Google (Google Search Console)**:
   - เข้าเว็บ [search.google.com/search-console](https://search.google.com/search-console)
   - เพิ่มชื่อโดเมนของคุณ
   - ส่งไฟล์ Sitemap: `https://ชื่อโดเมนของคุณ/sitemap.xml`
   - รอ Google ตรวจสอบ 1-3 วัน จากนั้นเมื่อพิมพ์ค้นหาชื่อบน Google ก็จะเจอหน้าเว็บของคุณทันที