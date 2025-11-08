// front.js
async function loadFrontEntries() {
  // Hae kaikki käyttäjät
  const usersRes = await fetch("/users");
  const users = await usersRes.json();
  const userMap = {};
  users.forEach(u => (userMap[u.id] = u.username));

  // Hae kaikki piirrokset
  const res = await fetch("/entries");
  const entries = await res.json();

  // Järjestä uusimmat ensin ja ota 20 uusinta
  const latest = entries.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);

  // Luo HTML
  document.getElementById("frontEntries").innerHTML = latest.map(e => {
    const username = userMap[e.user_id] || `User ${e.user_id}`;
    return `
      <div class="entry">
      <a href="mypage.html?user=${e.user_id}">
      <img src="${e.image_path}" alt="drawing">
      </a>        
      <p><a href="mypage.html?user=${e.user_id}">${username}</a></p>
        <small>${new Date(e.date).toLocaleString()}</small>
      </div>
    `;
  }).join("");
}

loadFrontEntries();

