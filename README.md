# The Ruler — starter project

A mobile-responsive, Solo Leveling-inspired fitness quest tracker built with HTML, CSS, JavaScript, and Python's standard library. It is free to run and needs no API key, AI subscription, database, or paid hosting.

## Features
- Dark holographic System UI with blue theme; purple theme unlocks at Level 100.
- Daily quest progress for push-ups, core reps, squats, and running/brisk walking.
- XP, levels, attribute points, rank milestones, streak display, and level-50 Job Quest.
- Countdown to local midnight, sound toggle, exportable JSON save, and reset.
- Saves progress in the browser using `localStorage`.
- Responsive mobile layout and basic PWA/offline caching support.

## 1. Run on your computer (VS Code)
1. Install Python 3 from https://www.python.org/downloads/ if it is not already installed. During Windows setup, tick **Add Python to PATH**.
2. Extract this ZIP and open the `ruler` folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Run:
   - Windows: `python app.py`
   - macOS/Linux: `python3 app.py`
5. Visit `http://localhost:8000` in Chrome.

No `pip install` step is required.

## 2. Open it on your phone on the same Wi-Fi
1. Keep `python app.py` running on your computer.
2. Find your computer's local IPv4 address:
   - Windows: run `ipconfig` in a second terminal and find **IPv4 Address** under your Wi-Fi adapter.
   - macOS: System Settings → Wi-Fi → Details, or use `ifconfig`.
3. On your phone connected to the same Wi-Fi, open `http://COMPUTER-IP:8000` (replace the example with the real address, e.g. `http://192.168.1.5:8000`).
4. If Windows Firewall asks, allow Python on **Private networks only**. Do not expose this development server directly to the public internet.
5. In Chrome on Android, use menu **⋮ → Add to Home screen**. On iPhone, use Safari's Share → Add to Home Screen.

The local-network setup is for development/testing. The service worker/PWA install and offline behavior are most reliable on `localhost` or HTTPS, so some install/offline features may not activate on a phone opened over plain local HTTP.

## 3. Put it online for phone-only access
For a public HTTPS URL, deploy the static files (`index.html`, `styles.css`, `app.js`, `manifest.json`, `service-worker.js`) to a free static host such as GitHub Pages or Cloudflare Pages. The frontend doesn't require Python once hosted statically. Free-tier policies can change, so check the host's current limits. GitHub Pages setup: create a repository, upload the static files to the repository root, then enable Pages in repository Settings. Note: this starter uses root-relative URLs; if hosting from a GitHub Pages project subfolder, change the paths in `index.html` and `service-worker.js` to match that subfolder, or use a host that serves from the domain root.

## How to use
- Tap **LOG** beside a quest to enter progress, or tick the checkbox to mark the target complete.
- When all daily targets are complete, claim the daily reward for 100 XP.
- **+25 XP** is a manual workout/habit log.
- Export downloads a JSON backup from this browser. Progress is stored separately on each device/browser; export/import sync is not built in.
- Level 50 unlocks the Job Quest. The job quest is a configurable game checklist, not a verified fitness assessment.
- Level 100 unlocks the purple theme.

## Safety and honest limitations
- This is a gamified tracker, not a medical or coaching tool. The sample 100-rep / 5-km targets may be too difficult for beginners. Change targets in `app.js` to fit your current ability; progress gradually and stop if you experience pain, dizziness, or unusual breathlessness.
- The original concept mentioned locking features and forcing a penalty workout. This starter intentionally does **not** force exercise, lock core functions, or prescribe double-rep penalties. Missed quests simply reset for the next day.
- No real AI assistant, Google Tasks integration, push notifications, cloud account, or cross-device sync is included yet. Those need additional APIs/services and secure authentication. This version is entirely free and works locally.


## Latest UI polish
- Added a cinematic System message overlay for daily quest rewards and level-ups.
- Added a short holographic pulse when an exercise is checked off.
- Added scanline texture and angular frame accents.
- Level 100 activates the purple Sovereign theme and shows an awakening message.

**Notification reminder:** the bell/button only requests browser permission and shows a test notification. It does not schedule recurring alerts or deliver notifications when the site is closed. Those features require a push service and a secure HTTPS deployment.


## If the browser still shows the old version
1. Stop the server in VS Code with `Ctrl+C`.
2. Make sure you opened the newly extracted `Ruler-v3` folder, not your previous project folder.
3. Start the server again with `python app.py`.
4. In Chrome, open `http://localhost:8000`, then press `Ctrl+Shift+R`.
5. If it still looks old, open Chrome DevTools → Application → Service Workers → **Unregister**, then Application → Storage → **Clear site data**, and reload.
6. The service-worker cache name is now `ruler-static-v3`, so this release should replace the previous cached frontend.


## Ruler v4: daily reminder setup
- Click the bell icon and allow browser notifications.
- In **NOTIFICATION PROTOCOL**, choose a daily time and press **SAVE REMINDER**.
- This browser-only version checks the reminder while the app page is open. Keep Ruler open; browser and mobile background limits may delay delivery.
- It does **not** send notifications after the browser/app has been fully closed. Reliable closed-app push notifications require HTTPS hosting and a push service/backend.
