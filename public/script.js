// --- CRAPBOOK FRONTEND ---
// --- UNIVERSAL NAVIGATION HANDLER (ROBUST FINAL VERSION) ---
function updateNavigation() {
  const userId = localStorage.getItem("userId");

  const loginLink = document.getElementById("loginLink");
  const signupLink = document.getElementById("signupLink");
  const myPageLink = document.getElementById("myPageLink");
  const logoutLink = document.getElementById("logoutLink");

  if (!loginLink || !signupLink || !myPageLink || !logoutLink) {
    // Jos elementtejä ei ole vielä olemassa, yritetään pian uudelleen
    setTimeout(updateNavigation, 100);
    return;
  }

  if (userId && userId !== "null") {
    // 🔹 Kirjautunut
    loginLink.style.display = "none";
    signupLink.style.display = "none";
    myPageLink.style.display = "inline";
    logoutLink.style.display = "inline";
  } else {
    // 🔹 Ei kirjautunut
    loginLink.style.display = "inline";
    signupLink.style.display = "inline";
    myPageLink.style.display = "none";
    logoutLink.style.display = "none";
  }

  // Logout-toiminto
  if (!logoutLink.hasListener) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("userId");
      window.location.href = "index.html";
    });
    logoutLink.hasListener = true;
  }
}

// Ajetaan heti ja vielä varmistukseksi DOMContentLoadedin jälkeen
updateNavigation();
window.addEventListener("DOMContentLoaded", updateNavigation);




// --- LOGIN STATUS ---
const params = new URLSearchParams(window.location.search);
const viewedUser = params.get("user");
const userId = localStorage.getItem("userId");

if (viewedUser) {
  fetch("/users")
    .then(r => r.json())
    .then(users => {
      const u = users.find(u => u.id === viewedUser);
      if (u) document.title = `${u.username} — Crapbook`;
    });
}

// --- DRAWING TOOL ---
const canvas = document.getElementById("piirtokangas");
const ctx = canvas.getContext("2d");
const taustaVari = "floralwhite";

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
  canvas.height = window.innerHeight * 0.8;

  ctx.fillStyle = taustaVari;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(temp, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function etaisyysReunasta(x, y) {
  const margX = Math.min(x, canvas.width - x);
  const margY = Math.min(y, canvas.height - y);
  const minEtaisyys = Math.min(margX, margY);
  return minEtaisyys / (canvas.width / 2);
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
  }

  else if (tyyli === "spray") {
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

// --- SAVE ENTRY ---
document.getElementById("save").addEventListener("click", async () => {
  const userId = localStorage.getItem("userId");
  if (!userId) return alert("Please log in to save.");

  const image = canvas.toDataURL("image/png");
  const text = document.getElementById("entryText").value || "";

  const res = await fetch("/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, image, text })
  });

  if (res.ok) {
    alert("Entry saved!");
    loadEntries();
  } else {
    const msg = await res.text();
    alert("Failed to save entry: " + msg);
  }
});

// --- LOAD & DELETE ENTRIES ---
async function loadEntries() {
  const res = await fetch("/entries");
  const all = await res.json();

  const currentUserId = localStorage.getItem("userId");
  const params = new URLSearchParams(window.location.search);
  const viewedUser = params.get("user");

  // Jos katsot toista käyttäjää
  const filtered = viewedUser
    ? all.filter(e => e.user_id === viewedUser)
    : all.filter(e => e.user_id === currentUserId);

  // Uusin ensin
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  document.getElementById("entries").innerHTML = filtered.map(e => `
    <div class="entry">
      <img src="${e.image_path}" alt="drawing">
      <p>${e.text || ""}</p>
      <small>${new Date(e.date).toLocaleString()}</small>
      ${!viewedUser && e.user_id === currentUserId
        ? `<p><a href="#" class="delete-entry" data-id="${e.id}">Delete entry</a></p>`
        : ""}
    </div>
  `).join("");

  // Estetään piirtäminen jos katsot toista käyttäjää
  if (viewedUser && viewedUser !== currentUserId) {
    canvas.style.pointerEvents = "none";
    document.getElementById("save").disabled = true;
    document.getElementById("save").style.opacity = "0.5";
  }

  // Poisto omilla sivuilla
  if (!viewedUser || viewedUser === currentUserId) {
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
}

loadEntries();

// --- PIILOTETAAN PIIRTOALUE JA OTSIKKO JOS EI KIRJAUTUNUT TAI KATSOO TOISEN SIVUA ---
window.addEventListener("DOMContentLoaded", () => {
  const currentUserId = localStorage.getItem("userId");
  const params = new URLSearchParams(window.location.search);
  const viewedUser = params.get("user");

  const canvas = document.getElementById("piirtokangas");
  const controls = document.getElementById("controls");
  const sprayControls = document.getElementById("sprayControls");
  const textArea = document.getElementById("entryText");
  const saveBtn = document.getElementById("save");
  const heading = document.querySelector("h2"); // oletuksena "My Entries"

  const isOwnPage = !viewedUser || viewedUser === currentUserId;

  if (!currentUserId || currentUserId === "null" || !isOwnPage) {
    console.warn("Viewer not owner — hiding draw UI");

    // Piilotetaan piirtoalue ja siihen liittyvät elementit
    [canvas, controls, sprayControls, textArea, saveBtn, heading].forEach(el => {
      if (el) el.style.display = "none";
    });
  } else {
    console.log("User is viewing their own page → draw UI visible");
    [canvas, controls, sprayControls, textArea, saveBtn, heading].forEach(el => {
      if (el) el.style.display = "";
    });
  }
});

