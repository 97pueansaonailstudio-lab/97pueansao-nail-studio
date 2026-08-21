/*
=========================================================
97Pueansao nail studio — ร้านแก้ข้อมูลตรงนี้ได้เลย
=========================================================
ใส่ข้อมูลจริงของร้านใน SHOP_CONFIG แล้วหน้าเว็บจะอัปเดตให้อัตโนมัติ

ตัวอย่าง:
phone: "0812345678"
lineId: "@97pueansao"
instagram: "https://www.instagram.com/youraccount/"
facebook: "https://www.facebook.com/yourpage/"
address: "123 ถนนตัวอย่าง แขวง... กรุงเทพฯ 10110"
hours: "ทุกวัน 10:00 - 20:00"
mapQuery: "13.7563,100.5018"  // หรือใส่ชื่อ/ที่อยู่ร้าน
*/

const SHOP_CONFIG = {
  phone: "061-072-2263",
  lineId: "LINE Official Account",
  lineUrl: "https://lin.ee/q9DpJ46",
  instagram: "@97pueansaonailstudio",
  instagramUrl: "https://www.instagram.com/97pueansaonailstudio?igsi=MTFzbHk1MjdmeXZ5dw%3D%3D&utm_source=qr",
  facebook: "97Pueansao nail studio",
  facebookUrl: "https://www.facebook.com/profile.php?id=61590331754351",
  address: "",
  hours: "",
  mapQuery: "97Pueansao nail studio"
};

const SUPABASE_CONFIG = {
  url: "https://bfavtiawdvrifhnsmsbt.supabase.co",
  publishableKey: "sb_publishable_yBX-u-TbyHDOR0FZjTVT1A_V0CqvSPD",
  bucket: "gallery",
  table: "gallery_images"
};

const supabaseClient = window.supabase?.createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.publishableKey
);

// ------------------------------
// Mobile navigation
// ------------------------------
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.classList.toggle("active", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

// ------------------------------
// Header blur on scroll
// ------------------------------
const header = document.querySelector(".site-header");

function updateHeader() {
  header.classList.toggle("scrolled", window.scrollY > 25);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

// ------------------------------
// Scroll reveal
// ------------------------------
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.12,
    rootMargin: "0px 0px -35px 0px"
  }
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 5, 4) * 55}ms`;
  revealObserver.observe(element);
});

// ------------------------------
// Gallery lightbox
// ------------------------------
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxTitle = document.getElementById("lightboxTitle");
const lightboxClose = document.querySelector(".lightbox-close");

function openLightbox(image, title) {
  lightboxImage.src = image;
  lightboxImage.alt = title;
  lightboxTitle.textContent = title;
  lightbox.classList.add("active");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
}

function closeLightbox() {
  lightbox.classList.remove("active");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");

  setTimeout(() => {
    lightboxImage.src = "";
  }, 250);
}

document.querySelectorAll(".gallery-item").forEach((item) => {
  item.addEventListener("click", () => {
    openLightbox(item.dataset.image, item.dataset.title);
  });
});

// Gallery administration (Supabase Storage + Database)
async function getSavedGallery() {
  if (!supabaseClient) throw new Error("ไม่สามารถเชื่อมต่อ Supabase ได้");
  const { data, error } = await supabaseClient
    .from(SUPABASE_CONFIG.table)
    .select("id, title, image_path")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((photo) => ({
    ...photo,
    image: supabaseClient.storage.from(SUPABASE_CONFIG.bucket).getPublicUrl(photo.image_path).data.publicUrl
  }));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

async function renderSavedGallery() {
  document.querySelectorAll(".gallery-uploaded").forEach((item) => item.remove());
  const gallery = document.getElementById("gallery");
  let photos = [];
  try {
    photos = await getSavedGallery();
  } catch (error) {
    console.error("Could not load gallery", error);
    return;
  }
  photos.forEach((photo) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "gallery-item gallery-uploaded reveal visible";
    item.dataset.id = photo.id;
    item.dataset.image = photo.image;
    item.dataset.title = photo.title;
    item.innerHTML = `<img src="${photo.image}" alt="${escapeHtml(photo.title)}" loading="lazy"><span class="gallery-overlay"><small>OUR WORK</small><strong>${escapeHtml(photo.title)}</strong></span><span class="gallery-delete" aria-label="ลบรูป">×</span>`;
    item.addEventListener("click", async (event) => {
      if (event.target.closest(".gallery-delete")) {
        if (document.body.classList.contains("admin-mode") && confirm("ลบรูปนี้ใช่หรือไม่?")) {
          const { error: storageError } = await supabaseClient.storage.from(SUPABASE_CONFIG.bucket).remove([photo.image_path]);
          if (storageError) return alert(`ลบรูปไม่สำเร็จ: ${storageError.message}`);
          const { error } = await supabaseClient.from(SUPABASE_CONFIG.table).delete().eq("id", photo.id);
          if (error) return alert(`ลบข้อมูลไม่สำเร็จ: ${error.message}`);
          renderSavedGallery();
        }
        return;
      }
      openLightbox(photo.image, photo.title);
    });
    gallery.append(item);
  });
}

const adminEntry = document.getElementById("adminEntry");
const adminLoginDialog = document.getElementById("adminLoginDialog");
const adminGalleryDialog = document.getElementById("adminGalleryDialog");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminGalleryForm = document.getElementById("adminGalleryForm");

adminEntry.addEventListener("click", async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  (session ? adminGalleryDialog : adminLoginDialog).showModal();
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => document.getElementById(button.dataset.closeDialog).close());
});

adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.getElementById("adminLoginMessage");
  message.textContent = "กำลังเข้าสู่ระบบ...";
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: document.getElementById("adminEmail").value.trim(),
    password: document.getElementById("adminPassword").value
  });
  if (error) {
    message.textContent = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    return;
  }
  document.body.classList.add("admin-mode");
  adminLoginDialog.close();
  adminLoginForm.reset();
  message.textContent = "";
  adminGalleryDialog.showModal();
});

adminGalleryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.getElementById("adminGalleryMessage");
  const files = [...document.getElementById("galleryFiles").files];
  const title = document.getElementById("uploadTitle").value.trim() || "ผลงานของเรา";
  message.textContent = "กำลังอัปโหลดรูป...";
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("กรุณาเข้าสู่ระบบอีกครั้ง");
    for (const file of files) {
      if (file.size > 6 * 1024 * 1024) throw new Error("กรุณาเลือกรูปที่มีขนาดไม่เกิน 6 MB");
      const extension = file.name.split(".").pop().toLowerCase();
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabaseClient.storage.from(SUPABASE_CONFIG.bucket).upload(path, file, { cacheControl: "3600", contentType: file.type });
      if (uploadError) throw uploadError;
      const { error: insertError } = await supabaseClient.from(SUPABASE_CONFIG.table).insert({ title, image_path: path });
      if (insertError) {
        await supabaseClient.storage.from(SUPABASE_CONFIG.bucket).remove([path]);
        throw insertError;
      }
    }
    await renderSavedGallery();
    adminGalleryForm.reset();
    message.textContent = "เพิ่มรูปเรียบร้อยแล้ว";
  } catch (error) {
    message.textContent = error.message || "ไม่สามารถอัปโหลดรูปได้";
  }
});

document.getElementById("adminLogout").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  document.body.classList.remove("admin-mode");
  adminGalleryDialog.close();
});

supabaseClient.auth.getSession().then(({ data: { session } }) => {
  document.body.classList.toggle("admin-mode", Boolean(session));
});
renderSavedGallery();

lightboxClose.addEventListener("click", closeLightbox);

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox.classList.contains("active")) {
    closeLightbox();
  }
});

// ------------------------------
// Shop information
// ------------------------------
const shopAddress = document.getElementById("shopAddress");
const shopHours = document.getElementById("shopHours");
const mapButton = document.getElementById("mapButton");
const mapIframe = document.querySelector(".map-card iframe");

if (SHOP_CONFIG.address.trim()) {
  shopAddress.textContent = SHOP_CONFIG.address;
}

if (SHOP_CONFIG.hours.trim()) {
  shopHours.textContent = SHOP_CONFIG.hours;
}

if (SHOP_CONFIG.mapQuery.trim()) {
  const query = encodeURIComponent(SHOP_CONFIG.mapQuery.trim());
  mapButton.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
  mapIframe.src = `https://www.google.com/maps?q=${query}&output=embed`;
}

// ------------------------------
// Contact buttons
// ------------------------------
function normalizePhone(phone) {
  return phone.replace(/[^\d+]/g, "");
}

function setContact({ selector, textSelector, value, url, emptyText }) {
  const link = document.querySelector(selector);
  const text = document.querySelector(textSelector);

  if (value && value.trim()) {
    text.textContent = value;
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
  } else {
    text.textContent = emptyText;
    link.href = "#";
    link.addEventListener("click", (event) => {
      event.preventDefault();
      alert("กรุณาเพิ่มข้อมูลช่องทางติดต่อนี้ใน SHOP_CONFIG ภายในไฟล์ script.js");
    });
  }
}

const lineUrl = SHOP_CONFIG.lineUrl || (SHOP_CONFIG.lineId
  ? `https://line.me/ti/p/~${encodeURIComponent(SHOP_CONFIG.lineId.replace(/^@/, ""))}`
  : "#");

setContact({
  selector: "#lineLink",
  textSelector: "#lineText",
  value: SHOP_CONFIG.lineId,
  url: lineUrl,
  emptyText: "เพิ่ม LINE ID"
});

setContact({
  selector: "#instagramLink",
  textSelector: "#instagramText",
  value: SHOP_CONFIG.instagram,
  url: SHOP_CONFIG.instagramUrl || SHOP_CONFIG.instagram || "#",
  emptyText: "เพิ่ม Instagram"
});

setContact({
  selector: "#facebookLink",
  textSelector: "#facebookText",
  value: SHOP_CONFIG.facebook,
  url: SHOP_CONFIG.facebookUrl || SHOP_CONFIG.facebook || "#",
  emptyText: "เพิ่ม Facebook"
});

const phoneLink = document.getElementById("phoneLink");
const phoneText = document.getElementById("phoneText");

if (SHOP_CONFIG.phone.trim()) {
  phoneText.textContent = SHOP_CONFIG.phone;
  phoneLink.href = `tel:${normalizePhone(SHOP_CONFIG.phone)}`;
} else {
  phoneText.textContent = "เพิ่มเบอร์โทร";
  phoneLink.href = "#";
  phoneLink.addEventListener("click", (event) => {
    event.preventDefault();
    alert("กรุณาเพิ่มเบอร์โทรใน SHOP_CONFIG ภายในไฟล์ script.js");
  });
}

// ------------------------------
// Footer year
// ------------------------------
document.getElementById("year").textContent = new Date().getFullYear();
