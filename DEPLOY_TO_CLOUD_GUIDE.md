# 🌐 คู่มือการนำ ItemBase ขึ้นออนไลน์ตลอด 24 ชั่วโมง ด้วย MongoDB.com

เพื่อให้ระบบและฐานข้อมูลสต็อกทำงานได้ตลอด 24 ชั่วโมง **โดยที่คุณสามารถปิดคอมพิวเตอร์ ปิดโปรแกรม และเข้าใช้งานจากมือถือได้ตลอดเวลา ข้อมูลไม่มีวันหาย 100%** มีส่วนประกอบ 2 ส่วนหลัก:

---

## 🍃 ส่วนที่ 1: สร้างฐานข้อมูลคลาวด์บน MongoDB.com (ฟรีตลอดชีพ)

MongoDB Atlas คือระบบฐานข้อมูลคลาวด์มาตรฐานโลก (ฟรี 512 MB ซึ่งเพียงพอสำหรับเก็บสต็อกและงานได้หลายแสนรายการ)

### ขั้นตอนการสมัครและรับรหัสเชื่อมต่อ (Connection String):
1. เข้าเว็บไซต์ **[mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)** แล้วสมัครสมาชิก (สามารถกด Sign up with Google ได้)
2. เมื่อเข้าสู่ระบบ ให้เลือกสร้างคลัสเตอร์แบบ **M0 (Free)** (ฟรี 100% ตลอดชีพ)
3. **สร้างผู้ใช้ฐานข้อมูล (Database User)**:
   - ไปที่เมนูด้านซ้าย **Security** -> **Database Access**
   - กดปุ่มสีเขียว **Add New Database User**
   - ตั้ง **Username** (เช่น `itembase_admin`)
   - ตั้ง **Password** (เช่น `Mai2000Pass!`) แล้วกด **Add User** *(จำรหัสผ่านนี้ไว้)*
4. **เปิดสิทธิ์การเข้าถึงจากทุกที่ (Network Access)**:
   - ไปที่เมนูด้านซ้าย **Security** -> **Network Access**
   - กดปุ่ม **Add IP Address**
   - คลิกเลือก **ALLOW ACCESS FROM ANYWHERE** (จะขึ้น IP เป็น `0.0.0.0/0`)
   - กด **Confirm**
5. **คัดลอก Connection String**:
   - ไปที่เมนูด้านซ้าย **Deployment** -> **Database**
   - กดปุ่ม **Connect** ตรงคลัสเตอร์ของคุณ
   - เลือก **Drivers** (Driver: `Node.js`)
   - คัดลอกข้อความ Connection String ที่ได้ ซึ่งจะมีหน้าตาแบบนี้:
     ```text
     mongodb+srv://itembase_admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
     ```
   - ให้เปลี่ยนคำว่า `<password>` เป็นรหัสผ่านที่คุณตั้งไว้ในข้อ 3 เช่น:
     ```text
     mongodb+srv://itembase_admin:Mai2000Pass!@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
     ```

---

## ⚡ ส่วนที่ 2: นำรหัสเชื่อมต่อมาใส่ในระบบ ItemBase

คุณสามารถนำ Connection String ที่ได้มาใส่ในระบบได้ทันที 2 วิธี:

### วิธีที่ 1: วางผ่านหน้าเว็บโดยตรง (ง่ายที่สุดใน 5 วินาที)
1. เปิดหน้าเว็บ ItemBase -> ไปที่แท็บ **ตั้งค่าระบบ** (รูปเฟือง)
2. เลือกแท็บย่อย **สำรองข้อมูล**
3. ในกล่องสีเข้ม **"ฐานข้อมูลคลาวด์ MongoDB Atlas (mongodb.com)"** 
4. วาง Connection String ลงในช่อง แล้วกดปุ่ม **"⚡ บันทึกและเชื่อมต่อ MongoDB Atlas ทันที"**
5. ระบบจะทดสอบและอัปโหลดข้อมูลสต็อกทั้งหมดขึ้น `mongodb.com` อัตโนมัติทันที!

---

## 🚀 ส่วนที่ 3: นำตัวเว็บขึ้นออนไลน์ตลอด 24 ชั่วโมง (ไม่ต้องเปิดคอมทิ้งไว้)

เพื่อให้เว็บไซต์เปิดได้ตลอดเวลา แม้จะปิดคอมพิวเตอร์เครื่องนี้:

1. เข้าเว็บ **[render.com](https://render.com)** สมัครด้วยบัญชี GitHub ของคุณ
2. กดปุ่ม **"New +"** เลือก **"Web Service"**
3. เลือก Repository: `villianmai2000-hue/itembase-stock`
4. ตั้งค่า:
   - **Name**: `itembase-stock`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. เมนู **Environment Variables** ด้านล่าง ให้กด **Add Environment Variable**:
   - **Key**: `MONGODB_URI`
   - **Value**: วาง Connection String ของ MongoDB Atlas ที่คุณได้จากส่วนที่ 1
6. กดปุ่ม **"Deploy Web Service"**

🎉 **เสร็จสมบูรณ์ 100%!**
- คุณจะได้ลิงก์ถาวร เช่น `https://itembase-stock.onrender.com`
- เปิดใช้งานบนมือถือ แท็บเล็ต หรือคอมพิวเตอร์เครื่องใดก็ได้ตลอด 24 ชั่วโมง
- **ปิดคอมพิวเตอร์หลัก ปิดหน้าจอได้เลย** ข้อมูลทุกอย่างปลอดภัยบน `mongodb.com` ตลอดไปครับ!