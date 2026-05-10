/// ===================== LOGIN SECTION (GOOGLE SHEET) =====================
const SHEET_API =
  "https://script.google.com/macros/s/AKfycbzYHpKZ9DH05HlRDVuZe-p7sBHG3wQI7CtIuepHm4ARRpFD-RqPi1rB3a3TDf_OeJ3Vsw/exec";

let users = [];
let onlineInterval = null;
let currentChatUser = null;
let chatInterval = null;

/* chat yang sedang dibuka */
let openedChatEmail = null;

// ===================== LOAD USER =====================
async function loadUsers() {
  try {
    const res = await fetch(SHEET_API);
    users = await res.json();
    console.log("Users loaded:", users);
  } catch (err) {
    console.error("Gagal load user:", err);
  }
}
// ===================== UPDATE STATUS =====================
async function updateUserStatus(email, status, note = "") {
  try {
    await fetch(
      `${SHEET_API}?type=status&email=${encodeURIComponent(
        email
      )}&status=${encodeURIComponent(status)}&note=${encodeURIComponent(note)}`
    );
  } catch (err) {
    console.error("Update status gagal:", err);
  }
}

// ===================== LOAD ONLINE USERS =====================
async function loadOnlineUsers() {
  try {
    window.userCallback = function (data) {
      const online = data.filter(
        (x) => String(x.Status || "").toLowerCase() === "online"
      );

      const onlineUsersBox = document.getElementById("onlineUsers");

      const onlineCount = document.getElementById("onlineCount");

      if (!onlineUsersBox || !onlineCount) return;

      // update jumlah online
      onlineCount.textContent = online.length;

      // cek apakah chat yg sedang dibuka masih online
      if (openedChatEmail) {
        const stillOnline = online.some((x) => x.Email === openedChatEmail);

        // kalau user yg diajak chat offline → tutup chat
        if (!stillOnline) {
          closeChat(openedChatEmail);
        }
      }

      // ==================================================
      // JANGAN render ulang kalau chat sedang dibuka
      // supaya textbox tidak hilang focus
      // ==================================================
     if (!openedChatEmail) {

  const me = (localStorage.getItem("currentUser") || "").toLowerCase();

  onlineUsersBox.innerHTML = online.map(user => {

    const isMe =
      String(user.Email || "").toLowerCase() === me;

    const lastChat = (user.Chat || "")
      .split("\n")
      .slice(-1)[0]
      .replace(/\[.*?\]\s*/, "");

    return `
      <div class="online-wrap">

        <div
          class="online-user ${isMe ? 'clickable' : 'disabled'}"
          ${isMe ? `onclick="openChat('${user.Email}','${user.Nama}')"` : ""}
        >
          <img src="${
            user.Foto ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png"
          }">

          <div class="online-user-info">

            <div class="online-user-name">
              ${user.Nama || "-"}
            </div>

            <div class="online-user-loc">
              ${user.Lokasi || "-"}
            </div>

            <div class="online-user-chat">
              ${lastChat}
            </div>

          </div>

          <div class="online-actions">

            ${
              !isMe
                ? `
                <button
                  class="call-btn voice"
                  onclick="event.stopPropagation(); callUser('${user.Email}','voice')"
                  title="Voice Call"
                >
                  📞
                </button>

                <button
                  class="call-btn video"
                  onclick="event.stopPropagation(); callUser('${user.Email}','video')"
                  title="Video Call"
                >
                  🎥
                </button>

                <button
                  class="call-btn meeting"
                  onclick="event.stopPropagation(); inviteMeeting('${user.Email}')"
                  title="Meeting"
                >
                  👥
                </button>
              `
                : ""
            }

            <div class="online-dot"></div>

          </div>

        </div>

        <div id="chat-${user.Email}" class="inline-chat hidden"></div>

      </div>

        <div id="chat-${user.Email}" class="inline-chat hidden"></div>

      </div>
    `;
  }).join("");
}

      // ==================================================
// kalau chat sedang dibuka, update count saja
// tidak redraw DOM
// ==================================================
if (openedChatEmail) {
  const activeUser = online.find(
    (x) => x.Email === openedChatEmail
  );

  if (activeUser) {
    const chatBox = document.getElementById(
      "chat-" + activeUser.Email
    );

    // kalau DOM chat belum ada → buat ulang
    if (!chatBox) {

      const me = (localStorage.getItem("currentUser") || "").toLowerCase();

      onlineUsersBox.innerHTML = online.map(user => {

        const isMe =
          String(user.Email || "").toLowerCase() === me;

        const lastChat = (user.Chat || "")
          .split("\n")
          .slice(-1)[0]
          .replace(/\[.*?\]\s*/, "");

        return `
          <div class="online-wrap">

            <div
              class="online-user ${isMe ? 'clickable' : 'disabled'}"
              ${isMe ? `onclick="openChat('${user.Email}','${user.Nama}')"` : ""}
            >
              <img src="${
                user.Foto ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }">

              <div class="online-user-info">

                <div class="online-user-name">
                  ${user.Nama || "-"}
                </div>

                <div class="online-user-loc">
                  ${user.Lokasi || "-"}
                </div>

                <div class="online-user-chat">
                  ${lastChat}
                </div>

              </div>

              <div class="online-actions">

            ${
              !isMe
                ? `
                <button
                  class="call-btn voice"
                  onclick="event.stopPropagation(); callUser('${user.Email}','voice')"
                  title="Voice Call"
                >
                  📞
                </button>

                <button
                  class="call-btn video"
                  onclick="event.stopPropagation(); callUser('${user.Email}','video')"
                  title="Video Call"
                >
                  🎥
                </button>

                <button
                  class="call-btn meeting"
                  onclick="event.stopPropagation(); inviteMeeting('${user.Email}')"
                  title="Meeting"
                >
                  👥
                </button>
              `
                : ""
            }

            <div class="online-dot"></div>

          </div>

        </div>

        <div id="chat-${user.Email}" class="inline-chat hidden"></div>

      </div>

            <div id="chat-${user.Email}" class="inline-chat hidden"></div>

          </div>
        `;
      }).join("");

      openChat(
        activeUser.Email,
        activeUser.Nama,
        true
      );
    }
  }
}
    };

    const old = document.getElementById("userJsonp");

    if (old) old.remove();

    const script = document.createElement("script");

    script.id = "userJsonp";

    script.src = `${SHEET_API}?callback=userCallback&t=${Date.now()}`;

    document.body.appendChild(script);
  } catch (err) {
    console.error("Load online user gagal:", err);
  }
}
// ===================== OPEN CHAT =====================
function openChat(email, nama, reopen = false) {
  // jika klik user yg sama, skip
  if (!reopen && openedChatEmail === email) return;

  openedChatEmail = email;
  currentChatUser = email;

  // tutup panel lain TANPA hapus isi
  document.querySelectorAll(".inline-chat").forEach((el) => {
    if (el.id !== "chat-" + email) {
      el.classList.add("hidden");
    }
  });

  const chatBox = document.getElementById("chat-" + email);
  if (!chatBox) return;

  chatBox.classList.remove("hidden");

  // hanya buat UI kalau belum ada
  if (!chatBox.innerHTML.trim()) {
    chatBox.innerHTML = `
      <div class="inline-chat-header">
        <span>💬 ${nama}</span>

        <button onclick="closeChat('${email}')">
          ✖
        </button>
      </div>

      <div id="chatBox-${email}" class="inline-chat-box">
        <div class="chat-messages"></div>

        <!-- TEXTAREA INPUT -->
        <textarea
          id="chatInput-${email}"
          class="chat-textarea"
          placeholder="Ketik pesan..."
          onkeydown="
            if(event.key === 'Enter' && !event.shiftKey){
              event.preventDefault();
              sendChat('${email}');
            }
          "
        ></textarea>
      </div>

      <!-- BUTTON PANEL -->
      <div class="inline-chat-input">

        <button onclick="sendChat('${email}')">
          Kirim
        </button>

        <button onclick="closeChat('${email}')">
          Batal
        </button>

        <button onclick="clearChat('${email}')">
          Hapus
        </button>

      </div>
    `;
  }

  // fokus ke textarea
  setTimeout(() => {
    const input = document.getElementById("chatInput-" + email);
    if (input) input.focus();
  }, 100);

  // load chat
  loadChat();

  // auto refresh
  if (chatInterval) clearInterval(chatInterval);

  chatInterval = setInterval(loadChat, 3000);
}
// ===================== CLOSE CHAT =====================
function closeChat(email) {
  openedChatEmail = null;
  currentChatUser = null;

  const box = document.getElementById("chat-" + email);

  if (box) {
    box.classList.add("hidden");
    box.innerHTML = "";
  }

  if (chatInterval) {
    clearInterval(chatInterval);
    chatInterval = null;
  }
}

// ===================== LOAD CHAT =====================
async function loadChatFeed() {
  window.feedCallback = function (data) {
    renderFeed(data);
  };

  const old = document.getElementById("feedJsonp");
  if (old) old.remove();

  const script = document.createElement("script");
  script.id = "feedJsonp";
  script.src = `${SHEET_API}?type=feed&callback=feedCallback&t=${Date.now()}`;
  document.body.appendChild(script);
}
// ===================== SEND CHAT =====================
async function sendChat(email = currentChatUser) {
  if (!email) return;

  const input = document.getElementById("chatInput-" + email);

  if (!input) return;

  const msg = input.value.trim();
  if (!msg) return;

  const from = localStorage.getItem("currentUser").toLowerCase();

  try {
    const oldScript = document.getElementById("sendJsonp");

    if (oldScript) oldScript.remove();

    window.sendCallback = function (res) {
      console.log("Chat terkirim:", res);

      input.value = "";
      loadChat();
      input.focus();
    };

    const script = document.createElement("script");

    script.id = "sendJsonp";

    script.src =
      `${SHEET_API}?type=sendChat` +
      `&from=${encodeURIComponent(from)}` +
      `&to=${encodeURIComponent(email)}` +
      `&message=${encodeURIComponent(msg)}` +
      `&callback=sendCallback` +
      `&t=${Date.now()}`;

    document.body.appendChild(script);
  } catch (err) {
    console.error("Send chat gagal:", err);
  }
}

function loadChat() {
  console.log("reload chat...");
  // ambil ulang data chat dari server / sheet
}
// ===================== RENDER CHAT =====================
function renderChat(data) {
  const me = localStorage.getItem("currentUser");

  if (!currentChatUser) return;

  const filtered = data.filter(
    (x) =>
      (String(x.From).trim() === me &&
        String(x.To).trim() === currentChatUser) ||
      (String(x.From).trim() === currentChatUser && String(x.To).trim() === me)
  );

  const chatBox = document.getElementById("chatBox-" + currentChatUser);

  if (!chatBox) return;

  chatBox.innerHTML = filtered
    .map(
      (msg) => `
    <div class="chat-item ${String(msg.From).trim() === me ? "me" : ""}">
      ${msg.Message}
    </div>
  `
    )
    .join("");

  chatBox.scrollTop = chatBox.scrollHeight;
}

function callUser(email, type = "voice") {
  const room = "VTS-" + Date.now();
  const me = (localStorage.getItem("currentUser") || "")
    .trim()
    .toLowerCase();

  console.log("NELPON:", me, "=>", email);

  const script = document.createElement("script");

  script.src =
    `${SHEET_API}?type=sendCall` +
    `&from=${encodeURIComponent(me)}` +
    `&to=${encodeURIComponent(email)}` +
    `&callType=${encodeURIComponent(type)}` +
    `&room=${encodeURIComponent(room)}` +
    `&conference=no` +
    `&callback=callCallback` +
    `&t=${Date.now()}`;

  window.callCallback = function(res) {
    console.log("CALL RESULT:", res);

    if (res.success) {
      const isVoice = type === "voice";

      const url =
        `https://meet.jit.si/${room}` +
        `#userInfo.displayName="${encodeURIComponent(me)}"` +
        `&config.startWithAudioMuted=false` +
        `&config.startWithVideoMuted=${isVoice ? "true" : "false"}`;

      window.open(url, "_blank");
    }
  };

  document.body.appendChild(script);
}
let incomingChecker = null;

function startIncomingCallListener() {
  if (incomingChecker) clearInterval(incomingChecker);

  incomingChecker = setInterval(() => {
    const me = (
      localStorage.getItem("currentUser") || ""
    ).trim().toLowerCase();

    if (!me) return;

    window.checkCallCallback = function(res) {
      if (!res) return;
      if (!res.status) return;

      if (res.status === "ringing") {
        showIncomingCall(
          res.from,
          res.callType,
          res.room
        );
      }
    };

    const old = document.getElementById("checkCallScript");
    if (old) old.remove();

    const script = document.createElement("script");
    script.id = "checkCallScript";
    script.src =
      `${SHEET_API}?type=checkCall` +
      `&email=${encodeURIComponent(me)}` +
      `&callback=checkCallCallback` +
      `&t=${Date.now()}`;

    document.body.appendChild(script);

  }, 2000);
}
// ===================== SHOW DASHBOARD =====================
async function showDashboard(user) {
  document.getElementById("loginPage").style.display = "none";
  document.querySelector("header").style.display = "flex";
  document.querySelector("main").style.display = "block";

  // tanggal
  const now = new Date();
  document.getElementById("current-date").textContent = now.toLocaleDateString(
    "id-ID",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }
  );

  // foto + nama
  const userInfoImg = document.querySelector(".user-info img");
  const userInfoText = document.querySelector(".user-info span");

  userInfoImg.src =
    user.Foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  userInfoText.textContent = user.Nama || user.Email.split("@")[0];

  // load dashboard
  showDashboardMaintenance();

  // load user online
  await loadOnlineUsers();

  if (!onlineInterval) {
    onlineInterval = setInterval(loadOnlineUsers, 5000);
  }
}
function renderFeed(data) {
  const onlineUsersBox = document.getElementById("onlineUsers");

  if (!onlineUsersBox) return;

  let html = "";

  data
    .slice(-20)
    .reverse()
    .forEach((item) => {
      const user = users.find(
        (u) => String(u.Email).toLowerCase() === String(item.from).toLowerCase()
      );

      const foto =
        user?.Foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

      html += `
      <div class="feed-item">
        <img src="${foto}" class="feed-avatar">

        <div class="feed-text">
          <b>${item.from}</b><br>
          ${item.message}
        </div>
      </div>
    `;
    });

  onlineUsersBox.innerHTML = html;
}

// ===================== SHOW LOGIN =====================
function showLoginPage() {
  document.querySelector("header").style.display = "none";
  document.querySelector("main").style.display = "none";
  document.getElementById("loginPage").style.display = "flex";
}

// ===================== LOGIN =====================
async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPassword").value.trim();
  const err = document.getElementById("loginError");

  showLoader();

  try {
    if (!users.length) {
      await loadUsers();
    }

    const user = users.find(
      (u) =>
        String(u.Email).trim() === email && String(u.Password).trim() === pass
    );

    if (!user) {
      err.textContent = "❌ Email atau password salah!";
      hideLoader();
      return;
    }

    err.textContent = "";

    localStorage.setItem("currentUser", user.Email);
    localStorage.setItem("currentJobPrefix", user.Lokasi || "UNKN");

    await updateUserStatus(user.Email, "Online", "Login");

    await showDashboard(user);
  } catch (error) {
    console.error(error);
    err.textContent = "❌ Gagal login";
  }

  hideLoader();
}

// ===================== TAMPILAN AWAL =====================
window.addEventListener("DOMContentLoaded", async () => {
  showLoginPage();

  await loadUsers();

  const savedUser = localStorage.getItem("currentUser");

  if (!savedUser) return;

  const user = users.find((u) => String(u.Email).trim() === savedUser);

  if (!user) {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentJobPrefix");
    return;
  }

  await updateUserStatus(savedUser, "Online", "Auto Login");

  await showDashboard(user);
});

// ===================== TAB DITUTUP =====================
window.addEventListener("beforeunload", async () => {
  const currentUser = localStorage.getItem("currentUser");

  if (currentUser) {
    await updateUserStatus(currentUser, "Offline", "Logout");
  }
});
async function logout() {
  showLoader();

  const currentUser = localStorage.getItem("currentUser");

  try {
    // update status ke Google Sheet
    if (currentUser) {
      await updateUserStatus(currentUser, "Offline", "Logout");
    }

    // stop refresh user online
    if (onlineInterval) {
      clearInterval(onlineInterval);
      onlineInterval = null;
    }

    // tutup chat kalau terbuka
    const chatPanel = document.getElementById("chatPanel");
    if (chatPanel) {
      chatPanel.classList.add("hidden");
    }

    setTimeout(() => {
      // tampilkan login
      document.getElementById("loginPage").style.display = "flex";

      // sembunyikan dashboard
      document.querySelector("header").style.display = "none";
      document.querySelector("main").style.display = "none";

      // sembunyikan report
      document.getElementById("reportSection").style.display = "none";
      document.getElementById("photoReportSection").style.display = "none";

      // reset form login
      document.getElementById("loginEmail").value = "";
      document.getElementById("loginPassword").value = "";

      // hapus session
      localStorage.removeItem("currentUser");
      localStorage.removeItem("currentJobPrefix");

      // reset job number
      const jobNumber = document.getElementById("jobNumber");
      if (jobNumber) jobNumber.textContent = "";

      hideLoader();
    }, 700);
  } catch (err) {
    console.error("Logout gagal:", err);
    hideLoader();
  }
}
// ===================== TOGGLE PASSWORD =====================
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("loginPassword");

togglePassword.addEventListener("click", () => {
  const isVisible = passwordInput.type === "text";
  passwordInput.type = isVisible ? "password" : "text";

  // Ubah isi SVG di dalam span, bukan outerHTML
  togglePassword.innerHTML = isVisible
    ? `<svg id="eyeIcon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>`
    : `<svg id="eyeIcon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.26 18.26 0 0 1 4.47-5.94M1 1l22 22"/>
          <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88"/>
        </svg>`;
});

// ===================== Tampilkan tanggal otomatis =====================
document.getElementById(
  "current-date"
).textContent = new Date().toLocaleDateString("id-ID", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
});

// ===================== ATURAN TAMPILAN AWAL =====================
window.addEventListener("DOMContentLoaded", async () => {
  document.querySelector("header").style.display = "none";
  document.querySelector("main").style.display = "none";
  document.getElementById("loginPage").style.display = "flex";

  // ambil user dari sheet
  await loadUsers();

  // cek session login
  const savedUser = localStorage.getItem("currentUser");
  const savedPrefix = localStorage.getItem("currentJobPrefix");

  if (!savedUser) return;

  // cari user di database sheet
  const user = users.find((u) => String(u.Email).trim() === savedUser);

  if (!user) {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentJobPrefix");
    return;
  }

  // tampilkan dashboard
  document.getElementById("loginPage").style.display = "none";
  document.querySelector("header").style.display = "flex";
  document.querySelector("main").style.display = "block";

  // foto user
  const userInfoImg = document.querySelector(".user-info img");
  userInfoImg.src =
    user.Foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  // nama user
  const userInfoText = document.querySelector(".user-info span");
  userInfoText.textContent = user.Nama || savedUser.split("@")[0];

  // update status online lagi
  await updateUserStatus(savedUser, "Online", "Auto Login");

  // tampilkan dashboard
  showDashboardMaintenance();

  // load user online
  loadOnlineUsers();
  setInterval(loadOnlineUsers, 5000);

  console.log("Prefix Auto Login:", savedPrefix);
});

// ===================== PANEL MENU =====================
function togglePanel() {
  document.getElementById("slidePanel").classList.toggle("open");
}

// ===================== LOADER CONTROL =====================
function showLoader() {
  document.getElementById("loaderOverlay").classList.add("active");
}

function hideLoader() {
  document.getElementById("loaderOverlay").classList.remove("active");
}

// ===================== PEMBUNGKUS LOADER =====================
function showLoaderAndRun(callback) {
  showLoader();
  setTimeout(() => {
    try {
      callback();
    } finally {
      hideLoader();
    }
  }, 800);
}

// ===================== CONTOH FUNGSI =====================
function showForm() {
  console.log("Menampilkan Form Pekerjaan...");
  alert("Form Pekerjaan terbuka!");
}

function showReport() {
  console.log("Menampilkan Laporan Pekerjaan...");
  alert("Laporan Pekerjaan terbuka!");
}

function showPhotoReport() {
  console.log("Menampilkan Laporan Foto...");
  alert("Laporan Foto per Nomor Pekerjaan terbuka!");
}

document.addEventListener("keydown", function (e) {
  if (e.key !== "Enter") return;

  const el = document.activeElement;

  // Fokus pada checkbox → ENTER = centang / uncentang item itu saja
  if (el.type === "checkbox") {
    e.preventDefault();
    el.checked = !el.checked;
    return;
  }

  // Fokus pada radio → ENTER = memilih radio yang sedang fokus
  if (el.type === "radio") {
    e.preventDefault();
    el.checked = true; // hanya pilih item yang fokus, tidak berpindah
    return;
  }
});

function generateJobNumber() {
  const currentUser = localStorage.getItem("currentUser");
  const prefix = localStorage.getItem("currentJobPrefix") || "UNKN";

  if (!currentUser) {
    alert("Silakan login terlebih dahulu!");
    return;
  }

  const key = `lastJobNumber_${currentUser}`;

  let last = localStorage.getItem(key);
  if (!last) last = 0;

  let next = parseInt(last) + 1;

  // simpan nomor terakhir
  localStorage.setItem(key, next);

  const formatted = `${prefix} : ${String(next).padStart(3, "0")}`;

  // 🔥 INI YANG KAMU LUPA
  document.getElementById("jobNumber").textContent = formatted;

  // tanggal
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleString("id-ID", {
    dateStyle: "short",
    timeStyle: "medium"
  });

  document.getElementById("current-date").textContent = formattedDate;
}
// ===================== FORM HANDLER =====================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("jobForm");
  const submitBtn = document.querySelector(".submit-btn");

  if (!form || !submitBtn) return;

  let sending = false;

  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    // cegah double submit
    if (sending) return;
    sending = true;
    submitBtn.disabled = true;

    try {
      const fileInput = document.querySelector("input[type='file']");
      let fotoUrl = "";

      // =========================
      // CONVERT FOTO -> BASE64
      // =========================
      if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];

        fotoUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;

          reader.readAsDataURL(file);
        });
      }

      // =========================
      // TANGGAL
      // =========================
      const tanggalSekarang = new Date().toLocaleString("id-ID", {
        dateStyle: "short",
        timeStyle: "medium"
      });

      // =========================
      // FORM DATA
      // =========================
      const formData = {
        "Job Number": document.getElementById("jobNumber")?.textContent || "",
        "Tanggal": tanggalSekarang,
        "User name": document.getElementById("user")?.value || "",
        "working type": document.getElementById("workingType")?.value || "",
        "installation type": document.getElementById("installationType")?.value || "",
        "Merk kendaraan": document.getElementById("merkKendaraan")?.value || "",
        "Vehicle type": document.getElementById("vehicleType")?.value || "",
        "Lisence plate": document.getElementById("licensePlate")?.value || "",
        "Vehicle id": document.getElementById("vehicleId")?.value || "",
        "Department": document.getElementById("department")?.value || "",
        "Colour": document.getElementById("colour")?.value || "",
        "Location": document.getElementById("location")?.value || "",
        "GPS Serial No": document.getElementById("gpsSerial")?.value || "",
        "GPS Unit ID": document.getElementById("gpsUnitId")?.value || "",
        "GSM": document.getElementById("gsm")?.value || "",
        "Distance": document.getElementById("distance")?.value || "",
        "GPS Unit Module": getStatus("gps"),
        "RFID Reader": getStatus("rfid"),
        "Buzzer": getStatus("buzzer"),
        "Stater interupter": getStatus("starter"),
        "Fuel stick": getStatus("fuel"),
        "Mesin": getStatus("d-mesin"),
        "Panel Dasbord": getStatus("d-paneldashboard"),
        "Klakson": getStatus("d-klakson"),
        "Audio": getStatus("d-audio"),
        "Sistem listrik": getStatus("d-listrik"),
        "AC": getStatus("d-ac"),
        "Power windows": getStatus("d-powerwindows"),
        "Panel Instrument": getStatus("d-panelinstrument"),
        "Spion": getStatus("d-spion"),
        "Deskripsi Pekerjaan":
          document.getElementById("deskripsiPekerjaan")?.value || "",
        "Progres Status":
          document.getElementById("progressStatus")?.value || "",
        "Upload foto Bukti": fotoUrl
      };

      console.log("📤 Mengirim:", formData);

      await sendToGoogleSheet(formData);

      console.log("✅ sukses simpan");

      if (typeof generateJobNumber === "function") {
        generateJobNumber();
      }

    } catch (err) {
      console.error("❌ Gagal simpan:", err);
      alert("❌ Gagal kirim data");
    } finally {
      sending = false;
      submitBtn.disabled = false;
    }
  });
});
document.addEventListener("DOMContentLoaded", function () {
  let kendaraanData = {};

  const API_URLS = [
    "https://script.google.com/macros/s/AKfycbzdMdw6ZNMoj1IimADGcl2mVf0WHCgx9dBOys5BFPfMt4th8NmsuLlbO2DeZYV1aaPxRQ/exec?type=vts",
    "https://script.google.com/macros/s/AKfycbx2qYSANHLW5_rwBnoEf6W1bUVNPc3q1QFi8QqeeC7Ve_ubCZcRl7Z1rQEbLzaxkB4l/exec?sheet=Informasi%20VTS",
    "https://script.google.com/macros/s/AKfycbwEWKwgvMaoYVYWyThk3L5_qU7xTI4pfjTxc4pOvhhlF9gldFEvDg4tc1whiNhxO9tEpA/exec?sheet=Informasi%20VTS"
  ];

  Promise.all(
    API_URLS.map((url) =>
      fetch(url)
        .then((r) => r.json())
        .then((res) => {
          if (Array.isArray(res)) return res;
          if (Array.isArray(res.data)) return res.data;
          if (Array.isArray(res.result)) return res.result;
          if (Array.isArray(res.values)) return res.values;
          if (Array.isArray(res.records)) return res.records;
          return [];
        })
        .catch((err) => {
          console.error(err);
          return [];
        })
    )
  ).then((results) => {
    const data = results.flat();

    const select = document.getElementById("vehicleId");
    select.innerHTML = '<option value="">-- Pilih Vehicle ID --</option>';

    data.forEach((row) => {
      let node = "";
      let plate = "";
      let jenis = "";
      let imei = "";
      let imsi = "";

      // ARRAY
      if (Array.isArray(row)) {
        node = row[1] || "";
        plate = row[2] || "";
        jenis = row[3] || "";
        imei = row[4] || "";
        imsi = row[5] || "";
      }

      // OBJECT
      else {
        node = row.Node || row.node || "";
        plate = row["License Plate"] || row.plate || "";
        jenis = row["Jenis kendaraan"] || row["Jenis Kendaraan"] || "";
        imei = row.IMEI || "";
        imsi = row.IMSI || "";
      }

      if (!plate) return;

      const key = plate.trim().toUpperCase();

      kendaraanData[key] = {
        merk: jenis,
        type: getType(jenis),
        plate,
        imei,
        node,
        imsi
      };

      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = plate;
      select.appendChild(opt);
    });

    console.log("siap:", kendaraanData);
  });

  function getType(jenis) {
    if (!jenis) return "";

    const j = jenis.toLowerCase();

    // ROAD ROLLER
    if (
      j.includes("roller") ||
      j.includes("road roller") ||
      j.includes("compactor")
    ) {
      return "Road Roller";
    }

    // EXCAVATOR
    if (
      j.includes("excavator") ||
      j.includes("hitachi excavator") ||
      j.includes("pc200") ||
      j.includes("pc300")
    ) {
      return "Excavator";
    }

    // BACKHOE LOADER
    if (
      j.includes("backhoe") ||
      j.includes("backhoe loader") ||
      j.includes("komatsu backhoe")
    ) {
      return "Picker";
      // kalau di dropdown Anda tidak ada "Backhoe Loader",
      // paling dekat pakai Picker
    }

    // MOTOR GRADER
    if (j.includes("grader")) {
      return "Motor Grader";
    }

    // PICKER
    if (j.includes("picker")) {
      return "Picker";
    }

    // CRANE
    if (j.includes("crane")) {
      return "Crane";
    }

    // LOWBED
    if (j.includes("lowbed")) {
      return "Truck Lowbed";
    }

    // TRONTON
    if (
      j.includes("tronton") ||
      j.includes("truck tronton") ||
      j.includes("mitsubishi truck tronton") ||
      j.includes("ud quester") ||
      j.includes("ud quester truck")
    ) {
      return "Truck tronton";
    }

    // TUG BOAT
    if (
      j.includes("tug boat") ||
      j.includes("arlin") ||
      j.includes("tug boat arlin")
    ) {
      return "Tug Boat Arlin";
    }

    // SPEED BOAT
    if (
      j.includes("speed boat") ||
      j.includes("speed teluk aru") ||
      j.includes("psb") ||
      j.includes("lct") ||
      j.includes("boat") ||
      j.includes("speed")
    ) {
      return "Speed Boat";
    }

    // VACUM TRUCK
    if (j.includes("fighter") || j.includes("hino") || j.includes("hd 125")) {
      return "Vacum truck";
    }

    // DOUBLE CABIN
    if (j.includes("triton") || j.includes("double")) {
      return "Doble cabin";
    }

    // SINGLE CABIN
    if (j.includes("single") || j.includes("pickup")) {
      return "Single cabin";
    }

    // SUV
    if (j.includes("pajero") || j.includes("fortuner")) {
      return "SUV";
    }

    // MPV
    if (j.includes("innova") || j.includes("hiace")) {
      return "MPV";
    }

    // FIRE TRUCK
    if (j.includes("pemadam") || j.includes("fire")) {
      return "Mobil Pemadam";
    }

    // MOTOR
    if (j.includes("motor")) {
      return "MotorCross";
    }

    return "";
  }
  document.getElementById("vehicleId").addEventListener("change", function () {
    const data = kendaraanData[this.value];
    if (!data) return;

    setVal("licensePlate", data.plate);
    setVal("merkKendaraan", data.merk);
    setVal("vehicleType", data.type);
    setVal("gpsSerial", data.imei);
    setVal("gpsUnitId", data.node);
    setVal("gsm", data.imsi);
  });

  function normalize(s) {
    return (s || "")
      .toString()
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " ")
      .replace(/[()]/g, "");
  }

  // khusus plate JBI
  function normalizePlate(s) {
    return (
      normalize(s)
        // JBI-063 -> JBI-63
        .replace(/JBI-0+(\d+)/gi, "JBI-$1")
        // PHR1-01 -> PHR1-1
        .replace(/PHR1-0+(\d+)/gi, "PHR1-$1")
        // hilangkan double space
        .replace(/\s+/g, " ")
        .trim()
    );
  }

  function setVal(id, value) {
    const el = document.getElementById(id);
    if (!el) return;

    // ================= SELECT =================
    if (el.tagName === "SELECT") {
      let found = false;

      // KHUSUS LICENSE PLATE
      if (id === "licensePlate") {
        const target = normalizePlate(value);

        for (let i = 0; i < el.options.length; i++) {
          const txt = normalizePlate(el.options[i].text);
          const val = normalizePlate(el.options[i].value);

          if (
            txt === target ||
            val === target ||
            txt.includes(target) ||
            target.includes(txt)
          ) {
            el.selectedIndex = i;
            found = true;
            break;
          }
        }
      }

      // SELECT BIASA
      else {
        const target = normalize(value);

        for (let i = 0; i < el.options.length; i++) {
          const txt = normalize(el.options[i].text);
          const val = normalize(el.options[i].value);

          if (
            txt === target ||
            val === target ||
            txt.includes(target) ||
            target.includes(txt)
          ) {
            el.selectedIndex = i;
            found = true;
            break;
          }
        }
      }

      if (!found) {
        console.warn("tidak ketemu:", id, value);
      }

      return;
    }

    // ================= INPUT =================
    el.value = value || "";
  }
});
// ===================== HELPER FUNCTION =====================
function getStatus(name) {
  const checked = document.querySelector(`input[name='${name}']:checked`);
  return checked ? checked.parentElement.textContent.trim() : "";
}

const sections = document.querySelectorAll(".form-section");
let current = 0;

function showStep(i) {
  sections.forEach((s) => s.classList.remove("active"));
  sections[i].classList.add("active");
}

document.querySelectorAll(".next-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (current < sections.length - 1) current++;
    showStep(current);
  });
});

document.querySelectorAll(".back-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (current > 0) current--;
    showStep(current);
  });
});
showStep(0);

document.addEventListener("DOMContentLoaded", () => {
  // Ambil semua section (form steps) dan step indicator
  const sections = Array.from(document.querySelectorAll(".form-section"));
  const wizardSteps = Array.from(
    document.querySelectorAll(".wizard-progress .step")
  );

  if (!sections.length) {
    console.warn(
      "Tidak ditemukan .form-section. Periksa selector atau lokasi skrip."
    );
    return;
  }
  if (!wizardSteps.length) {
    console.warn(
      "Tidak ditemukan .wizard-progress .step. Periksa selector atau lokasi skrip."
    );
    // lanjut saja — indikator opsional
  }

  // Cari tombol next/back
  const nextBtns = Array.from(document.querySelectorAll(".next-btn"));
  const backBtns = Array.from(document.querySelectorAll(".back-btn"));
  const submitBtn = document.querySelector(".submit-btn");

  // Tentukan currentStep: cari yang sudah punya kelas 'active', kalau tidak ada pakai 0
  let currentStep = sections.findIndex((s) => s.classList.contains("active"));
  if (currentStep === -1) currentStep = 0;

  // Fungsi untuk menampilkan section berdasarkan index
  function showSection(index) {
    if (index < 0) index = 0;
    if (index >= sections.length) index = sections.length - 1;

    sections.forEach((sec, i) => {
      if (i === index) {
        sec.classList.add("active");
        sec.style.display = ""; // biarkan CSS atur; if you used display none earlier
      } else {
        sec.classList.remove("active");
        // hide non-active for accessibility (optional)
        sec.style.display = "none";
      }
    });

    currentStep = index;
    updateStepIndicator(index);
    // optional: scroll to top of form so user sees it
    // document.getElementById('jobForm').scrollIntoView({behavior:'smooth', block:'start'});
  }

  // updateStepIndicator (safe: hanya jika wizardSteps ada)
  function updateStepIndicator(index) {
    if (!wizardSteps.length) return;
    wizardSteps.forEach((step, i) => {
      step.classList.toggle("active", i === index);
      // update aria for accessibility
      step.setAttribute("aria-current", i === index ? "step" : "false");
    });
  }

  // Pasang event pada Next buttons => naik 1 step
  nextBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = Math.min(currentStep + 1, sections.length - 1);
      showSection(target);
    });
  });

  // Pasang event pada Back buttons => turun 1 step
  backBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = Math.max(currentStep - 1, 0);
      showSection(target);
    });
  });

 
  // Klik pada step indicator untuk langsung lompat ke step tertentu
  if (wizardSteps.length) {
    wizardSteps.forEach((step, idx) => {
      step.addEventListener("click", () => {
        showSection(idx);
      });
    });
  }

  // Inisialisasi tampilan awal
  showSection(currentStep);

  // Debug: tampilkan status
  console.log("Wizard inited:", {
    totalSections: sections.length,
    currentStep,
    hasWizardSteps: wizardSteps.length > 0
  });
});

/// URL Google Sheet Web App
const sheetURL =
  "https://script.google.com/macros/s/AKfycbzdMdw6ZNMoj1IimADGcl2mVf0WHCgx9dBOys5BFPfMt4th8NmsuLlbO2DeZYV1aaPxRQ/exec";

// Menyimpan detail pekerjaan per Working Type
window.workingTypeDetails = {};

// ============================
// 🔔 LOAD DATA NOTIFIKASI
// ============================
window.loadWorkingTypeNotification = async function () {
  try {
    const response = await fetch(sheetURL);
    const rows = await response.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      console.warn("Data kosong.");
      return;
    }

    let counts = {};
    window.workingTypeDetails = {}; // reset

    rows.forEach((row) => {
      const type = row["working type"]?.trim();
      const job = row["Job Number"] || "-";
      const plate = row["Lisence plate"] || "-";
      const vehicle = row["Vehicle id"] || "-";

      if (!type) return;

      // Hitung jumlah working type
      counts[type] = (counts[type] || 0) + 1;

      // Siapkan list detail
      if (!window.workingTypeDetails[type])
        window.workingTypeDetails[type] = [];

      window.workingTypeDetails[type].push({
        jobNumber: job,
        workingType: type,
        plate: plate,
        vehicleId: vehicle
      });
    });

    updateNotifUI(counts);
  } catch (err) {
    console.error("Error Load Notif:", err);
  }
};

// ============================
// 🔔 UPDATE LIST NOTIFIKASI
// ============================
window.updateNotifUI = function (counts) {
  const notifList = document.getElementById("notifList");
  const notifBadge = document.getElementById("notifBadge");

  notifList.innerHTML = "";

  let total = 0;

  for (let type in counts) {
    const count = counts[type];
    total += count;

    notifList.innerHTML += `
      <li class="notif-item" style="cursor:pointer; padding:5px;" 
          onclick="showJobDetail('${type}')">
        <strong>${type}</strong> : ${count} pekerjaan
      </li>
    `;
  }

  notifBadge.textContent = total;
};

// ========================================
// 📌 SHOW MULTIPLE DETAIL PANEL — SIDE-BY-SIDE
// ========================================
window.showJobDetail = function (type) {
  const container = document.getElementById("notifDetailContainer");

  const panelId = `panel-${type.replace(/\s+/g, "")}`;
  const existing = document.getElementById(panelId);

  // Jika sudah terbuka → tutup
  if (existing) {
    existing.remove();
    return;
  }

  const listData = window.workingTypeDetails[type] || [];

  let html = `
    <div id="${panelId}" class="panel-box">
      <h3 class="panel-title">${type}</h3>
      <table border="1" width="100%" style="border-collapse:collapse; font-size:14px;">
        <thead style="background:#f4f4f4;">
          <tr>
            <th>Job Number</th>
            <th>Working Type</th>
            <th>License Plate</th>
            <th>Vehicle ID</th>
          </tr>
        </thead>
        <tbody>
  `;

  listData.forEach((item) => {
    html += `
      <tr>
        <td>${item.jobNumber}</td>
        <td>${item.workingType}</td>
        <td>${item.plate}</td>
        <td>${item.vehicleId}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.insertAdjacentHTML("beforeend", html);
};

// ================= GLOBAL =================
let dataVTS = [];
let dataVTSReady = false;

// ================= LOAD DATA =================
// ================= LOAD DATA =================
function loadDataVTS() {
  Promise.all([
    fetch(
      "https://script.google.com/macros/s/AKfycbzdMdw6ZNMoj1IimADGcl2mVf0WHCgx9dBOys5BFPfMt4th8NmsuLlbO2DeZYV1aaPxRQ/exec?type=vts"
    ).then((res) => res.json()),

    fetch(
      "https://script.google.com/macros/s/AKfycbx2qYSANHLW5_rwBnoEf6W1bUVNPc3q1QFi8QqeeC7Ve_ubCZcRl7Z1rQEbLzaxkB4l/exec?sheet=Informasi%20VTS"
    )
      .then((res) => res.json())
      .then((res) => (Array.isArray(res) ? res : res.data || [])),

    fetch(
      "https://script.google.com/macros/s/AKfycbwEWKwgvMaoYVYWyThk3L5_qU7xTI4pfjTxc4pOvhhlF9gldFEvDg4tc1whiNhxO9tEpA/exec?sheet=Informasi%20VTS"
    )
      .then((res) => res.json())
      .then((res) => (Array.isArray(res) ? res : res.data || []))
  ])
    .then(([jambi, rantau, psu]) => {
      // gabung semua tanpa merubah kode utama
      dataVTS = [...jambi, ...rantau, ...psu];

      dataVTSReady = true;

      console.log("✅ Jambi:", jambi.length);
      console.log("✅ Rantau:", rantau.length);
      console.log("✅ PSU:", psu.length);
      console.log("✅ Data VTS siap:", dataVTS);
    })
    .catch((err) => {
      console.error("❌ Gagal ambil data VTS", err);
    });
}
// ================= NORMALISASI PLAT =================
function bersihkanPlat(text) {
  return (text || "").toLowerCase().replace(/[^a-z0-9]/g, ""); // hapus semua selain huruf & angka
}

// ================= AUTO ISI =================
function autoIsiVTS() {
  if (!dataVTSReady) {
    console.warn("⏳ Data VTS belum siap");
    return;
  }

  const value = document.getElementById("cekPlate").value;
  if (!value) return;

  const plateForm = value.split("|")[1];
  const plateFix = bersihkanPlat(plateForm);

  const found = dataVTS.find((item) => {
    const sheetPlate = item["License Plate"] || item["Lisence plate"] || "";
    const sheetFix = bersihkanPlat(sheetPlate);

    return sheetFix.includes(plateFix); // 🔥 fleksibel & kuat
  });

  console.log("Dipilih:", plateFix);
  console.log("Ditemukan:", found);

  if (found) {
    document.getElementById("cekIMEI").value =
      found["IMEI"] || found["GPS Serial No"] || "";

    document.getElementById("cekIMSI").value =
      found["IMSI"] || found["GSM"] || "";

    document.getElementById("cekNode").value = found["Node"] || ""; // 🔥 INI TAMBAHAN
  }
}

// ================= INIT =================
window.onload = function () {
  loadDataVTS();
};
function showVTS() {
  document.querySelector("main").style.display = "none";
  document.getElementById("reportSection").style.display = "none";
  document.getElementById("photoReportSection").style.display = "none";

  document.getElementById("vtsSection").style.display = "block";

  loadVTS();
}

function loadVTS() {
  const url =
    "https://script.google.com/macros/s/AKfycbzdMdw6ZNMoj1IimADGcl2mVf0WHCgx9dBOys5BFPfMt4th8NmsuLlbO2DeZYV1aaPxRQ/exec?type=vts";

  const tbody = document.querySelector("#vtsTable tbody");
  tbody.innerHTML = "<tr><td colspan='7'>Loading...</td></tr>";

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      tbody.innerHTML = "";

      data.forEach((d, i) => {
        let status = (d["Status VTS"] || "").toLowerCase();
        let warna = status.includes("active") ? "green" : "red";

        let row = `
          <tr>
            <td>${d["No"] || i + 1}</td>
            <td>${d["Node"]}</td>
            <td>${d["License Plate"]}</td>
            <td>${d["Jenis kendaraan"]}</td>
            <td>${d["IMEI"]}</td>
            <td>${d["IMSI"]}</td>
            <td style="color:${warna}; font-weight:bold;">
              ${d["Status VTS"]}
            </td>
          </tr>
        `;

        tbody.innerHTML += row;
      });
    })
    .catch((err) => {
      tbody.innerHTML = "<tr><td colspan='7'>Gagal ambil data</td></tr>";
      console.error(err);
    });
}

function loadVTSRantau() {
  const url =
    "https://script.google.com/macros/s/AKfycbx2qYSANHLW5_rwBnoEf6W1bUVNPc3q1QFi8QqeeC7Ve_ubCZcRl7Z1rQEbLzaxkB4l/exec?sheet=Informasi%20VTS";

  const tbody = document.querySelector("#vtsTableRantau tbody");

  if (!tbody) {
    console.error("tbody tidak ditemukan");
    return;
  }

  tbody.innerHTML = "<tr><td colspan='7'>Loading...</td></tr>";

  fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }
      return res.json();
    })
    .then((json) => {
      console.log("DATA VTS RANTAU =", json);

      // ambil array data
      const data = Array.isArray(json) ? json : json.data || [];

      tbody.innerHTML = "";

      if (!data.length) {
        tbody.innerHTML = "<tr><td colspan='7'>Data kosong</td></tr>";
        return;
      }

      data.forEach((d, i) => {
        const status = String(d["Status VTS"] || "").toLowerCase();

        let warna = "#ef4444";
        if (status.includes("active")) warna = "#16a34a";

        const row = `
          <tr>
            <td>${d["No"] || i + 1}</td>
            <td>${d["Node"] || "-"}</td>
            <td>${d["License Plate"] || "-"}</td>
            <td>${d["Jenis kendaraan"] || "-"}</td>
            <td>${d["IMEI"] || "-"}</td>
            <td>${d["IMSI"] || "-"}</td>
            <td style="color:${warna};font-weight:bold;">
              ${d["Status VTS"] || "-"}
            </td>
          </tr>
        `;

        tbody.insertAdjacentHTML("beforeend", row);
      });
    })
    .catch((err) => {
      console.error("ERROR VTS RANTAU =", err);
      tbody.innerHTML =
        "<tr><td colspan='7'>❌ Gagal ambil data Rantau</td></tr>";
    });
}

function loadVTSPsu() {
  const url =
    "https://script.google.com/macros/s/AKfycbwEWKwgvMaoYVYWyThk3L5_qU7xTI4pfjTxc4pOvhhlF9gldFEvDg4tc1whiNhxO9tEpA/exec?sheet=Informasi%20VTS";

  const tbody = document.querySelector("#vtsTablePSU tbody");

  if (!tbody) {
    console.error("tbody tidak ditemukan");
    return;
  }

  tbody.innerHTML = "<tr><td colspan='7'>Loading...</td></tr>";

  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then((json) => {
      console.log("DATA VTS PSU =", json);

      const data = Array.isArray(json) ? json : json.data || [];

      tbody.innerHTML = "";

      if (!data.length) {
        tbody.innerHTML = "<tr><td colspan='7'>Data kosong</td></tr>";
        return;
      }

      data.forEach((d, i) => {
        const status = String(d["Status VTS"] || "").toLowerCase();
        const warna = status.includes("active") ? "#16a34a" : "#ef4444";

        tbody.insertAdjacentHTML(
          "beforeend",
          `
          <tr>
            <td>${d["No"] || i + 1}</td>
            <td>${d["Node"] || "-"}</td>
            <td>${d["License Plate"] || "-"}</td>
            <td>${d["Jenis kendaraan"] || "-"}</td>
            <td>${d["IMEI"] || "-"}</td>
            <td>${d["IMSI"] || "-"}</td>
            <td style="color:${warna};font-weight:bold;">
              ${d["Status VTS"] || "-"}
            </td>
          </tr>
          `
        );
      });
    })
    .catch((err) => {
      console.error("ERROR VTS PSU =", err);
      tbody.innerHTML = "<tr><td colspan='7'>❌ Gagal ambil data PSU</td></tr>";
    });
}
function submitCekRutin() {
  const data = {
    type: "cek_rutin",

    tanggal: document.getElementById("cekTanggal").value,
    node: document.getElementById("cekNode").value,
    plate: document.getElementById("cekPlate").selectedOptions[0].text,
    imei: document.getElementById("cekIMEI").value,
    imsi: document.getElementById("cekIMSI").value,
    rfid: document.getElementById("cekRFID").value,
    fuel: document.getElementById("cekFuel").value,
    relay: document.getElementById("cekRelay").value,
    fuse: document.getElementById("cekFuse").value,
    instalasi: document.getElementById("cekInstalasi").value,
    job: document.getElementById("cekJob").value,
    keterangan: document.getElementById("cekKeterangan").value
  };

  fetch(
    "https://script.google.com/macros/s/AKfycbzdMdw6ZNMoj1IimADGcl2mVf0WHCgx9dBOys5BFPfMt4th8NmsuLlbO2DeZYV1aaPxRQ/exec",
    {
      method: "POST",
      body: JSON.stringify(data)
    }
  )
    .then((res) => res.json())
    .then((res) => {
      alert(res.message);

      // 🔥 RESET FORM
      resetFormCekRutin();
    })
    .catch((err) => {
      alert("Gagal koneksi");
      console.error(err);
    });
}
function resetFormCekRutin() {
  document.getElementById("cekTanggal").value = "";
  document.getElementById("cekNode").value = "";
  document.getElementById("cekPlate").selectedIndex = 0;
  document.getElementById("cekIMEI").value = "";
  document.getElementById("cekIMSI").value = "";
  document.getElementById("cekRFID").selectedIndex = 0;
  document.getElementById("cekFuel").selectedIndex = 0;
  document.getElementById("cekRelay").selectedIndex = 0;
  document.getElementById("cekFuse").selectedIndex = 0;
  document.getElementById("cekInstalasi").selectedIndex = 0;
  document.getElementById("cekJob").value = "";
  document.getElementById("cekKeterangan").value = "";
}

function formatTanggal(tgl) {
  if (!tgl) return "";

  const date = new Date(tgl);

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function warnaStatus(val) {
  if (val === "NOT OK") return "style='color:red;font-weight:bold'";
  if (val === "OK") return "style='color:green;font-weight:bold'";
  return "";
}

function loadCekRutinReport() {
  document.getElementById("cekRutinSection").style.display = "none";
  document.getElementById("reportCekRutinSection").style.display = "block";

  fetch(
     "https://script.google.com/macros/s/AKfycbzdMdw6ZNMoj1IimADGcl2mVf0WHCgx9dBOys5BFPfMt4th8NmsuLlbO2DeZYV1aaPxRQ/exec?type=cek_rutin"
  )
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.querySelector("#tabelCekRutin tbody");
      tbody.innerHTML = "";

      data.reverse().forEach((item) => {
        const row = `
          <tr>
            <td>${formatTanggal(item.Tanggal)}</td>
            <td>${item.Node || ""}</td>
            <td>${item["License Plate"] || ""}</td>
            <td>${item.IMEI || ""}</td>
            <td>${item.IMSI || ""}</td>
            <td ${warnaStatus(item.RFID)}>${item.RFID || ""}</td>
            <td ${warnaStatus(item["Fuel stick"])}>${
          item["Fuel stick"] || ""
        }</td>
            <td ${warnaStatus(item.Relay)}>${item.Relay || ""}</td>
            <td ${warnaStatus(item["Fuse VTS"])}>${item["Fuse VTS"] || ""}</td>
            <td ${warnaStatus(item["Instalasi VTS"])}>${
          item["Instalasi VTS"] || ""
        }</td>
            <td>${item["Job Number"] || ""}</td>
            <td>${item.Keterangan || ""}</td>
          </tr>
        `;
        tbody.innerHTML += row;
      });
    })
    .catch((err) => {
      alert("Gagal load data");
      console.error(err);
    });
}

function kembaliKeForm() {
  document.getElementById("cekRutinSection").style.display = "block";
  document.getElementById("reportCekRutinSection").style.display = "none";
}

let chartInstance;

// ================= PARSE TANGGAL =================
function parseTanggal(tanggalStr) {
  try {
    const [datePart, timePart] = tanggalStr.split(", ");
    const [day, month, year] = datePart.split("/");
    const [hour, min, sec] = timePart.split(".");

    const fullYear = "20" + year;

    return new Date(fullYear, month - 1, day, hour, min, sec);
  } catch {
    return null;
  }
}

// ================= NORMALIZE TEXT =================
function normalizeText(text) {
  return (text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function detectArea(item) {
  const vehicle = (
    item["Vehicle id"] ||
    item["vehicle id"] ||
    ""
  ).toLowerCase();

  const plate = (
    item["Plate License"] ||
    item["plate license"] ||
    ""
  ).toLowerCase();

  const gabung = vehicle + " " + plate;

  if (gabung.includes("jambi")) return "jambi";
  if (gabung.includes("rantau")) return "rantau";
  if (gabung.includes("psu") || gabung.includes("pangkalan"))
    return "pangkalan susu";

  return "";
}
// ================= SET DROPDOWN 1 LEVEL (JOB + FIELD) =================
(function () {
  const select = document.getElementById("filterJob");
  if (!select) return;

  select.innerHTML = `
    <option value="">Semua</option>

        <option value="maintenance|">Maintenance (Semua)</option>
    <option value="maintenance|PT.PERTAMINA ASSET 1 FIELD JAMBI">↳ Maintenance - PT.PERTAMINA ASSET 1 FIELD JAMBI</option>
    <option value="maintenance|PT.PERTAMINA ASSET 1 FIELD RANTAU">↳ Maintenance - PT.PERTAMINA ASSET 1 FIELD RANTAU</option>
    <option value="maintenance|PT.PERTAMINA ASSET 1 FIELD PANGKALAN SUSU">↳ Maintenance - PT.PERTAMINA ASSET 1 FIELD PANGKALAN SUSU</option>

    <option value="cek rutin|">Cek Rutin (Semua)</option>
    <option value="cek rutin|PT.PERTAMINA ASSET 1 FIELD JAMBIi">↳ Cek Rutin - PT.PERTAMINA ASSET 1 FIELD JAMBI</option>
    <option value="cek rutin|PT.PERTAMINA ASSET 1 FIELD RANTAU">↳ Cek Rutin - PT.PERTAMINA ASSET 1 FIELD RANTAU</option>
    <option value="cek rutin|PT.PERTAMINA ASSET 1 FIELD PANGKALAN SUSU">↳ cek rutin - PT.PERTAMINA ASSET 1 FIELD PANGKALAN SUSU</option>

    <option value="Data Retrieval|">Data Retrieval (Semua)</option>
    <option value="Data Retrieval|PT.PERTAMINA ASSET 1 FIELD JAMBI">↳ Data Retrieval - PT.PERTAMINA ASSET 1 FIELD JAMBI</option>
    <option value="Data Retrieval|PT.PERTAMINA ASSET 1 FIELD RANTAU">↳ Data Retrieval - PT.PERTAMINA ASSET 1 FIELD RANTAU</option>
    <option value="Data Retrieval|PT.PERTAMINA ASSET 1 FIELD PANGKALAN SUSU">↳ Data Retrieval - PT.PERTAMINA ASSET 1 FIELD PANGKALAN SUSU</option>

    <option value="Dismantle|">Dismantle (Semua)</option>
    <option value="Dismantle|PT.PERTAMINA ASSET 1 FIELD JAMBI">↳ Dismantle - PT.PERTAMINA ASSET 1 FIELD JAMBI</option>
    <option value="Dismantle|PT.PERTAMINA ASSET 1 FIELD RANTAU">↳ Dismantle - PT.PERTAMINA ASSET 1 FIELD RANTAU</option>
    <option value="Dismantle|PT.PERTAMINA ASSET 1 FIELD PANGKALAN SUSU">↳ Dismantle - PT.PERTAMINA ASSET 1 FIELD PANGKALAN SUSU</option>
   
    <option value="Re Installation|">Re Installation (Semua)</option>
    <option value="Re Installation|PT.PERTAMINA ASSET 1 FIELD JAMBI">↳ Re Installation - PT.PERTAMINA ASSET 1 FIELD JAMBI</option>
    <option value="Re Installation|PT.PERTAMINA ASSET 1 FIELD RANTAU">↳ Re Installation - PT.PERTAMINA ASSET 1 FIELD RANTAU</option>
    <option value="Re Installation|PT.PERTAMINA ASSET 1 FIELD PANGKALAN SUSU">↳ Re Installation - PT.PERTAMINA ASSET 1 FIELD PANGKALAN SUSU</option>

    <option value="Installation|">Installation (Semua)</option>
    <option value="Installation|PT.PERTAMINA ASSET 1 FIELD JAMBI">↳ Installation - PT.PERTAMINA ASSET 1 FIELD JAMBI</option>
    <option value="Installation|PT.PERTAMINA ASSET 1 FIELD RANTAU">↳ Installation - PT.PERTAMINA ASSET 1 FIELD RANTAU</option>
    <option value="Installation|PT.PERTAMINA ASSET 1 FIELD PANGKALAN SUSU">↳ Installation - PT.PERTAMINA ASSET 1 FIELD PANGKALAN SUSU</option>

    <option value="Ganti Unit|">Ganti Unit (Semua)</option>
    <option value="Ganti Unit|PT.PERTAMINA ASSET 1 FIELD JAMBI">↳ Ganti Unit - PT.PERTAMINA ASSET 1 FIELD JAMBI</option>
    <option value="Ganti Unit|PT.PERTAMINA ASSET 1 FIELD RANTAU">↳ Ganti Unit - PT.PERTAMINA ASSET 1 FIELD RANTAU</option>
    <option value="Ganti Unit|PT.PERTAMINA ASSET 1 FIELD PANGKALAN SUSU">↳ PT.PERTAMINA ASSET 1 FIELD PANGKALAN SUSU - RANTAU</option>

    <option value="Adding Acc|">Adding Acc (Semua)</option>
    <option value="Adding Acc|PT.PERTAMINA ASSET 1 FIELD JAMBI">↳ Adding Acc - PT.PERTAMINA ASSET 1 FIELD JAMBI</option>
    <option value="Adding Acc|PT.PERTAMINA ASSET 1 FIELD RANTAU">↳ Adding Acc - PT.PERTAMINA ASSET 1 FIELD RANTAU</option>
    <option value="Adding Acc|PT.PERTAMINA ASSET 1 FIELD PANGKALAN SUSU">↳ Adding Acc - PT.PERTAMINA ASSET 1 FIELD PANGKALAN SUSU</option>


  `;
})();
// ================= LOAD DASHBOARD =================
function loadDashboardMaintenance() {
  const selectedValue = document.getElementById("filterJob").value;

  // 🔥 pecah jadi job dan field
  const [job, field] = selectedValue.split("|");

  const selected = normalizeText(job || "");
  const selectedField = normalizeText(field || "");

  fetch(
    "https://script.google.com/macros/s/AKfycbzdMdw6ZNMoj1IimADGcl2mVf0WHCgx9dBOys5BFPfMt4th8NmsuLlbO2DeZYV1aaPxRQ/exec"
  )
    .then((res) => res.text())
    .then((text) => {
      let data;
      try {
        data = JSON.parse(text);
        globalData = data;
      } catch {
        throw new Error("Response bukan JSON");
      }

      let grouped = {};
      let progressCount = 0;
      let progressVehicles = [];

      data.forEach((item) => {
        let tanggal = item["Tanggal"] || item["tanggal"] || "";
        if (!tanggal) return;

        const date = parseTanggal(tanggal);
        if (!date) return;

        // ================= FILTER JOB =================
        const workingTypeRaw =
          item["working type"] || item["Working type"] || "";
        const workingType = normalizeText(workingTypeRaw);

        if (selected && !workingType.includes(selected)) return;

        // ================= FILTER FIELD =================
        if (selectedField) {
          const userName =
            item["User name"] || item["user name"] || item["User Name"] || "";

          if (!normalizeText(userName).includes(selectedField)) return;
        }

        // ================= AMBIL DATA =================
        const vehicle =
          item["Vehicle id"] || item["vehicle id"] || item["Vehicle ID"] || "";

        const statusRaw =
          item["progres status"] || item["Progres Status"] || item["AF"] || "";

        const status = normalizeText(statusRaw);

        // ================= HITUNG PROGRESS =================
        if (status.includes("progress")) {
          progressCount++;

          if (vehicle && !progressVehicles.includes(vehicle)) {
            progressVehicles.push(vehicle);
          }
        }

        // ================= GROUPING =================
        let key;

        if (selected === "dataretrieval") {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(date.getDate()).padStart(2, "0")}`;
        } else {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}`;
        }

        if (!grouped[key]) grouped[key] = 0;
        grouped[key]++;
      });

      const rawLabels = Object.keys(grouped).sort(
        (a, b) => new Date(a) - new Date(b)
      );

      const values = rawLabels.map((k) => grouped[k]);

      const labels = rawLabels.map((l) => {
        if (selected === "dataretrieval") {
          const d = new Date(l);
          return d.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short"
          });
        } else {
          const [y, m] = l.split("-");
          return new Date(y, m - 1).toLocaleDateString("id-ID", {
            month: "short",
            year: "numeric"
          });
        }
      });

      // ================= KPI =================
      const total = values.reduce((a, b) => a + b, 0);
      const lastMonth = values.length ? values[values.length - 1] : 0;

      document.getElementById("kpiTotal").innerText = total;
      document.getElementById("kpiLastMonth").innerText = lastMonth;
      document.getElementById(
        "kpiUpdate"
      ).innerText = new Date().toLocaleTimeString("id-ID");

      document.getElementById("kpiProgress").innerText = progressCount;

      let displayList = progressVehicles.slice(0, 5).join(", ");
      if (progressVehicles.length > 5) displayList += " ...";

      document.getElementById("kpiProgressList").innerText = displayList || "-";

      renderChartTrend(labels, values, selectedValue);
    })
    .catch((err) => {
      alert("Gagal load dashboard");
      console.error(err);
    });
}
// ================= RENDER CHART PROFESSIONAL =================
function renderChartTrend(labels, data, jobName) {
  const canvas = document.getElementById("chartMaintenance");
  const ctx = canvas.getContext("2d");

  if (chartInstance) {
    chartInstance.destroy();
  }

  // ===== gradient fill =====
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, "rgba(37,99,235,.35)");
  gradient.addColorStop(0.5, "rgba(37,99,235,.12)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  // ===== glow line =====
  const glowGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  glowGradient.addColorStop(0, "#60a5fa");
  glowGradient.addColorStop(0.5, "#2563eb");
  glowGradient.addColorStop(1, "#1d4ed8");

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: jobName ? `Trend ${jobName}` : "Semua Job",
          data,
          fill: true,
          backgroundColor: gradient,
          borderColor: glowGradient,
          borderWidth: 4,
          tension: 0.42,

          pointRadius: 3,
          pointHoverRadius: 8,
          pointHitRadius: 20,

          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#2563eb",
          pointBorderWidth: 3,

          hoverBorderWidth: 4
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        intersect: false,
        mode: "index"
      },

      animation: {
        duration: 1400,
        easing: "easeOutQuart"
      },

      // klik detail
      onClick: (evt, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const label = labels[index];
          showDetailByLabel(label, jobName);
        }
      },

      plugins: {
        legend: {
          position: "top",
          align: "start",
          labels: {
            color: "#111827",
            usePointStyle: true,
            pointStyle: "circle",
            boxWidth: 10,
            padding: 25,
            font: {
              size: 13,
              weight: "600"
            }
          }
        },

        tooltip: {
          padding: 14,
          cornerRadius: 14,
          caretSize: 8,
          displayColors: false,

          backgroundColor: "rgba(17,24,39,.95)",
          titleColor: "#fff",
          bodyColor: "#dbeafe",
          borderColor: "rgba(255,255,255,.08)",
          borderWidth: 1,

          callbacks: {
            title: (items) => "Tanggal : " + items[0].label,
            label: (ctx) => "Jumlah Job : " + ctx.raw
          }
        }
      },

      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: "#6b7280",
            font: {
              size: 12,
              weight: "500"
            }
          }
        },

        y: {
          beginAtZero: true,

          grid: {
            drawBorder: false,
            color: "rgba(148,163,184,.15)",
            lineWidth: 1
          },

          ticks: {
            precision: 0,
            color: "#6b7280",
            padding: 10,
            font: {
              size: 12,
              weight: "500"
            }
          }
        }
      }
    }
  });
}
function showDetailByLabel(label, selectedJob) {
  const tbody = document.querySelector("#detailTable tbody");
  tbody.innerHTML = "";

  if (!globalData || globalData.length === 0) {
    alert("Data belum siap");
    return;
  }

  console.clear();
  console.log("🟢 LABEL CHART DIKLIK:", label);
  console.log("🟢 SELECTED JOB:", selectedJob);

  // 🔥 pecah job dan field
  const [job, field] = (selectedJob || "").split("|");

  const selected = normalizeText(job || "");
  const selectedField = normalizeText(field || "");

  let found = false;

  globalData.forEach((item, i) => {
    let tanggal = item["Tanggal"] || item["tanggal"] || "";
    if (!tanggal) return;

    const date = parseTanggal(tanggal);
    if (!date) return;

    // 🔍 DEBUG TANGGAL
    console.log(
      `Row ${i + 1}`,
      "| Raw:",
      tanggal,
      "| Parsed:",
      date,
      "| Day:",
      date.getDate(),
      "| Month:",
      date.getMonth(),
      "| Year:",
      date.getFullYear()
    );

    const workingType = normalizeText(
      item["working type"] || item["Working type"] || ""
    );

    // ================= FILTER JOB =================
    if (selected && !workingType.includes(selected)) return;

    // 🔥 ================= FILTER FIELD =================
    if (selectedField) {
      const userName =
        item["User name"] || item["user name"] || item["User Name"] || "";

      if (!normalizeText(userName).includes(selectedField)) return;
    }

    let match = false;
    // 🔥 MATCH BERDASARKAN DATA ASLI (BUKAN TEXT)
    if (selected === "dataretrieval") {
  const bulanMap = {
    jan: 0,
    januari: 0,

    feb: 1,
    februari: 1,

    mar: 2,
    maret: 2,

    apr: 3,
    april: 3,

    mei: 4,

    jun: 5,
    juni: 5,

    jul: 6,
    juli: 6,

    agu: 7,
    agustus: 7,

    sep: 8,
    september: 8,

    okt: 9,
    oktober: 9,

    nov: 10,
    november: 10,

    des: 11,
    desember: 11
  };

  const parts = label.trim().split(/\s+/);

  const day = parseInt(parts[0]);
  const monthName = (parts[1] || "").toLowerCase();
  const month = bulanMap[monthName];
  const year = date.getFullYear();

  console.log(
    "📌 DATARETRIEVAL MATCH:",
    "| Day:", day,
    "| Month:", month,
    "| Year:", year
  );

  if (!isNaN(day) && month !== undefined) {
    match =
      date.getDate() === day &&
      date.getMonth() === month &&
      date.getFullYear() === year;
  }
}
    else {
      const bulanMap = {
        jan: 0,
        january: 0,

        feb: 1,
        february: 1,

        mar: 2,
        march: 2,

        apr: 3,
        april: 3,

        may: 4,
        mei: 4,

        jun: 5,
        june: 5,

        jul: 6,
        july: 6,

        aug: 7,
        august: 7,

        sep: 8,
        sept: 8,
        september: 8,

        oct: 9,
        okt: 9,
        oktober: 9,
        october: 9,

        nov: 10,
        november: 10,

        dec: 11,
        des: 11, // 🔥 FIX
        desember: 11,
        december: 11
      };

      const parts = label.trim().split(/\s+/);
      const monthName = (parts[0] || "").toLowerCase();
      const year = parseInt(parts[1]);

      const targetMonth = bulanMap[monthName];

      // 🔍 DEBUG LABEL
      console.log(
        "📌 BULAN MATCH:",
        "| Label:",
        label,
        "| MonthName:",
        monthName,
        "| TargetMonth:",
        targetMonth,
        "| Year:",
        year
      );

      if (targetMonth !== undefined && !isNaN(year)) {
        match = date.getMonth() === targetMonth && date.getFullYear() === year;
      }
    }

    // 🔍 DEBUG MATCH
    console.log("✅ MATCH?", match, "| Tanggal:", tanggal, "| Label:", label);

    if (!match) return;

    const vehicle = item["Vehicle id"] || item["vehicle id"] || "-";
    const status = item["Progres Status"] || item["progres status"] || "-";

    const tr = `
      <tr>
        <td>${tanggal}</td>
        <td>${vehicle}</td>
        <td>${workingType}</td>
        <td>${status}</td>
      </tr>
    `;

    tbody.innerHTML += tr;
    found = true;
  });

  if (!found) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;color:#888;padding:25px;">
          Tidak ada data untuk <b>${label}</b>
        </td>
      </tr>
    `;
  }

  document.getElementById("modalDetail").style.display = "block";
}

function closeModal() {
  document.getElementById("modalDetail").style.display = "none";
}
// ============================
// 🔔 TOGGLE DROPDOWN NOTIF
// ============================
window.toggleNotifDropdown = function () {
  const box = document.getElementById("notifDropdown");
  const isActive = box.classList.contains("active");

  if (isActive) {
    box.classList.remove("active");
    box.style.display = "none";
  } else {
    box.style.display = "block";
    setTimeout(() => box.classList.add("active"), 10);
  }
};

// ============================
// 🔔 FIX — CLICK OUTSIDE CLOSE DROPDOWN
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const bell = document.querySelector(".notif-bell");
  const dropdown = document.getElementById("notifDropdown");

  // Klik lonceng
  bell.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleNotifDropdown();
  });

  // Klik di dalam dropdown → jangan tutup
  dropdown.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  // Klik luar dropdown → tutup
  document.addEventListener("click", () => {
    dropdown.classList.remove("active");
    dropdown.style.display = "none";
  });
});

// ============================
// 🔄 LOAD OTOMATIS
// ============================
loadWorkingTypeNotification();

// ===================== KIRIM KE GOOGLE SHEET =====================
async function sendToGoogleSheet(formData) {
  const scriptURL =
    "https://script.google.com/macros/s/AKfycbzdMdw6ZNMoj1IimADGcl2mVf0WHCgx9dBOys5BFPfMt4th8NmsuLlbO2DeZYV1aaPxRQ/exec";

  const loader = document.getElementById("loaderOverlay");
  if (loader) loader.style.display = "flex";

  try {

    const fd = new FormData();

    fd.append("data", JSON.stringify(formData));

    const res = await fetch(scriptURL, {
      method: "POST",
      body: fd
    });
    
    alert("✅ Data + foto berhasil dikirim");

    // =========================
    // RESET FORM
    // =========================
    const form = document.getElementById("jobForm");
    if (form) form.reset();

    // reset preview foto kalau ada
    const preview = document.getElementById("previewImage");
    if (preview) {
      preview.src = "";
      preview.style.display = "none";
    }

    // reset text area manual kalau perlu
    const deskripsi = document.getElementById("deskripsiPekerjaan");
    if (deskripsi) deskripsi.value = "";

    // generate nomor job baru
    if (typeof generateJobNumber === "function") {
      generateJobNumber();
    }

    // update tanggal baru
    const tanggal = document.getElementById("current-date");
    if (tanggal) {
      tanggal.textContent = new Date().toLocaleString("id-ID");
    }

    // scroll ke atas
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  } catch (err) {
    console.error("❌ Error:", err);
    alert("❌ Gagal kirim");
  } finally {
    if (loader) loader.style.display = "none";
  }
}
// ===================== HIDE SEMUA =====================
function hideAllSections() {
  // main
  const main = document.querySelector("main");
  if (main) main.style.display = "none";

  // report umum
  document.querySelectorAll(".report-section").forEach((el) => {
    el.style.display = "none";
  });

  // 🔥 hide laporan foto
  document.querySelectorAll(".photo-report-section").forEach((el) => {
    el.style.display = "none";
  });

  const photoSection = document.getElementById("photoReportSection");
  if (photoSection) {
    photoSection.style.display = "none";
  }

  // 🔥 semua section VTS HARUS DIPAKSA HIDE
  const vtsSections = ["vtsSection", "vtsSectionRantau", "vtsSectionPSU"];

  vtsSections.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = "none";

      // kalau mau bersihkan isi:
      // el.querySelector("tbody")?.innerHTML = "";
    }
  });

  // slide panel
  document.querySelectorAll(".slide-panel").forEach((el) => {
    el.classList.remove("open");
  });

  // monitoring panel
  document.querySelectorAll(".monitoring-panel").forEach((el) => {
    el.classList.remove("open");
  });
}
// ===================== FORM =====================
function showForm() {
  hideAllSections();

  document.querySelector("main").style.display = "block";

  document.getElementById("slidePanel").classList.remove("open");
}

// ===================== CEK RUTIN =====================
function showCekRutinVTS() {
  hideAllSections();

  document.getElementById("cekRutinSection").style.display = "block";

  document.getElementById("slidePanel").classList.remove("open");
}

// ===================== REPORT =====================
function showReport() {
  hideAllSections();

  document.getElementById("reportSection").style.display = "block";
  loadReport();

  document.getElementById("slidePanel").classList.remove("open");
}

// ===================== FOTO =====================
function showPhotoReport() {
  hideAllSections();

  document.getElementById("photoReportSection").style.display = "block";
  loadPhotoReport();

  document.getElementById("slidePanel").classList.remove("open");
}

// ===================== DASHBOARD =====================
function showDashboardMaintenance() {
  hideAllSections();

  // 🔥 hanya dashboard yang tampil
  document.getElementById("dashboardSection").style.display = "block";

  loadDashboardMaintenance();

  document.getElementById("slidePanel").classList.remove("open");
}

function showVTS() {
  hideAllSections();

  const el = document.getElementById("vtsSection");
  if (el) el.style.display = "block";

  loadVTS();
}

function showVTSRantau() {
  hideAllSections();

  const el = document.getElementById("vtsSectionRantau");
  if (el) el.style.display = "block";

  loadVTSRantau();
}

function showVTSPSU() {
  hideAllSections();

  const el = document.getElementById("vtsSectionPSU");
  if (el) el.style.display = "block";

  if (typeof loadVTSPsu === "function") {
    loadVTSPsu();
  } else {
    console.error("❌ loadVTSPsu belum dibuat");
  }
}

function showMonitoringKontrak(type = "jambi") {
  hideAllSections();

  const section = document.getElementById("monitoringKontrakSection");
  if (!section) {
    console.error("❌ monitoringKontrakSection tidak ditemukan");
    return;
  }

  section.style.display = "block";

  let title = "Monitoring Harian VTS Pertamina Jambi";

  if (type === "rantau") {
    title = "Monitoring Harian VTS Pertamina Rantau";
  }

  if (type === "psu") {
    title = "Monitoring Harian VTS Pertamina PSU";
  }

  const titleMain = document.getElementById("titleMain");
  if (titleMain) {
    titleMain.textContent = title;
  }

  // 🔥 penting: reset header + load data pakai type
  generateTanggalHeader();
  loadMonitoringData(type);

  window.scrollTo({ top: 0, behavior: "smooth" });

  document.getElementById("slidePanel")?.classList.remove("open");
  document.getElementById("monitoringPanel")?.classList.remove("open");
  document.getElementById("monitoringPanelRantau")?.classList.remove("open");
  document.getElementById("monitoringPanelPSU")?.classList.remove("open");
}

function showProgressReport(type = "jambi") {
  hideAllSections();

  document.getElementById("progressReportSection").style.display = "block";

  loadProgressReport(type);

  window.scrollTo({ top: 0, behavior: "smooth" });

  document.getElementById("slidePanel").classList.remove("open");
  document.getElementById("monitoringPanel").classList.remove("open");
  document.getElementById("monitoringPanelRantau").classList.remove("open");
  document.getElementById("monitoringPanelPSU").classList.remove("open");
}

function showSummaryDayVTS(type = "jambi") {
  hideAllSections();

  document.getElementById("summaryDaySection").style.display = "block";

  loadSummaryDay(type);

  window.scrollTo({ top: 0, behavior: "smooth" });

  document.getElementById("slidePanel").classList.remove("open");
  document.getElementById("monitoringPanel").classList.remove("open");
  document.getElementById("monitoringPanelRantau").classList.remove("open");
  document.getElementById("monitoringPanelPSU").classList.remove("open");
}

// ===================== TOGGLE MENU UTAMA =====================
function togglePanel(e) {
  if (e) e.stopPropagation();

  const btn = e.currentTarget;
  const panel = document.getElementById("slidePanel");

  const rect = btn.getBoundingClientRect();

  panel.style.left = rect.left + "px";
  panel.style.top = rect.bottom + 8 + "px";
  panel.style.width = rect.width + "px";

  panel.classList.toggle("open");
}
// ===================== TOGGLE MONITORING =====================
function toggleMonitoringPanel(type, btn, e) {
  if (e) e.stopPropagation();

  document.querySelectorAll(".monitoring-panel").forEach((p) => {
    p.classList.remove("open");
  });

  let panel;

  if (type === "jambi") panel = document.getElementById("monitoringPanel");
  if (type === "rantau")
    panel = document.getElementById("monitoringPanelRantau");
  if (type === "psu") panel = document.getElementById("monitoringPanelPSU");

  if (!panel || !btn) return;

  const rect = btn.getBoundingClientRect();

  /* posisi tepat di bawah tombol */
  panel.style.left = rect.left + "px";
  panel.style.top = rect.bottom + 8 + "px";

  /* 🔥 lebar otomatis ikut tombol */
  panel.style.width = rect.width + "px";

  panel.classList.toggle("open");
}
// ===================== CLOSE ALL PANEL =====================
function closeAllPanels() {
  document.querySelectorAll(".slide-panel").forEach((panel) => {
    panel.classList.remove("open");
  });
}

// ===================== TOGGLE PANEL UTAMA =====================
function togglePanel(e) {
  if (e) e.stopPropagation();

  const panel = document.getElementById("slidePanel");

  // cek status sebelum ditutup semua
  const isOpen = panel.classList.contains("open");

  // tutup semua panel dulu
  closeAllPanels();

  // kalau sebelumnya belum open → buka
  if (!isOpen) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();

    panel.style.left = rect.left + "px";
    panel.style.top = rect.bottom + 8 + "px";
    panel.style.width = rect.width + "px";

    panel.classList.add("open");
  }
}

// ===================== TOGGLE MONITORING PANEL =====================
function toggleMonitoringPanel(type, btn, e) {
  if (e) e.stopPropagation();

  let panel = null;

  if (type === "jambi") {
    panel = document.getElementById("monitoringPanel");
  }

  if (type === "rantau") {
    panel = document.getElementById("monitoringPanelRantau");
  }

  if (type === "psu") {
    panel = document.getElementById("monitoringPanelPSU");
  }

  if (!panel) return;

  // cek status dulu
  const isOpen = panel.classList.contains("open");

  // tutup semua
  closeAllPanels();

  // buka panel yg dipilih kalau sebelumnya tertutup
  if (!isOpen) {
    const rect = btn.getBoundingClientRect();

    panel.style.left = rect.left + "px";
    panel.style.top = rect.bottom + 8 + "px";
    panel.style.width = rect.width + "px";

    panel.classList.add("open");
  }
}

// ===================== AUTO CLOSE (KLIK LUAR) =====================
document.addEventListener("click", function (e) {
  const klikDiPanel = e.target.closest(".slide-panel");
  const klikDiTombol = e.target.closest(".slide-btn");

  if (!klikDiPanel && !klikDiTombol) {
    closeAllPanels();
  }
});
const API_MAP = {
  jambi:
    "https://script.google.com/macros/s/AKfycbxdlTGtyAdapfCRhFgiB9E2gWqpUVwSU5ZxqY70SC3Bqi9tKSXciehwADcjlc64vJ-_QA/exec",

  rantau:
    "https://script.google.com/macros/s/AKfycbx2qYSANHLW5_rwBnoEf6W1bUVNPc3q1QFi8QqeeC7Ve_ubCZcRl7Z1rQEbLzaxkB4l/exec",

  psu:
    "https://script.google.com/macros/s/AKfycbwEWKwgvMaoYVYWyThk3L5_qU7xTI4pfjTxc4pOvhhlF9gldFEvDg4tc1whiNhxO9tEpA/exec"
};
// 🔥 helper ambil value fleksibel (anti beda nama kolom)
function getVal(d, keys) {
  for (let k of keys) {
    if (d[k] !== undefined) return d[k];
  }
  return "";
}

// 🔥 helper cari key tanggal (anti beda huruf besar/kecil)
function getTanggalValue(d, i) {
  const target = ("tanggal" + i).toLowerCase().replace(/\s/g, "");
  const key = Object.keys(d).find(
    (k) => k.toLowerCase().replace(/\s/g, "") === target
  );
  return key ? d[key] : "";
}

// ✅ Generate tanggal 1–31
function generateTanggalHeader() {
  const header = document.getElementById("monitoringHeader");

  if (!header) {
    console.error("❌ monitoringHeader tidak ditemukan");
    return;
  }

  header.querySelectorAll(".tgl").forEach((el) => el.remove());

  for (let i = 1; i <= 31; i++) {
    const th = document.createElement("th");
    th.classList.add("tgl");
    th.innerText = "Tgl " + i;
    header.appendChild(th);
  }
}
function refreshMonitoring() {
  console.log("🔄 Refresh:", activeMonitoringType);
  loadMonitoringData(activeMonitoringType);
}

// =========================
// 🔥 LOAD MULTI LOCATION
// =========================
async function loadMonitoringData(type = activeMonitoringType) {
  // simpan lokasi aktif
  activeMonitoringType = type;

  const tbody = document.getElementById("monitoringTableBody");
  const mdvrHeader = document.getElementById("mdvrHeader");

  // tampilkan MDVR hanya untuk Rantau
  if (mdvrHeader) {
    mdvrHeader.style.display = type === "rantau" ? "" : "none";
  }

  if (!tbody) {
    console.error("❌ monitoringTableBody tidak ditemukan");
    return;
  }

  tbody.innerHTML = "<tr><td colspan='50'>Loading...</td></tr>";

  try {
    const API_URL = API_MAP[type];

    console.log("TYPE =", type);
    console.log("ACTIVE TYPE =", activeMonitoringType);
    console.log("API URL =", API_URL);

    if (!API_URL) {
      throw new Error("API tidak ditemukan: " + type);
    }

    const url = API_URL + "?sheet=Monitoring";

    console.log("REQUEST =", url);

    const res = await fetch(url);

    console.log("STATUS =", res.status);
    console.log("OK =", res.ok);
    console.log("CONTENT TYPE =", res.headers.get("content-type"));

    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    // 🔥 ambil raw dulu biar ketahuan isi response asli
    const raw = await res.text();

    console.log("RAW RESPONSE ↓↓↓");
    console.log(raw);

    let json;

    try {
      json = JSON.parse(raw);
    } catch (parseErr) {
      console.error("❌ JSON parse gagal:", parseErr);
      throw new Error("Response bukan JSON valid");
    }

    console.log("DATA API =", json);
    // =========================
    // 🔥 HEADER
    // =========================
    if (json.header && json.header.length) {
      const titleMain = document.getElementById("titleMain");
      const titleSub = document.getElementById("titleSub");

      if (titleMain) {
        let lokasiText = "Jambi";
        if (type === "rantau") lokasiText = "Rantau";
        if (type === "psu") lokasiText = "PSU";

        titleMain.innerText =
          json.header[0] || `Monitoring Harian VTS Pertamina ${lokasiText}`;

        titleMain.style.fontSize = "26px";
        titleMain.style.fontWeight = "800";
        titleMain.style.marginBottom = "12px";
        titleMain.style.letterSpacing = "0.5px";
      }

      if (titleSub) {
        const subText = json.header[1] || "";

        titleSub.style.fontSize = "15px";
        titleSub.style.color = "#222";
        titleSub.style.lineHeight = "1.8";

        const parts = subText.split("|");

        titleSub.innerHTML = parts
          .map((p) => {
            const split = p.split(":");

            if (split.length >= 2) {
              return `
                <div style="
                  display:grid;
                  grid-template-columns:150px 10px auto;
                  margin:3px 0;
                  align-items:center;
                ">
                  <span style="font-weight:800;">${split[0].trim()}</span>
                  <span style="text-align:center;">:</span>
                  <span style="font-weight:600;">${split
                    .slice(1)
                    .join(":")
                    .trim()}</span>
                </div>
              `;
            }

            return `<div>${p.trim()}</div>`;
          })
          .join("");
      }
    }

    // =========================
    // 🔥 DATA
    // =========================
    const data = json.data || [];

    tbody.innerHTML = "";

    if (!data.length) {
      tbody.innerHTML = "<tr><td colspan='50'>⚠ Data kosong</td></tr>";
      return;
    }

    data.forEach((d, index) => {
      let row = `
        <tr>
          <td>${getVal(d, ["No"]) || index + 1}</td>
          <td>${getVal(d, ["Node"])}</td>
          <td>${getVal(d, ["License Plate", "Licence plate"])}</td>
          <td>${getVal(d, ["Jenis kendaraan", "Jenis Kendaraan"])}</td>
          <td>${getVal(d, ["IMEI"])}</td>
          <td>${getVal(d, ["IMSI"])}</td>

          <td class="${
            getVal(d, ["Status VTS"]) === "Active" ? "active" : "inactive"
          }">
            ${getVal(d, ["Status VTS"])}
          </td>

          <td>${getVal(d, ["Status RFID"])}</td>

          <td>
              ${getVal(d, [
              "Status Fuel Stock",
              "Status Fuel Stick"
              ])}
          </td>

         ${
           type === "rantau"
            ? `
         <td class="${
            getVal(d, ["Status MDVR"]) === "Active"
            ? "active"
            : "inactive"
             }">
           ${getVal(d, ["Status MDVR"])}
       </td>
           `
           : ""
          }

        <td>${getVal(d, ["Remarks"])}</td>
        <td>${getVal(d, ["Pengecekan Unit"])}</td>
        <td>${getVal(d, ["Duration Eror/Hari"])}</td>
      `;

      for (let i = 1; i <= 31; i++) {
        const val = getTanggalValue(d, i);

        row += `
          <td class="${
            val === "Active" ? "active" : val === "Inactive" ? "inactive" : ""
          }">
            ${val || "-"}
          </td>
        `;
      }

      row += "</tr>";
      tbody.innerHTML += row;
    });
  } catch (err) {
    console.error("LOAD MONITORING ERROR =", err);
    console.error("MESSAGE =", err.message);

    tbody.innerHTML =
      "<tr><td colspan='50'>❌ Gagal load data (cek console)</td></tr>";
  }
}

const monitoringBody = document.querySelector(".monitoring-body");
const monitoringHeader = document.querySelector(".monitoring-header");

monitoringBody.addEventListener("scroll", function () {
  monitoringHeader.scrollLeft = monitoringBody.scrollLeft;
});
// =========================
// 🔥 AUTO DEFAULT JAMI
// =========================
window.addEventListener("DOMContentLoaded", () => {
  generateTanggalHeader();
  loadMonitoringData("jambi");
});

function downloadExcelFix() {
  try {
    if (typeof XLSX === "undefined") {
      alert("❌ XLSX belum ke-load");
      return;
    }

    const tbody = document.getElementById("monitoringTableBody");
    const headerRow = document.getElementById("monitoringHeader");
    const titleMain = document.getElementById("titleMain");
    const titleSub = document.getElementById("titleSub");

    if (!tbody || !headerRow) {
      alert("❌ Struktur tabel tidak ditemukan");
      return;
    }

    const rows = tbody.querySelectorAll("tr");

    if (rows.length === 0) {
      alert("⚠️ Data kosong");
      return;
    }

    if (rows[0].innerText.includes("Klik tombol")) {
      alert("⚠️ Load data dulu");
      return;
    }

    // =========================
    // 🔥 AMBIL JUDUL
    // =========================
    const title = titleMain ? titleMain.innerText : "Monitoring VTS";

    // =========================
    // 🔥 AMBIL HEADER INFO
    // =========================
    let formattedInfo = [];

    if (titleSub) {
      const rowsInfo = titleSub.querySelectorAll("div");

      rowsInfo.forEach((div) => {
        const spans = div.querySelectorAll("span");

        if (spans.length >= 3) {
          const label = spans[0].innerText.trim();
          const value = spans[2].innerText.trim();

          formattedInfo.push([label, ": " + value]);
        } else {
          const parts = div.innerText.split(":");
          formattedInfo.push([
            (parts[0] || "").trim(),
            ": " + (parts[1] || "").trim()
          ]);
        }
      });
    }

    // =========================
    // 🔥 HEADER KOLOM
    // =========================
    const headers = [];
    headerRow.querySelectorAll("th").forEach((th) => {
      headers.push(th.innerText.trim());
    });

    // =========================
    // 🔥 DATA
    // =========================
    const data = [];
    rows.forEach((tr) => {
      const row = [];
      tr.querySelectorAll("td").forEach((td) => {
        row.push(td.innerText.trim());
      });
      data.push(row);
    });

    // =========================
    // 🔥 GABUNG SEMUA
    // =========================
    const sheetData = [[title], ...formattedInfo, [], [], headers, ...data];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // =========================
    // 🔥 MERGE JUDUL (A s/d kolom terakhir)
    // =========================
    ws["!merges"] = [
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: headers.length - 1 }
      }
    ];

    // =========================
    // 🔥 FREEZE (SAMPAI HEADER TABEL)
    // =========================
    const freezeRow = 1 + formattedInfo.length + 2 + 1;
    // penjelasan:
    // 1 = judul
    // + formattedInfo
    // + 2 baris kosong
    // + 1 header tabel

    ws["!freeze"] = {
      xSplit: 0,
      ySplit: freezeRow
    };

    // =========================
    // 🔥 LEBAR KOLOM
    // =========================
    ws["!cols"] = [
      { wch: 25 },
      { wch: 40 },
      ...headers.map(() => ({ wch: 20 }))
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monitoring VTS");

    XLSX.writeFile(wb, "Monitoring_VTS.xlsx");
  } catch (err) {
    console.error("REAL ERROR:", err);
    alert("❌ Export gagal (lihat console)");
  }
}

const PROGRESS_API_MAP = {
  jambi:
    "https://script.google.com/macros/s/AKfycbxdlTGtyAdapfCRhFgiB9E2gWqpUVwSU5ZxqY70SC3Bqi9tKSXciehwADcjlc64vJ-_QA/exec",

  rantau:
    "https://script.google.com/macros/s/AKfycbx2qYSANHLW5_rwBnoEf6W1bUVNPc3q1QFi8QqeeC7Ve_ubCZcRl7Z1rQEbLzaxkB4l/exec?sheet=Progres%20Report",

  psu:
    "https://script.google.com/macros/s/AKfycbwEWKwgvMaoYVYWyThk3L5_qU7xTI4pfjTxc4pOvhhlF9gldFEvDg4tc1whiNhxO9tEpA/exec?sheet=Progres%20Report"
};
// =========================
// 🔥 LOAD PROGRESS REPORT (MULTI AREA)
// =========================
async function loadProgressReport(type = "jambi") {
  const tbody = document.getElementById("progressTableBody");

  tbody.innerHTML = `<tr><td colspan="10">⏳ Loading data...</td></tr>`;

  try {
    const PROGRESS_API = PROGRESS_API_MAP[type];

    if (!PROGRESS_API) {
      throw new Error("API tidak ditemukan untuk: " + type);
    }

    // 🔥 tambahkan parameter sheet
    const url =
      PROGRESS_API +
      (PROGRESS_API.includes("?") ? "&" : "?") +
      "sheet=" +
      encodeURIComponent("Progres Report");

    console.log("TYPE =", type);
    console.log("REQUEST =", url);

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error("HTTP error " + res.status);
    }

    const json = await res.json();

    console.log("DATA PROGRESS:", json);

    // =========================
    // 🔥 HEADER
    // =========================
    if (json.header) {
      const title = document.getElementById("progressTitle");
      const info = document.getElementById("progressInfo");

      let lokasi = "Jambi";
      if (type === "rantau") lokasi = "Rantau";
      if (type === "psu") lokasi = "PSU";

      if (title) {
        title.innerText =
          "📈 " + (json.header.title || `Progress Report VTS ${lokasi}`);
      }

      if (info) {
        info.innerHTML = `
          <div><b>Customer</b> : ${json.header.customer || "-"}</div>
          <div><b>Job Type</b> : ${json.header.job || "-"}</div>
          <div><b>Area</b> : ${json.header.area || lokasi}</div>
        `;
      }
    }

    // =========================
    // 🔥 DATA
    // =========================
    const data = json.data || [];

    tbody.innerHTML = "";

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="10">Data kosong</td></tr>`;
      return;
    }

    let no = 1;

    data.forEach((item) => {
      const row = `
        <tr>
          <td>${no++}</td>
          <td>${item.Node || "-"}</td>
          <td>${item["License Plate"] || item["Licence plate"] || "-"}</td>
          <td>${item["Status VTS"] || "-"}</td>
          <td>${item.IMEI || "-"}</td>
          <td>${item.IMSI || "-"}</td>
          <td>${item.Status || "-"}</td>
        </tr>
      `;

      tbody.innerHTML += row;
    });
  } catch (err) {
    console.error("LOAD PROGRESS ERROR:", err);
    tbody.innerHTML = `<tr><td colspan="10">❌ Gagal load data</td></tr>`;
  }
}
function downloadProgressExcel() {
  try {
    if (typeof XLSX === "undefined") {
      alert("❌ XLSX belum ke-load");
      return;
    }

    const headerRow = document.getElementById("progressHeader");
    const tbody = document.getElementById("progressTableBody");

    const titleEl = document.getElementById("progressTitle");
    const infoEl = document.getElementById("progressInfo");

    if (!headerRow || !tbody) {
      alert("❌ Struktur tabel tidak ditemukan");
      return;
    }

    const rows = tbody.querySelectorAll("tr");

    if (rows.length === 0 || rows[0].innerText.includes("Klik tombol")) {
      alert("⚠️ Data belum tersedia");
      return;
    }

    // =========================
    // 🔥 AMBIL JUDUL
    // =========================
    const title = titleEl ? titleEl.innerText : "Progress Report VTS";

    // =========================
    // 🔥 AMBIL HEADER INFO (RAPI 3 KOLOM)
    // =========================
    let formattedInfo = [];

    if (infoEl) {
      const structuredRows = infoEl.querySelectorAll(".info-row");

      // kalau pakai struktur baru (label, colon, value)
      if (structuredRows.length > 0) {
        structuredRows.forEach((row) => {
          const label = row.querySelector(".label")?.innerText.trim() || "";
          const value = row.querySelector(".value")?.innerText.trim() || "";

          formattedInfo.push([label, ": " + value]);
        });
      }
      // fallback kalau masih format lama
      else {
        infoEl.querySelectorAll("div").forEach((div) => {
          const parts = div.innerText.split(":");
          formattedInfo.push([
            (parts[0] || "").trim(),
            ": " + (parts[1] || "").trim()
          ]);
        });
      }
    }

    // =========================
    // 🔥 HEADER KOLOM
    // =========================
    const headers = [];
    headerRow.querySelectorAll("th").forEach((th) => {
      headers.push(th.innerText.trim());
    });

    // =========================
    // 🔥 DATA
    // =========================
    const data = [];
    rows.forEach((tr) => {
      const row = [];
      tr.querySelectorAll("td").forEach((td, index) => {
        let text = td.innerText.trim();

        // 🔥 fix IMEI biar tidak scientific
        if (index === 4) {
          text = "'" + text;
        }

        row.push(text);
      });

      if (row.length > 1) data.push(row);
    });

    // =========================
    // 🔥 GABUNG SEMUA
    // =========================
    const sheetData = [[title], ...formattedInfo, [], headers, ...data];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // =========================
    // 🔥 MERGE JUDUL
    // =========================
    ws["!merges"] = [
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: headers.length - 1 }
      }
    ];

    // =========================
    // 🔥 LEBAR KOLOM (HEADER + DATA)
    // =========================
    ws["!cols"] = [
      { wch: 20 }, // label
      { wch: 5 }, // :
      { wch: 35 }, // value
      ...headers.map(() => ({ wch: 25 }))
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Progress Report");

    const now = new Date();
    const fileName = `Progress_Report_VTS_${now.getFullYear()}-${
      now.getMonth() + 1
    }-${now.getDate()}.xlsx`;

    XLSX.writeFile(wb, fileName);
  } catch (err) {
    console.error("DOWNLOAD ERROR:", err);
    alert("❌ Gagal download, cek console (F12)");
  }
}
const SUMMARY_API_MAP = {
  jambi:
    "https://script.google.com/macros/s/AKfycbxdlTGtyAdapfCRhFgiB9E2gWqpUVwSU5ZxqY70SC3Bqi9tKSXciehwADcjlc64vJ-_QA/exec?sheet=Summary%20Day",

  rantau:
    "https://script.google.com/macros/s/AKfycbx2qYSANHLW5_rwBnoEf6W1bUVNPc3q1QFi8QqeeC7Ve_ubCZcRl7Z1rQEbLzaxkB4l/exec?sheet=Summary%20Day",

  psu:
    "https://script.google.com/macros/s/AKfycbwEWKwgvMaoYVYWyThk3L5_qU7xTI4pfjTxc4pOvhhlF9gldFEvDg4tc1whiNhxO9tEpA/exec?sheet=Summary%20Day"
};

// 🔥 helper ambil value (anti beda nama kolom)
function getVal(obj, keys) {
  for (let k of keys) {
    if (obj[k] !== undefined && obj[k] !== "") return obj[k];
  }
  return "-";
}

// 🔥 NORMALISASI KEY (ANTI SPASI & CASE)
function normalizeKeys(obj) {
  const newObj = {};
  Object.keys(obj).forEach((k) => {
    const clean = k.toLowerCase().replace(/\s+/g, "");
    newObj[clean] = obj[k];
  });
  return newObj;
}

function formatDate(val) {
  try {
    if (!val || val === "-") return "-";

    if (typeof val === "string" && val.includes("T")) {
      const date = new Date(val);
      if (isNaN(date)) return val;

      const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000);

      return wib.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    }

    if (typeof val === "string") {
      return val.replace(/-/g, " ").replace(/april/i, "April");
    }

    const date = new Date(val);
    if (isNaN(date)) return val;

    const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000);

    return wib.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  } catch (err) {
    console.error("FORMAT DATE ERROR:", val, err);
    return val || "-";
  }
}

// =========================
// 🔥 MAIN FUNCTION MULTI AREA
// =========================
async function loadSummaryDay(type = "jambi") {
  const thead = document.getElementById("summaryThead");
  const tbody = document.getElementById("summaryTableBody");
  const title = document.getElementById("summaryTitle");

  tbody.innerHTML = `<tr><td colspan="12">⏳ Loading...</td></tr>`;

  try {
    const SUMMARY_API = SUMMARY_API_MAP[type];

    if (!SUMMARY_API) {
      throw new Error("API tidak ditemukan: " + type);
    }

    const res = await fetch(SUMMARY_API);
    const json = await res.json();

    console.log("SUMMARY RAW:", json);

    let data = [];
    let periode = "";

    if (Array.isArray(json)) {
      data = json;
    } else {
      data = json.data || [];
      periode = json.periode || "";
    }

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="12">Data kosong</td></tr>`;
      return;
    }

    // =========================
    // 🔥 HEADER TITLE DINAMIS
    // =========================
    let lokasi = "Jambi";
    if (type === "rantau") lokasi = "Rantau";
    if (type === "psu") lokasi = "PSU";

    let headerHTML = "";

    if (json.header && json.header.length > 0) {
      headerHTML = json.header.join("<br>");
    } else {
      headerHTML = `
        SUMMARY OF CHARGE FOR SERVICE CHARGE <br>
        PERTAMINA EP ASSET ${lokasi} <br>
        PERIODE
      `;
    }

    title.innerHTML = headerHTML;

    // =========================
    // 🔥 TABLE HEADER (TETAP)
    // =========================
    thead.innerHTML = `
      <tr>
        <th rowspan="2">NO</th>
        <th colspan="2">Unit identification</th>
        <th colspan="3">Vehicle identification</th>
        <th rowspan="2">VTS/MONTH</th>
        <th rowspan="2">RFID</th>
        <th rowspan="2">FUEL STICK INDIKATOR/MONTH</th>
        <th rowspan="2">KOLOM TAMBAHAN</th>
        <th colspan="2">Periode pemakaian</th>
        <th rowspan="2">Jumlah hari</th>
      </tr>
      <tr>
        <th>GPS No</th>
        <th>IMEI</th>
        <th>License Plate</th>
        <th>Vehicle ID</th>
        <th>Model</th>
        <th>Start</th>
        <th>End</th>
      </tr>
    `;

    // =========================
    // 🔥 BODY DATA
    // =========================
    tbody.innerHTML = "";
    let no = 1;

    data.forEach((item) => {
      const clean = normalizeKeys(item);

      const startRaw =
        clean["start"] ||
        clean["periodepemakaianstart"] ||
        clean["2026periodepemakaianstart"];

      const endRaw =
        clean["end"] ||
        clean["periodepemakaianend"] ||
        clean["2026periodepemakaianend"];

      const jumlahHari = clean["jumlahhari"] || clean["days"];

      const row = `
        <tr>
          <td>${no++}</td>
          <td>${getVal(item, ["GPS No"])}</td>
          <td>${getVal(item, ["IMEI"])}</td>
          <td>${getVal(item, ["License Plate"])}</td>
          <td>${getVal(item, ["Vehicle ID", "VEHICLE ID"])}</td>
          <td>${getVal(item, ["MODEL", "Model"])}</td>
          <td>${getVal(item, ["VTS/MONTH"])}</td>
          <td>${getVal(item, ["RFID"])}</td>
          <td>${getVal(item, ["FUEL STICK INDIKATOR/MONTH"])}</td>
          <td>${getVal(item, ["KOLOM TAMBAHAN"])}</td>

          <td>${formatDate(startRaw)}</td>
          <td>${formatDate(endRaw)}</td>

          <td>${jumlahHari || "-"}</td>
        </tr>
      `;

      tbody.innerHTML += row;
    });
  } catch (err) {
    console.error("SUMMARY ERROR:", err);
    tbody.innerHTML = `<tr><td colspan="12">❌ Gagal load data</td></tr>`;
  }
}
function downloadSummaryExcel() {
  const table = document.querySelector("#summaryDaySection table");

  if (!table) {
    alert("Tabel tidak ditemukan!");
    return;
  }

  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
  `;

  // 🔥 ambil judul
  const title = document.getElementById("summaryTitle").innerText;
  html += `<h2 style="text-align:center;">${title.replace(/\n/g, "<br>")}</h2>`;

  // 🔥 ambil tabel
  html += table.outerHTML;

  html += `</body></html>`;

  const blob = new Blob([html], {
    type: "application/vnd.ms-excel"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "Summary_VTS.xls";
  a.click();

  URL.revokeObjectURL(url);
}
function refreshSummary() {
  const tbody = document.getElementById("summaryTableBody");

  // 🔥 kasih loading effect
  tbody.innerHTML = `<tr><td colspan="12">🔄 Refreshing...</td></tr>`;

  // 🔥 reload data
  loadSummaryDay();
}
/* ===================== LOAD LAPORAN PEKERJAAN ===================== */
const rowsPerPage = 100;
let currentPage = 1;
let allReportData = [];
let filteredData = [];

// ===================== LOAD DATA LAPORAN =====================
async function loadReport() {
  const tableBody = document.querySelector("#reportTable tbody");

  // 🌀 Loader animasi
  tableBody.innerHTML = `
    <tr>
      <td colspan="17" style="text-align:center; font-weight:500; font-size:15px;">
        <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
          <div class="loader"></div>
          <span>Memuat data laporan, mohon tunggu...</span>
        </div>
      </td>
    </tr>`;

  try {
    const scriptURL =
      "https://script.google.com/macros/s/AKfycbzdMdw6ZNMoj1IimADGcl2mVf0WHCgx9dBOys5BFPfMt4th8NmsuLlbO2DeZYV1aaPxRQ/exec";
    const response = await fetch(scriptURL);

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    console.log("📥 Data Laporan:", data);

    allReportData = data;
    currentPage = 1;
    renderReportTable();
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="18" style="text-align:center;">❌ Gagal memuat data!</td></tr>`;
    console.error("❌ Error load report:", error);
  }
}

// ===================== RENDER TABEL =====================
function renderReportTable() {
  const tableBody = document.querySelector("#reportTable tbody");
  tableBody.innerHTML = "";

  if (!allReportData || allReportData.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="18" style="text-align:center;">❌ Tidak ada data laporan</td></tr>`;
    return;
  }

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const dataSource =
  filteredData.length ? filteredData : allReportData;
  const pageData = dataSource.slice(start, end);

  pageData.forEach((item, i) => {
    const row = document.createElement("tr");
    const photoField = item["Foto Bukti"] || item["Upload foto Bukti"] || "";
    const tanggal = item["Tanggal"] || "";

    row.innerHTML = `
      <td>${start + i + 1}</td>
      <td>${item["Job Number"] || ""}</td>
      <td>${tanggal}</td>
      <td>${item["User name"] || ""}</td>
      <td>${item["working type"] || ""}</td>
      <td>${item["installation type"] || ""}</td>
      <td>${item["Merk kendaraan"] || ""}</td>
      <td>${item["Vehicle type"] || ""}</td>
      <td>${item["Lisence plate"] || ""}</td>
      <td>${item["Vehicle id"] || ""}</td>
      <td>${item["Department"] || ""}</td>
      <td>${item["GPS Serial No"] || ""}</td>
      <td>${item["GPS Unit ID"] || ""}</td>
      <td>${item["GSM"] || ""}</td>
      <td>${item["Progres Status"] || ""}</td>
      <td class="desc-cell">${item["Deskripsi Pekerjaan"] || ""}</td>
      <td>${renderPhotoCell(photoField)}</td>
     <td>
  <button class="view-btn table-btn" onclick='openDetail(${JSON.stringify(
    item
  )})'>
    <i class="fa-solid fa-eye"></i> Detail
  </button>

  <button class="edit-btn table-btn" onclick='openEdit(${JSON.stringify(
    item
  )})'>
    <i class="fa-solid fa-pen-to-square"></i> Edit
  </button>

  <button class="delete-btn table-btn" onclick='deleteItem("${
    item["Job Number"]
  }")'>
    <i class="fa-solid fa-trash"></i> Hapus
  </button>
</td>

    `;
    tableBody.appendChild(row);
  });

  renderPaginationNumbers();
}

// ===================== OPEN EDIT =====================
function openEdit(item) {
  // Tampilkan form input
  showForm();

  // Scroll halus ke form input
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Mengisi form SAMPAI SAMA dengan formData yang Anda kirim ke Sheet
  document.getElementById("jobNumber").textContent = item["Job Number"] || "";
  document.getElementById("user").value = item["User name"] || "";
  document.getElementById("workingType").value = item["working type"] || "";
  document.getElementById("installationType").value =
    item["installation type"] || "";
  document.getElementById("merkKendaraan").value = item["Merk kendaraan"] || "";
  document.getElementById("vehicleType").value = item["Vehicle type"] || "";
  document.getElementById("licensePlate").value = item["Lisence plate"] || "";
  document.getElementById("vehicleId").value = item["Vehicle id"] || "";
  document.getElementById("department").value = item["Department"] || "";
  document.getElementById("colour").value = item["Colour"] || "";
  document.getElementById("location").value = item["Location"] || "";
  document.getElementById("gpsSerial").value = item["GPS Serial No"] || "";
  document.getElementById("gpsUnitId").value = item["GPS Unit ID"] || "";
  document.getElementById("gsm").value = item["GSM"] || "";
  document.getElementById("distance").value = item["Distance"] || "";

  // Radio
  setRadio("gps", item["GPS Unit Module"]);
  setRadio("rfid", item["RFID Reader"]);
  setRadio("buzzer", item["Buzzer"]);
  setRadio("starter", item["Stater interupter"]);
  setRadio("fuel", item["Fuel stick"]);

  // Komponen
  setRadio("d-mesin", item["Mesin"]);
  setRadio("d-paneldashboard", item["Panel Dasbord"]);
  setRadio("d-klakson", item["Klakson"]);
  setRadio("d-audio", item["Audio"]);
  setRadio("d-listrik", item["Sistem listrik"]);
  setRadio("d-ac", item["AC"]);
  setRadio("d-powerwindows", item["Power windows"]);
  setRadio("d-panelinstrument", item["Panel Instrument"]);
  setRadio("d-spion", item["Spion"]);

  // Lainnya
  document.getElementById("deskripsiPekerjaan").value =
    item["Deskripsi Pekerjaan"] || "";
  document.getElementById("progressStatus").value =
    item["Progres Status"] || "";
}

// ===================== HELPER RADIO =====================
function setRadio(name, value) {
  const radios = document.querySelectorAll(`input[name="${name}"]`);
  radios.forEach((r) => {
    r.checked = r.parentElement.textContent.trim() === value;
  });
}

// ===================== DELETE ITEM =====================
async function deleteItem(jobNumber) {
  if (!confirm("❗ Apakah Anda yakin ingin menghapus data ini?")) return;

  try {
    const scriptURL =
      "https://script.google.com/macros/s/AKfycbzdMdw6ZNMoj1IimADGcl2mVf0WHCgx9dBOys5BFPfMt4th8NmsuLlbO2DeZYV1aaPxRQ/exec";

    const payload = {
      _method: "DELETE",
      jobNumber: jobNumber
    };

    const fd = new FormData();
    fd.append("data", JSON.stringify(payload));

    const response = await fetch(scriptURL, {
      method: "POST",
      body: fd
    });

    const result = await response.json();

    console.log("DELETE RESULT =", result);

    if (result.status === "success") {
      // hapus data lokal
      allReportData = allReportData.filter(
        item => String(item["Job Number"]).trim() !== String(jobNumber).trim()
      );

      localStorage.setItem(
        "reportData",
        JSON.stringify(allReportData)
      );

      renderReportTable();

      alert("✅ Data berhasil dihapus permanen");
    } else {
      alert("❌ " + result.message);
    }

  } catch (err) {
    console.error("DELETE ERROR =", err);
    alert("❌ Gagal menghapus data");
  }
}
// ===================== PAGINATION DENGAN ANGKA =====================
function renderPaginationNumbers() {

  // 🔥 TAMBAHAN
  const dataSource =
    filteredData.length ? filteredData : allReportData;

  // 🔥 GANTI totalPages
  const totalPages = Math.ceil(dataSource.length / rowsPerPage);

  let paginationContainer = document.getElementById("pagination");

  if (!paginationContainer) {
    paginationContainer = document.createElement("div");
    paginationContainer.id = "pagination";
    paginationContainer.style.textAlign = "center";
    paginationContainer.style.margin = "15px 0";
    paginationContainer.style.userSelect = "none";

    document
      .querySelector(".table-responsive")
      .after(paginationContainer);
  }

  let buttonsHTML = `
    <span class="page-btn"
      onclick="changePage(-1)"
      ${
        currentPage === 1
          ? "style='opacity:0.5;pointer-events:none;'"
          : ""
      }>
      ⬅
    </span>
  `;

  for (let i = 1; i <= totalPages; i++) {
    buttonsHTML += `
      <span class="page-number ${
        i === currentPage ? "active" : ""
      }"
      onclick="goToPage(${i})">
        ${i}
      </span>
    `;
  }

  buttonsHTML += `
    <span class="page-btn"
      onclick="changePage(1)"
      ${
        currentPage === totalPages
          ? "style='opacity:0.5;pointer-events:none;'"
          : ""
      }>
      ➡
    </span>
  `;

  paginationContainer.innerHTML = buttonsHTML;
}

function goToPage(page) {
  currentPage = page;

  renderReportTable();

  document
    .querySelector(".table-responsive")
    .scrollIntoView({
      behavior: "smooth",
    });
}

function changePage(direction) {

  // 🔥 TAMBAHAN
  const dataSource =
    filteredData.length ? filteredData : allReportData;

  // 🔥 GANTI totalPages
  const totalPages = Math.ceil(
    dataSource.length / rowsPerPage
  );

  const newPage = currentPage + direction;

  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;

    renderReportTable();

    document
      .querySelector(".table-responsive")
      .scrollIntoView({
        behavior: "smooth",
      });
  }
}
// ===================== RENDER FOTO =====================
function renderPhotoCell(photoField) {
  if (!photoField) return "❌ Tidak ada foto";
  if (photoField.startsWith("http")) {
    return `<a href="${photoField}" target="_blank">📷 Lihat</a>`;
  }
  return photoField;
}

async function downloadReportWithPhotos() {
  const table = document.getElementById("reportTable");
  if (!table) return alert("❌ Tabel tidak ditemukan!");

  // === 🔄 Tambahkan loader overlay ===
  const loader = document.createElement("div");
  loader.id = "excelLoader";
  loader.style.position = "fixed";
  loader.style.top = 0;
  loader.style.left = 0;
  loader.style.width = "100vw";
  loader.style.height = "100vh";
  loader.style.background = "rgba(0, 0, 0, 0.5)";
  loader.style.display = "flex";
  loader.style.flexDirection = "column";
  loader.style.alignItems = "center";
  loader.style.justifyContent = "center";
  loader.style.zIndex = 9999;
  loader.innerHTML = `
    <div style="background:#fff; padding:20px 40px; border-radius:10px; text-align:center; box-shadow:0 0 15px rgba(0,0,0,0.2);">
      <div class="spinner" style="border: 4px solid #eee; border-top: 4px solid #007ACC; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
      <p style="font-family:'Poppins',sans-serif; color:#007ACC; font-weight:500;">🔄 Sedang menyiapkan file Excel...</p>
    </div>
  `;
  document.body.appendChild(loader);

  // === Animasi spinner ===
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Report");

    // ===== Ambil header =====
    const headers = Array.from(table.querySelectorAll("thead th")).map((th) =>
      th.innerText.trim()
    );
    sheet.addRow(headers);

    // ===== Ambil data =====
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll("td");
      const rowValues = [];

      for (let j = 0; j < cells.length; j++) {
        const img = cells[j].querySelector("img");
        if (img) {
          rowValues.push(""); // Placeholder untuk gambar
        } else {
          rowValues.push(cells[j].innerText.trim());
        }
      }

      const addedRow = sheet.addRow(rowValues);

      // ===== Tambahkan gambar =====
      for (let j = 0; j < cells.length; j++) {
        const img = cells[j].querySelector("img");
        if (img) {
          try {
            const response = await fetch(img.src);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();

            const imageId = workbook.addImage({
              buffer: arrayBuffer,
              extension: "jpeg"
            });

            // Letakkan gambar di sel
            sheet.addImage(imageId, {
              tl: { col: j, row: i + 1 },
              ext: { width: 80, height: 60 }
            });
          } catch (err) {
            console.error("⚠️ Gagal menambahkan gambar:", err);
          }
        }
      }
    }

    // ===== Styling header =====
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
      cell.border = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } }
      };
    });

    // ===== Styling isi =====
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFEEEEEE" } },
            left: { style: "thin", color: { argb: "FFEEEEEE" } },
            bottom: { style: "thin", color: { argb: "FFEEEEEE" } },
            right: { style: "thin", color: { argb: "FFEEEEEE" } }
          };
          cell.alignment = {
            vertical: "middle",
            horizontal: "left",
            wrapText: true
          };
        });
      }
    });

    sheet.columns.forEach((col) => (col.width = 25));

    // ===== Simpan Excel =====
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer]),
      `report_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  } catch (error) {
    alert("❌ Terjadi kesalahan saat membuat file Excel!");
    console.error(error);
  } finally {
    // === Hapus loader setelah selesai ===
    loader.remove();
  }
}

// ===================== LOAD LAPORAN FOTO =====================
async function loadPhotoReport() {
  const tableBody = document.querySelector("#photoReportTable tbody");
  const paginationContainer = document.getElementById("photoPagination");

  tableBody.innerHTML = `
    <tr>
      <td colspan="8" style="text-align:center; font-weight:500; font-size:15px;">
        <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
          <div class="loader"></div>
          <span>Memuat data foto, mohon tunggu...</span>
        </div>
      </td>
    </tr>
  `;

  try {
    const scriptURL =
      "https://script.google.com/macros/s/AKfycbzdMdw6ZNMoj1IimADGcl2mVf0WHCgx9dBOys5BFPfMt4th8NmsuLlbO2DeZYV1aaPxRQ/exec";

    console.log("📡 Fetching data from:", scriptURL);
    const response = await fetch(scriptURL);

    // 🛑 Jika tidak 200 OK
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status} - ${response.statusText}`);
    }

    // 🧠 Coba parse JSON dengan aman
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      const textData = await response.text();
      console.error("⚠️ Response bukan JSON valid:", textData);
      throw new Error("Response dari server bukan format JSON valid");
    }

    console.log("✅ Data diterima:", data);

    // 🔍 Filter data yang memiliki foto
    const filteredData = data.filter(
      (item) => item["Upload foto Bukti"] || item["Foto Bukti"]
    );

    if (filteredData.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">📭 Tidak ada foto tersimpan</td></tr>`;
      paginationContainer.innerHTML = "";
      return;
    }

    // 📖 Pagination
    const rowsPerPage = 10;
    let currentPage = 1;
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    function renderPage(page) {
      tableBody.innerHTML = "";
      const start = (page - 1) * rowsPerPage;
      const end = start + rowsPerPage;
      const pageData = filteredData.slice(start, end);

      pageData.forEach((item, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${start + index + 1}</td>
          <td>${item["Job Number"] || ""}</td>
          <td>${item["User name"] || ""}</td>
          <td>${item["Department"] || ""}</td>
          <td>${item["Vehicle id"] || ""}</td>
          <td>${item["Progres Status"] || ""}</td>
          <td>${
            item["Deskripsi Pekerjaan"] || "<i>Tidak ada deskripsi</i>"
          }</td>
          <td>${renderPhotoCell(
            item["Upload foto Bukti"] || item["Foto Bukti"]
          )}</td>
        `;
        tableBody.appendChild(row);
      });

      renderPagination(page);
      window.scrollTo({ top: tableBody.offsetTop - 100, behavior: "smooth" });
    }

    // 🔢 Pagination angka
    function renderPagination(activePage) {
      paginationContainer.innerHTML = "";
      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.className = `page-number ${i === activePage ? "active" : ""}`;
        btn.onclick = () => renderPage(i);
        paginationContainer.appendChild(btn);
      }
    }

    renderPage(currentPage);
  } catch (err) {
    console.error("❌ Error load photo report:", err);
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">❌ Gagal memuat data!<br><small>${err.message}</small></td></tr>`;
  }
}

// === UTILITAS: Tampilkan Foto ===
function renderPhotoCell(url) {
  if (!url) return "<span style='color:#aaa;'>📷 Tidak ada foto</span>";
  let fileId = "";
  const patterns = [
    /\/d\/([a-zA-Z0-9_-]{25,})/,
    /id=([a-zA-Z0-9_-]{25,})/,
    /open\?id=([a-zA-Z0-9_-]{25,})/,
    /file\/d\/([a-zA-Z0-9_-]{25,})/,
    /uc\?export=view&id=([a-zA-Z0-9_-]{25,})/,
    /([a-zA-Z0-9_-]{25,})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      fileId = match[1];
      break;
    }
  }

  const photoURL = fileId
    ? `https://lh3.googleusercontent.com/d/${fileId}=s220`
    : url;

  return `
    <a href="https://drive.google.com/file/d/${fileId}/view" target="_blank" title="Klik untuk lihat foto">
      <img src="${photoURL}"
           alt="Foto Bukti"
           onerror="this.onerror=null;this.src='https://cdn-icons-png.flaticon.com/512/1828/1828665.png';"
           style="width:70px;height:70px;border-radius:10px;object-fit:cover;box-shadow:0 0 3px rgba(0,0,0,0.3);cursor:pointer;">
    </a>
  `;
}

async function downloadPhotoReport() {
  const table = document.getElementById("photoReportTable");
  if (!table) return alert("❌ Tabel laporan foto tidak ditemukan!");

  // === 🔄 Tampilkan loader ===
  const loader = document.createElement("div");
  loader.id = "downloadLoader";
  loader.innerHTML = `
    <div class="loader-overlay">
      <div class="loader-box">
        <div class="spinner"></div>
        <p>Mengunduh laporan dengan foto... Mohon tunggu 🙏</p>
      </div>
    </div>
  `;
  document.body.appendChild(loader);

  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Laporan Foto");

    // === Ambil header sampai kolom "Foto Bukti" ===
    const allHeaders = Array.from(
      table.querySelectorAll("thead th")
    ).map((th) => th.innerText.trim());
    const fotoIndex = allHeaders.findIndex((h) =>
      h.toLowerCase().includes("foto bukti")
    );
    const headers =
      fotoIndex !== -1 ? allHeaders.slice(0, fotoIndex + 1) : allHeaders;
    sheet.addRow(headers);

    // === Ambil data baris ===
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll("td");
      const rowValues = [];
      const limit = fotoIndex !== -1 ? fotoIndex + 1 : cells.length;

      for (let j = 0; j < limit; j++) {
        const img = cells[j].querySelector("img");
        if (img) {
          rowValues.push(""); // placeholder gambar
        } else {
          rowValues.push(cells[j].innerText.trim());
        }
      }

      const addedRow = sheet.addRow(rowValues);

      // === Tambah gambar jika ada ===
      for (let j = 0; j < limit; j++) {
        const img = cells[j].querySelector("img");
        if (img) {
          try {
            const response = await fetch(img.src);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();

            const imageId = workbook.addImage({
              buffer: arrayBuffer,
              extension: "jpeg"
            });

            sheet.addImage(imageId, {
              tl: { col: j, row: i + 1 },
              ext: { width: 80, height: 60 }
            });
          } catch (err) {
            console.error("⚠️ Gagal menambahkan gambar:", err);
          }
        }
      }
    }

    // === Lebar kolom otomatis ===
    sheet.columns.forEach((col) => (col.width = 25));

    // === Styling header ===
    const headerRow = sheet.getRow(1);
    for (let i = 1; i <= fotoIndex + 1; i++) {
      const cell = headerRow.getCell(i);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF007ACC" } // biru
      };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // putih
      cell.alignment = { vertical: "middle", horizontal: "center" };
    }

    // === Download hasil Excel ===
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer]),
      `laporan_foto_${new Date().toISOString().split("T")[0]}.xlsx`
    );

    alert("✅ Laporan dengan foto berhasil diunduh!");
  } catch (err) {
    console.error("❌ Gagal membuat laporan:", err);
    alert("❌ Terjadi kesalahan saat membuat laporan. Silakan coba lagi.");
  } finally {
    // === 🔁 Hapus loader setelah selesai ===
    const loader = document.getElementById("downloadLoader");
    if (loader) loader.remove();
  }
}

// ===================== MODAL DETAIL =====================
function openDetail(item = {}) {
  const modal = document.getElementById("detailModal");
  const modalContent = document.getElementById("detailContent");
  modal.style.display = "block";

  // ================= Bagian C – Hasil Uji =================
  const bagianCKeys = [
    "GPS Unit Module",
    "RFID Reader",
    "Buzzer",
    "Stater interupter",
    "Fuel stick"
  ];
  const hasilUji = bagianCKeys.map((key) => ({
    jobDescription: key,
    status: item[key] || "",
    note: "",
    checked: item[key] === "OK"
  }));

  // ================= Bagian D – Komponen =================
  const bagianDKeys = [
    "Mesin",
    "Panel Dasbord",
    "Klakson",
    "Audio",
    "Sistem listrik",
    "AC",
    "Power windows",
    "Panel Instrument",
    "Spion"
  ];
  const bagD = bagianDKeys.map((key) => ({
    deskripsi: item[key + "_desc"] || "",
    OK: (item[key] || "").toLowerCase() === "ok",
    NotOK: (item[key] || "").toLowerCase() === "not ok",
    NA: (item[key] || "").toLowerCase() === "na"
  }));

  // ================= Bagian E – Deskripsi Pekerjaan =================
  const deskripsiPekerjaan = (item["Deskripsi Pekerjaan"] || "").replace(
    /\r\n|\r/g,
    "\n"
  );

  // ===================== TANGGAL / HARI UPDATE OTOMATIS =====================
  const now = new Date();
  const hariList = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu"
  ];
  const hari = hariList[now.getDay()];
  const tanggal = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  // 🔄 Jika belum ada hari update, buat otomatis
  if (!item["Hari Update"]) {
    item["Hari Update"] = `${hari}, ${tanggal}`;

    // Simpan ke localStorage agar tidak berubah lagi
    let allData = JSON.parse(localStorage.getItem("jobReports") || "[]");
    const index = allData.findIndex(
      (d) => d["Job Number"] === item["Job Number"]
    );

    if (index !== -1) {
      allData[index]["Hari Update"] = item["Hari Update"];
    } else {
      allData.push(item);
    }

    localStorage.setItem("jobReports", JSON.stringify(allData));
  }

  const html = `
<style>
  * {
    font-family: "Segoe UI", Roboto, Arial, sans-serif;
    line-height: 1.45;
    color: #222;
  }

  body {
    background: #ffffff;
  }

  h1, h2 {
    margin: 0;
    font-weight: 600;
  }

  /* HEADER PREMIUM */
  .modal-header {
    display: flex;
    align-items: center;
    gap: 22px;
    padding-bottom: 22px;
    border-bottom: 3px solid #1e3a8a; /* 🔥 ditegaskan warna */
    margin-bottom: 26px;
  }

  .modal-header img {
    height: 100px;
    border-radius: 4px;
    border: 2.5px solid #1e3a8a; /* 🔥 border foto premium */
  }

  .modal-header h1 {
    font-size: 27px;
  }

  .modal-header h2 {
    font-size: 19px;
    color: #334155;
  }

  /* JOB BOX */
  .job-number {
    background: #f3f6ff;
    border: 2px solid #1e3a8a; /* 🔥 diperkeras */
    padding: 14px 18px;
    border-radius: 12px;
    margin-bottom: 26px;
    display: flex;
    justify-content: space-between;
    font-size: 15.5px;
    font-weight: 600;
    box-shadow: 0 2px 6px rgba(30,58,138,0.15); /* glow biru lembut */
  }

  /* SECTION BOX */
  .modal-section {
    border: 2px solid #1e3a8a; /* 🔥 border diperkuat */
    padding: 18px;
    border-radius: 12px;
    margin-bottom: 32px;
    background: #ffffff;
    box-shadow: 0 3px 8px rgba(30,58,138,0.12); /* shadow soft elegan */
  }

  .modal-section h2 {
    font-size: 20px;
    border-left: 7px solid #1e3a8a; /* 🔥 kiri lebih prestige */
    padding-left: 12px;
    margin-bottom: 16px;
    color: #1e3a8a;
  }

  /* GRID FORM FIELD */
  .modal-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .modal-grid div {
    border: 2px solid #64748b; /* 🔥 lebih crisp */
    padding: 10px 12px;
    border-radius: 10px;
    background: #f8fafc;
  }

  label {
    display: block;
    font-size: 13px;
    color: #1e3a8a; /* corporate blue */
    margin-bottom: 4px;
    font-weight: 700; /* ditegaskan */
  }

  input, textarea {
    width: 100%;
    border: none;
    font-size: 15px;
    background: transparent;
    outline: none;
    font-weight: 500;
  }

  input[type="time"] {
    font-size: 14px;
  }

  /* TABLES */
  .modal-table {
    border-collapse: collapse;
    width: 100%;
    margin-top: 10px;
    font-size: 14px;
    border: 2px solid #1e3a8a; /* 🔥 frame table lebih profesional */
  }

  .modal-table th {
    background: #e0e7ff;
    color: #1e3a8a;
    padding: 10px;
    border: 2px solid #1e3a8a; /* header tebal */
    font-weight: 700;
  }

  .modal-table td {
    padding: 9px;
    border: 1.8px solid #94a3b8; /* garis soft tapi jelas */
    text-align: center;
  }

  .modal-table input[type="checkbox"] {
    transform: scale(1.25);
  }

  /* SIGNATURE */
  .signature-table {
    width: 100%;
    text-align: center;
    border-collapse: collapse;
    margin-top: 8px;
    border: 2px solid #1e3a8a; /* border ditegaskan */
  }

  .signature-table th {
    padding: 12px;
    border-bottom: 2px solid #1e3a8a;
    font-size: 15.5px;
    background: #eef2ff;
    color: #1e3a8a;
    font-weight: 700;
  }

  .signature-table td {
    height: 95px;
    border: 1.8px solid #94a3b8;
  }

  /* FOOTER */
  .modal-footer {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
    gap: 14px;
  }

  .modal-footer button {
    padding: 10px 20px;
    border: 0;
    background: #1e3a8a;
    color: white;
    font-size: 15px;
    border-radius: 8px;
    cursor: pointer;
    transition: 0.2s;
    font-weight: 700;
    border: 2px solid #1e3a8a; /* button border luxury */
  }

  .modal-footer button:nth-child(1) {
    background: #475569;
    border: 2px solid #475569;
  }

  .modal-footer button:hover {
    transform: scale(1.03);
    opacity: 0.92;
  }

</style>

<!-- HEADER -->
<div class="modal-header">
  <img src="https://i.postimg.cc/CLr4t8vR/indosat.webp">
  <div>
    <h1>Indosat Ooredoo & Pertamina Jambi Project</h1>
    <h2>Laporan Pekerjaan (Job Report)</h2>
    <p style="margin:3px 0; font-size:14px;">Alamat: Kantor Pusat PT Indosat (KPPTI) Lt. 18
Jl. Medan Merdeka Barat No.21
Daerah Khusus Ibukota Jakarta, 10110</p>
    <p style="margin:3px 0; font-size:14px;">WhatsApp:ICT Service Indosat. +62 855-7556-677 | Teknisi VTS Jambi 0895-3822-81515</p>
  </div>
</div>

<!-- JOB NUMBER -->
<div class="job-number">
  <div><strong>No. Pekerjaan:</strong> ${item["Job Number"] || ""}</div>
  <div><strong>${item["Hari Update"]}</strong></div>
</div>

<form id="jobForm">

<!-- BAGIAN A -->
<div class="modal-section">
  <h2>Bagian A – Informasi Pekerjaan</h2>
  <div class="modal-grid">
    <div><label>User Name</label><input type="text" value="${
      item["User name"] || ""
    }"></div>
    <div><label>Working Type</label><input type="text" value="${
      item["working type"] || ""
    }"></div>
    <div><label>Installation Type</label><input type="text" value="${
      item["installation type"] || ""
    }"></div>
  </div>
</div>

<!-- BAGIAN B -->
<div class="modal-section">
  <h2>Bagian B – Informasi Kendaraan</h2>
  <div class="modal-grid">
    ${[
      "Merk kendaraan",
      "Vehicle type",
      "Lisence plate",
      "Vehicle id",
      "Department",
      "Colour",
      "Location",
      "GPS Serial No",
      "GPS Unit ID",
      "GSM",
      "Distance"
    ]
      .map(
        (key) => `
      <div>
        <label>${key}</label>
        <input type="${key === "Distance" ? "number" : "text"}" value="${
          item[key] || ""
        }">
      </div>
    `
      )
      .join("")}
  </div>
</div>

<!-- BAGIAN C -->
<div class="modal-section">
  <h2>Bagian C – Hasil Uji</h2>
  <table class="modal-table">
    <thead>
      <tr>
        <th>No</th><th>Job Description</th><th>OK</th><th>Not OK</th><th>N/A</th><th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${hasilUji
        .map(
          (row, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${row.jobDescription}</td>
          <td><input type="checkbox" ${
            row.status === "OK" ? "checked" : ""
          }></td>
          <td><input type="checkbox" ${
            row.status === "Not OK" ? "checked" : ""
          }></td>
          <td><input type="checkbox" ${
            row.status === "NA" ? "checked" : ""
          }></td>
          <td><input type="checkbox" ${row.checked ? "checked" : ""}></td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>
</div>

<!-- BAGIAN D -->
<div class="modal-section">
  <h2>Bagian D – Uraian Pemeriksaan</h2>
  <table class="modal-table">
    <thead>
      <tr>
        <th>No</th><th>Komponen</th><th>OK</th><th>Not OK</th><th>N/A</th>
      </tr>
    </thead>
    <tbody>
      ${bagD
        .map(
          (row, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${bagianDKeys[i]}</td>
          <td><input type="checkbox" ${row.OK ? "checked" : ""}></td>
          <td><input type="checkbox" ${row.NotOK ? "checked" : ""}></td>
          <td><input type="checkbox" ${row.NA ? "checked" : ""}></td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>
</div>

<!-- BAGIAN E -->
<div class="modal-section">
  <h2>Bagian E – Laporan Pekerjaan</h2>
  <label>Deskripsi Pekerjaan</label>
  <div style="border:1px solid #d1d5db; border-radius:6px; padding:12px; background:#f8fafc; margin-bottom:14px;">
    ${deskripsiPekerjaan.replace(/\\n/g, "<br>")}
  </div>

  <div class="modal-grid">
    <div><label>Jam Awal</label><input type="time" value="${
      item["Jam Awal"] || ""
    }"></div>
    <div><label>Jam Akhir</label><input type="time" value="${
      item["Jam Akhir"] || ""
    }"></div>
    <div><label>Progress Status</label><input type="text" value="${
      item["Progres Status"] || ""
    }"></div>
  </div>
</div>

<!-- TANDA TANGAN -->
<div class="modal-section">
  <table class="signature-table">
    <thead><tr><th>EOS</th><th>Data Analis</th><th>User</th></tr></thead>
    <tbody><tr><td></td><td></td><td></td></tr></tbody>
  </table>
</div>

<!-- FOOTER -->
<div class="modal-footer">
  <button type="button" onclick="closeDetail()">Tutup</button>
  <button type="button" onclick="downloadPDF()">Download PDF</button>
  <button type="button" onclick="downloadExcel()">Download Excel</button>
</div>

</form>
`;

  modalContent.innerHTML = html;
}

// Tutup modal
function closeDetail() {
  const modal = document.getElementById("detailModal");
  modal.style.display = "none";
  document.getElementById("detailContent").innerHTML = "";
}

window.addEventListener("click", function (event) {
  const modal = document.getElementById("detailModal");
  if (event.target === modal) closeDetail();
});

async function downloadPDF() {
  const original = document.getElementById("detailContent");

  const hideElements = original.querySelectorAll(".no-print, button");
  hideElements.forEach((el) => (el.style.display = "none"));

  const clone = original.cloneNode(true);
  clone.style.maxHeight = "none";
  clone.style.overflow = "visible";
  clone.style.height = "auto";
  clone.style.position = "absolute";
  clone.style.top = "-9999px";
  clone.style.left = "0";
  clone.style.width = "210mm";
  clone.style.background = "#ffffff";
  clone.style.maxWidth = "210mm";
  clone.style.minWidth = "210mm";
  clone.style.zoom = "1";
  clone.style.transform = "scale(1)";
  clone.style.webkitPrintColorAdjust = "exact";
  clone.style.printColorAdjust = "exact";

  document.body.appendChild(clone);

  clone.querySelectorAll("table").forEach((table) => {
    table.style.border = "2px solid #000";
    table.style.borderCollapse = "collapse";
    table.style.width = "100%";
  });

  /* =======================
     FIX INTI (RINGAN)
     ======================= */

  // 🔥 MATIKAN CSS BERAT KHUSUS PDF
  const pdfStyle = document.createElement("style");
  pdfStyle.innerHTML = `
    * {
      box-shadow: none !important;
      text-shadow: none !important;
      transition: none !important;
    }
    .modal-section,
    .job-number,
    table {
      border-radius: 0 !important;
    }
  `;
  clone.appendChild(pdfStyle);

  // 🔑 SCALE TURUN = CEPAT (MASIH TAJAM A4)
  const canvas = await html2canvas(clone, {
    scale: 2, // ⬅️ INI KUNCI KECEPATAN
    useCORS: true,
    backgroundColor: "#ffffff",
    imageSmoothingEnabled: false,
    logging: false
  });

  // JPEG jauh lebih ringan
  const imgData = canvas.toDataURL("image/jpeg", 0.9);

  // 🔥 WAJIB BUANG CANVAS
  canvas.width = 0;
  canvas.height = 0;
  canvas.remove();

  const pdf = new jspdf.jsPDF("p", "mm", "a4");

  pdf.addImage(imgData, "JPEG", 0, 0, 210, 295);
  pdf.save(`Job_Report_${new Date().toISOString().slice(0, 10)}.pdf`);

  hideElements.forEach((el) => (el.style.display = ""));
  document.body.removeChild(clone);
}

async function getBase64(url) {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("Gagal fetch logo");
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result); // data:<type>;base64,....
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("getBase64 error:", err);
    return null;
  }
}

async function downloadExcel() {
  if (typeof ExcelJS === "undefined") {
    alert(
      "Library ExcelJS belum dimuat. Tambahkan CDN ExcelJS sebelum script ini."
    );
    return;
  }
  if (typeof saveAs === "undefined") {
    alert(
      "Library FileSaver (saveAs) belum dimuat. Tambahkan CDN FileSaver sebelum script ini."
    );
    return;
  }

  try {
    const logoUrl = "https://i.postimg.cc/CLr4t8vR/indosat.webp";
    const logoDataUrl = await getBase64(logoUrl);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("JOB REPORT", {
      pageSetup: {
        orientation: "portrait",
        fitToPage: true,
        horizontalCentered: true
      }
    });

    sheet.properties.defaultRowHeight = 20;
    sheet.getColumn(1).width = 28;
    sheet.getColumn(2).width = 38;
    sheet.getColumn(3).width = 22;
    sheet.getColumn(4).width = 22;
    sheet.getColumn(5).width = 22; // Kolom E
    sheet.getColumn(6).width = 22; // Kolom F

    const borderSoft = {
      top: { style: "thin", color: { argb: "FFBBBBBB" } },
      left: { style: "thin", color: { argb: "FFBBBBBB" } },
      right: { style: "thin", color: { argb: "FFBBBBBB" } },
      bottom: { style: "thin", color: { argb: "FFBBBBBB" } }
    };

    // ⭐ UPGRADE PREMIUM: Font Korporat Global
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.font = { name: "Segoe UI" };
      });
    });

    if (logoDataUrl) {
      let base64String = logoDataUrl;
      if (base64String.indexOf(",") !== -1)
        base64String = base64String.split(",")[1];

      const imageId = workbook.addImage({
        base64: base64String,
        extension: "png"
      });

      sheet.mergeCells("A1:B6");
      sheet.addImage(imageId, {
        tl: { col: 0, row: 0 },
        br: { col: 2, row: 6 }
      });

      [
        "A1",
        "A2",
        "A3",
        "A4",
        "A5",
        "A6",
        "B1",
        "B2",
        "B3",
        "B4",
        "B5",
        "B6"
      ].forEach((c) => {
        sheet.getCell(c).border = borderSoft;
      });
    }

    const headerTitle =
      document.querySelector(".modal-header h1")?.innerText || "Job Report";
    const headerSub =
      document.querySelector(".modal-header h2")?.innerText || "";
    const jobNumber =
      document
        .querySelectorAll(".job-number > div")[0]
        ?.innerText.split(":")[1]
        ?.trim() || "";
    const tanggal =
      document.querySelectorAll(".job-number > div")[1]?.innerText.trim() || "";
    const alamat =
      document.querySelector(".modal-header p:nth-of-type(1)")?.innerText || ""; // Alamat
    const kontak =
      document.querySelector(".modal-header p:nth-of-type(2)")?.innerText || ""; // Kontak

    // Mengatur header dengan format yang lebih profesional
    sheet.mergeCells("C1:D2");
    sheet.getCell("C1").value = headerTitle;
    sheet.getCell("C1").alignment = {
      horizontal: "center",
      vertical: "middle"
    };
    sheet.getCell("C1").font = { bold: true, size: 16 }; // Ukuran font lebih besar
    sheet.getCell("C1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9EAD3" } // Warna latar belakang
    };
    sheet.getCell("C1").border = {
      bottom: { style: "thin", color: { argb: "FF000000" } } // Garis bawah
    };

    sheet.mergeCells("C3:D4");
    sheet.getCell("C3").value = headerSub;
    sheet.getCell("C3").alignment = {
      horizontal: "center",
      vertical: "middle"
    };
    sheet.getCell("C3").font = { italic: true, size: 12 }; // Font italic untuk subjudul
    sheet.getCell("C3").border = {
      bottom: { style: "thin", color: { argb: "FF000000" } } // Garis bawah
    };

    sheet.mergeCells("C5:D6");
    sheet.getCell("C5").value = alamat; // Menambahkan alamat
    sheet.getCell("C5").alignment = {
      horizontal: "center",
      vertical: "middle"
    };
    sheet.getCell("C5").font = { size: 10 }; // Ukuran font lebih kecil

    // Menambahkan kontak
    sheet.addRow([]);
    sheet.mergeCells("C7:D7");
    sheet.getCell("C7").value = kontak; // Menambahkan kontak
    sheet.getCell("C7").alignment = {
      horizontal: "center",
      vertical: "middle"
    };
    sheet.getCell("C7").font = { size: 10 };

    // Menambahkan border untuk semua sel header
    [
      "C1",
      "C2",
      "C3",
      "C4",
      "C5",
      "C6",
      "D1",
      "D2",
      "D3",
      "D4",
      "D5",
      "D6"
    ].forEach((c) => {
      sheet.getCell(c).border = borderSoft;
    });

    // ⭐ UPGRADE PREMIUM: Header Gradien
    sheet.getCell("C1").fill = {
      type: "gradient",
      gradient: "angle",
      degree: 90,
      stops: [
        { position: 0, color: { argb: "FFF6D32A" } },
        { position: 1, color: { argb: "FFFFF8A6" } }
      ]
    };

    sheet.addRow([]);
    sheet.mergeCells("A8:F8"); // Memperluas ke kolom F
    sheet.getCell("A8").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF9DA3A" }
    };
    sheet.getCell("A8").border = borderSoft;

    sheet.addRow([]);
    sheet.mergeCells("A10:C10");
    sheet.getCell("A10").value = `No. Pekerjaan : ${jobNumber}`;
    sheet.getCell("A10").font = { bold: true };
    sheet.getCell("A10").border = borderSoft;

    sheet.getCell("D10").value = tanggal;
    sheet.getCell("D10").alignment = { horizontal: "right" };
    sheet.getCell("D10").border = borderSoft;

    // ⭐ UPGRADE PREMIUM: Spasi visual
    sheet.getRow(10).height = 26;

    function sectionHeader(text) {
      sheet.addRow([]);
      const r = sheet.addRow([text]);
      const rn = r.number;
      sheet.mergeCells(`A${rn}:F${rn}`); // Memperluas ke kolom F
      sheet.getCell(`A${rn}`).font = { bold: true };
      sheet.getCell(`A${rn}`).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFCEFA6" }
      };
      sheet.getCell(`A${rn}`).alignment = { horizontal: "left" };
      sheet.getCell(`A${rn}`).border = borderSoft;
      sheet.getRow(rn).height = 24;
      return rn;
    }

    const secA = document.querySelectorAll(".modal-section")[0];
    sectionHeader("Bagian A – Informasi Pekerjaan");
    if (secA) {
      const inputs = secA.querySelectorAll("input, textarea");
      if (inputs.length === 0) {
        const r = sheet.addRow([secA.innerText.trim(), "", "", "", "", ""]); // Menambahkan kolom kosong hingga F
        r.eachCell((c) => (c.border = borderSoft));
      } else {
        inputs.forEach((inp) => {
          const row = sheet.addRow([
            inp.closest("div")?.querySelector("label")?.innerText || "",
            inp.value || "",
            "",
            "",
            "",
            ""
          ]); // Menambahkan kolom kosong hingga F
          row.eachCell((c) => (c.border = borderSoft));
        });
      }
    }

    const secB = document.querySelectorAll(".modal-section")[1];
    sectionHeader("Bagian B – Informasi Kendaraan");
    if (secB) {
      const cards = secB.querySelectorAll(".modal-grid div");
      if (cards.length === 0) {
        const r = sheet.addRow([secB.innerText.trim(), "", "", "", "", ""]); // Menambahkan kolom kosong hingga F
        r.eachCell((c) => (c.border = borderSoft));
      } else {
        cards.forEach((div) => {
          const row = sheet.addRow([
            div.querySelector("label")?.innerText || "",
            div.querySelector("input, textarea")?.value || div.innerText,
            "",
            "",
            "",
            "" // Menambahkan kolom kosong hingga F
          ]);
          row.eachCell((c) => (c.border = borderSoft));
        });
      }
    }

    function parseTableAndWrite(sel) {
      const tbl = sel.querySelector(".modal-table");
      if (!tbl) return;
      [...tbl.querySelectorAll("tr")].forEach((tr, idx) => {
        const cells = [...tr.querySelectorAll("th, td")].map((td) => {
          const cb = td.querySelector("input[type='checkbox']");
          return cb ? (cb.checked ? "✔" : "") : td.innerText.trim();
        });
        const row = sheet.addRow([...cells, "", "", ""]); // Menambahkan kolom kosong hingga F
        row.eachCell((c) => (c.border = borderSoft));
        if (idx === 0) {
          row.font = { bold: true };
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFEFEFEF" }
          };
        }
      });
    }

    sectionHeader("Bagian C – Hasil Uji");
    parseTableAndWrite(document.querySelectorAll(".modal-section")[2]);

    sectionHeader("Bagian D – Uraian Pemeriksaan");
    parseTableAndWrite(document.querySelectorAll(".modal-section")[3]);

    const secE = document.querySelectorAll(".modal-section")[4];
    sectionHeader("Bagian E – Laporan Pekerjaan");
    if (secE) {
      const desc = (secE.innerText || "").split("\n").filter(Boolean);
      desc.forEach((t) => {
        const r = sheet.addRow([t, "", "", "", "", ""]); // Menambahkan kolom kosong hingga F
        r.eachCell((c) => (c.border = borderSoft));
      });
    }

    sheet.addRow([]);
    const signRow = sheet.addRow(["EOS", "Data Analis", "User", "", "", ""]); // Menambahkan kolom kosong hingga F
    signRow.eachCell((c) => {
      c.font = { bold: true };
      c.alignment = { horizontal: "center" };
      c.border = borderSoft;
    });

    const sEmpty1 = sheet.addRow([
      "(________________)",
      "",
      "(________________)",
      "",
      "",
      ""
    ]); // Menambahkan kolom kosong hingga F
    sEmpty1.eachCell((c) => {
      c.alignment = { horizontal: "center" };
      c.border = borderSoft;
    });

    // ⭐ UPGRADE PREMIUM: Watermark Transparan
    if (logoDataUrl) {
      sheet.addBackgroundImage(
        workbook.addImage({
          base64: logoDataUrl,
          extension: "png"
        }),
        "A15:F40"
      ); // Memperluas watermark hingga kolom F
    }

    // ⭐ UPGRADE PREMIUM: Footer otomatis
    sheet.headerFooter.oddFooter =
      "&C © Indosat Ooredoo Hutchison - Confidential Report";

    const buf = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buf]), `Job_Report_${jobNumber || "report"}.xlsx`);
  } catch (err) {
    console.error("downloadExcel error:", err);
    alert("Gagal membuat file Excel. Cek console untuk detail.");
  }
}

// ===================== PENCARIAN SPESIFIK BERDASARKAN JOB NUMBER =====================
function filterTable() {
  const searchJob = document
    .getElementById("searchJob")
    .value.toLowerCase();

  const searchVehicle = document
    .getElementById("searchVehicle")
    .value.toLowerCase();

  filteredData = allReportData.filter((item) => {
    const job = (item["Job Number"] || "")
      .toLowerCase();

    const vehicle = (
      item["Vehicle id"] || ""
    ).toLowerCase();

    return (
      job.includes(searchJob) &&
      vehicle.includes(searchVehicle)
    );
  });

  currentPage = 1;

  renderReportTable();
}

function clearSearchJob() {
  document.getElementById("searchJob").value = "";
  filterTable(); // Refresh filter setelah input dikosongkan
}

function clearSearchVehicle() {
  document.getElementById("searchVehicle").value = "";
  filterTable(); // Refresh filter setelah input dikosongkan
}
function toggleSettingMenu(e){
    e.stopPropagation();

    const menu = document.getElementById("settingMenu");
    menu.classList.toggle("show");
}

/* klik luar = tutup */
document.addEventListener("click", function(e){
    const wrapper = document.querySelector(".setting-wrapper");
    const menu = document.getElementById("settingMenu");

    if(wrapper && !wrapper.contains(e.target)){
        menu.classList.remove("show");
    }
});

/* upload wallpaper */
document.addEventListener("DOMContentLoaded", ()=>{

    const input = document.getElementById("wallpaperInput");

    if(input){
        input.addEventListener("change", function(e){

            const file = e.target.files[0];
            if(!file) return;

            const reader = new FileReader();

            reader.onload = function(ev){
                const img = ev.target.result;

                document.body.style.background =
                    `url(${img}) center center / cover no-repeat fixed`;

                localStorage.setItem("dashboardWallpaper", img);
            };

            reader.readAsDataURL(file);
        });
    }

    /* load saved wallpaper */
    const savedWallpaper = localStorage.getItem("dashboardWallpaper");

    if(savedWallpaper){
        document.body.style.background =
            `url(${savedWallpaper}) center center / cover no-repeat fixed`;
    }
});

/* reset */
function resetWallpaper(){
    localStorage.removeItem("dashboardWallpaper");
    document.body.style.background = "#f4f6fb";

    document.getElementById("settingMenu").classList.remove("show");
}
