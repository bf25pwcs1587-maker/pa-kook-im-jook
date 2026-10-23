# Pa-Kook-Im-Jook (ป้ากุ๊กอิ่มจุก) POS & Sales Tracking System

ระบบบันทึกการขายและคำนวณกำไร-ต้นทุน ร้านป้ากุ๊กอิ่มจุก (อาหารจานเดียว & เครื่องดื่ม)
A modern, responsive POS and daily/monthly revenue & profit tracking web application with live Google Cloud Firestore cloud database persistence.

---

## 3 วิธีในการส่งมอบโปรแกรมให้ลูกค้า (How to Deliver to Customer)

### วิธีที่ 1: ส่งลิงก์เว็บตรงให้ลูกค้าใช้งานได้ทันที (แนะนำ - ง่ายที่สุด ไม่ต้องติดตั้ง)
โปรแกรมถูก deploy อยู่บนคลาวด์พร้อมใช้งานแล้ว:
- **URL ร้านค้า:** `https://ais-pre-lvtgexu2d73vuhzq3m6fjh-719270563159.asia-east1.run.app`
- **วิธีทำเป็นแอปบนมือถือ/แท็บเล็ตของลูกค้า (Add to Home Screen):**
  1. เปิดลิงก์ด้านบนใน Safari (iPhone/iPad) หรือ Google Chrome (Android/คอมพิวเตอร์)
  2. กดปุ่ม **แชร์ (Share)** หรือ จุด 3 จุด
  3. เลือก **"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)**
  4. จะได้ไอคอนแอปบนหน้าจอ เปิดใช้งานเหมือนแอปแท็บเล็ตทั่วไปได้ทันที ข้อมูลบันทึกและซิงค์คลาวด์ตลอดเวลา

---

### วิธีที่ 2: Deploy ขึ้น Vercel (ฟรี + ใส่ชื่อโดเมนของลูกค้าได้ เช่น `pakook-pos.vercel.app`)
โปรแกรมนี้เป็น React + Vite + TypeScript พร้อมไฟล์ `vercel.json` แล้ว:

1. **วิธีผ่าน Vercel Dashboard (แนะนำ):**
   - อัปโหลดโค้ดนี้ขึ้น GitHub
   - ไปที่ [vercel.com](https://vercel.com) แล้วกด **"Add New Project"**
   - เลือก Repository นี้จาก GitHub
   - Vercel จะตั้งค่าให้อัตโนมัติ:
     - Framework Preset: `Vite`
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - กด **Deploy** จะได้ลิงก์โดเมนของ Vercel ทันที!

2. **หรือใช้ Vercel CLI:**
   ```bash
   npm i -g vercel
   vercel
   ```

---

### วิธีที่ 3: อัปโหลดขึ้น GitHub (Push to GitHub)
```bash
git init
git add .
git commit -m "feat: complete Pa-Kook-Im-Jook POS app ready for customer"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

## ขั้นตอนสำคัญก่อนส่งมอบให้ลูกค้า (Pre-Handover Checklist)
1. **ล้างยอดขายทดสอบให้เริ่มที่ 0 บิล:**
   - กดปุ่มสีเขียว **"เชื่อมต่อฐานข้อมูลแล้ว"** ด้านบนแถบหัวเว็บ
   - กดปุ่ม **"ล้างยอดขายทั้งหมด เริ่มต้นร้านใหม่ 0 บิล (สำหรับส่งมอบลูกค้า)"**
   - เมนูอาหารทั้ง 18 เมนูพร้อมสูตรต้นทุนจะยังอยู่ครบถ้วน พร้อมให้ลูกค้าเริ่มขายจริงวันแรก!
2. **ทดสอบพิมพ์ใบเสร็จ:**
   - รองรับทั้งเครื่องพิมพ์ใบเสร็จ 80mm POS Slip และกระดาษ A4
