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

const ADMIN_CONFIG = {
  password: "97pueansao",
  storageKey: "97pueansao-gallery"
};

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

// Gallery administration (browser-only storage)
function getSavedGallery() {
  try {
    const photos = JSON.parse(localStorage.getItem(ADMIN_CONFIG.storageKey) || "[]");
    return Array.isArray(photos) ? photos : [];
  } catch (_) {
    return [];
  }
}

function saveGallery(photos) {
  localStorage.setItem(ADMIN_CONFIG.storageKey, JSON.stringify(photos));
}

function renderSavedGallery() {
  document.querySelectorAll(".gallery-uploaded").forEach((item) => item.remove());
  const gallery = document.getElementById("gallery");
  getSavedGallery().forEach((photo) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "gallery-item gallery-uploaded reveal visible";
    item.dataset.id = photo.id;
    item.dataset.image = photo.image;
    item.dataset.title = photo.title;
    item.innerHTML = `<img src="${photo.image}" alt="${photo.title}" loading="lazy"><span class="gallery-overlay"><small>OUR WORK</small><strong>${photo.title}</strong></span><span class="gallery-delete" aria-label="ลบรูป">×</span>`;
    item.addEventListener("click", (event) => {
      if (event.target.closest(".gallery-delete")) {
        if (document.body.classList.contains("admin-mode") && confirm("ลบรูปนี้ใช่หรือไม่?")) {
          saveGallery(getSavedGallery().filter((saved) => saved.id !== photo.id));
          renderSavedGallery();
        }
        return;
      }
      openLightbox(photo.image, photo.title);
    });
    gallery.append(item);
  });
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์รูปได้"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("ไฟล์รูปนี้ไม่รองรับ"));
      image.onload = () => {
        const longestEdge = 1400;
        const scale = Math.min(1, longestEdge / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const adminEntry = document.getElementById("adminEntry");
const adminLoginDialog = document.getElementById("adminLoginDialog");
const adminGalleryDialog = document.getElementById("adminGalleryDialog");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminGalleryForm = document.getElementById("adminGalleryForm");

adminEntry.addEventListener("click", () => {
  (sessionStorage.getItem("97pueansao-admin") === "true" ? adminGalleryDialog : adminLoginDialog).showModal();
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => document.getElementById(button.dataset.closeDialog).close());
});

adminLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = document.getElementById("adminLoginMessage");
  if (document.getElementById("adminPassword").value !== ADMIN_CONFIG.password) {
    message.textContent = "รหัสผ่านไม่ถูกต้อง";
    return;
  }
  sessionStorage.setItem("97pueansao-admin", "true");
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
  message.textContent = "กำลังเตรียมรูป...";
  try {
    const images = await Promise.all(files.map(resizeImage));
    const photos = getSavedGallery();
    images.forEach((image, index) => photos.push({ id: `${Date.now()}-${index}`, title, image }));
    saveGallery(photos);
    renderSavedGallery();
    adminGalleryForm.reset();
    message.textContent = "เพิ่มรูปเรียบร้อยแล้ว";
  } catch (error) {
    message.textContent = error.name === "QuotaExceededError" ? "พื้นที่เก็บรูปเต็ม กรุณาลบรูปเก่าออกก่อน" : error.message;
  }
});

document.getElementById("adminLogout").addEventListener("click", () => {
  sessionStorage.removeItem("97pueansao-admin");
  document.body.classList.remove("admin-mode");
  adminGalleryDialog.close();
});

if (sessionStorage.getItem("97pueansao-admin") === "true") document.body.classList.add("admin-mode");
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
