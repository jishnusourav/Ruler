/* RULER v4 — Google Calendar + Google Tasks integration
   Uses Google Identity Services.
   No client secret or API key is required in this browser file.
*/

(() => {
  "use strict";

  // 1. REPLACE THIS with your Google OAuth Web Client ID.
  const GOOGLE_CLIENT_ID = "619697186632-55a2m4htv3ovb7oirfuah6m47tb2aatj.apps.googleusercontent.com";

  const GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/tasks"
  ].join(" ");

  const CALENDAR_EVENT_KEY = "ruler-google-calendar-event-id-v1";
  const TASK_LIST_KEY = "ruler-google-task-list-id-v1";
  const REMINDER_KEY = "ruler-daily-reminder-v1";

  const QUESTS = [
    { id: "push", name: "Push-ups", target: 100, unit: "reps" },
    { id: "sit", name: "Sit-ups / core", target: 100, unit: "reps" },
    { id: "squat", name: "Squats", target: 100, unit: "reps" },
    { id: "run", name: "Run / brisk walk", target: 5, unit: "km" }
  ];

  let accessToken = null;
  let tokenClient = null;
  let gisPromise = null;

  const $ = id => document.getElementById(id);

  function showMessage(message) {
    const toast = $("toast");

    if (toast) {
      toast.textContent = message;
      toast.classList.add("show");

      clearTimeout(showMessage.timer);
      showMessage.timer = setTimeout(
        () => toast.classList.remove("show"),
        3500
      );
    } else {
      alert(message);
    }
  }

  function getLocalDate() {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");
  }

  function getLocalDateTime(date, time) {
    const d = new Date(`${date}T${time}:00`);

    if (Number.isNaN(d.getTime())) {
      throw new Error("Invalid reminder date or time.");
    }

    return d;
  }

  function formatLocalDateTime(d) {
    const date = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");

    const time = [
      String(d.getHours()).padStart(2, "0"),
      String(d.getMinutes()).padStart(2, "0")
    ].join(":");

    return `${date}T${time}:00`;
  }

  function getReminderTime() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(REMINDER_KEY) || "{}"
      );

      return saved.time || $("reminderTime")?.value || "20:00";
    } catch {
      return $("reminderTime")?.value || "20:00";
    }
  }

  function setStatus(message) {
    const status = $("googleSyncStatus");
    if (status) status.textContent = message;
  }

  function loadGoogleIdentityServices() {
    if (window.google?.accounts?.oauth2) {
      return Promise.resolve();
    }

    if (gisPromise) return gisPromise;

    gisPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;

      script.onload = () => {
        if (window.google?.accounts?.oauth2) {
          resolve();
        } else {
          reject(new Error("Google sign-in could not be initialized."));
        }
      };

      script.onerror = () => {
        gisPromise = null;
        reject(new Error("Could not load Google's sign-in library."));
      };

      document.head.appendChild(script);
    });

    return gisPromise;
  }

  async function connectGoogle() {
    if (
      !GOOGLE_CLIENT_ID ||
      GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID"
    ) {
      throw new Error(
        "Add your Google OAuth Client ID inside google-sync.js first."
      );
    }

    await loadGoogleIdentityServices();

    return new Promise((resolve, reject) => {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,

        callback: response => {
          if (response.error) {
            accessToken = null;
            reject(new Error(response.error_description || response.error));
            return;
          }

          accessToken = response.access_token;
          setStatus("GOOGLE CONNECTED");
          resolve(accessToken);
        },

        error_callback: error => {
          reject(new Error(error.message || "Google sign-in was cancelled."));
        }
      });

      // Opens Google's consent/sign-in window after a button click.
      tokenClient.requestAccessToken();
    });
  }

  async function ensureGoogleConnected() {
    if (accessToken) return accessToken;
    return connectGoogle();
  }

  async function googleAPI(url, options = {}) {
    if (!accessToken) {
      throw new Error("Connect your Google account first.");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    const text = await response.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      const error = new Error(
        data.error?.message || data.message ||
        `Google API request failed (${response.status}).`
      );

      error.status = response.status;
      throw error;
    }

    return data;
  }

  // 2. Create or update the daily Google Calendar reminder.
  async function syncCalendarReminder() {
    await ensureGoogleConnected();

    const time = getReminderTime();
    const date = getLocalDate();
    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";

    const start = getLocalDateTime(date, time);
    const end = new Date(start.getTime() + 5 * 60 * 1000);

    const event = {
      summary: "RULER // DAILY QUEST REMINDER",
      description:
        "Your Ruler daily fitness quest is waiting. Open Ruler and review today's progress.",
      start: {
        dateTime: formatLocalDateTime(start),
        timeZone: timezone
      },
      end: {
        dateTime: formatLocalDateTime(end),
        timeZone: timezone
      },
      recurrence: ["RRULE:FREQ=DAILY"],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 0 }
        ]
      }
    };

    const savedEventId = localStorage.getItem(CALENDAR_EVENT_KEY);
    let existingEvent = null;

    if (savedEventId) {
      try {
        existingEvent = await googleAPI(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(savedEventId)}`
        );
      } catch (error) {
        if (error.status !== 404) throw error;
      }
    }

    let result;

    if (existingEvent?.id) {
      result = await googleAPI(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(savedEventId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(event)
        }
      );
    } else {
      result = await googleAPI(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          body: JSON.stringify(event)
        }
      );
    }

    if (result.id) {
      localStorage.setItem(CALENDAR_EVENT_KEY, result.id);
    }

    showMessage(`Daily Calendar reminder saved for ${time}.`);
    return result;
  }

  // 3. Find or create a dedicated Google Tasks list for Ruler.
  async function getRulerTaskList() {
    const savedId = localStorage.getItem(TASK_LIST_KEY);

    if (savedId) {
      try {
        return await googleAPI(
          `https://tasks.googleapis.com/tasks/v1/users/@me/lists/${encodeURIComponent(savedId)}`
        );
      } catch (error) {
        if (error.status !== 404) throw error;
      }
    }

    const result = await googleAPI(
      "https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=100"
    );

    const lists = result.items || [];
    let rulerList = lists.find(
      list => list.title === "Ruler Daily Quests"
    );

    if (!rulerList) {
      rulerList = await googleAPI(
        "https://tasks.googleapis.com/tasks/v1/users/@me/lists",
        {
          method: "POST",
          body: JSON.stringify({ title: "Ruler Daily Quests" })
        }
      );
    }

    localStorage.setItem(TASK_LIST_KEY, rulerList.id);
    return rulerList;
  }

  // 4. Create today's quest tasks without duplicating matching tasks.
  async function syncGoogleTasks() {
    await ensureGoogleConnected();

    const list = await getRulerTaskList();
    const date = getLocalDate();
    const listUrl =
      `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(list.id)}/tasks`;

    const result = await googleAPI(`${listUrl}?maxResults=100`);
    const tasks = result.items || [];
    let created = 0;

    for (const quest of QUESTS) {
      const title =
        `Ruler ${date} — ${quest.name} (${quest.target} ${quest.unit})`;

      const exists = tasks.some(task => task.title === title);

      if (exists) continue;

      await googleAPI(listUrl, {
        method: "POST",
        body: JSON.stringify({
          title,
          notes: `Daily quest from Ruler. Target: ${quest.target} ${quest.unit}.`,
          due: `${date}T00:00:00.000Z`
        })
      });

      created++;
    }

    showMessage(
      created
        ? `${created} quest task(s) added to Google Tasks.`
        : "Today's Ruler quest tasks already exist."
    );
  }

  // 5. Add a small Google Sync panel without editing your existing HTML.
  function createSyncPanel() {
    if ($("googleSyncPanel")) return;

    const panel = document.createElement("section");
    panel.id = "googleSyncPanel";
    panel.className = "panel notification-panel";

    panel.innerHTML = `
      <div class="panel-heading">
        <span class="section-icon">◈</span>
        <span>GOOGLE SYNC</span>
        <span class="tiny-tag" id="googleSyncStatus">NOT CONNECTED</span>
      </div>
      <p class="panel-desc">
        Connect Google to schedule your daily Calendar reminder
        and create today's quest tasks.
      </p>
      <div class="notification-controls">
        <button class="primary-button" id="googleConnectBtn" type="button">
          CONNECT GOOGLE
        </button>
        <button class="secondary-button" id="googleCalendarBtn" type="button">
          SYNC DAILY REMINDER
        </button>
        <button class="secondary-button" id="googleTasksBtn" type="button">
          SYNC QUESTS TO TASKS
        </button>
      </div>
      <p class="micro-note">
        Google permission is requested only when you connect.
        Your access token is kept in memory, not saved in localStorage.
      </p>
    `;

    const existingPanel = document.querySelector(".notification-panel");

    if (existingPanel) {
      existingPanel.insertAdjacentElement("afterend", panel);
    } else {
      document.querySelector("main")?.appendChild(panel);
    }

    $("googleConnectBtn").addEventListener("click", async () => {
      try {
        setStatus("CONNECTING...");
        await connectGoogle();
        showMessage("Google account connected.");
      } catch (error) {
        setStatus("CONNECTION FAILED");
        showMessage(error.message);
      }
    });

    $("googleCalendarBtn").addEventListener("click", async () => {
      try {
        setStatus("SAVING REMINDER...");
        await syncCalendarReminder();
        setStatus("REMINDER SYNCED");
      } catch (error) {
        setStatus("SYNC FAILED");
        showMessage(error.message);
      }
    });

    $("googleTasksBtn").addEventListener("click", async () => {
      try {
        setStatus("SYNCING QUESTS...");
        await syncGoogleTasks();
        setStatus("QUESTS SYNCED");
      } catch (error) {
        setStatus("SYNC FAILED");
        showMessage(error.message);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createSyncPanel);
  } else {
    createSyncPanel();
  }
})();