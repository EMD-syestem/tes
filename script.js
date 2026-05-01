/* =================================================
   REALTIME ENGINE GUARD (ANTI DOUBLE LOAD)
================================================= */
if (window.__REALTIME_LOADED__) {
  console.warn("Realtime.js already loaded");
} else {
  window.__REALTIME_LOADED__ = true;

  /* ===============================
     UI BLOCKER RESET
  ================================ */
  function resetUIBlocker() {
    const loader = document.getElementById("loader");
    if (loader) {
      loader.style.display = "none";
      loader.style.pointerEvents = "none";
    }

    const logoutLoader = document.getElementById("logoutLoader");
    if (logoutLoader) {
      logoutLoader.style.display = "none";
      logoutLoader.style.pointerEvents = "none";
    }

    document.body.style.pointerEvents = "auto";
    document.body.style.overflow = "auto";

    [".sidebar", ".main"].forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.style.opacity = "1";
        el.style.pointerEvents = "auto";
        el.style.filter = "none";
      }
    });
  }

  /* ===============================
     SCRIPT URL
  ================================ */
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxLNNOcK6aXVO0U8e8ychDBEnmVDi4k5R694ohbDs4FS5DgDU4x4YVZnD9ju00wp1gk8Q/exec";

  /* ===============================
     LOGIN HANDLER
  ================================ */
  var currentUserEmail = null;
  var heartbeatTimer = null;

  async function login(email, password) {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      body: new URLSearchParams({
        action: "login",
        email,
        password
      })
    });

    const result = await res.json();

    if (result.success && result.user) {
      currentUserEmail = result.user.email;
      resetUIBlocker();
      startHeartbeat(currentUserEmail);
    }

    return result;
  }

  /* ===============================
     HEARTBEAT (ONLINE STATUS)
  ================================ */
  function startHeartbeat(email) {
    console.log("🚀 START HEARTBEAT:", email);

    if (window.heartbeatTimer) clearInterval(window.heartbeatTimer);

    window.heartbeatTimer = setInterval(() => {
      fetch(`${SCRIPT_URL}?action=heartbeat&email=${encodeURIComponent(email)}`)
        .then((r) => r.json())
        .then((d) => console.log("❤️ HEARTBEAT:", d))
        .catch((e) => console.error("Heartbeat error:", e));
    }, 30000); // kirim tiap 30 detik
  }

  /* ===============================
     REALTIME ONLINE USERS
  ================================ */
  var lastChecksum = "";

  async function fetchOnlineUsers() {
    try {
      const res = await fetch(`${SCRIPT_URL}?action=getonlineusers`);
      const data = await res.json();

      console.log("ONLINE USERS RAW:", data);

      if (!data || !Array.isArray(data.users)) {
        console.warn("Format data online users salah / kosong:", data);
        return;
      }

      // optional checksum (kalau belum dipakai, tetap aman)
      if (data.checksum && data.checksum === lastChecksum) return;
      lastChecksum = data.checksum || "";

      renderOnlineUsers(data.users);
    } catch (e) {
      console.error("Fetch online users error FULL:", e);
    }
  }

  /* ===============================
   RENDER ONLINE USERS (FINAL + INTERACTIVE)
=============================== */
  function renderOnlineUsers(users = []) {
    const container = document.getElementById("onlineUsers");
    if (!container) return;

    if (users.length === 0) {
      container.innerHTML = `<div class="user empty">Tidak ada user online</div>`;
      return;
    }

    container.innerHTML = users
      .map((u) => {
        const noteRaw = u.note || u.pesan || u.message || u.status || "";
        const note = noteRaw.trim();
        const hasNote = note !== "";
        const isOwner = u.email === loggedUser;

        // 🔐 amankan note (anti petik, enter, emoji, dll)
        const safeNote = encodeURIComponent(note);

        return `
        <div class="user-online"
          ${
            isOwner
              ? `onclick="openNote(
                    '${u.email}',
                    '${u.nama || "-"}',
                    '${u.email}',
                    decodeURIComponent('${safeNote}')
                 )"`
              : ""
          }
          style="
            display:flex;
            align-items:flex-start;
            gap:10px;
            margin-bottom:10px;
            cursor:${isOwner ? "pointer" : "default"};
            opacity:${isOwner ? "1" : "0.9"};
          ">

          <img src="${u.foto || "default.png"}"
               onerror="this.src='default.png'"
               style="
                 width:44px;
                 height:44px;
                 border-radius:50%;
                 object-fit:cover;
                 flex-shrink:0;
               ">

          <div style="line-height:1.3; max-width:200px;">
            <div style="
              font-size:13px;
              font-weight:600;
              color:#fff;
            ">
              ${u.nama || "-"}
            </div>

            ${
              hasNote
                ? `<div style="
                    font-size:12.5px;
                    line-height:1.4;
                    background:#f1f1f1;
                    padding:8px 10px;
                    border-radius:10px;
                    margin-top:6px;
                    color:#333;
                    word-break:break-word;
                  ">
                    💬 ${note}
                  </div>`
                : `<div style="
                    font-size:11px;
                    color:#4caf50;
                    margin-top:4px;
                  ">
                    🟢 online
                  </div>`
            }
          </div>
        </div>
      `;
      })
      .join("");
  }

  /* ===============================
     START ENGINE
  ================================ */
  fetchOnlineUsers(); // load pertama
  setInterval(fetchOnlineUsers, 3000); // realtime 3 detik
}
document.addEventListener("DOMContentLoaded", () => {
  const email = localStorage.getItem("loggedUser");
  if (email) {
    console.log("🔥 RESTORE HEARTBEAT:", email);
    startHeartbeat(email);
  }
});
let noteTargetEmail = null;
let loggedUser = localStorage.getItem("loggedUser");

function openNote(email, name, owner, note = "") {
  const box = document.getElementById("noteBox");
  const title = document.getElementById("noteTargetName");
  const btnDelete = document.getElementById("btnDeleteNote");

  noteTargetEmail = email;
  lastNoteText = note || "";

  title.innerText = "💬 Kirim pesan ke " + name;
  document.getElementById("noteInput").value = lastNoteText;

  box.style.display = "block";

  const isOwner = owner === loggedUser && lastNoteText.trim() !== "";
  if (btnDelete) btnDelete.style.display = isOwner ? "inline-block" : "none";
}

function sendNote() {
  const input = document.getElementById("noteInput");
  const text = input.value.trim();
  if (!text || !noteTargetEmail) return;

  fetch(scriptURL, {
    method: "POST",
    body: new URLSearchParams({
      action: "setnote", // backend update / replace
      email: noteTargetEmail,
      note: text,
      sender: loggedUser
    })
  })
    .then((res) => res.json())
    .then((r) => {
      if (!r.success) {
        alert(r.message || "Gagal mengirim pesan");
        return;
      }
      cancelNote();
    });
}

function cancelNote() {
  document.getElementById("noteInput").value = "";
  document.getElementById("noteBox").style.display = "none";
  noteTargetEmail = null;
}

function deleteNote() {
  if (!noteTargetEmail) return;

  if (!confirm("Yakin hapus pesan ini?")) return;

  fetch(scriptURL, {
    method: "POST",
    body: new URLSearchParams({
      action: "clearnote",
      email: noteTargetEmail,
      sender: loggedUser
    })
  })
    .then((res) => res.json())
    .then((r) => {
      if (!r.success) {
        alert(r.message);
        return;
      }
      cancelNote();
    });
}

/* === FUNGSI: TAMPILKAN DASHBOARD / APLIKASI SESUAI USER === */
function showAppForUser(email) {
  const loginPage = document.getElementById("loginPage");
  const sidebar = document.querySelector(".sidebar");
  const main = document.querySelector(".main");

  if (loginPage) loginPage.style.display = "none";
  if (sidebar) sidebar.style.display = "block";
  if (main) main.style.display = "block";

  const name = email.split("@")[0];

  // ✅ SIMPAN DENGAN KEY YANG BENAR
  localStorage.setItem("reservationName", name);
  localStorage.setItem("currentEditor", name);
  localStorage.setItem("loggedUser", email);

  // ✅ TAMPIL LANGSUNG
  const cr = document.getElementById("createReservation");
  if (cr) cr.value = name;

  const userLabel = document.getElementById("loggedInUser");
  if (userLabel)
    userLabel.textContent = name.charAt(0).toUpperCase() + name.slice(1);

  currentUserEmail = email;
}

// =======================
// GLOBAL login() FUNCTION
// =======================
function login(event) {
  if (event) event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    alert("Masukkan email dan password");
    return;
  }

  document.getElementById("loader").style.display = "flex";

  fetch(
    "https://script.google.com/macros/s/AKfycbxLNNOcK6aXVO0U8e8ychDBEnmVDi4k5R694ohbDs4FS5DgDU4x4YVZnD9ju00wp1gk8Q/exec",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        action: "login",
        email: email,
        password: password
      })
    }
  )
    .then((res) => res.json())
    .then((res) => {
      document.getElementById("loader").style.display = "none";

      if (res.success) {
        localStorage.setItem("loggedUser", res.user.email);
        localStorage.setItem("reservationName", res.user.name);

        showAppForUserFromSheet(res.user);
      } else {
        alert(res.message);
      }
    })
    .catch((err) => {
      document.getElementById("loader").style.display = "none";
      alert("Login error");
      console.error(err);
    });
}

function showAppForUserFromSheet(user) {
  resetUIBlocker(); // 🔥 FIX UTAMA
  document.getElementById("loginPage").style.display = "none";
  document.querySelector(".sidebar").style.display = "block";
  document.querySelector(".main").style.display = "block";

  setTimeout(() => {
    const userImg =
      document.getElementById("userPhoto") ||
      document.querySelector(".user-info img");

    if (userImg) {
      const foto = (user.foto || "").trim();

      userImg.src =
        foto !== ""
          ? foto
          : "https://cdn-icons-png.flaticon.com/512/149/149071.png";

      userImg.onerror = () => {
        userImg.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
      };
    }

    const userLabel = document.getElementById("loggedInUser");
    if (userLabel) {
      userLabel.textContent = user.nama || "User";
    }

    const cr = document.getElementById("createReservation");
    if (cr) cr.value = user.nama || "";

    localStorage.setItem("loggedUser", user.email);
    localStorage.setItem("createReservation", user.nama || "");
    localStorage.setItem("userPhoto", user.foto || "");
    localStorage.setItem("userRole", user.role || "user");
  }, 100);
}
document.addEventListener("DOMContentLoaded", () => {
  const photo = localStorage.getItem("userPhoto");
  const name = localStorage.getItem("createReservation");

  const img =
    document.getElementById("userPhoto") ||
    document.querySelector(".user-info img");

  if (img && photo) img.src = photo;
  if (name) {
    const label = document.getElementById("loggedInUser");
    if (label) label.textContent = name;
  }
});

// Listener form dan button
const loginForm = document.getElementById("loginForm");
if (loginForm) loginForm.addEventListener("submit", (e) => login(e));

const loginBtn = document.getElementById("loginBtn");
if (loginBtn) loginBtn.addEventListener("click", (e) => login(e));

/* === FUNGSI LOGOUT (DENGAN LOADER) === */
function logout() {
  // buat elemen loader jika belum ada
  let loader = document.getElementById("logoutLoader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "logoutLoader";
    loader.innerHTML = `
      <div class="loader-overlay">
        <div class="spinner"></div>
        <p>Logging out...</p>
      </div>
    `;
    document.body.appendChild(loader);
  }

  // tampilkan loader
  loader.style.display = "flex";

  // sembunyikan sidebar dan main lebih dulu
  const sidebar = document.querySelector(".sidebar");
  const main = document.querySelector(".main");
  if (sidebar) sidebar.style.opacity = "0.5";
  if (main) main.style.opacity = "0.5";

  // proses logout dengan delay simulasi (1.5 detik)
  setTimeout(() => {
    // hapus data login dari localStorage
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("currentEditor");
    currentUserEmail = null;

    const cr = document.getElementById("createReservation");
    if (cr) cr.value = "";

    // kosongkan label user di header
    const userLabel = document.getElementById("loggedInUser");
    if (userLabel) userLabel.textContent = "Guest";

    // reset foto user ke default
    const userImg = document.querySelector(".user-info img");
    if (userImg)
      userImg.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    // tampilkan kembali halaman login
    const loginPage = document.getElementById("loginPage");
    if (loginPage) loginPage.style.display = "flex";
    if (sidebar) sidebar.style.display = "none";
    if (main) main.style.display = "none";

    // bersihkan input login
    const emailEl = document.getElementById("loginEmail");
    const passEl = document.getElementById("loginPassword");
    const errorEl = document.getElementById("loginError");
    if (emailEl) emailEl.value = "";
    if (passEl) passEl.value = "";
    if (errorEl) errorEl.textContent = "";

    // sembunyikan loader setelah logout selesai
    loader.style.display = "none";
  }, 1500);
}

/* === AUTO LOGIN (PADA RELOAD) === */
window.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) loginBtn.addEventListener("click", login);

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  const saved = localStorage.getItem("loggedUser");
  const savedEditor = localStorage.getItem("currentEditor");

  if (saved) {
    currentUserEmail = saved;
    showAppForUser(saved); // otomatis tampil dashboard jika sebelumnya login
  } else {
    const loginPage = document.getElementById("loginPage");
    const sidebar = document.querySelector(".sidebar");
    const main = document.querySelector(".main");
    if (loginPage) loginPage.style.display = "flex";
    if (sidebar) sidebar.style.display = "none";
    if (main) main.style.display = "none";
  }

  const cr = document.getElementById("createReservation");
  if (cr && savedEditor) cr.value = savedEditor;
});
/* ====== FIX: saat EDIT, nama lama selalu diganti dengan user login ====== */
function onEditReservation(recordId) {
  // Ambil user yang sedang login sekarang
  const currentEditor =
    localStorage.getItem("currentEditor") ||
    (currentUserEmail ? currentUserEmail.split("@")[0] : "Unknown");

  // Ganti kolom nama pembuat reservation (overwrite nama lama)
  const cr = document.getElementById("createReservation");
  if (cr) {
    cr.value = currentEditor;
    cr.setAttribute("data-locked", "true"); // opsional: tandai bahwa ini dari user login
  }

  console.log(`✏️ Data ID ${recordId} diedit oleh: ${currentEditor}`);

  // Contoh logika jika kamu kirim ke server
  // updateReservation(recordId, { editedBy: currentEditor });
}

/* contoh fungsi update (opsional) */
function updateReservation(recordId, data) {
  console.log(`Data ${recordId} diperbarui oleh ${data.editedBy}`);
  // fetch(scriptURL, {
  //   method: "POST",
  //   body: JSON.stringify({ id: recordId, ...data })
  // });
}

function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const icon = document.getElementById("toggleIcon");

  sidebar.classList.toggle("collapsed");

  if (sidebar.classList.contains("collapsed")) {
    icon.style.transform = "rotate(180deg)";
  } else {
    icon.style.transform = "rotate(0deg)";
  }
}
function toggleMessagePanel() {
  document.getElementById("messagePanel").classList.toggle("hidden");
}
function showSection(sectionId) {
  alert("Tampilkan: " + sectionId);
}

document.querySelectorAll(".header-whatsapp a").forEach((link) => {
  const number = link.href.replace("https://wa.me/", "");
  link.href = `whatsapp://send?phone=${number}`; // langsung ke aplikasi WA
  link.target = "_blank"; // buka di tab baru (opsional)
});

const scriptURL =
  "https://script.google.com/macros/s/AKfycbxLNNOcK6aXVO0U8e8ychDBEnmVDi4k5R694ohbDs4FS5DgDU4x4YVZnD9ju00wp1gk8Q/exec";

// === FUNGSI UTAMA NAVIGASI ===
function showSection(id, autoLoad = false) {
  // Tampilkan loading
  document.getElementById("loading").style.display = "flex";

  // Sembunyikan semua section
  document.querySelectorAll(".main-content").forEach((section) => {
    section.classList.add("hidden");
  });

  // Menampilkan section yang dipilih
  const selected = document.getElementById(id);
  if (selected) {
    selected.classList.remove("hidden");
  }

  // Memuat data sesuai section yang dipilih
  if (autoLoad) {
    setTimeout(() => {
      switch (id) {
        case "reportSection":
          loadReport();
          break;
        case "vehicleReportSection":
          loadVehicleReport();
          break;
        case "driverReportSection":
          loadDriverReport();
          break;
        case "bbmTrendSection":
          loadBBMTrend();
          break;
        case "bbmAbnormalSection": // ✅ Tambahkan ini
          loadBBMAbnormal();
          break;
        case "dashboardBBMSection":
          loadDashboardBBM();
          break;
        /* ✅ TAMBAHAN BARU */
        case "realPerjalananReportSection":
          loadRealPerjalananReport();
          break;
        case "jobReportVTSSection":
          loadJobReportVTS();
          break;
      }

      // Sembunyikan loading setelah data dimuat
      document.getElementById("loading").style.display = "none";
    }, 2000); // Ganti 2000 dengan waktu loading yang diinginkan (dalam milidetik)
  } else {
    // Sembunyikan loading jika tidak ada autoLoad
    document.getElementById("loading").style.display = "none";
  }
}

function showLoading(duration = 5000) {
  const loading = document.getElementById("loading");
  loading.style.display = "flex"; // tampilkan

  // otomatis hilang setelah duration milidetik
  setTimeout(() => {
    loading.style.display = "none";
  }, duration);
}

// Contoh pemanggilan
showLoading(5000);

// === CEK DATA BELUM UPDATE (berdasarkan kolom 'Jam update data') ===
function checkUnupdatedData() {
  fetch(scriptURL + "?action=getAllData")
    .then((res) => res.json())
    .then((data) => {
      unupdatedDataList = [];

      data.forEach((row) => {
        const jamUpdate = row["Jam update data"];
        const driver = row["Driver"];
        const kendaraan = row["KRP-Nopol"];
        const tanggal = row["Date"];

        // Jika jam update kosong → tambahkan ke daftar notif
        if (!jamUpdate || jamUpdate.trim() === "") {
          unupdatedDataList.push({
            driver: driver || "Tidak diketahui",
            kendaraan: kendaraan || "-",
            tanggal: tanggal || "-"
          });
        }
      });

      updateNotifUI();
    })
    .catch((err) => console.error("Gagal memuat data:", err));
}

// === PERBARUI TAMPILAN NOTIFIKASI ===
function updateNotifUI() {
  const badge = document.getElementById("notifBadge");
  const messageList = document.getElementById("messageList");

  if (unupdatedDataList.length > 0) {
    badge.style.display = "inline-block";
    badge.textContent = unupdatedDataList.length;

    messageList.innerHTML = unupdatedDataList
      .map(
        (item) =>
          `<li style="margin-bottom:5px;">
            🚨 <b>${item.driver}</b> (${item.kendaraan}) - ${formatDateTime(
            item.tanggal
          )}
          </li>`
      )
      .join("");
  } else {
    badge.style.display = "none";
    messageList.innerHTML = "<li>✅ Semua data sudah diperbarui.</li>";
  }
}

// === TAMPIL / SEMBUNYIKAN PANEL NOTIF ===
function toggleMessagePanel() {
  const panel = document.getElementById("messagePanel");
  panel.classList.toggle("hidden");
}

// === FORMAT TANGGAL & JAM (UTILITY) ===
function formatDateForInput(dt) {
  if (!dt) return "";
  let d = new Date(dt);
  if (isNaN(d)) return "";
  let month = (d.getMonth() + 1).toString().padStart(2, "0");
  let day = d.getDate().toString().padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function formatTime(dt) {
  if (!dt) return "";
  let d = new Date(dt);
  if (isNaN(d)) return "";
  return d.toLocaleTimeString("id-ID", { hour12: false });
}

function formatDateTime(dt) {
  if (!dt) return "";
  let d = new Date(dt);
  if (isNaN(d)) return dt;

  const tgl = d.getDate().toString().padStart(2, "0");
  const bln = (d.getMonth() + 1).toString().padStart(2, "0");
  const thn = d.getFullYear();

  const jam = d.getHours().toString().padStart(2, "0");
  const menit = d.getMinutes().toString().padStart(2, "0");

  return `${tgl}-${bln}-${thn} ${jam}:${menit}`;
}

// === JALANKAN OTOMATIS SAAT HALAMAN DIBUKA ===
document.addEventListener("DOMContentLoaded", () => {
  checkUnupdatedData();
  setInterval(checkUnupdatedData, 15000);
});

// ========= FUNGSI UTAMA PERHITUNGAN =========
function hitungBBM() {
  const kmAwal = parseFloat(document.getElementById("kmAwal").value) || 0;
  const kmAkhir = parseFloat(document.getElementById("kmAkhir").value) || 0;
  const qty =
    parseFloat(document.querySelector('input[name="QTY (L)"]').value) || 0;

  // --- Hitung Real Perjalanan ---
  const real = Math.max(0, kmAkhir - kmAwal);
  document.getElementById("realPerjalanan").value = real.toFixed(2);

  // --- Hitung Rasio BBM (ideal = 1:10) ---
  const rasioBBM = real / 10;
  document.getElementById("rasioBBM").value = rasioBBM.toFixed(2);

  // --- Hitung Rasio BBM Terinput (real ÷ QTY) ---
  const rasioTerinput = qty > 0 ? real / qty : 0;
  document.querySelector('input[name="Rasio BBM terinput"]').value = Math.round(
    rasioTerinput
  );

  // --- Tampilkan Rasio Aktual 1:x di bagian PARAMETER RASIO ---
  const rasioDisplay = document.getElementById("rasioDisplay");
  if (qty > 0 && real > 0) {
    rasioDisplay.textContent = `1:${rasioTerinput.toFixed(1)}`;
  } else {
    rasioDisplay.textContent = "1:0";
  }

  // --- Tampilkan nilai pembagian rasio (1:5 sampai 1:13) ---
  updateRasioPembagi(real);
}

// ========= PEMBAGIAN RASIO 5 - 13 =========
function updateRasioPembagi(real) {
  const rasioValues = [7, 8, 9, 10, 11, 12, 13];

  rasioValues.forEach((val, idx) => {
    const cell = document.getElementById(`rasioCalc_${val}`);
    if (cell) {
      cell.textContent = (real / val).toFixed(1);
    }
  });
}

// ========= EVENT LISTENER =========
document.getElementById("kmAwal").addEventListener("input", hitungBBM);
document.getElementById("kmAkhir").addEventListener("input", hitungBBM);
document
  .querySelector('input[name="QTY (L)"]')
  .addEventListener("input", hitungBBM);

// ==============================
// FOTO KM + FOTO BUKTI
// ==============================
document
  .getElementById("updatePhotoKM")
  .addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (evt) {
      submitPhotoKMBase64 = evt.target.result;

      document.getElementById("previewKM").src = submitPhotoKMBase64;
      document.getElementById("previewKMContainer").style.display = "block";
    };

    reader.readAsDataURL(file);
  });

document
  .getElementById("updatePhotoBukti")
  .addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (evt) {
      submitPhotoBuktiBase64 = evt.target.result;

      document.getElementById("previewBukti").src = submitPhotoBuktiBase64;
      document.getElementById("previewBuktiContainer").style.display = "block";
    };

    reader.readAsDataURL(file);
  });

// GLOBAL FOTO
let submitPhotoKMBase64 = "";
let submitPhotoKMLink = "";

let submitPhotoBuktiBase64 = "";
let submitPhotoBuktiLink = "";

let updatedPhotoKMBase64 = "";
let updatedPhotoKMLink = "";

let updatedPhotoBase64 = "";
let updatedPhotoLink = "";

// ==============================
// SUBMIT DATA BARU
// ==============================
document.getElementById("myForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // cek FOTO KM wajib ada
  const previewKM = document.getElementById("previewKM");
  const hasPhotoKM =
    submitPhotoKMBase64 ||
    submitPhotoKMLink ||
    (previewKM && previewKM.src);

  if (!hasPhotoKM) {
    alert("📷 Foto KM wajib diupload / paste / isi link terlebih dahulu!");
    return;
  }

  let formData = new FormData(e.target);
  formData.set("action", "submit");

  const now = new Date();
  formData.set("Date", formData.get("Date") || now.toISOString().split("T")[0]);
  formData.set("Jam submit", now.toLocaleString("id-ID", { hour12: false }));
  formData.set("Jam update", "");

  // kirim Foto KM
  if (submitPhotoKMLink) {
    formData.set("Foto KM", submitPhotoKMLink);
  } else if (submitPhotoKMBase64) {
    formData.set("Foto KM", submitPhotoKMBase64);
  } else if (previewKM?.src) {
    formData.set("Foto KM", previewKM.src);
  }

  // Foto Bukti optional
  if (submitPhotoBuktiLink) {
    formData.set("Foto Bukti", submitPhotoBuktiLink);
  } else if (submitPhotoBuktiBase64) {
    formData.set("Foto Bukti", submitPhotoBuktiBase64);
  }

  document.getElementById("loading").style.display = "flex";

  fetch(scriptURL, {
    method: "POST",
    body: formData
  })
    .then((res) => res.text())
    .then((msg) => {
      document.getElementById("status").innerHTML = msg;

      const savedName = localStorage.getItem("reservationName");
      e.target.reset();

      // reset semua variable foto
      submitPhotoKMBase64 = "";
      submitPhotoKMLink = "";
      submitPhotoBuktiBase64 = "";
      submitPhotoBuktiLink = "";

      updatedPhotoKMBase64 = "";
      updatedPhotoKMLink = "";
      updatedPhotoBase64 = "";
      updatedPhotoLink = "";

      // reset preview
      document.getElementById("previewKM").src = "";
      document.getElementById("previewBukti").src = "";

      document.getElementById("previewKMContainer").style.display = "none";
      document.getElementById("previewBuktiContainer").style.display = "none";

      if (document.getElementById("createReservation")) {
        document.getElementById("createReservation").value = savedName;
      }

      editRowIndex = null;

      loadReport();
      loadVehicleReport();
    })
    .catch((err) => {
      document.getElementById("status").innerHTML = "❌ Gagal: " + err.message;
    })
    .finally(() => {
      document.getElementById("loading").style.display = "none";
    });
});
// === Edit Data Terakhir Berdasarkan KRP-Nopol ===
document.getElementById("editBtn").addEventListener("click", () => {
  const nopol = document.querySelector('select[name="KRP-Nopol"]').value;
  if (!nopol) {
    alert("Pilih KRP-Nopol dulu!");
    return;
  }

  // Tampilkan loading
  document.getElementById("loading").style.display = "flex";

  fetch(`${scriptURL}?KRP-Nopol=${encodeURIComponent(nopol)}`)
    .then((res) => res.json())
    .then((res) => {
      if (!res.success) return alert("❌ " + res.message);
      const data = res.data;
      editRowIndex = data.rowIndex;

      const form = document.getElementById("myForm").elements;
      const currentEditor = localStorage.getItem("currentEditor") || "Unknown";

      for (const key in data) {
        if (form[key]) {
          if (key === "CreateReservation" || key === "createReservation")
            continue;
          form[key].value =
            key === "Date" ? formatDateForInput(data[key]) : data[key];
        }
      }

      if (form["CreateReservation"])
        form["CreateReservation"].value = currentEditor;
      if (form["createReservation"])
        form["createReservation"].value = currentEditor;

      alert(`✅ Data terakhir KRP ${nopol} dimuat (baris ${editRowIndex})`);
      if (typeof hitungPerjalanan === "function") hitungPerjalanan();
    })
    .catch((err) => alert("❌ Gagal ambil data: " + err.message))
    .finally(() => {
      // Sembunyikan loading
      document.getElementById("loading").style.display = "none";
    });
});

// === 🆕 Upload / Paste Foto Saat UPDATE Data ===
document.addEventListener("DOMContentLoaded", function () {
  const inputKM = document.getElementById("updatePhotoKM");
  const inputBukti = document.getElementById("updatePhotoBukti");

  const linkKM = document.getElementById("linkPhotoKM");
  const linkBukti = document.getElementById("linkPhotoBukti");

  const previewKM = document.getElementById("previewKM");
  const previewBukti = document.getElementById("previewBukti");

  const previewKMContainer = document.getElementById("previewKMContainer");
  const previewBuktiContainer = document.getElementById("previewBuktiContainer");

  let activeTarget = null;

  // pilih target paste
  [inputKM, linkKM, previewKMContainer].forEach((el) => {
    if (!el) return;

    el.addEventListener("focus", () => {
      activeTarget = "km";
    });

    el.addEventListener("click", () => {
      activeTarget = "km";
    });
  });

  [inputBukti, linkBukti, previewBuktiContainer].forEach((el) => {
    if (!el) return;

    el.addEventListener("focus", () => {
      activeTarget = "bukti";
    });

    el.addEventListener("click", () => {
      activeTarget = "bukti";
    });
  });

  // ===== upload KM =====
  inputKM?.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (ev) {
      const img = ev.target.result;

      // submit
      submitPhotoKMBase64 = img;
      submitPhotoKMLink = "";

      // update
      updatedPhotoKMBase64 = img;
      updatedPhotoKMLink = "";

      previewKM.src = img;
      previewKMContainer.style.display = "block";
    };

    reader.readAsDataURL(file);
  });

  // ===== upload Bukti =====
  inputBukti?.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (ev) {
      const img = ev.target.result;

      // submit
      submitPhotoBuktiBase64 = img;
      submitPhotoBuktiLink = "";

      // update
      updatedPhotoBase64 = img;
      updatedPhotoLink = "";

      previewBukti.src = img;
      previewBuktiContainer.style.display = "block";
    };

    reader.readAsDataURL(file);
  });

  // ===== link KM =====
  linkKM?.addEventListener("input", function () {
    const url = this.value.trim();

    // submit
    submitPhotoKMLink = url;
    submitPhotoKMBase64 = "";

    // update
    updatedPhotoKMLink = url;
    updatedPhotoKMBase64 = "";

    if (url) {
      previewKM.src = url;
      previewKMContainer.style.display = "block";
    }
  });

  // ===== link Bukti =====
  linkBukti?.addEventListener("input", function () {
    const url = this.value.trim();

    // submit
    submitPhotoBuktiLink = url;
    submitPhotoBuktiBase64 = "";

    // update
    updatedPhotoLink = url;
    updatedPhotoBase64 = "";

    if (url) {
      previewBukti.src = url;
      previewBuktiContainer.style.display = "block";
    }
  });

  // ===== paste image =====
  document.addEventListener("paste", function (event) {
    const items = event.clipboardData?.items || [];

    for (const item of items) {
      if (!item.type.includes("image")) continue;

      const file = item.getAsFile();
      const reader = new FileReader();

      reader.onload = function (e) {
        const base64 = e.target.result;

        // FOTO KM
        if (activeTarget === "km") {
          // submit
          submitPhotoKMBase64 = base64;
          submitPhotoKMLink = "";

          // update
          updatedPhotoKMBase64 = base64;
          updatedPhotoKMLink = "";

          previewKM.src = base64;
          previewKMContainer.style.display = "block";
        }

        // FOTO BUKTI
        if (activeTarget === "bukti") {
          // submit
          submitPhotoBuktiBase64 = base64;
          submitPhotoBuktiLink = "";

          // update
          updatedPhotoBase64 = base64;
          updatedPhotoLink = "";

          previewBukti.src = base64;
          previewBuktiContainer.style.display = "block";
        }
      };

      reader.readAsDataURL(file);
      break;
    }
  });
});
/// === Update Data Berdasarkan Row Index ===
document.getElementById("updateBtn").addEventListener("click", () => {
  if (!editRowIndex) {
    alert("Silakan tekan tombol Edit dulu!");
    return;
  }

  const form = document.getElementById("myForm");
  const formData = new FormData(form);

  formData.set("action", "update");
  formData.set("rowIndex", editRowIndex);
  formData.set(
    "Jam update",
    new Date().toLocaleString("id-ID", { hour12: false })
  );

  // =========================
  // FOTO KM
  // =========================
  if (updatedPhotoKMLink) {
    formData.set("Foto KM", updatedPhotoKMLink);
  } else if (updatedPhotoKMBase64) {
    formData.set("Foto KM", updatedPhotoKMBase64);
  }

  // =========================
  // FOTO BUKTI
  // =========================
  if (updatedPhotoLink) {
    formData.set("Foto Bukti", updatedPhotoLink);
  } else if (updatedPhotoBase64) {
    formData.set("Foto Bukti", updatedPhotoBase64);
  }

  // user
  const savedName = localStorage.getItem("reservationName") || "Unknown";
  formData.set("CreateReservation", savedName);

  // loading
  document.getElementById("loading").style.display = "flex";

  fetch(scriptURL, {
    method: "POST",
    body: formData
  })
    .then((res) => res.text())
    .then((msg) => {
      document.getElementById("status").innerHTML = msg;

      // reset form
      form.reset();

      // kembalikan nama
      const createReservation = document.getElementById("createReservation");

      if (createReservation) {
        createReservation.value = savedName;
      }

      // reset variable
      updatedPhotoKMBase64 = "";
      updatedPhotoKMLink = "";

      updatedPhotoBase64 = "";
      updatedPhotoLink = "";

      submitPhotoKMBase64 = "";
      submitPhotoKMLink = "";

      submitPhotoBuktiBase64 = "";
      submitPhotoBuktiLink = "";

      editRowIndex = null;

      // =========================
      // RESET FOTO BUKTI
      // =========================
      const fileBukti = document.getElementById("updatePhotoBukti");
      const linkBukti = document.getElementById("linkPhotoBukti");
      const previewBukti = document.getElementById("previewBukti");
      const previewBuktiContainer =
        document.getElementById("previewBuktiContainer");

      if (fileBukti) fileBukti.value = "";
      if (linkBukti) linkBukti.value = "";
      if (previewBukti) previewBukti.src = "";
      if (previewBuktiContainer) previewBuktiContainer.style.display = "none";

      // =========================
      // RESET FOTO KM
      // =========================
      const fileKM = document.getElementById("updatePhotoKM");
      const linkKM = document.getElementById("linkPhotoKM");
      const previewKM = document.getElementById("previewKM");
      const previewKMContainer =
        document.getElementById("previewKMContainer");

      if (fileKM) fileKM.value = "";
      if (linkKM) linkKM.value = "";
      if (previewKM) previewKM.src = "";
      if (previewKMContainer) previewKMContainer.style.display = "none";

      // reload
      loadReport();
      loadVehicleReport();
    })
    .catch((err) => {
      document.getElementById("status").innerHTML =
        "❌ Gagal update: " + err.message;
    })
    .finally(() => {
      document.getElementById("loading").style.display = "none";
    });
});
function loadReport() {
  // === Buat loader jika belum ada ===
  let loader = document.getElementById("loadReportLoader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "loadReportLoader";
    loader.style.display = "none";
    loader.innerHTML = `
      <div class="loader-overlay">
        <div style="display:flex; flex-direction:column; align-items:center;">
          <div class="spinner"></div>
          <p style="margin-top:10px; font-size:16px; color:#007ACC;">Memuat laporan...</p>
        </div>
      </div>
    `;
    document.body.appendChild(loader);
  }

  // tampilkan loader
  loader.style.display = "flex";

  const url = `${scriptURL}?action=getalldata`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.querySelector("#reportTable tbody");
      if (!tbody) return;
      tbody.innerHTML = "";

      if (!Array.isArray(data)) {
        tbody.innerHTML = `<tr><td colspan='17'>${
          data?.message || "Gagal memuat data"
        }</td></tr>`;
        return;
      }

      if (data.length === 0) {
        tbody.innerHTML = "<tr><td colspan='17'>Tidak ada data</td></tr>";
        return;
      }

      reportData = data;
      renderFilteredReport(data);
    })
    .catch((err) => console.error("❌ [loadReport] Gagal load report:", err))
    .finally(() => {
      // sembunyikan loader
      loader.style.display = "none";
    });
}

// === 🔹 Render Table dengan Kolom Foto Bukti ===
function renderFilteredReport(data) {
  const tbody = document.querySelector("#reportTable tbody");
  tbody.innerHTML = "";

  const keys = [
    "Date",
    "Fungsi",
    "WKP",
    "Discription",
    "Driver",
    "KRP-Nopol",
    "KM awal",
    "KM akhir",
    "Real perjalanan",
    "Rasio BBM (L)",
    "QTY (L)",
    "Create reservation",
    "Rasio BBM terinput",
    "Jam submit data",
    "Jam update data",
    "Tempat Pengisian",
    "Foto KM",
    "Foto Bukti"
  ];

  if (!data || data.length === 0) {
    tbody.innerHTML = "<tr><td colspan='18'>Tidak ada data ditemukan</td></tr>";
    return;
  }

  data.forEach((row) => {
    const tr = document.createElement("tr");

    keys.forEach((key) => {
      const td = document.createElement("td");
      let value = row[key] ?? "";

      // =====================
      // FORMAT TANGGAL
      // =====================
      if (key === "Date" && value) {
        value = new Date(value).toLocaleDateString("id-ID");
      }

      // =====================
      // FORMAT JAM
      // =====================
      if ((key === "Jam submit data" || key === "Jam update data") && value) {
        value = new Date(value).toLocaleString("id-ID", { hour12: false });
      }

      // =====================
      // FOTO (KM & BUKTI) - FIX FULL BASE64
      // =====================
      if (key === "Foto Bukti" || key === "Foto KM") {
        if (value && typeof value === "string") {
          // 🔥 MODE 1: BASE64 (REKOMENDASI UTAMA)
          if (value.startsWith("data:image")) {
            td.innerHTML = `
              <img src="${value}"
                   style="width:70px;height:70px;border-radius:10px;object-fit:cover;cursor:pointer;">
            `;
          } else {
            let fileId = "";

            const patterns = [
              /\/d\/([a-zA-Z0-9_-]{10,})/,
              /id=([a-zA-Z0-9_-]{10,})/,
              /file\/d\/([a-zA-Z0-9_-]{10,})/
            ];

            for (const pattern of patterns) {
              const match = value.match(pattern);
              if (match && match[1]) {
                fileId = match[1];
                break;
              }
            }

            const photoURL = fileId
              ? `https://lh3.googleusercontent.com/d/${fileId}=s220` // tampil
              : value;

            const realURL = fileId
              ? `https://drive.google.com/uc?export=view&id=${fileId}` // excel
              : value;

            const linkURL = fileId
              ? `https://drive.google.com/file/d/${fileId}/view`
              : value;

            td.innerHTML = `
    <a href="${linkURL}" target="_blank">
      <img src="${photoURL}"
           data-src="${realURL}"
           loading="lazy"
           style="width:70px;height:70px;border-radius:10px;object-fit:cover;cursor:pointer;"
           onerror="this.src='https://drive.google.com/thumbnail?id=${fileId}'">
    </a>
  `;
          }
        } else {
          td.innerHTML = "<span style='color:#aaa;'>📷 Tidak ada foto</span>";
        }
      } else {
        td.textContent = value;
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}
// =================================================
// 🔎 FILTER DATA (RENTANG TANGGAL + NOPOL + DRIVER)
// =================================================
function applyFilter() {
  const dateFrom = document.getElementById("filterDateFrom")?.value;
  const dateTo = document.getElementById("filterDateTo")?.value;

  const nopol = document
    .getElementById("filterNopol")
    ?.value.trim()
    .toLowerCase();

  const driver = document
    .getElementById("filterDriver")
    ?.value.trim()
    .toLowerCase();

  if (!reportData || reportData.length === 0) {
    alert("⚠️ Data belum dimuat. Silakan klik Refresh Data terlebih dahulu.");
    return;
  }

  const filtered = reportData.filter((row) => {
    let rowDate = row["Date"] ? new Date(row["Date"]) : null;

    // ==== FILTER TANGGAL RANGE ====
    let matchDate = true;

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      matchDate = rowDate && rowDate >= from;
    }

    if (matchDate && dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      matchDate = rowDate && rowDate <= to;
    }

    // ==== FILTER NOPOL ====
    const matchNopol =
      !nopol ||
      (row["KRP-Nopol"] && row["KRP-Nopol"].toLowerCase().includes(nopol));

    // ==== FILTER DRIVER ====
    const matchDriver =
      !driver ||
      (row["Driver"] && row["Driver"].toLowerCase().includes(driver));

    return matchDate && matchNopol && matchDriver;
  });

  renderFilteredReport(filtered);
}

// =======================
// 🔄 RESET FILTER
// =======================
function resetFilter() {
  document.getElementById("filterDateFrom").value = "";
  document.getElementById("filterDateTo").value = "";
  document.getElementById("filterNopol").value = "";
  document.getElementById("filterDriver").value = "";

  renderFilteredReport(reportData);
}

function loadVehicleReport() {
  const startDateInput = document.getElementById("vehicleStartDate")?.value;
  const endDateInput = document.getElementById("vehicleEndDate")?.value;
  const startDate = startDateInput ? new Date(startDateInput) : null;
  const endDate = endDateInput ? new Date(endDateInput) : null;

  const url = `${scriptURL}?action=getalldata`;
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      console.log("📊 [loadVehicleReport] Data diterima:", data);

      const headerRow = document.getElementById("vehicleReportHeader");
      const body = document.getElementById("vehicleReportBody");

      if (!headerRow || !body) {
        console.error("❌ Elemen tabel kendaraan tidak ditemukan di HTML.");
        return;
      }

      if (!Array.isArray(data)) {
        body.innerHTML = `<tr><td colspan='100%'>${
          data?.message || "Gagal memuat data"
        }</td></tr>`;
        return;
      }

      if (data.length === 0) {
        body.innerHTML = "<tr><td colspan='100%'>Tidak ada data</td></tr>";
        return;
      }

      // === Ambil tanggal unik ===
      let uniqueDates = [
        ...new Set(data.map((item) => item["Date"]).filter(Boolean))
      ]
        .map((d) => new Date(d))
        .sort((a, b) => a - b);

      // === Jika user belum isi filter tanggal, tampilkan 10 hari terakhir ===
      if (!startDate && !endDate && uniqueDates.length > 10) {
        uniqueDates = uniqueDates.slice(-10);
      }

      // === Filter berdasarkan tanggal input (jika ada) ===
      if (startDate) uniqueDates = uniqueDates.filter((d) => d >= startDate);
      if (endDate) uniqueDates = uniqueDates.filter((d) => d <= endDate);

      const vehicles = [
        ...new Set(data.map((item) => item["KRP-Nopol"]).filter(Boolean))
      ];

      // === Pivot Data ===
      const pivot = {};
      vehicles.forEach((v) => {
        pivot[v] = {};
        uniqueDates.forEach((d) => (pivot[v][d.toISOString()] = 0));
      });

      data.forEach((item) => {
        const kendaraan = item["KRP-Nopol"];
        const tanggal = new Date(item["Date"]).toISOString();
        const qty = parseFloat(item["QTY (L)"]) || 0;
        if (kendaraan && pivot[kendaraan]?.hasOwnProperty(tanggal)) {
          pivot[kendaraan][tanggal] += qty;
        }
      });

      // === Header Tabel ===
      headerRow.innerHTML =
        "<th>Kendaraan</th>" +
        uniqueDates
          .map((d) => `<th>${d.toLocaleDateString("id-ID")}</th>`)
          .join("") +
        "<th>Total</th>";

      // === Isi Body Tabel ===
      body.innerHTML = "";
      vehicles.forEach((v) => {
        let total = 0;
        const cells = uniqueDates
          .map((d) => {
            const val = pivot[v][d.toISOString()] || 0;
            total += val;
            return `<td>${val ? val.toFixed(2) : ""}</td>`;
          })
          .join("");
        body.innerHTML += `<tr><td><b>${v}</b></td>${cells}<td><b>${total.toFixed(
          2
        )}</b></td></tr>`;
      });

      // === Grand Total ===
      let grandRow = "<tr><td><b>Grand Total</b></td>";
      let grandTotal = 0;
      uniqueDates.forEach((d) => {
        let sum = 0;
        vehicles.forEach((v) => (sum += pivot[v][d.toISOString()] || 0));
        grandRow += `<td><b>${sum.toFixed(2)}</b></td>`;
        grandTotal += sum;
      });
      grandRow += `<td><b>${grandTotal.toFixed(2)}</b></td></tr>`;
      body.innerHTML += grandRow;
    })
    .catch((err) =>
      console.error("❌ [loadVehicleReport] Gagal memuat Vehicle report:", err)
    );
}
function fixGoogleDriveUrl(url) {
  if (!url) return "";

  // format /d/ID
  let match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }

  // format id=ID
  match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }

  // 🔥 KHUSUS lh3.googleusercontent (FIX TEPAT)
  if (url.includes("lh3.googleusercontent.com")) {
    const matchLh3 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (matchLh3) {
      return `https://drive.google.com/uc?export=view&id=${matchLh3[1]}`;
    }
  }

  return url;
}
async function downloadTableAsExcel(bodyTableId, filename) {
  // ================= LOADER =================
  let loader = document.getElementById("excelDownloadLoader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "excelDownloadLoader";
    loader.innerHTML = `
      <div class="loader-overlay">
        <div class="spinner"></div>
        <p style="margin-top:10px; color:#007ACC; font-weight:bold;">
          Sedang membuat file Excel...
        </p>
      </div>
    `;
    document.body.appendChild(loader);
  }

  loader.style.display = "flex";

  try {
    const bodyTable = document.getElementById(bodyTableId);
    if (!bodyTable) return alert("Tabel body tidak ditemukan!");

    const headerDiv = bodyTable
      .closest(".card")
      .querySelector(".table-header table thead");

    if (!headerDiv) return alert("Header tabel tidak ditemukan!");

    const headers = Array.from(headerDiv.querySelectorAll("th")).map((th) =>
      th.innerText.trim()
    );

    const rows = Array.from(bodyTable.querySelectorAll("tr"));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Report");

    sheet.addRow(headers);

    // ================= HEADER STYLE =================
    const headerRow = sheet.getRow(1);
    headerRow.height = 25;

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF007ACC" }
      };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // ================= LOOP DATA =================
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll("td");

      // TEXT ROW
      const rowValues = Array.from(cells).map((cell) =>
        cell.querySelector("img") || cell.querySelector("a")
          ? ""
          : cell.innerText.trim()
      );

      sheet.addRow(rowValues);

      // ================= HANDLE IMAGE =================
      for (let j = 0; j < cells.length; j++) {
        const cell = cells[j];
        const img = cell.querySelector("img");

        if (!img) continue;

        let imageBuffer = null;
        let ext = "jpeg";

        try {
          // ================= BASE64 =================
          if (img.src.startsWith("data:image")) {
            const imageId = workbook.addImage({
              base64: img.src,
              extension: "jpeg"
            });

            sheet.addImage(imageId, {
              tl: { col: j + 0.15, row: i + 1.2 },
              ext: { width: 90, height: 70 }
            });

            sheet.getRow(i + 2).height = 55;
            continue;
          }

          // ================= CANVAS (ANTI CORS) =================
          await new Promise((resolve) => {
            const tempImg = new Image();
            tempImg.crossOrigin = "anonymous";

            // 🔥 gunakan src yang tampil (bukan fetch)
            tempImg.src = img.src;

            tempImg.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = tempImg.naturalWidth;
              canvas.height = tempImg.naturalHeight;

              const ctx = canvas.getContext("2d");
              ctx.drawImage(tempImg, 0, 0);

              canvas.toBlob(async (blob) => {
                if (!blob) return resolve();

                imageBuffer = await blob.arrayBuffer();
                ext = blob.type.includes("png") ? "png" : "jpeg";

                resolve();
              }, "image/jpeg");
            };

            tempImg.onerror = resolve;
          });

          if (!imageBuffer) continue;

          const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension: ext
          });

          sheet.addImage(imageId, {
            tl: { col: j + 0.15, row: i + 1.2 },
            ext: { width: 90, height: 70 }
          });

          sheet.getRow(i + 2).height = 55;
        } catch (err) {
          console.error("Gagal load gambar:", err);
        }
      }
    }

    // ================= STYLE BODY =================
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.alignment = {
            vertical: "middle",
            horizontal: "left",
            wrapText: true
          };
        });
      }
    });

    sheet.columns.forEach((col) => (col.width = 25));

    // ================= DOWNLOAD =================
    const buffer = await workbook.xlsx.writeBuffer();

    saveAs(
      new Blob([buffer]),
      `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  } finally {
    loader.style.display = "none";
  }
}
// === Report BBM Per Driver (Tabel per tanggal & kendaraan) ===
function loadDriverReport() {
  const selectedMonth = document.getElementById("filterMonth")?.value;
  // format: 2026-02

  fetch(scriptURL + "?action=getAllData")
    .then((response) => {
      if (!response.ok) throw new Error("Gagal ambil data dari server");
      return response.json();
    })
    .then((data) => {
      console.log("📊 [Driver Report] Data diterima:", data);

      const body = document.getElementById("driverReportBody");
      body.innerHTML = "";

      if (!Array.isArray(data) || data.length === 0) {
        body.innerHTML = "<tr><td colspan='4'>Tidak ada data</td></tr>";
        return;
      }

      // ==============================
      // ✅ FILTER BULAN DI SINI
      // ==============================
      let filteredData = data;

      if (selectedMonth) {
        filteredData = data.filter((row) => {
          if (!row["Date"]) return false;

          const dateObj = new Date(row["Date"]);
          const yearMonth =
            dateObj.getFullYear() +
            "-" +
            String(dateObj.getMonth() + 1).padStart(2, "0");

          return yearMonth === selectedMonth;
        });
      }

      if (filteredData.length === 0) {
        body.innerHTML =
          "<tr><td colspan='4'>Tidak ada data pada bulan ini</td></tr>";
        return;
      }

      // 🔹 Ambil semua tanggal unik
      const tanggalSet = new Set();
      filteredData.forEach((row) => {
        if (row["Date"]) {
          const tgl = new Date(row["Date"]).toLocaleDateString("id-ID");
          tanggalSet.add(tgl);
        }
      });

      const tanggalList = Array.from(tanggalSet).sort(
        (a, b) =>
          new Date(a.split("/").reverse().join("-")) -
          new Date(b.split("/").reverse().join("-"))
      );

      // 🔹 Kelompokkan data
      const driverMap = {};
      filteredData.forEach((row) => {
        const driver = row["Driver"] || "-";
        const tanggal = row["Date"]
          ? new Date(row["Date"]).toLocaleDateString("id-ID")
          : "-";

        const nopol =
          row["KRP-Nopol"] ||
          row["KRP Nopol"] ||
          row["Nopol"] ||
          row["No Polisi"] ||
          row["Inisial Kendaraan"] ||
          "-";

        const liter = parseFloat(row["QTY (L)"] || 0);

        if (!driverMap[driver]) driverMap[driver] = {};
        if (!driverMap[driver][tanggal]) driverMap[driver][tanggal] = {};
        if (!driverMap[driver][tanggal][nopol])
          driverMap[driver][tanggal][nopol] = 0;

        driverMap[driver][tanggal][nopol] += liter;
      });

      // 🔹 Tampilkan data
      Object.keys(driverMap).forEach((driver) => {
        let total = 0;
        let tanggalHTML = "";
        let kendaraanHTML = "";

        tanggalList.forEach((tgl) => {
          if (driverMap[driver][tgl]) {
            Object.keys(driverMap[driver][tgl]).forEach((nopol) => {
              const liter = driverMap[driver][tgl][nopol];
              if (liter > 0) {
                tanggalHTML += `<div>${tgl}</div>`;
                kendaraanHTML += `<div>${nopol}: ${liter.toFixed(2)} L</div>`;
                total += liter;
              }
            });
          }
        });

        const rowHTML = `
          <tr>
            <td>${driver}</td>
            <td style="text-align:left">${tanggalHTML || "-"}</td>
            <td style="text-align:left">${kendaraanHTML || "-"}</td>
            <td><b>${total.toFixed(2)}</b></td>
          </tr>`;

        body.insertAdjacentHTML("beforeend", rowHTML);
      });
    })
    .catch((err) => {
      console.error("⚠️ [Driver Report] Error:", err);
      document.getElementById("driverReportBody").innerHTML =
        "<tr><td colspan='4'>Terjadi kesalahan memuat data</td></tr>";
    });
}

// === LOAD REPORT TREN BBM (DENGAN PERSENTASE, EFISIENSI & DETEKSI ANOMALI) ===
function loadBBMTrend() {
  fetch(scriptURL + "?action=getAllData")
    .then((res) => res.json())
    .then((data) => {
      if (!Array.isArray(data) || data.length === 0) {
        alert("⚠️ Tidak ada data BBM ditemukan.");
        return;
      }

      // === Deteksi otomatis nama kolom ===
      const firstRow = data[0];
      const bbmKey =
        Object.keys(firstRow).find(
          (key) =>
            key.toLowerCase().includes("bbm") &&
            !key.toLowerCase().includes("laporan")
        ) || "Jumlah BBM";

      const nopolKey =
        Object.keys(firstRow).find(
          (key) =>
            key.toLowerCase().includes("nopol") ||
            key.toLowerCase().includes("krp")
        ) || "KRP-Nopol";

      const driverKey =
        Object.keys(firstRow).find((key) =>
          key.toLowerCase().includes("driver")
        ) || "Nama Driver";

      const kmAwalKey =
        Object.keys(firstRow).find((key) =>
          key.toLowerCase().includes("km awal")
        ) || null;

      const kmAkhirKey =
        Object.keys(firstRow).find((key) =>
          key.toLowerCase().includes("km akhir")
        ) || null;

      const sorted = data.sort((a, b) => {
        if (a[nopolKey] === b[nopolKey]) {
          return new Date(a.Date) - new Date(b.Date);
        }
        return a[nopolKey].localeCompare(b[nopolKey]);
      });

      const trendRows = [];
      let lastData = {};
      let counter = 1;

      for (const row of sorted) {
        const krp = row[nopolKey] || "-";
        const driver = row[driverKey] || "-";
        const tanggal = row["Date"]
          ? new Date(row["Date"]).toLocaleDateString("id-ID")
          : "-";
        const jumlah = parseFloat(row[bbmKey]) || 0;
        const kmAwal = parseFloat(row[kmAwalKey]) || 0;
        const kmAkhir = parseFloat(row[kmAkhirKey]) || 0;
        const jarak = kmAkhir - kmAwal;

        // === Efisiensi per KM ===
        const efisiensiLiterPerKM =
          jarak > 0 ? (jumlah / jarak).toFixed(3) : "-";

        // === Analisis perubahan BBM ===
        let status = "📍 Data Awal";
        let percentChange = "-";
        let catatan = "-";

        if (lastData[krp] !== undefined) {
          const prev = lastData[krp].jumlah;
          const diff = jumlah - prev;
          percentChange =
            prev !== 0 ? ((diff / prev) * 100).toFixed(2) : "0.00";

          if (diff > 0) {
            if (percentChange > 100) {
              status = "🚨 Naik Tidak Normal";
              catatan = "⚠️ Anomali BBM (kenaikan >100%)";
            } else {
              status = "🔺 Naik";
            }
          } else if (diff < 0) {
            status = "🔻 Turun";
          } else {
            status = "⚖️ Stabil";
          }
        }

        trendRows.push({
          no: counter++,
          krp,
          driver,
          tanggal,
          jumlah: jumlah.toFixed(2),
          kmAwal: kmAwal > 0 ? kmAwal.toString() : "-",
          kmAkhir: kmAkhir > 0 ? kmAkhir.toString() : "-",
          persen: percentChange + "%",
          status,
          literPerKM: efisiensiLiterPerKM,
          catatan
        });

        // Simpan data terakhir
        lastData[krp] = { jumlah };
      }

      // === Isi tabel ===
      const tbody = document.querySelector("#bbmTrendTable tbody");
      tbody.innerHTML = "";

      if (trendRows.length === 0) {
        tbody.innerHTML = "<tr><td colspan='11'>Belum ada data BBM</td></tr>";
        return;
      }

      for (const r of trendRows) {
        const anomalyClass = r.catatan.includes("Anomali")
          ? "style='background:#ffe0e0;'"
          : "";
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <tr ${anomalyClass}>
            <td>${r.no}</td>
            <td>${r.krp}</td>
            <td>${r.driver}</td>
            <td>${r.tanggal}</td>
            <td>${r.jumlah}</td>
            <td>${r.kmAwal}</td>
            <td>${r.kmAkhir}</td>
            <td>${r.persen}</td>
            <td>${r.status}</td>
            <td>${r.literPerKM}</td>
            <td>${r.catatan}</td>
          </tr>
        `;
        tbody.appendChild(tr);
      }
    })
    .catch((err) => {
      console.error("❌ Gagal ambil data:", err);
      alert("Gagal memuat tren BBM: " + err.message);
    });
}

// === INISIALISASI DROPDOWN OTOMATIS UNTUK KENDARAAN ===
function initVehicleDropdown() {
  fetch(scriptURL + "?action=getAllData")
    .then((res) => res.json())
    .then((data) => {
      const dropdown = document.getElementById("vehicleSelect");
      dropdown.innerHTML = "<option value=''>-- Pilih KRP / Nopol --</option>";

      if (!Array.isArray(data) || data.length === 0) {
        dropdown.innerHTML +=
          "<option disabled>Tidak ada data kendaraan</option>";
        return;
      }

      // Ambil daftar kendaraan unik dari kolom "KRP-Nopol"
      const kendaraanSet = new Set();
      data.forEach((item) => {
        const kendaraan = item["KRP-Nopol"];
        if (kendaraan) kendaraanSet.add(kendaraan);
      });

      // Isi dropdown
      kendaraanSet.forEach((k) => {
        const opt = document.createElement("option");
        opt.value = k;
        opt.textContent = k;
        dropdown.appendChild(opt);
      });

      console.log("✅ Dropdown kendaraan berhasil dimuat:", [...kendaraanSet]);
    })
    .catch((err) => console.error("❌ Gagal memuat dropdown kendaraan:", err));
}

// === LOAD GRAFIK SESUAI KENDARAAN DIPILIH ===
function loadVehicleChart() {
  const kendaraanDipilih = document.getElementById("vehicleSelect").value;
  if (!kendaraanDipilih) {
    alert("Pilih kendaraan terlebih dahulu!");
    return;
  }

  fetch(scriptURL + "?action=getAllData")
    .then((res) => res.json())
    .then((data) => {
      const filterData = data.filter(
        (d) => d["KRP-Nopol"] === kendaraanDipilih
      );

      if (!filterData.length) {
        alert("Tidak ada data untuk kendaraan ini.");
        return;
      }

      // ================= TANGGAL =================
      const tanggal = filterData.map((d) => {
        const raw = d["Date"];
        if (!raw) return "";
        const t = new Date(raw);
        return isNaN(t)
          ? raw
          : t.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric"
            });
      });

      // ================= QTY =================
      const qty = filterData.map((d) => {
        const val = d["QTY (L)"];
        const num = parseFloat(
          String(val)
            .replace(/[^\d.,-]/g, "")
            .replace(",", ".")
        );
        return isNaN(num) ? 0 : num;
      });

      // ================= EMA =================
      const EMA = (data, period) => {
        const k = 2 / (period + 1);
        return data.map((v, i) =>
          i === 0 ? v : v * k + data[i - 1] * (1 - k)
        );
      };

      // ================= ATR =================
      const ATR = (data) => {
        const out = [0];
        for (let i = 1; i < data.length; i++) {
          out.push(Math.abs(data[i] - data[i - 1]));
        }
        return out;
      };

      const ema20 = EMA(qty, 20);
      const ema50 = EMA(qty, 50);
      const ema100 = EMA(qty, 100);
      const ema200 = EMA(qty, 200);
      const atr14 = ATR(qty);

      if (window.vehicleChartInstance) window.vehicleChartInstance.destroy();

      const ctx = document
        .getElementById("vehicleChartCanvas")
        .getContext("2d");

      // ✅ WAJIB: register plugin
      Chart.register(ChartDataLabels);

      window.vehicleChartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels: tanggal,
          datasets: [
            {
              label: "Qty BBM",
              data: qty,
              borderColor: "orange",
              borderWidth: 2,
              fill: false,
              yAxisID: "y",

              pointRadius: 4,
              pointHoverRadius: 6,

              datalabels: {
                display: true,
                align: "top",
                anchor: "end",
                offset: 6,
                color: "#000",
                backgroundColor: "rgba(255,255,255,0.8)",
                borderRadius: 4,
                padding: 4,
                font: {
                  size: 11,
                  weight: "bold"
                },
                formatter: (v) => v.toFixed(1) + " L"
              }
            },

            {
              label: "EMA20",
              data: ema20,
              borderColor: "blue",
              borderWidth: 1,
              yAxisID: "y",
              datalabels: { display: false }
            },
            {
              label: "EMA50",
              data: ema50,
              borderColor: "green",
              borderWidth: 1,
              yAxisID: "y",
              datalabels: { display: false }
            },
            {
              label: "EMA100",
              data: ema100,
              borderColor: "gold",
              borderWidth: 1,
              yAxisID: "y",
              datalabels: { display: false }
            },
            {
              label: "EMA200",
              data: ema200,
              borderColor: "purple",
              borderWidth: 1,
              yAxisID: "y",
              datalabels: { display: false }
            },
            {
              label: "ATR14",
              data: atr14,
              borderColor: "red",
              borderDash: [4, 4],
              borderWidth: 2,
              yAxisID: "y1",
              datalabels: { display: false }
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `Grafik Qty BBM - ${kendaraanDipilih}`
            },
            legend: { position: "bottom" },
            datalabels: {
              clamp: true,
              clip: false
            }
          },
          scales: {
            y: {
              title: { display: true, text: "Jumlah BBM (L)" }
            },
            y1: {
              title: { display: true, text: "ATR (Volatilitas)" },
              position: "right",
              grid: { drawOnChartArea: false }
            },
            x: {
              title: { display: true, text: "Tanggal Pengisian BBM" }
            }
          }
        }
      });
    })
    .catch((err) => console.error("❌ Gagal memuat data grafik:", err));
}

// === DOWNLOAD GRAFIK SEBAGAI GAMBAR PNG ===
function downloadVehicleChart() {
  const canvas = document.getElementById("vehicleChartCanvas");
  const link = document.createElement("a");
  link.download = "Grafik_BBM_per_Kendaraan.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// === DOWNLOAD DATA GRAFIK KE EXCEL ===
function downloadVehicleChartExcel() {
  const kendaraanDipilih = document.getElementById("vehicleSelect").value;
  if (!kendaraanDipilih || !window.vehicleChartInstance) {
    alert("Tampilkan grafik terlebih dahulu sebelum download Excel!");
    return;
  }

  const chart = window.vehicleChartInstance;
  const labels = chart.data.labels;
  const datasets = chart.data.datasets;

  let rows = [["Tanggal", ...datasets.map((ds) => ds.label)]];
  labels.forEach((label, i) => {
    const row = [label];
    datasets.forEach((ds) => row.push(ds.data[i] ?? ""));
    rows.push(row);
  });

  // Konversi ke Excel
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Grafik_BBM");
  XLSX.writeFile(wb, `Grafik_BBM_${kendaraanDipilih}.xlsx`);
}

// === LOAD DROPDOWN SAAT AWAL ===
document.addEventListener("DOMContentLoaded", initVehicleDropdown);

// === INISIALISASI DROPDOWN OTOMATIS UNTUK DRIVER ===
function initDriverDropdown() {
  fetch(scriptURL + "?action=getAllData")
    .then((res) => res.json())
    .then((data) => {
      const dropdown = document.getElementById("driverSelect");
      dropdown.innerHTML = "<option value=''>-- Pilih Nama Driver --</option>";

      if (!Array.isArray(data) || data.length === 0) {
        dropdown.innerHTML += "<option disabled>Tidak ada data driver</option>";
        return;
      }

      const driverSet = new Set();
      data.forEach((item) => {
        const driver = (
          item["Nama Driver"] ||
          item["Driver"] ||
          item["Nama"] ||
          ""
        ).trim();
        if (driver) driverSet.add(driver);
      });

      driverSet.forEach((d) => {
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = d;
        dropdown.appendChild(opt);
      });

      console.log("✅ Dropdown driver berhasil dimuat:", [...driverSet]);
    })
    .catch((err) => console.error("❌ Gagal memuat dropdown driver:", err));
}

// === INISIALISASI DROPDOWN ===
document.addEventListener("DOMContentLoaded", () => {
  initVehicleDropdown();
  initDriverDropdown();
});

// === LOAD GRAFIK SESUAI DRIVER DIPILIH ===
function loadDriverChart() {
  const driverDipilih = document.getElementById("driverSelect").value.trim();
  if (!driverDipilih) {
    alert("Pilih driver terlebih dahulu!");
    return;
  }

  fetch(scriptURL + "?action=getAllData")
    .then((res) => res.json())
    .then((data) => {
      // Filter data driver
      const filterData = data.filter((d) => {
        const driverName = (
          d["Nama Driver"] ||
          d["Driver"] ||
          d["Nama"] ||
          ""
        ).trim();
        return driverName.toLowerCase() === driverDipilih.toLowerCase();
      });

      if (filterData.length === 0) {
        alert("Tidak ada data untuk driver ini.");
        return;
      }

      window.lastDriverData = filterData;

      // ===== FORMAT TANGGAL =====
      const tanggal = filterData.map((d) => {
        const t = new Date(d["Date"]);
        return isNaN(t)
          ? d["Date"]
          : t.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric"
            });
      });

      // ===== QTY (L) =====
      const qty = filterData.map((d) => {
        const key = Object.keys(d).find((k) => k.toLowerCase() === "qty (l)");
        const val = key
          ? parseFloat(
              String(d[key])
                .replace(/[^\d.,-]/g, "")
                .replace(",", ".")
            )
          : 0;
        return isNaN(val) ? 0 : val;
      });

      console.log("✅ Qty:", qty);

      // ===== EMA =====
      const EMA = (data, period) => {
        const k = 2 / (period + 1);
        return data.map((v, i) =>
          i === 0 ? v : v * k + data[i - 1] * (1 - k)
        );
      };

      // ===== ATR =====
      const ATR = (data, period = 14) => {
        const result = [];
        for (let i = 0; i < data.length; i++) {
          if (i < period) result.push(null);
          else {
            const slice = data.slice(i - period, i);
            const avg =
              slice.reduce((a, b) => a + Math.abs(b - slice[0]), 0) / period;
            result.push(avg);
          }
        }
        return result;
      };

      const ema20 = EMA(qty, 20);
      const ema50 = EMA(qty, 50);
      const ema100 = EMA(qty, 100);
      const ema200 = EMA(qty, 200);
      const atr14 = ATR(qty, 14);

      // ===== DESTROY CHART =====
      if (window.driverChartInstance) window.driverChartInstance.destroy();

      const ctx = document.getElementById("driverChartCanvas").getContext("2d");

      window.driverChartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels: tanggal,
          datasets: [
            {
              label: "Qty BBM",
              data: qty,
              borderColor: "orange",
              borderWidth: 2,
              fill: false,

              // ✅ DATA LABELS AKTIF
              datalabels: {
                display: true,
                align: "top",
                anchor: "end",
                color: "#000",
                font: {
                  weight: "bold",
                  size: 10
                },
                formatter: (v) => v.toFixed(2)
              }
            },
            {
              label: "EMA20",
              data: ema20,
              borderColor: "blue",
              borderWidth: 1,
              datalabels: { display: false }
            },
            {
              label: "EMA50",
              data: ema50,
              borderColor: "green",
              borderWidth: 1,
              datalabels: { display: false }
            },
            {
              label: "EMA100",
              data: ema100,
              borderColor: "gold",
              borderWidth: 1,
              datalabels: { display: false }
            },
            {
              label: "EMA200",
              data: ema200,
              borderColor: "purple",
              borderWidth: 1,
              datalabels: { display: false }
            },
            {
              label: "ATR14",
              data: atr14,
              borderColor: "red",
              borderDash: [4, 4],
              borderWidth: 1,
              datalabels: { display: false }
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `Grafik Qty BBM - ${driverDipilih}`
            },
            legend: {
              position: "bottom"
            },
            datalabels: {
              clamp: true
            }
          },
          scales: {
            y: {
              title: { display: true, text: "Jumlah (Liter)" }
            },
            x: {
              title: { display: true, text: "Tanggal Pengisian BBM" }
            }
          }
        }
      });
    })
    .catch((err) => console.error("❌ Gagal load grafik driver:", err));
}

// === DOWNLOAD DATA DRIVER SEBAGAI EXCEL ===
function downloadDriverChartExcel() {
  if (!window.lastDriverData || window.lastDriverData.length === 0) {
    alert("Data driver belum tersedia. Refresh grafik terlebih dahulu.");
    return;
  }

  const filterData = window.lastDriverData;
  const driverDipilih = document.getElementById("driverSelect").value.trim();

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const headers = Object.keys(filterData[0]);
  const trHead = document.createElement("tr");
  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  filterData.forEach((row) => {
    const tr = document.createElement("tr");
    headers.forEach((h) => {
      const td = document.createElement("td");
      td.textContent = row[h] ?? "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(table);
  XLSX.utils.book_append_sheet(wb, ws, "DriverData");
  XLSX.writeFile(
    wb,
    `Data_${driverDipilih}_${new Date().toISOString().split("T")[0]}.xlsx`
  );
}

let allBBMData = []; // simpan semua data global

// === LOAD DASHBOARD BBM UTAMA ===
async function loadDashboardBBM() {
  try {
    const res = await fetch(`${scriptURL}?action=getalldata`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log("📊 [Dashboard BBM] Data diterima:", data);

    if (!Array.isArray(data) || data.length === 0) {
      alert("Tidak ada data BBM ditemukan.");
      return;
    }

    allBBMData = data;
    populateMonthSelector(data);
    updateDashboardByMonth();
    loadTempatPengisian(data); // 🔹 Tambahkan agar card tempat pengisian otomatis muncul
  } catch (err) {
    console.error("❌ [Dashboard BBM] Gagal memuat data:", err);
    alert("Gagal memuat data Dashboard BBM.\nDetail: " + err.message);
  }
}

/* === DROPDOWN BULAN === */
function populateMonthSelector(data) {
  const monthSelector = document.getElementById("monthSelector");
  if (!monthSelector) return;

  const months = new Set();
  data.forEach((item) => {
    if (item["Date"]) {
      const tgl = new Date(item["Date"]);
      const bulanKey = `${tgl.getFullYear()}-${String(
        tgl.getMonth() + 1
      ).padStart(2, "0")}`;
      months.add(bulanKey);
    }
  });

  const sortedMonths = Array.from(months).sort();
  sortedMonths.forEach((key) => {
    const [year, month] = key.split("-");
    const label = `${tglToNamaBulan(parseInt(month))} ${year}`;
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = label;
    monthSelector.appendChild(opt);
  });
}

/* === FILTER BERDASARKAN BULAN === */
function updateDashboardByMonth() {
  const selectedMonth = document.getElementById("monthSelector").value;
  let filteredData = allBBMData;

  if (selectedMonth !== "all") {
    filteredData = allBBMData.filter((item) => {
      if (!item["Date"]) return false;
      const tgl = new Date(item["Date"]);
      const key = `${tgl.getFullYear()}-${String(tgl.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      return key === selectedMonth;
    });
  }

  renderDashboard(filteredData);
  loadTempatPengisian(filteredData); // 🔹 update juga berdasarkan bulan terpilih
}

/* === RENDER DASHBOARD === */
function renderDashboard(data) {
  const perFungsi = {};
  const detailPerFungsi = {};
  const perTanggal = {};
  const perMinggu = {};
  const perBulan = {};

  data.forEach((item) => {
    const qty = parseFloat(item["QTY (L)"]) || 0;
    const fungsi = item["Fungsi"] || "Lainnya";
    const rawDate = item["Date"];
    if (!rawDate) return;
    const tgl = new Date(rawDate);

    perFungsi[fungsi] = (perFungsi[fungsi] || 0) + qty;

    const tempat =
      item["Tempat Pengisian"] ||
      item["Lokasi Pengisian"] ||
      item["Tempat"] ||
      "-";

    if (!detailPerFungsi[fungsi]) detailPerFungsi[fungsi] = [];
    detailPerFungsi[fungsi].push({
      Tanggal: tgl.toLocaleDateString("id-ID"),
      Nopol: item["KRP-Nopol"] || "-",
      Driver: item["Driver"] || "-",
      Deskripsi: item["Discription"] || "-",
      Tempat: tempat,
      Qty: qty.toFixed(1)
    });

    const tanggalKey = tgl.toISOString().split("T")[0];
    perTanggal[tanggalKey] = (perTanggal[tanggalKey] || 0) + qty;

    const weekLabel = getWeekLabel(tgl);
    perMinggu[weekLabel] = (perMinggu[weekLabel] || 0) + qty;

    const bulanKey = `${tgl.toLocaleString("id-ID", {
      month: "long"
    })} ${tgl.getFullYear()}`;
    perBulan[bulanKey] = (perBulan[bulanKey] || 0) + qty;
  });

  const container = document.getElementById("fungsiSummary");
  if (container) {
    container.innerHTML = "";
    Object.entries(perFungsi).forEach(([fungsi, total]) => {
      const card = document.createElement("div");
      card.className = "summary-card";
      card.style.cursor = "pointer";
      card.innerHTML = `<strong>${fungsi}</strong><br><span>${total.toFixed(
        1
      )} L</span>`;
      card.onclick = () => showDetailTable(fungsi, detailPerFungsi[fungsi]);
      container.appendChild(card);
    });
  }

  createChart(
    "chartBBMTrend",
    "line",
    "Grafik Tren Harian BBM (L)",
    perTanggal
  );
  createChart("chartBBMWeekly", "bar", "Total BBM per Minggu", perMinggu);
  createChart("chartBBMMonthly", "bar", "Total BBM per Bulan", perBulan);
}

/* === 🔹 LOAD CARD PER TEMPAT PENGISIAN (DENGAN DETAIL) === */
function loadTempatPengisian(data) {
  if (!data || data.length === 0) return;
  const tempatMap = {};
  const detailPerTempat = {};

  data.forEach((d) => {
    const tempat = d["Tempat Pengisian"] || d["WKP"] || "Lainnya";
    const val = parseFloat(
      String(d["QTY (L)"])
        .replace(/[^\d.,-]/g, "")
        .replace(",", ".")
    );
    const qty = isNaN(val) ? 0 : val;
    if (!tempatMap[tempat]) tempatMap[tempat] = 0;
    tempatMap[tempat] += qty;

    if (!detailPerTempat[tempat]) detailPerTempat[tempat] = [];
    const tgl = new Date(d["Date"]);
    detailPerTempat[tempat].push({
      Tanggal: tgl.toLocaleDateString("id-ID"),
      Nopol: d["KRP-Nopol"] || "-",
      Driver: d["Driver"] || "-",
      Deskripsi: d["Discription"] || "-",
      Tempat: tempat, // Menambahkan tempat ke detail
      Qty: qty.toFixed(1)
    });
  });

  const container = document.getElementById("tempatPengisianContainer");
  if (!container) return;
  container.innerHTML = "";

  Object.entries(tempatMap).forEach(([tempat, total]) => {
    const card = document.createElement("div");
    card.className = "tempat-card";
    card.style.cursor = "pointer";
    card.innerHTML = `
      <h3>${tempat}</h3>
      <p><strong>${total.toFixed(1)} L</strong></p>
    `;
    card.onclick = () => showDetailTableTempat(tempat, detailPerTempat[tempat]);
    container.appendChild(card);
  });
}

/* === 🔹 MODAL DETAIL TEMPAT PENGISIAN === */
function showDetailTableTempat(tempat, data) {
  let modal = document.getElementById("fungsiModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "fungsiModal";
    modal.innerHTML = `
      <div class="modal-overlay" onclick="closeModal()"></div>
      <div class="modal-content">
        <h3 id="modalTitle"></h3>
        <table id="fungsiDetailTable" class="detail-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>KRP-Nopol</th>
              <th>Driver</th>
              <th>Deskripsi</th>
              <th>Tempat Pengisian</th>
              <th>QTY (L)</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
        <div class="modal-buttons">
          <button onclick="exportToExcel()" class="btn-export">Export ke Excel</button>
          <button onclick="closeModal()" class="btn-close">Tutup</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const tbody = modal.querySelector("tbody");
  tbody.innerHTML = "";
  data.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.Tanggal}</td>
      <td>${row.Nopol}</td>
      <td>${row.Driver}</td>
      <td>${row.Deskripsi}</td>
      <td>${row.Tempat}</td>
      <td style="text-align:right">${row.Qty}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("modalTitle").textContent = `Detail ${tempat}`;
  modal.dataset.fungsi = tempat;
  modal.dataset.data = JSON.stringify(data);
  modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("fungsiModal");
  if (modal) modal.style.display = "none";
}

/* === MODAL DETAIL PER FUNGSI === */
function showDetailTable(fungsi, data) {
  let modal = document.getElementById("fungsiModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "fungsiModal";
    modal.innerHTML = `
      <div class="modal-overlay" onclick="closeModal()"></div>
      <div class="modal-content">
        <h3 id="modalTitle"></h3>
        <table id="fungsiDetailTable" class="detail-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>KRP-Nopol</th>
              <th>Driver</th>
              <th>Discription</th>
              <th>Tempat Pengisian</th>
              <th>QTY (L)</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
        <div class="modal-buttons">
          <button onclick="exportToExcel()" class="btn-export">Export ke Excel</button>
          <button onclick="closeModal()" class="btn-close">Tutup</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const tbody = modal.querySelector("tbody");
  tbody.innerHTML = "";
  data.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.Tanggal}</td>
      <td>${row.Nopol}</td>
      <td>${row.Driver}</td>
      <td>${row.Deskripsi}</td>
      <td>${row.Tempat}</td>
      <td style="text-align:right">${row.Qty}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("modalTitle").textContent = `Detail ${fungsi}`;
  modal.dataset.fungsi = fungsi;
  modal.dataset.data = JSON.stringify(data);
  modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("fungsiModal");
  if (modal) modal.style.display = "none";
}

/* === EXPORT EXCEL === */
async function exportToExcel() {
  const modal = document.getElementById("fungsiModal");
  if (!modal) return;

  const fungsi = modal.dataset.fungsi || "Report";
  const data = JSON.parse(modal.dataset.data || "[]");

  if (data.length === 0) {
    alert("❌ Tidak ada data untuk diekspor!");
    return;
  }

  // 🔵 Buat workbook & sheet
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Data");

  // 🔹 Tambahkan header
  const headers = Object.keys(data[0]);
  sheet.addRow(headers);

  // 🔹 Tambahkan data
  data.forEach((item) => {
    sheet.addRow(Object.values(item));
  });

  // 🎨 Style header
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF007ACC" } // biru elegan
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 }; // teks putih
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCCCCCC" } },
      left: { style: "thin", color: { argb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
      right: { style: "thin", color: { argb: "FFCCCCCC" } }
    };
  });

  // 🔸 Atur lebar kolom otomatis
  sheet.columns.forEach((col) => (col.width = 25));

  // 💾 Simpan file
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer]),
    `Laporan_${fungsi.replace(/\s+/g, "_")}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`
  );
}

/* === CHART UTILITY === */
function createChart(canvasId, type, title, dataObj) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  if (window[canvasId] && typeof window[canvasId].destroy === "function")
    window[canvasId].destroy();

  const sortedLabels = Object.keys(dataObj);
  window[canvasId] = new Chart(ctx, {
    type: type,
    data: {
      labels: sortedLabels,
      datasets: [
        {
          label: "Total BBM (L)",
          data: sortedLabels.map((key) => dataObj[key]),
          backgroundColor:
            type === "bar" ? "rgba(0,123,255,0.6)" : "rgba(0,123,255,0.3)",
          borderColor: "#007bff",
          fill: type === "line",
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: title,
          color: "#007bff",
          font: { size: 16, weight: "bold" }
        }
      },
      scales: {
        x: { ticks: { color: "#333" }, grid: { color: "#eee" } },
        y: { ticks: { color: "#333" }, grid: { color: "#eee" } }
      }
    }
  });
}

/* === HELPER === */
function getWeekLabel(date) {
  const curr = new Date(date);
  const weekStart = new Date(curr);
  weekStart.setDate(curr.getDate() - curr.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const startStr = `${weekStart.getDate()} ${weekStart.toLocaleString("id-ID", {
    month: "short"
  })}`;
  const endStr = `${weekEnd.getDate()} ${weekEnd.toLocaleString("id-ID", {
    month: "short"
  })}`;
  const weekNum = getWeekNumber(curr);
  return `Minggu ke-${weekNum} (${startStr}–${endStr})`;
}

function getWeekNumber(date) {
  const tempDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = tempDate.getUTCDay() || 7;
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  return Math.ceil(((tempDate - yearStart) / 86400000 + 1) / 7);
}

function tglToNamaBulan(bulan) {
  const nama = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"
  ];
  return nama[bulan - 1];
}

// === LOAD REPORT BBM ABNORMAL (Rasio < 10) ===
function loadBBMAbnormal() {
  fetch(scriptURL + "?action=getAllData") // ambil semua data dari Google Sheet
    .then((res) => res.json())
    .then((data) => {
      if (!Array.isArray(data) || data.length === 0) {
        alert("⚠️ Tidak ada data BBM ditemukan.");
        return;
      }

      const tbody = document.querySelector("#bbmAbnormalTable tbody");
      tbody.innerHTML = "";

      let counter = 1;

      data.forEach((row) => {
        // Ambil rasio BBM terinput
        const rasio = parseFloat(row["Rasio BBM terinput"]) || 0;

        // Filter hanya rasio < 10
        if (rasio < 10) {
          const tanggal = row["Date"]
            ? new Date(row["Date"]).toLocaleDateString("id-ID")
            : "-";

          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${counter++}</td>
            <td>${tanggal}</td>
            <td>${row["Fungsi"] || "-"}</td>
            <td>${row["WKP"] || "-"}</td>
            <td>${row["Discription"] || "-"}</td>
            <td>${row["Driver"] || "-"}</td>
            <td>${row["KRP-Nopol"] || "-"}</td>
            <td>${row["KM awal"] || 0}</td>
            <td>${row["KM akhir"] || 0}</td>
            <td>${row["Real perjalanan"] || 0}</td>
            <td>${row["QTY (L)"] || 0}</td>
            <td>${row["Create reservation"] || "-"}</td>
            <td>${rasio}</td>
          `;
          tbody.appendChild(tr);
        }
      });

      // Jika tidak ada yang abnormal
      if (!tbody.hasChildNodes()) {
        tbody.innerHTML =
          "<tr><td colspan='13'>Tidak ada BBM abnormal</td></tr>";
      }
    })
    .catch((err) => {
      console.error("❌ Gagal ambil data abnormal:", err);
      alert("Gagal memuat BBM Abnormal: " + err.message);
    });
}

let map;
let markers = [];
let routingControl;

// Inisialisasi peta (versi cepat)
function initLeaflet() {
  const mapContainer = document.getElementById("leafletMap");
  mapContainer.style.background =
    "#eaeaea url('https://i.postimg.cc/63F3RrZn/loading-map.gif') center center no-repeat";

  // Inisialisasi langsung dengan performa tinggi
  map = L.map("leafletMap", {
    center: [-2.5, 105],
    zoom: 5,
    zoomControl: true,
    preferCanvas: true
  });

  // Gunakan tile server cepat
  const tiles = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
      crossOrigin: true
    }
  ).addTo(map);

  // Hapus background loading setelah tile pertama dimuat
  tiles.on("load", () => {
    mapContainer.style.background = "none";
  });
}

// Cari kota otomatis dan buat routing
async function searchCities() {
  const input = document.getElementById("cityInput").value;
  if (!input) return alert("Masukkan kota yang ingin dicari!");

  const cities = input.split(",").map((c) => c.trim());
  const waypoints = [];

  resetMapDistance();

  for (const city of cities) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          city
        )}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const marker = L.marker([lat, lon], { title: city })
          .addTo(map)
          .bindPopup(`<b>${city}</b>`)
          .openPopup();
        markers.push(marker);
        waypoints.push(L.latLng(lat, lon));
      }
    } catch (err) {
      console.error("Gagal mencari kota:", err);
    }
  }

  if (waypoints.length > 1) {
    routingControl = L.Routing.control({
      waypoints: waypoints,
      routeWhileDragging: false,
      lineOptions: {
        styles: [
          { color: "magenta", weight: 4, opacity: 0.8, dashArray: "10,10" }
        ]
      },
      createMarker: function (i, wp, nWps) {
        return L.marker(wp.latLng).bindPopup(`<b>${cities[i]}</b>`);
      },
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1"
      }),
      show: false
    }).addTo(map);

    routingControl.on("routesfound", function (e) {
      const route = e.routes[0];
      const distanceKm = (route.summary.totalDistance / 1000).toFixed(2);
      document.getElementById(
        "leafletDistanceResult"
      ).textContent = `📏 Total jarak mengikuti jalan: ${distanceKm} km (${waypoints.length} kota)`;
    });

    map.fitBounds(L.latLngBounds(waypoints));
  } else if (waypoints.length === 1) {
    map.setView(waypoints[0], 10);
  }
}

// Reset peta
function resetMapDistance() {
  markers.forEach((m) => map.removeLayer(m));
  markers = [];
  if (routingControl) map.removeControl(routingControl);
  routingControl = null;
  document.getElementById("leafletDistanceResult").textContent = "";
}

// Jalankan langsung saat halaman siap
document.addEventListener("DOMContentLoaded", initLeaflet);
// Pastikan peta langsung menyesuaikan ukuran kontainer
setTimeout(() => {
  map.invalidateSize();
}, 200);

let realPerjalananCache = [];

function loadRealPerjalananReport() {
  const tbody = document.querySelector("#realPerjalananTable tbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5">Memuat data...</td></tr>`;

  if (realPerjalananCache.length === 0) {
    fetch(scriptURL + "?action=getalldata")
      .then((res) => res.json())
      .then((data) => {
        realPerjalananCache = Array.isArray(data) ? data : [];
        renderRangeReport();
      })
      .catch((err) => {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="5">Gagal memuat data</td></tr>`;
      });
  } else {
    renderRangeReport();
  }
}

function renderRangeReport() {
  const tbody = document.querySelector("#realPerjalananTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const fromVal = document.getElementById("dateFrom")?.value;
  const toVal = document.getElementById("dateTo")?.value;

  if (!fromVal || !toVal) {
    tbody.innerHTML = `<tr><td colspan="5">Silakan pilih rentang tanggal</td></tr>`;
    return;
  }

  const dateFrom = new Date(fromVal);
  const dateTo = new Date(toVal);
  dateTo.setHours(23, 59, 59);

  const recap = {};
  const LIMIT = 10000;

  // 🔑 AMBIL KM AKHIR TERBESAR PER NOPOL
  realPerjalananCache.forEach((row) => {
    const dateRaw = row["Date"];
    const nopol = row["KRP-Nopol"];
    const kmAkhir = Number(row["KM akhir"]) || 0;

    if (!dateRaw || !nopol || kmAkhir <= 0) return;

    const date = new Date(dateRaw);
    if (isNaN(date.getTime())) return;
    if (date < dateFrom || date > dateTo) return;

    // simpan KM AKHIR TERBESAR
    if (!recap[nopol] || kmAkhir > recap[nopol]) {
      recap[nopol] = kmAkhir;
    }
  });

  if (Object.keys(recap).length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">Tidak ada data pada rentang ini</td></tr>`;
    return;
  }

  Object.entries(recap)
    .sort((a, b) => b[1] - a[1])
    .forEach(([nopol, totalKM]) => {
      const LIMIT = 10000;
      const sisaKM = LIMIT - (totalKM % LIMIT || LIMIT);

      let status = "🟢 Aman";
      let cls = "";
      let estimasi = `± ${sisaKM} KM lagi`;

      if (sisaKM <= 500) {
        status = "🔴 Harus Servis";
        cls = "danger";
        estimasi = `Segera Servis (≤ ${sisaKM} KM)`;
      } else if (sisaKM <= 1000) {
        status = "⚠️ Mendekati Servis";
        cls = "warning";
      }

      const tr = document.createElement("tr");
      tr.className = cls;
      tr.innerHTML = `
        <td><strong>${nopol}</strong></td>
        <td>${totalKM} KM</td>
        <td>${sisaKM} KM</td>
        <td>${estimasi}</td>
        <td>${status}</td>
      `;

      tbody.appendChild(tr);
    });
}

function loadJobReportVTS() {
  const table = document.querySelector("#jobReportVTSTable");
  const tbody = table.querySelector("tbody");
  const thead = table.querySelector("thead");
  const wrapper = document.querySelector(".table-wrapper");

  tbody.innerHTML = `<tr><td colspan="33">Loading Job Report VTS...</td></tr>`;

  const API_URL =
    "https://script.google.com/macros/s/AKfycbyW6bQ8QS6Ba0sJzc6CzmUiCaAwaFuFetKhewZCQxsa2mv9aHep7nyeuPS1sZENNkWz/exec?action=getjobreport";

  fetch(API_URL)
    .then((res) => res.json())
    .then((data) => {
      if (!Array.isArray(data) || !data.length) {
        tbody.innerHTML = `<tr><td colspan="33">❌ Data kosong</td></tr>`;
        return;
      }

      const headers = Object.keys(data[0]);

      tbody.innerHTML = data
        .map((row) => {
          // ===============================
          // FILTER ANTI BARIS RUSAK / HANTU
          // ===============================

          // helper get
          const get = (name) => (row[name] || "").toString().trim();

          // 2️⃣ Skip baris status (Done, Pending, dll)
          const firstCell = (get(headers[0]) || "").toLowerCase();
          if (
            firstCell === "done" ||
            firstCell === "pending" ||
            firstCell === "process"
          )
            return "";

          // 3️⃣ Skip jika Job Number kosong
          if (!get("Job Number")) return "";

          // ===============================
          // FOTO GOOGLE DRIVE (FIX TOTAL)
          // ===============================
          let rawFoto = get("Upload foto Bukti");
          let fotoThumb = "";
          let fotoOpen = "";

          if (rawFoto.includes("drive.google.com")) {
            const match =
              rawFoto.match(/\/file\/d\/([^/]+)/) ||
              rawFoto.match(/\/d\/([^/]+)/) ||
              rawFoto.match(/id=([^&]+)/);

            if (match) {
              const fileId = match[1];
              fotoThumb = `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
              fotoOpen = `https://drive.google.com/file/d/${fileId}/view`;
            }
          }

          // ===============================
          // RENDER BARIS VALID SAJA
          // ===============================
          return `
          <tr>
            <td>${get("Job Number") || "-"}</td>
            <td>${get("Tanggal") || "-"}</td>
            <td>${get("User name") || "-"}</td>
            <td>${get("working type") || "-"}</td>
            <td>${get("installation type") || "-"}</td>
            <td>${get("Merk kendaraan") || "-"}</td>
            <td>${get("Vehicle type") || "-"}</td>
            <td>${get("Lisence plate") || "-"}</td>
            <td>${get("Vehicle id") || "-"}</td>
            <td>${get("Department") || "-"}</td>
            <td>${get("Colour") || "-"}</td>
            <td>${get("Location") || "-"}</td>
            <td>${get("GPS Serial No") || "-"}</td>
            <td>${get("GPS Unit ID") || "-"}</td>
            <td>${get("GSM") || "-"}</td>
            <td>${get("Distance") || "-"}</td>
            <td>${get("GPS Unit Module") || "-"}</td>
            <td>${get("RFID Reader") || "-"}</td>
            <td>${get("Buzzer") || "-"}</td>
            <td>${get("Stater interrupter") || "-"}</td>
            <td>${get("Fuel stick") || "-"}</td>
            <td>${get("Mesin") || "-"}</td>
            <td>${get("Panel Dasbord") || "-"}</td>
            <td>${get("Klakson") || "-"}</td>
            <td>${get("Audio") || "-"}</td>
            <td>${get("Sistem listrik") || "-"}</td>
            <td>${get("AC") || "-"}</td>
            <td>${get("Power windows") || "-"}</td>
            <td>${get("Panel Instrument") || "-"}</td>
            <td>${get("Spion") || "-"}</td>
            <td>${get("Deskripsi Pekerjaan") || "-"}</td>
            <td>${get("Progres Status") || "-"}</td>
            <td>
              ${
                fotoThumb
                  ? `<img src="${fotoThumb}"
                        loading="lazy"
                        style="width:70px;max-height:90px;object-fit:cover;border-radius:8px;
                               cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.25);"
                        onclick="window.open('${fotoOpen}','_blank')"
                        onerror="this.outerHTML='❌ Foto tidak tersedia';">`
                  : "-"
              }
            </td>
          </tr>
          `;
        })
        .join("");

      // ===============================
      // SET LEBAR KOLOM
      // ===============================
      const widths = Array(33).fill("100px");
      widths[32] = "80px";

      table.querySelectorAll("tr").forEach((tr) => {
        tr.querySelectorAll("th,td").forEach((cell, i) => {
          if (widths[i]) {
            cell.style.width = widths[i];
            cell.style.minWidth = widths[i];
            cell.style.maxWidth = widths[i];
            cell.style.whiteSpace = "normal";
            cell.style.wordBreak = "break-word";
          }
        });
      });

      // ===============================
      // SCROLL 5 ROW
      // ===============================
      setTimeout(() => {
        const bodyRows = table.querySelectorAll("tbody tr");
        if (bodyRows.length) {
          const rowHeight = bodyRows[0].offsetHeight;
          wrapper.style.maxHeight =
            rowHeight * 5 + (thead.offsetHeight || 45) + 5 + "px";
          wrapper.style.overflow = "auto";
        }
      }, 100);
    })
    .catch((err) => {
      tbody.innerHTML = `<tr><td colspan="33">❌ Gagal memuat data</td></tr>`;
      console.error(err);
    });
}

// PANGGIL
loadJobReportVTS();

// ===============================
// FILTER VEHICLE ID
// ===============================
function applyJobReportFilter() {
  const table = document.getElementById("jobReportVTSTable");
  const rows = table.querySelectorAll("tbody tr");
  const keyword = document
    .getElementById("searchVehicleId")
    .value.trim()
    .toLowerCase();

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (!cells.length) return;

    const vehicleId = cells[8].innerText.trim().toLowerCase();
    row.style.display = vehicleId.includes(keyword) ? "" : "none";
  });
}

function resetJobReportFilter() {
  document.getElementById("searchVehicleId").value = "";
  applyJobReportFilter();
}
function loadDefaultSuratTemplate() {
  const preview = document.getElementById("previewSurat");
  if (!preview) return;

  setTimeout(() => {
    const nomorSpan = document.getElementById("nomorSurat");
    if (nomorSpan) nomorSpan.innerText = generateNomorSuratBBM();
  }, 50);

  applySuratLayout();
}

/* ================= NOMOR SURAT ================= */

function getRomawi(bulan) {
  return [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII"
  ][bulan];
}

function generateNomorSuratBBM() {
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = getRomawi(now.getMonth());

  let last = localStorage.getItem("nomorSuratBBM");
  last = last ? parseInt(last) + 1 : 1;
  localStorage.setItem("nomorSuratBBM", last);

  return `${String(last).padStart(3, "0")}/BBM/EMD/${bulan}/${tahun}`;
}

/* ================= LAYOUT SURAT ================= */

function applySuratLayout() {
  const surat = document.getElementById("previewSurat");
  if (!surat) return;

  surat.style.width = "100%";
  surat.style.maxWidth = "330mm";
  surat.style.minHeight = "210mm";
  surat.style.margin = "20px auto";
  surat.style.padding = "28mm 25mm";
  surat.style.background = "#ffffff";
  surat.style.border = "none";
  surat.style.boxShadow = "none";
  surat.style.fontFamily = "Times New Roman, serif";
  surat.style.lineHeight = "1.7";
  surat.style.borderRadius = "0";
  surat.style.display = "block";

  const kop = surat.querySelector(".kop-surat");
  if (kop) {
    kop.style.width = "100%";
    kop.style.maxWidth = "330mm";
    kop.style.border = "none";
    kop.style.boxShadow = "none";
  }

  lockKopSurat();
}

/* ================= LOCK KOP ================= */

function lockKopSurat() {
  const kop = document.querySelector("#previewSurat .kop-surat");
  if (!kop) return;
  kop.setAttribute("contenteditable", "false");
}

/* ================= DOWNLOAD PDF ================= */

function downloadSuratBBM() {
  const surat = document.getElementById("previewSurat");
  if (!surat) return alert("Surat tidak ditemukan!");

  const kop = surat.querySelector(".kop-surat");

  // SIMPAN STYLE ASLI
  const originalPadding = surat.style.padding;
  const originalWidth = surat.style.width;
  const originalTransform = surat.style.transform;
  const originalLineHeight = surat.style.lineHeight;
  const kopOriginalStyle = kop ? kop.getAttribute("style") : "";

  // SET MODE PDF A4
  surat.style.width = "210mm";
  surat.style.padding = "12mm 10mm";
  surat.style.lineHeight = "1.5";
  surat.style.transform = "scale(0.98)";
  surat.style.transformOrigin = "top center";

  // PAKSA KOP RAPI SAAT PDF
  if (kop) {
    kop.style.width = "100%";
    kop.style.display = "flex";
    kop.style.alignItems = "center";
    kop.style.gap = "14px";
    kop.style.flexWrap = "nowrap";

    const logo = kop.querySelector("img");
    if (logo) logo.style.flexShrink = "0";

    const kopText = kop.querySelector(".kop-text, .kop-center");
    if (kopText) {
      kopText.style.flex = "1";
      kopText.style.wordBreak = "break-word";
      kopText.style.lineHeight = "1.35";
      kopText.style.textAlign = "left";
    }
  }

  setTimeout(() => {
    const opt = {
      margin: 0,
      filename: "Surat_Pernyataan_BBM.pdf",
      image: { type: "jpeg", quality: 1 },

      html2canvas: {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollY: 0
      },

      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait"
      },

      pagebreak: { mode: ["avoid-all"] }
    };

    html2pdf()
      .set(opt)
      .from(surat)
      .save()
      .then(restoreStyle)
      .catch((err) => {
        console.error("PDF ERROR:", err);
        restoreStyle();
      });

    function restoreStyle() {
      surat.style.padding = originalPadding;
      surat.style.width = originalWidth;
      surat.style.transform = originalTransform;
      surat.style.lineHeight = originalLineHeight;

      if (kop) {
        if (kopOriginalStyle) {
          kop.setAttribute("style", kopOriginalStyle);
        } else {
          kop.removeAttribute("style");
        }
      }
    }
  }, 120);
}

/* ================= AUTO RUN ================= */

window.addEventListener("load", () => {
  if (typeof loadDefaultSuratTemplate === "function") {
    loadDefaultSuratTemplate();
  }
});

function saveToGoogleDocs() {
  const surat = document.getElementById("previewSurat");
  if (!surat) {
    alert("Surat tidak ditemukan!");
    return;
  }

  const formData = new URLSearchParams();
  formData.append("html", surat.innerHTML);
  formData.append("filename", "Surat_Pernyataan_BBM_" + Date.now());

  fetch(
    "https://script.google.com/macros/s/AKfycbxm42JmM6vNQurRiinOGA8AWGTtS25AhtODifdQay9JXXjnqPeShKOCf0esKYR16c_tqw/exec",
    {
      method: "POST",
      body: formData
    }
  )
    .then((r) => r.text())
    .then((t) => {
      const res = JSON.parse(t);

      if (res.status === "success") {
        // ❌ tidak buka Google Docs
        alert("✅ Surat berhasil tersimpan di Google Docs");
      } else {
        alert("❌ ERROR: " + res.message);
      }
    })
    .catch((err) => {
      console.error(err);
      alert("❌ Gagal menyimpan surat");
    });
}

// ================= LOAD HISTORY REPORT =================
async function loadHistoryReport() {
  const tbody = document.querySelector("#bbmReportTable tbody");
  tbody.innerHTML =
    "<tr><td colspan='5'>⏳ Mengambil history dari Google...</td></tr>";

  try {
    const res = await fetch(
      "https://script.google.com/macros/s/AKfycbxm42JmM6vNQurRiinOGA8AWGTtS25AhtODifdQay9JXXjnqPeShKOCf0esKYR16c_tqw/exec?action=getHistoryBBM"
    );

    const data = await res.json();
    tbody.innerHTML = "";

    if (!data.length) {
      tbody.innerHTML =
        "<tr><td colspan='5'>Tidak ada history tersimpan</td></tr>";
      return;
    }

    data.forEach((row, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${row.nomor || "-"}</td>
        <td>${row.driver || "-"}</td>
        <td>${row.maker || "-"}</td>
        <td>${row.tanggal || "-"}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML =
      "<tr><td colspan='5'>❌ Gagal memuat history Google</td></tr>";
  }
}
