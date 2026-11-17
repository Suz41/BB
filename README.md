# 🎟️ BB — Interactive Mobile Ticket Studio

> A premium, interactive, and responsive cinema ticket dashboard inspired by BookMyShow. Recreated with pixel-perfect attention to detail, live on-screen editing, automated BookMyShow link importing, and instant PDF ticket generation.

🔗 **Live Demo**: [https://suz41.github.io/BB/](https://suz41.github.io/BB/)

---

## ✨ Features

- **⚡ Instant BookMyShow Auto-Fill**:
  - Paste any BookMyShow URL (movie details, buy-tickets/showtimes, cinema page, or order summary).
  - Also parses raw booking SMS or WhatsApp confirmation text.
  - Automatically extracts theater name, screen/audi, show date & time, seats, booking ID, and total amount.

- **🎬 TMDB Metadata & HD Posters**:
  - Queries TMDB to pull official high-resolution posters.
  - Fetches complete title & taglines, Indian movie certifications (`(A)`, `(UA)`, `(U)`), and original language (`Kannada`, `Hindi`, `English`, `Telugu`, etc.).

- **✏️ On-Screen In-Line Editing**:
  - Every piece of text on the ticket card is `contenteditable`.
  - Click on the movie poster to load a custom image URL.
  - Click on the QR code to customize its scan destination.

- **📱 Dynamic Vector QR Code**:
  - Generates crisp, scalable vector SVG QR codes with auto-adjusted error correction.
  - Encodes official BookMyShow booking URLs or custom text.

- **📄 High-Definition PDF Download**:
  - Built-in PDF export powered by `html2canvas` and `jsPDF`.
  - Automatically captures the ticket card with custom print dimensions.

- **🔗 Shareable Ticket Links**:
  - Synchronizes ticket state with browser address bar query parameters (`?id=...&poster=...`) for instant sharing and bookmarking.

- **🎨 Modern Aesthetic & Perforations**:
  - Classic cinema ticket design featuring realistic perforated cuts, support banner, and drawer interactions.

---

## 🚀 Quick Start / Local Setup

Clone the repository and serve it locally with any static web server:

```bash
# Clone the repository
git clone https://github.com/Suz41/BB.git
cd BB

# Switch to the test branch
git checkout test

# Start a local preview server
python3 -m http.server 8080
```

Open your browser and navigate to:
```
http://localhost:8080
```

---

## 🛠️ Tech Stack

- **Markup & Layout**: HTML5, Semantic Elements
- **Styling**: Modern CSS3 (CSS Variables, Flexbox, CSS Grid, Glassmorphism, Micro-animations)
- **Logic**: Vanilla JavaScript (ES6+, Async/Await)
- **APIs & Libraries**:
  - [The Movie Database (TMDB) API](https://www.themoviedb.org/documentation/api) — Movie metadata & poster assets
  - [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) — Vector SVG QR generation
  - [html2canvas](https://html2canvas.hertzen.com/) & [jsPDF](https://github.com/parallax/jsPDF) — Client-side ticket rendering and PDF export

---

## 📄 License

This project is open-source under the [ISC License](LICENSE).
