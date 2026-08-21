# 97Pueansao nail studio Website

ไฟล์หลัก:
- `index.html` — โครงสร้างหน้าเว็บ
- `styles.css` — ดีไซน์และ Responsive
- `script.js` — เมนู, Lightbox, Animation และข้อมูลร้าน

## เปลี่ยนข้อมูลร้าน
เปิด `script.js` แล้วแก้ค่าที่ `SHOP_CONFIG` ด้านบนสุด:

```js
const SHOP_CONFIG = {
  phone: "0812345678",
  lineId: "@yourline",
  instagram: "https://www.instagram.com/youraccount/",
  facebook: "https://www.facebook.com/yourpage/",
  address: "ใส่ที่อยู่ร้าน",
  hours: "ทุกวัน 10:00 - 20:00",
  mapQuery: "พิกัด latitude,longitude หรือที่อยู่ร้าน"
};
```

## เปลี่ยนรูปผลงาน
เปิด `index.html` แล้วค้นหาคำว่า `gallery-item`
เปลี่ยน URL ใน `src="..."` และ `data-image="..."` เป็นรูปของร้านได้เลย

รูปที่ใส่ไว้ในเวอร์ชันนี้เป็นภาพตัวอย่างจาก Unsplash ไม่ใช่ผลงานจริงของร้าน

## เปิดเว็บไซต์
ดับเบิลคลิก `index.html` ได้เลย หรืออัปโหลดทั้งโฟลเดอร์ขึ้น Hosting / GitHub Pages / Netlify / Vercel
# ระบบจัดการรูปผลงาน

เว็บไซต์นี้มีหลังบ้านสำหรับแอดมินที่ `admin.php`

1. เปิด `setup.php` เพียงครั้งแรกเพื่อตั้งชื่อผู้ใช้และรหัสผ่าน
2. เข้า `admin.php` เพื่ออัปโหลดหรือลบรูปผลงาน
3. รูปที่เพิ่มจะแสดงบนหน้าแรกอัตโนมัติ

ระบบต้องนำขึ้นโฮสต์ที่รองรับ PHP และอนุญาตให้โฟลเดอร์ `data` กับ `uploads` เขียนไฟล์ได้
