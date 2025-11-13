// FRONT PAGE ENTRY LIST

async function loadFrontEntries() {
  const entriesRes = await fetch("/entries");
  const entries = await entriesRes.json();

  const usersRes = await fetch("/users");
  const users = await usersRes.json();

  const userMap = {};
  users.forEach(u => userMap[u.id] = u.username);

  // Uusimmat ensin, max 20
  const latest = entries.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);

  document.getElementById("frontEntries").innerHTML = latest.map(e => `
    <div class="entry">
      <a href="mypage.html?user=${e.user_id}&entry=${e.id}">
        <img src="${e.image_path}" alt="drawing">
      </a>
      <p><a href="mypage.html?user=${e.user_id}">${userMap[e.user_id] || "User"}</a></p>
      <small>${new Date(e.date).toLocaleString()}</small>
    </div>
  `).join("");
}

loadFrontEntries();
