// server.js
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

const PUBLIC_DIR = path.join(__dirname, "public");
const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
const ENTRIES_FILE = path.join(__dirname, "entries.json");
const USERS_FILE = path.join(__dirname, "users.json");

// Luo tiedostot jos puuttuvat
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(ENTRIES_FILE)) fs.writeFileSync(ENTRIES_FILE, "[]");
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.static(PUBLIC_DIR));

/* -------------------- USER MANAGEMENT -------------------- */

// POST /signup → luodaan käyttäjä ja lähetetään salasana sähköpostiin
app.post("/signup", async (req, res) => {
  const { email, username } = req.body;
  if (!email || !username) return res.status(400).send("Missing email or username");

  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  if (users.find(u => u.email === email)) {
    return res.status(400).send("User already exists");
  }

  // Luo satunnainen salasana
  const password = crypto.randomBytes(4).toString("hex");

  const newUser = {
    id: Date.now().toString(),
    email,
    username,
    password,
  };
  users.push(newUser);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  console.log(`✅ Created user ${username} (${email})`);
  console.log(`Temporary password: ${password}`);

  // Lähetä sähköposti (voi ensin testata pelkkänä console.log)
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "YOUR_EMAIL@gmail.com",
        pass: "YOUR_APP_PASSWORD",
      },
    });

    await transporter.sendMail({
      from: '"Sketchboook" <no-reply@sketchboook.com>',
      to: email,
      subject: "Your Sketchboook password",
      text: `Hello ${username},\n\nYour password is: ${password}\n\nYou can now log in at http://localhost:${PORT}/login.html`,
    });

    console.log("✉️ Password email sent to", email);
  } catch (err) {
    console.log("⚠️ Email not sent (test mode):", err.message);
  }

  res.json({ success: true });
});

// POST /login → tarkistaa käyttäjän
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).send("Invalid credentials");
  res.json({ id: user.id, username: user.username });
});

/* -------------------- ENTRIES -------------------- */

// GET kaikki merkinnät
app.get("/entries", (req, res) => {
  const entries = JSON.parse(fs.readFileSync(ENTRIES_FILE, "utf-8"));
  res.json(entries);
});

// POST uusi merkintä
app.post("/entries", (req, res) => {
  try {
    const { userId, image, text } = req.body;
    if (!userId || !image) return res.status(400).send("Missing data");

    const entries = JSON.parse(fs.readFileSync(ENTRIES_FILE, "utf-8"));
    const id = Date.now().toString();
    const filename = `entry-${id}.png`;
    const imagePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(imagePath, image.replace(/^data:image\/png;base64,/, ""), "base64");

    const newEntry = {
      id,
      user_id: userId,
      image_path: `uploads/${filename}`,
      text,
      date: new Date().toISOString(),
    };
    entries.push(newEntry);
    fs.writeFileSync(ENTRIES_FILE, JSON.stringify(entries, null, 2));

    console.log("✅ Saved entry", id);
    res.json(newEntry);
  } catch (err) {
    console.error("❌ Save failed:", err);
    res.status(500).send("Save failed");
  }
});

// DELETE merkintä
app.delete("/entries/:id", (req, res) => {
  const id = req.params.id;
  const entries = JSON.parse(fs.readFileSync(ENTRIES_FILE, "utf-8"));
  const index = entries.findIndex(e => e.id === id);

  if (index === -1) return res.status(404).send("Entry not found");

  const [deleted] = entries.splice(index, 1);
  fs.writeFileSync(ENTRIES_FILE, JSON.stringify(entries, null, 2));

  const filePath = path.join(PUBLIC_DIR, deleted.image_path);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  res.json({ success: true });
});

// GET /users → palauttaa käyttäjät (vain id ja username)
app.get("/users", (req, res) => {
  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  const publicData = users.map(u => ({ id: u.id, username: u.username }));
  res.json(publicData);
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
