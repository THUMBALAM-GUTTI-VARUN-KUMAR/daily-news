# ⚡ AI RADAR — Varun Foundry

> **Personal AI Intelligence & Model Radar** — Continuously discovering breakthrough AI developments from verified first-party engineering blogs, arXiv papers, and GitHub releases. Features a Schmooze-inspired swipe matching deck, 10-step autonomous synthesis pipeline, and instant mobile app deployment.

---

## 🌟 Key Highlights

- **Discovery-First, AI-Second Pipeline**: Discovery is 100% real-world driven (13 verified feeds including OpenAI, DeepMind, Anthropic, Mistral, Hugging Face, arXiv, and GitHub releases). Gemini is leveraged strictly post-fetch for classification, scoring, and 3-sentence briefings.
- **Schmooze-Inspired Swipe Matching**: Mobile-first tactile card stack:
  - **Swipe Right**: Interested (boosts topic affinity vectors)
  - **Swipe Left**: Pass
  - **Bookmark**: Save to personal briefing collection
  - **Tap**: Slide-up executive detail briefing with *"Why Varun Should Care"*
  - **Direct Source**: One-tap jump to the original publication
- **Attractive White Aesthetic**: Luminous porcelain canvas (`#F8FAFC`), crisp white cards with tactile multi-layer shadows, electric sunset accents (`#FF3366` → `#FF5E62`), and zero muddy artifacts.
- **Native Mobile Ready**: Built with **Capacitor 8** for Android & iOS with native haptic pulses on card gestures, plus instant PWA installation.
- **Automated Cloud APK Build**: Includes GitHub Actions CI/CD to compile the Android `.apk` in the cloud automatically with zero setup.

---

## 📐 Architecture & Pipeline

```
Fetch ➔ Extract ➔ Normalize ➔ Deduplicate ➔ Classify ➔ Score ➔ Summarize ➔ Store ➔ Rank ➔ Display
```

- **Deduplication**: Canonical URL resolution, parameter stripping (`utm_*`, `ref`), and RapidFuzz title/entity matching with time-window safeguarding.
- **Personalization**: Dynamic mathematical ranking formula:
  $$\text{Score} = 40\% \text{ Importance} + 30\% \text{ User Relevance} + 20\% \text{ Recency} + 10\% \text{ Novelty}$$
- **Persistence**: SQLite with WAL mode (`PRAGMA journal_mode=WAL`) and 5s busy timeout.
- **Scheduler**: APScheduler running configurable background scans (default: 10 mins).

---

## 🚀 Quickstart

### 1. Backend Setup (FastAPI + Python 3.13)
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and insert your GEMINI_API_KEY (optional, fallback heuristics are active)

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Backend API docs available at: `http://localhost:8000/docs`

### 2. Frontend Setup (React 19 + TypeScript + Vite + Tailwind)
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev -- --host 0.0.0.0 --port 5173
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📱 Mobile App (Android & iOS)

### Option A: Install from Phone Browser (Instant PWA)
1. Ensure your phone is on the same Wi-Fi as your computer.
2. Open `http://<your-local-ip>:5173` on your phone's browser (Chrome or Safari).
3. Tap **"Install App"** or **"Add to Home Screen"**.

### Option B: Build Android APK via GitHub Actions (Cloud)
Push this repository to GitHub. The workflow in `.github/workflows/build-apk.yml` will automatically build the `app-debug.apk` and make it downloadable under the **Actions** tab.

### Option C: Local Android Studio Build
```bash
cd frontend
npm run build
npx cap sync android
npx cap open android
```

---

## 🧪 Testing
```bash
# Run backend test suite
PYTHONPATH="backend" pytest backend/tests -q

# Run frontend build verification
cd frontend && npm run build
```

---

## 🛡️ License
Private project for **Varun Foundry**. All rights reserved.
