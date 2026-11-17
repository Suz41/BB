# 🎟️ BB — Interactive Mobile Ticket Studio

> A premium, interactive, and responsive cinema ticket dashboard inspired by BookMyShow. Recreated with pixel-perfect attention to detail, live on-screen editing, automated BookMyShow link importing, and instant PDF ticket generation.

🔗 **Live Demo**: [https://suz41.github.io/BB/](https://suz41.github.io/BB/)

---

## ✨ Features

- **⚡ Instant BookMyShow Auto-Fill**:
  - Paste any BookMyShow URL (movie details, buy-tickets/showtimes, cinema page, or order summary).
  - Also parses raw booking SMS or WhatsApp confirmation text.
  - Automatically extracts theater name, screen/audi, show date & time, seats, booking ID, and total amount.
  - **Zero Fabrication Guarantee**: Missing booking details remain strictly missing—no randomized seat numbers, fabricated prices, fake dates, or invented cinema venues.
  - **Data Confidence Tracking**: Every extracted field tracks attribution and status (`verified`, `inferred`, `manual`, `missing`).

- **🛡️ Dedicated BMS Extractor Engine (`js/bms-extractor.js`)**:
  - Modular, zero-dependency extraction and validation layer.
  - Separate dedicated route handlers for `/order-summary/{bookingId}/{routeCode}`, `/movies/{city}/{movie-slug}`, `/buytickets/...`, and `/cinemas/...`.
  - Approved BookMyShow host restrictions to safeguard against malicious or unapproved URLs.
  - Graceful authentication boundary detection for private booking orders.

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

## 🔍 BookMyShow Extractor Architecture & Limitations

The dedicated extractor engine in [`js/bms-extractor.js`](file:///data/data/com.termux/files/home/BB/js/bms-extractor.js) isolates URL classification, parsing, retrieval, and status tracking.

### Supported Input Formats

| Input Type | Format / Example | Extracted Details | Status |
| :--- | :--- | :--- | :--- |
| **Order Summary URL** | `https://in.bookmyshow.com/order-summary/ET00516631/IMMO` | `bookingId: "ET00516631"`, `orderCode: "IMMO"` | `verified` (Booking ID) / `login_required` (Details) |
| **Movie Details URL** | `https://in.bookmyshow.com/mumbai/movies/kalki-2898-ad/ET00352941` | `movieTitle: "Kalki 2898 Ad"`, `city: "mumbai"`, `bookingId: "ET00352941"` | `inferred` / `verified` |
| **Showtimes / Buytickets** | `https://in.bookmyshow.com/buytickets/toxic-a-fairy-tale-for-grown-ups-bengaluru/movie-bang-ET00378770-MT/20260826` | Movie title, city, event code, show date | `inferred` / `verified` |
| **Cinema Venue Page** | `https://in.bookmyshow.com/cinemas/bengaluru/pvr-nexus-koramangala/PVKG` | `cinemaName: "PVR: Nexus Koramangala"`, city | `inferred` / `verified` |
| **Booking SMS / WhatsApp** | `"Hi! Booking confirmed for Toxic (Kannada, 2D) at PVR: Nexus, Koramangala on Wed, 26 Aug, 2026 at 06:30 AM. Screen: AUDI 1 IMAX. Seats: K09. Ticket Price: Rs. 300, Total: Rs. 350. Booking ID: ET00516631"` | Title, language, venue, date, time, screen, seats, pricing, booking ID | `verified` |

### Field Confidence & Status States

Every extracted field tracks its origin and confidence:
- `verified`: Directly from an authoritative booking record, JSON-LD, or structured confirmation text.
- `inferred`: Derived from URL slug structure or contextual text keywords.
- `manual`: Entered or edited by the user in the UI form.
- `missing`: Detail was not provided. Never populated with fabricated or randomized values.

### Retrieval Limitations & Security Boundaries

1. **Authentication Boundary**: BookMyShow order-summary pages (`/order-summary/{id}/{code}`) are private customer transaction pages that require active account session cookies. Unauthenticated requests to BookMyShow return `401/403` or redirect to the login portal. BB transparently marks these bookings as `Login required` and invites the user to provide confirmation text or enter missing fields directly.
2. **Approved Host Validation**: Retrieval is strictly restricted to approved BookMyShow domains (`in.bookmyshow.com`, `bookmyshow.com`, `bms.bz`, etc.) with request timeouts to prevent SSRF and security risks.
3. **No Credential Exposure**: Client-side code never exposes or stores server credentials or private user authentication tokens.

### Running Tests and Type Checking

```bash
# Run unit test suite
npm test

# Run build / type validation
npm run build
```

---

## 📄 License

This project is open-source under the [ISC License](LICENSE).
