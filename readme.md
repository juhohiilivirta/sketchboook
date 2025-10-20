# Crapbook

**Crapbook** is a web-based social network and creative platform for artists who embrace creativity and imperfection.  
Users can draw with intentionally limited tools, write short notes, and share their work on personal artist pages.

---

## Features
- Draw directly in your browser with pencil, spray, and eraser tools  
- Undo, clear, and download drawings as JPG  
- Create a personal page to save and display your drawings  
- View other artists pages and see the latest drawings on the front page  
- No ads, no tracking, no data selling — your artwork and data remain yours  

---

## Project structure

crapbook/
├── public/
│ ├── index.html # Frontpage (latest drawings)
│ ├── mypage.html # Personal drawing page
│ ├── login.html # User login
│ ├── signup.html # Create account
│ ├── about.html # About Crapbook
│ ├── style.css # Shared styles
│ ├── script.js # Drawing + entries logic
│ └── front.js # Frontpage scripts
├── server.js # Node.js + Express backend
├── package.json # Dependencies
├── .gitignore
└── README.md

---

## How to run locally

1. Install [Node.js](https://nodejs.org/)  
2. Clone this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/crapbook.git
   cd crapbook

3. Install dependencies:
    bash
    npm install

4. Start the server:
    terminal bash
    node server.js

5. Open in your browser:
    http://localhost:3000

## Privacy & Ownership
Crapbook does not track or sell user data.
Only the drawings, usernames, and text entries you choose to share are stored.
All rights to your artwork remain entirely yours.

## Author
Created in 2025 by Juho Hiilivirta.
Designed and built with simplicity and curiosity in mind.