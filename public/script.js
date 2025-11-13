// --- SKETCHBOOOK FRONTEND ---
// --- UNIVERSAL NAVIGATION HANDLER (ROBUST FINAL VERSION) ---
function updateNavigation() {
  const userId = localStorage.getItem("userId");

  const loginLink = document.getElementById("loginLink");
  const signupLink = document.getElementById("signupLink");
  const myPageLink = document.getElementById("myPageLink");
  const logoutLink = document.getElementById("logoutLink");

  if (!loginLink || !signupLink || !myPageLink || !logoutLink) {
    setTimeout(updateNavigation, 100);
    return;
  }

  if (userId && userId !== "null") {
    loginLink.style.display = "none";
    signupLink.style.display = "none";
    myPageLink.style.display = "inline";
    logoutLink.style.display = "inline";
  } else {
    loginLink.style.display = "inline";
    signupLink.style.display = "inline";
    myPageLink.style.display = "none";
    logoutLink.style.display = "none";
  }

  if (!logoutLink.hasListener) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("userId");
      window.location.href = "index.html";
    });
    logoutLink.hasListener = true;
  }
}

updateNavigation();
window.addEventListener("DOMContentLoaded", updateNavigation);

// --- PAGE TITLE USER NAME ---
const params = new URLSearchParams(window.location.search);
const viewedUser = params.get("user");
const userId = localStorage.getItem("userId");

if (viewedUser) {
  fetch("/users")
    .then(r => r.json())
    .then(users => {
      const u = users.find(u => u.id === viewedUser);
      if (u) document.title = `${u.username} — Sketchboook`;
    });
}

// Allow drawing on index even without login
if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
  localStorage.setItem("allowDrawWithoutLogin", "true");
} else {
  localStorage.removeItem("allowDrawWithoutLogin");
}

// --- DRAWING TOOL ---
const canvas = document.getElementById("piirtokangas");
const ctx = canvas.getContext("2d");
const taustaVari = "#f7f7f7";

canvas.classList.add("cursor-pencil");

let piirretaan = false;
let edellinenX = 0;
let edellinenY = 0;
let tyyli = "normal";

let sprayTiheys = 50;
let spraySäde = 20;
const sprayControls = document.getElementById("sprayControls");

document.getElementById("intensity").addEventListener("input", e => sprayTiheys = +e.target.value);
document.getElementById("radius").addEventListener("input", e => spraySäde = +e.target.value);

const undoStack = [];
const MAX_UNDOS = 20;

function tallennaUndo() {
  if (undoStack.length >= MAX_UNDOS) undoStack.shift();
  undoStack.push(canvas.toDataURL());
}

function palautaUndo() {
  if (undoStack.length === 0) return;
  const viimeisin = undoStack.pop();
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
  img.src = viimeisin;
}

function resizeCanvas() {
  const temp = document.createElement("canvas");
  temp.width = canvas.width;
  temp.height = canvas.height;
  temp.getContext("2d").drawImage(canvas, 0, 0);

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight * 0.75;

  ctx.fillStyle = taustaVari;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(temp, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function etaisyysReunasta(x, y) {
  const margX = Math.min(x, canvas.width - x);
  const margY = Math.min(y, canvas.height - y);
  return Math.min(margX, margY) / (canvas.width / 2);
}

function kohina(strength) {
  return (Math.random() - 0.5) * strength;
}

canvas.addEventListener("pointerdown", (e) => {
  piirretaan = true;
  const rect = canvas.getBoundingClientRect();
  edellinenX = e.clientX - rect.left;
  edellinenY = e.clientY - rect.top;
  tallennaUndo();
});

canvas.addEventListener("pointerup", () => piirretaan = false);

canvas.addEventListener("pointermove", (e) => {
  if (!piirretaan) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (tyyli === "normal" || tyyli === "eraser") {
    const suhteellinenEtaisyys = etaisyysReunasta(x, y);
    const värinäVoimakkuus = (1 - suhteellinenEtaisyys) * 10;
    const kohinaX = kohina(värinäVoimakkuus);
    const kohinaY = kohina(värinäVoimakkuus);

    ctx.beginPath();
    ctx.moveTo(edellinenX, edellinenY);
    ctx.lineTo(x + kohinaX, y + kohinaY);
    ctx.strokeStyle = (tyyli === "eraser") ? taustaVari : "#000";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.stroke();

    edellinenX = x + kohinaX;
    edellinenY = y + kohinaY;
  } else if (tyyli === "spray") {
    ctx.fillStyle = "#000";
    for (let i = 0; i < sprayTiheys; i++) {
      const kulma = Math.random() * 2 * Math.PI;
      const säde = Math.random() * spraySäde;
      ctx.fillRect(x + Math.cos(kulma) * säde, y + Math.sin(kulma) * säde, 1, 1);
    }
  }
});

document.getElementById("erase").addEventListener("click", () => {
  tallennaUndo();
  ctx.fillStyle = taustaVari;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
});

document.getElementById("undo").addEventListener("click", () => palautaUndo());

document.getElementById("style").addEventListener("click", () => {
  if (tyyli === "normal") tyyli = "spray";
  else if (tyyli === "spray") tyyli = "eraser";
  else tyyli = "normal";

  document.getElementById("style").textContent = `STYLE: ${tyyli.toUpperCase()}`;
  sprayControls.style.display = (tyyli === "spray") ? "block" : "none";

  canvas.classList.remove("cursor-pencil", "cursor-eraser", "cursor-spray");
  if (tyyli === "normal") canvas.classList.add("cursor-pencil");
  if (tyyli === "eraser") canvas.classList.add("cursor-eraser");
  if (tyyli === "spray") canvas.classList.add("cursor-spray");
});

document.getElementById("download").addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const exportCtx = exportCanvas.getContext("2d");

  exportCtx.fillStyle = taustaVari;
  exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  exportCtx.drawImage(canvas, 0, 0);

  const link = document.createElement("a");
  link.download = "drawing.jpg";
  link.href = exportCanvas.toDataURL("image/jpeg", 0.95);
  link.click();
});

// --- POST ENTRY ---
document.getElementById("save").addEventListener("click", async () => {
  const userId = localStorage.getItem("userId");
  const onFrontpage = window.location.pathname.endsWith("index.html") || window.location.pathname === "/";
  const image = canvas.toDataURL("image/png");
  const textField = document.getElementById("entryText");
  const text = textField ? textField.value : "";

  if (onFrontpage && (!userId || userId === "null")) {
    alert("You need to log in before posting.");
    return;
  }
  if (!userId || userId === "null") {
    alert("You must be logged in to post.");
    return;
  }

  const res = await fetch("/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, image, text })
  });

  if (res.ok) {
    alert("Your post has been published!");

    ctx.fillStyle = taustaVari;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (textField) textField.value = "";

    if (onFrontpage && typeof loadFrontEntries === "function") {
      loadFrontEntries();
    } else if (typeof loadEntries === "function") {
      loadEntries();
    }
  } else {
    const msg = await res.text();
    alert("Failed to post: " + msg);
  }
});

// --- LOAD & DELETE ENTRIES (INCL. SCROLL TARGET) ---
async function loadEntries() {
  const res = await fetch("/entries");
  const all = await res.json();

  const currentUserId = localStorage.getItem("userId");
  const params = new URLSearchParams(window.location.search);
  const viewedUser = params.get("user");

  const filtered = viewedUser
    ? all.filter(e => e.user_id === viewedUser)
    : all.filter(e => e.user_id === currentUserId);

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  document.getElementById("entries").innerHTML = filtered.map(e => `
    <div class="entry" id="entry-${e.id}">
      <img src="${e.image_path}" alt="drawing">
      <small>${new Date(e.date).toLocaleString()}</small>
      <p>${e.text || ""}</p>
      ${!viewedUser && e.user_id === currentUserId
        ? `<p><a href="#" class="delete-entry" data-id="${e.id}">Delete entry</a></p>`
        : ""}
    </div>
  `).join("");

  if ((!viewedUser || viewedUser === currentUserId)) {
    document.querySelectorAll(".delete-entry").forEach(link => {
      link.addEventListener("click", async (e) => {
        e.preventDefault();
        const id = e.target.getAttribute("data-id");
        if (confirm("Delete this entry?")) {
          const del = await fetch(`/entries/${id}`, { method: "DELETE" });
          if (del.ok) loadEntries();
        }
      });
    });
  }

  // ✅ SCROLL TO SPECIFIC ENTRY
  const urlParams = new URLSearchParams(window.location.search);
  const targetEntry = urlParams.get("entry");
  if (targetEntry) {
    const targetEl = document.getElementById(`entry-${targetEntry}`);
    if (targetEl) {
      setTimeout(() => {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        targetEl.style.background = "var(--bg-color)";
        setTimeout(() => targetEl.style.background = "transparent", 2000);
      }, 150);
    }
  }
}

loadEntries();

// --- HIDE DRAW TOOLS IF VIEWING ANOTHER USER ---
window.addEventListener("DOMContentLoaded", () => {
  const currentUserId = localStorage.getItem("userId");
  const params = new URLSearchParams(window.location.search);
  const viewedUser = params.get("user");

  const canvas = document.getElementById("piirtokangas");
  const controls = document.getElementById("controls");
  const sprayControls = document.getElementById("sprayControls");
  const textArea = document.getElementById("entryText");
  const saveBtn = document.getElementById("save");
  const heading = document.querySelector("h2");

  const isOwnPage = !viewedUser || viewedUser === currentUserId;
  const onFrontpage = window.location.pathname.endsWith("index.html") || window.location.pathname === "/";

  if ((!currentUserId || currentUserId === "null" || !isOwnPage) && !onFrontpage) {
    [canvas, controls, sprayControls, textArea, saveBtn, heading].forEach(el => {
      if (el) el.style.display = "none";
    });
  }
});

// --- HIDE LOGIN NOTICE IF LOGGED IN ---
window.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("userId");
  const notice = document.getElementById("loginNotice");

  const onFrontpage = window.location.pathname.endsWith("index.html") || window.location.pathname === "/";
  if (onFrontpage && notice) {
    notice.style.display = (userId && userId !== "null") ? "none" : "block";
  }
});
