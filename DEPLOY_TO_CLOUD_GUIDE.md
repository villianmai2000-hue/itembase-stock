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

---

## 💾 วิธีทำให้ข้อมูลออนไลน์ไม่หาย: ใช้ GitHub เดิมเป็นคลาวด์ถาวร 24 ชม.

เนื่องจาก Render.com แพ็กเกจฟรีจะพักเครื่อง (Sleep) หากไม่มีการใช้งาน 15 นาที และจะล้างไฟล์ในดิสก์ทิ้งเมื่อพักเครื่อง  
เพื่อให้ข้อมูลที่ลงไว้ **ไม่หายถาวร** คุณสามารถใช้ **GitHub เดิม** เป็นที่เก็บข้อมูลได้ทันที (ทำเพียง 1 นาที):

1. **สร้าง GitHub Personal Access Token**:
   - ไปที่ลิงก์นี้โดยตรง: [github.com/settings/tokens/new](https://github.com/settings/tokens/new?scopes=repo&description=itembase-stock-cloud-db)
   - ช่อง Note ใส่ชื่อ: `itembase-token`
   - ติ๊กถูกที่ช่อง **repo** (Full control of private/public repositories)
   - เลื่อนลงด้านล่างสุด กดปุ่มสีเขียว **Generate token**
   - **คัดลอกรหัสโทเค็นทันที** (ขึ้นต้นด้วย `ghp_...`)

2. **ใส่รหัสใน Render Dashboard**:
   - ไปที่ [dashboard.render.com](https://dashboard.render.com)
   - คลิกเลือกเว็บของคุณ: **itembase-stock**
   - เมนูด้านซ้าย เลือก **Environment**
   - กดปุ่ม **Add Environment Variable**
   - ใส่ข้อมูล:
     - **Key**: `GITHUB_TOKEN`
     - **Value**: วางรหัส `ghp_...` ที่คัดลอกมา
   - กด **Save Changes**

🎉 **เรียบร้อย 100%!** ระบบจะเชื่อมต่อกับ GitHub เดิมของคุณทันที ทุกครั้งที่มีการแก้ไข/เบิก/ลงสต็อก ข้อมูลจะถูกบันทึกลงบน GitHub ตลอดไป ไม่มีวันหายอีกแล้วครับ!