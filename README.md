# 🎭 Palermo Game (Mafia-style party game)

A modern **web adaptation** of the classic party game *Palermo/Mafia*.
Playable entirely in the browser, mobile-friendly, with narration, music, sound effects, vibration feedback, and special roles.
Built with **HTML + CSS + JavaScript**... and a lot of **AI magic** 🤖✨.

---

## 🚀 Features

* 🎙️ **Narration system**: Audio lines guide each night/day phase.

* 🕹️ **Voting system**: Free-form voting with add/remove buttons, 3″ countdown, cancel option.

* 📳 **Haptics**: Vibration feedback on all button presses (Android/Chrome).

* 🎶 **Background music**: Rotating fantasy soundtrack.

* 🔊 **Sound effects**: Voting, mayor reveal, kamikaze sacrifice, bulletproof block, win states.

* 🌙 **Roles implemented**:

  * Citizen (Πολίτης)
  * Hidden Killer / Known Killer (Δολοφόνοι)
  * Police officer (Αστυνομικός)
  * Snitch (Ρουφιάνος)
  * Bulletproof (Αλεξίσφαιρος)
  * Lovers (Ερωτευμένοι)
  * Kamikaze (Καμικάζι)
  * Madman (Τρέλα)
  * Mother Teresa (Μητέρα Τερέζα)
  * Mayor (Δήμαρχος)

* 📱 **Mobile-first UI**: Scrollable voting area for >10 players, vibration feedback, wake-lock to prevent screen dim.

* 📦 **PWA support**: Installable on Android/iOS home screen with custom icon, offline support via Service Worker.

---

## 🛠️ Tech stack

* **Vanilla JS** (no frameworks)
* **CSS Grid / Flexbox** for layout
* **Service Worker + manifest.json** for PWA
* **GitHub Pages** for hosting
* **ChatGPT** for the whole project 😅 (yes, even this README!)

---

## 📥 Installation & Run

1. Clone the repo:

   ```bash
   git clone https://github.com/<your-username>/palermo-game.git
   cd palermo-game
   ```
2. Serve locally (any static server works). Example with VSCode Live Server or:

   ```bash
   npx http-server .
   ```
3. Open [http://localhost:8080](http://localhost:8080) on your browser.
4. Or simply play it directly via **GitHub Pages**:
   👉 [Play Palermo Game](https://<your-username>.github.io/palermo-game/)

---

## 🎮 How to Play

1. Choose number of players (5–15).
2. Select optional roles.
3. Each player enters their name and secretly views their role.
4. Narration begins: night/day cycles with special roles acting.
5. Players discuss and vote to eliminate suspects.
6. Game ends when all killers are eliminated (good win) or killers outnumber others (bad win).

---

## 📳 Notes

* Vibration works on **Android/Chrome**. iOS Safari does **not** support the Vibration API.
* Silent mode on the phone disables vibrations (not a bug, just… your phone being polite 🤷).
* Audio requires user interaction to start (autoplay policy).

---

## 📸 Screenshots

*(add screenshots here: role reveal, voting screen, narration overlay)*

---

## 🧪 The AI Experiment

This whole project is part of a **fun experiment**: the developer (me 🙋) knows very little JavaScript, but with the help of **ChatGPT**, the entire game was designed, implemented, debugged, and polished.

Even this `README.md` is written by AI — so if you spot jokes, emojis, or too much enthusiasm, now you know why. 😎

The idea was simple: *what if I let an AI co-pilot build a complete browser game from scratch?* This repo is the result.

📌 **Why Palermo?** Because the original Android app for this game disappeared, and on iOS it was only available as a paid app. This project is my way of bringing it back for everyone, free and open-source. 🎉

---

## 🏆 Credits

* Concept: classic **Palermo/Mafia** party game.
* Development: Human curiosity + AI assistance.
* Music & SFX: World of Warcraft OST snippets + custom audio tracks.
* Icons: Emoji set / custom SVGs.
* README: also written by AI (seriously).

---

## 📜 License

MIT License. Use, modify, and share freely.

---

## ⚠️ Disclaimer

Some narration lines and audio files are **borrowed from the original Palermo app** (which is no longer available on Android and paid-only on iOS).
This project is **non-commercial, for personal use and entertainment with friends**.
All rights for those assets belong to their respective creators.
