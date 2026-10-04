// Generates docs/presentation/index.html (16:9 slides). Open it in Chrome and print to PDF, or run
//   node docs/presentation/build-deck.mjs && node docs/presentation/make-pdf.mjs
// to produce docs/Medisynix_Demo_Presentation.pdf.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
let n = 0;
const slides = [];
const add = (html, cls = "") => slides.push(`<section class="slide ${cls} ${/class="(step|cover|divider)/.test(html) ? "" : "roomy"}"><div class="inner">${html}</div><div class="foot"><span>Medisynix · FYP demo</span><span>${++n}</span></div></section>`);

const list = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
const browser = (img, cap = "") => `<figure class="browser"><div class="bar"><i></i><i></i><i></i></div><img src="img/${img}.png" alt=""/>${cap ? `<figcaption>${cap}</figcaption>` : ""}</figure>`;
const table = (head, rows, cls = "") => `<table class="${cls}"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
const tag = (t, c = "blue") => `<span class="tag ${c}">${t}</span>`;

// A journey step: instructions on the left, screenshot(s) on the right
function step({ role, num, title, goal, click, say, behind, imgs, cap }) {
  const color = { Patient: "blue", Doctor: "teal", Admin: "violet" }[role];
  add(
    `<div class="step">
      <div class="col text">
        <div class="kicker ${color}">${role} journey · Step ${num}</div>
        <h2>${title}</h2>
        <p class="goal">${goal}</p>
        <h4>Do this</h4>${list(click)}
        <div class="say"><b>Say:</b> ${say}</div>
        <h4>Behind the scenes</h4><p class="small">${behind}</p>
      </div>
      <div class="col shots ${imgs.length > 1 ? "two" : ""}">${imgs.map((i, k) => browser(i, cap && cap[k])).join("")}</div>
    </div>`
  );
}

function divider(role, color, name, who, goal, steps) {
  add(
    `<div class="divider ${color}">
      <div class="big">${role}</div>
      <h1>${name}</h1>
      <p class="lead">${who}</p>
      <div class="goalbox"><b>What this person wants:</b> ${goal}</div>
      <div class="steps">${steps.map((s, i) => `<span><em>${i + 1}</em>${s}</span>`).join("")}</div>
    </div>`,
    "dark"
  );
}

/* ---------------------------------------------------------------- 1 cover */
add(
  `<div class="cover">
    <img class="logo" src="img/logo-light.png" alt="Medisynix"/>
    <h1>Medisynix</h1>
    <p class="lead">An AI-powered medical assistant that connects patients, doctors and administrators in one place.</p>
    <div class="pills"><span>Complete user journey</span><span>Patient → Doctor → Admin</span><span>Market research · Pros &amp; cons · Roadmap</span></div>
    <p class="meta">Final-year project demonstration guide · October 2026</p>
  </div>`,
  "dark cover-slide"
);

/* ---------------------------------------------------------------- 2 plan */
add(
  `<h2>Today's plan <small>(about 15 minutes)</small></h2>
   <div class="grid3">
     <div class="card"><div class="num">1</div><h3>The idea · 2 min</h3><p>Why we built Medisynix, who it helps and how it works under the hood.</p></div>
     <div class="card"><div class="num">2</div><h3>Patient · 5 min</h3><p>Sign in, check health, ask the AI, book a doctor, upload a report.</p></div>
     <div class="card"><div class="num">3</div><h3>Doctor · 3 min</h3><p>See the day's schedule, spot risky patients, complete a visit.</p></div>
     <div class="card"><div class="num">4</div><h3>Admin · 2 min</h3><p>Manage users, check system health, export reports.</p></div>
     <div class="card"><div class="num">5</div><h3>Market &amp; future · 2 min</h3><p>What else exists, why we are different, what we do next.</p></div>
     <div class="card accent"><h3>One-sentence pitch</h3><p>"Medisynix helps people understand their health in plain language and reach the right doctor, while giving doctors and administrators the tools to run the care."</p></div>
   </div>
   <p class="note">How to read this deck: every journey slide has <b>Do this</b> (what to click), <b>Say</b> (what to tell the audience) and <b>Behind the scenes</b> (what is really happening, for questions).</p>`
);

/* ---------------------------------------------------------------- 3 setup */
add(
  `<h2>Before you start: set-up in 3 minutes</h2>
   <div class="twocol">
     <div>
       <h4>1. Start the app (production mode is fastest)</h4>
       <pre>cd "E:\\Personal Projects\\AI-powered-medical-assistant"
npm run demo:reset     # fresh demo data, dated for today
npm run build          # once, about 1 minute
npm start              # opens on http://localhost:3000</pre>
       <h4>2. Open Chrome at 100% zoom, full screen (F11)</h4>
       <ul>
         <li>Internet is needed for the AI Doctor chat and fonts. MongoDB is <b>not</b> needed: the app falls back to local files.</li>
         <li>Open three tabs, one per role. The app remembers one login per browser address, so use <b>localhost:3000</b> for the patient, <b>127.0.0.1:3000</b> for the doctor and a private (incognito) window for the admin.</li>
         <li>Do not click the Google / GitHub buttons: they need OAuth keys that are not configured. Use email and password.</li>
       </ul>
     </div>
     <div>
       <h4>Demo accounts</h4>
       ${table(["Role", "Email", "Password"], [
         ["Patient", "ayesha.khan@demo.medisynix.test", "Demo@1234"],
         ["Doctor", "dr.sarah@medisynix.com", "doctor123"],
         ["Admin", "admin@medisynix.com", "admin123"],
       ], "compact")}
       <p class="small">On the login page choose the matching tab (Patient / Doctor / Admin) first. A mismatch shows "Invalid credentials".</p>
       <div class="say"><b>Tip:</b> the full story for each role is on the next slides. If anything goes wrong, the screenshots in this deck show exactly what you should see.</div>
     </div>
   </div>`
);

/* ---------------------------------------------------------------- 4 problem */
add(
  `<h2>Why we built it: healthcare is hard to reach and hard to understand</h2>
   <div class="stats">
     <div><b>256 M</b><span>people in Pakistan</span></div>
     <div><b>~319,000</b><span>registered doctors for the whole country</span></div>
     <div><b>&lt; 1% of GDP</b><span>public spending on health</span></div>
     <div><b>≈ 53%</b><span>of health spending paid out of pocket</span></div>
     <div><b>117 M</b><span>internet users — already online</span></div>
   </div>
   <div class="grid3">
     <div class="card"><h3>Hard to reach</h3><p>Long queues, travel, and not knowing which doctor or hospital to choose. Many people only go when it is already serious.</p></div>
     <div class="card"><h3>Hard to understand</h3><p>Lab reports and medical words are confusing. People search random websites or ask relatives, and often get wrong or scary answers.</p></div>
     <div class="card"><h3>Hard to manage</h3><p>Records live on paper or in WhatsApp photos. Doctors lack a quick, organised view of a patient's vitals, medicines and history.</p></div>
   </div>
   <p class="note">Sources: DataReportal Digital 2026 (internet users, population), Pakistan Economic Survey 2024-25 (doctors, health spending), Pakistan National Health Accounts 2019-20 (out-of-pocket share). See the sources slide.</p>`
);

/* ---------------------------------------------------------------- 5 solution */
add(
  `<h2>Our solution: one platform, three roles, an AI helper</h2>
   <div class="roles">
     <div class="role blue"><h3>Patient</h3>${list(["Ask the AI Doctor in plain language", "Check symptoms with safety warnings", "Upload a report and get a simple explanation", "Find a doctor and book a time slot", "Keep vitals, records and medicines in one place"])}</div>
     <div class="role teal"><h3>Doctor</h3>${list(["See today's schedule at a glance", "Vitals screening flags who needs attention", "Complete visits with diagnosis and notes", "Send reports straight to the patient", "Manage public profile, fees and time slots"])}</div>
     <div class="role violet"><h3>Administrator</h3>${list(["Create, edit and remove accounts", "Platform health, alerts and security score", "Analytics on users and appointments", "Download reports (CSV / JSON)", "Protect accounts with guard-rails"])}</div>
   </div>
   <p class="note"><b>Design principles:</b> plain language · always show a "not a medical diagnosis" reminder · never invent data · a human doctor stays in charge.</p>`
);

/* ---------------------------------------------------------------- 6 architecture */
add(
  `<h2>How it is built</h2>
   <div class="arch">
     <div class="box a1"><b>Browser</b><span>Patient · Doctor · Admin dashboards<br/>React 18 + Tailwind CSS</span></div>
     <div class="arrow">→</div>
     <div class="box a2"><b>Next.js 15 server</b><span>App Router pages + API routes<br/>JWT login · role checks · validation</span></div>
     <div class="arrow">→</div>
     <div class="stack">
       <div class="box a3"><b>MongoDB</b><span>main database (when available)</span></div>
       <div class="box a4"><b>Local JSON files</b><span>automatic fallback · works offline</span></div>
     </div>
   </div>
   <div class="arch second">
     <div class="box a5"><b>Chatbase AI agents</b><span>real language model for the AI Doctor chat<br/>(General agent and Personal agent)</span></div>
     <div class="box a6"><b>Rule-based engines</b><span>symptom checker · vitals screening ·<br/>report explainer (sample)</span></div>
   </div>
   <div class="grid3 tight">
     <div class="card"><h3>Security</h3><p>Passwords hashed with bcrypt. Signed tokens (7-day expiry). Every API checks the user's role; one patient can never open another patient's data.</p></div>
     <div class="card"><h3>Resilience</h3><p>If the database is down, the app keeps working from local files, and the admin Security page says so honestly.</p></div>
     <div class="card"><h3>Tech list</h3><p>Next.js 15 · React 18 · Tailwind 3 · Recharts · MongoDB · bcryptjs · jsonwebtoken · react-hot-toast · Chatbase.</p></div>
   </div>`
);

/* ---------------------------------------------------------------- 7 real vs simulated */
add(
  `<h2>What is real and what is a demo (be upfront — it builds trust)</h2>
   ${table(["Feature", "How it works today", "Status"], [
     ["AI Doctor chat (General &amp; Personal)", "Real language model through Chatbase, grounded on Aga Khan University Hospital and Al Shifa Hospital information", tag("Real AI", "green")],
     ["Symptom checker", "Rule-based: matches your symptoms against 10 common conditions, shows % match, advice and emergency red flags", tag("Rule-based", "amber")],
     ["Vitals screening (doctor view, patient dashboard)", "Rules on blood pressure, heart rate, glucose and BMI using standard reference ranges", tag("Rule-based", "amber")],
     ["Report explainer (upload report)", "Shows a sample plain-language explanation for the chosen test type with confidence and reasoning; the uploaded file is not yet read by a model", tag("Prototype", "red")],
     ["Accounts, booking, records, medicines, consultations", "Fully working: validated, role-protected, stored in database or local files", tag("Working", "green")],
     ["Payments, video calls, live chat with doctors", "Not built yet — fees are shown for information only", tag("Roadmap", "slate")],
   ])}
   <div class="say"><b>If asked "is the AI real?"</b> — "The conversational assistant is a real language model. The symptom checker and vitals screening are transparent rules we can explain line by line. The report explainer is a prototype that shows the experience we will connect to a medical model next."</div>`
);

/* ---------------------------------------------------------------- 8 big picture */
add(
  `<h2>The big picture: how the three roles connect</h2>
   <div class="flow">
     <div class="lane blue"><h3>Patient</h3><ol><li>Registers, fills the health profile</li><li>Finds a doctor and books a slot</li><li>Uploads a report, asks the AI</li></ol></div>
     <div class="mid">⇄</div>
     <div class="lane teal"><h3>Doctor</h3><ol><li>Sees the booking and the patient's vitals</li><li>Completes the visit with diagnosis &amp; notes</li><li>Uploads a report for the patient</li></ol></div>
     <div class="mid">⇄</div>
     <div class="lane violet"><h3>Admin</h3><ol><li>Creates and manages accounts</li><li>Watches platform health and alerts</li><li>Exports reports</li></ol></div>
   </div>
   <p class="note"><b>What the audience should notice:</b> everything the patient does shows up for the doctor, and everything the doctor does shows up for the patient. The administrator keeps the whole system safe. One shared data model — nothing is typed in twice.</p>`
);

/* ============================================================ PATIENT */
divider("Patient", "blue", "Ayesha Khan, 38", "Has high blood pressure and a penicillin allergy. Wants quick, understandable answers and an easy way to see a cardiologist.", "Understand my health, ask questions safely, and book and track my care without confusion.", [
  "Sign in", "Dashboard", "Health profile", "Find a doctor", "Book a visit", "AI Doctor", "Symptom checker", "Upload report", "Records & medicines", "Visits & insights",
]);

step({
  role: "Patient", num: 1, title: "Welcome and sign in",
  goal: "Show the public website, then log in as a patient.",
  click: ["Open <b>localhost:3000</b>. Scroll slowly: Features → How it works → Contact.", "Click <b>Log in</b>. Keep the <b>Patient</b> tab selected.", "Sign in as <b>ayesha.khan@demo.medisynix.test</b> / <b>Demo@1234</b>."],
  say: "This is Medisynix. Anyone can read about it, but health data is only visible after logging in, and each role gets its own workspace.",
  behind: "The login page checks the password (hashed with bcrypt) and the chosen role, then issues a signed token valid for 7 days. A wrong password shows \"Invalid credentials\". New users can register from <i>Create an account</i>.",
  imgs: ["pub-hero", "pub-login"],
});

step({
  role: "Patient", num: 2, title: "The dashboard: your health at a glance",
  goal: "One screen with vitals, status colours and shortcuts.",
  click: ["Point at the <b>Quick actions</b> row, then the four <b>Health metrics</b> cards.", "Notice the colour tags: High (red), Normal (green), Elevated (amber).", "Scroll to the <b>AI health signal</b> and the <b>Upcoming appointment</b> card."],
  say: "Ayesha's blood pressure is 152/96 and the app flags it as High straight away, so she knows to act, without anyone reading a chart for her.",
  behind: "Cards are calculated from her latest saved readings with standard ranges (for example 140/90 or higher is flagged). The \"AI health signal\" is a rule-based score, not a diagnosis.",
  imgs: ["pat-dashboard"],
});

step({
  role: "Patient", num: 3, title: "Health profile and vitals",
  goal: "Keep personal details and measurements up to date.",
  click: ["Sidebar → <b>Health Profile</b> → <b>Edit Profile</b>.", "Show the fields: contact, date of birth, blood type, allergies, conditions, height, weight, BP, heart rate, glucose.", "Optional: type a wrong value (weight 9000) to show validation, then <b>Cancel</b>."],
  say: "Everything here is used later: by the dashboard, the AI, and by the doctor who treats her. Impossible values such as a 9,000 kg weight are rejected.",
  behind: "Saving calls the profile API which validates ranges (height 50–260 cm, weight 2–500 kg, heart rate 20–250, glucose 20–900, BP like 120/80), then stores one history entry per update. BMI is calculated automatically.",
  imgs: ["pat-profile-edit"],
});

step({
  role: "Patient", num: 4, title: "Find a doctor",
  goal: "Search by name, speciality or place and see real time slots.",
  click: ["Sidebar → <b>Find a Doctor</b>.", "Type <b>cardio</b> in the search box, or use the speciality / location filters.", "Click <b>View Profile</b> on Dr. Sarah Johnson."],
  say: "Each doctor shows fee, experience, location and open slots. The slots come from the doctor's own profile, so patients can only choose times the doctor offers.",
  behind: "The directory API merges doctors created by the admin. A booked slot disappears for others on that date, and cancelling a booking frees it again.",
  imgs: ["pat-find-doctor"],
});

step({
  role: "Patient", num: 5, title: "Book an appointment",
  goal: "From profile to confirmed booking in three clicks.",
  click: ["On the doctor page pick a <b>date</b> and a <b>time slot</b> (the button becomes active).", "Click <b>Book Appointment</b>, add a reason, confirm.", "Sidebar → <b>Appointments</b>: the visit appears under Upcoming. Show the Past and Cancelled tabs."],
  say: "If two patients try the same slot, the second one gets a clear message instead of a double booking. Past dates are refused too.",
  behind: "Server rules: no double bookings (HTTP 409), no past or invalid dates (400), only offered time slots. Cancelling returns the slot to the pool. The doctor is notified on their bell.",
  imgs: ["pat-doctor-detail", "pat-book-form"],
});

step({
  role: "Patient", num: 6, title: "AI Doctor (real language model)",
  goal: "Ask questions in everyday language.",
  click: ["Sidebar → <b>AI Doctor</b> → <b>Select General AI Doctor</b>.", "Type: <i>\"I have a fever and a sore throat since two days. What should I do?\"</i>", "Optional: go back and open the <b>Personal AI Doctor</b>, which shows her saved health summary beside the chat."],
  say: "The answer is general guidance, never a diagnosis: rest, fluids, watch the temperature, and when to see a doctor. It also points to the Personal AI Doctor.",
  behind: "Powered by a Chatbase agent trained on Aga Khan University Hospital and Al Shifa Hospital information. The Personal view shows the profile on screen; it does not send her record to the model.",
  imgs: ["pat-ai-general"],
  cap: ["Real response captured from the live General AI Doctor"],
});

step({
  role: "Patient", num: 7, title: "Symptom checker with emergency warnings",
  goal: "A fast, transparent way to see which common conditions fit.",
  click: ["Sidebar → <b>Symptom Checker</b>.", "Tap chips <b>fever</b>, <b>cough</b>, <b>headache</b> → <b>Check symptoms</b>. Show the % match bars and advice.", "<b>Clear</b>, then tap <b>chest pain</b> and <b>shortness of breath</b>: a red emergency alert appears (Edhi 115, Rescue 1122)."],
  say: "It tells you how many of a condition's typical symptoms you reported, what to do, and when to seek urgent help. It is a guide, not a diagnosis, and says so.",
  behind: "A small built-in table of 10 common conditions. Matching is by symptom phrase; red-flag phrases such as chest pain or coughing blood trigger the emergency banner independently of the matches.",
  imgs: ["pat-symptoms-result", "pat-symptoms-emergency"],
});

step({
  role: "Patient", num: 8, title: "Upload a report and get a plain-language summary",
  goal: "Turn confusing lab or imaging reports into something readable.",
  click: ["Dashboard → <b>Upload Report</b> (or sidebar <b>Medical Records → Add record</b>).", "Choose <b>Lab test report</b>, select a test (for example CBC), attach any image or PDF, click <b>Upload and analyze</b>.", "Show <b>In plain language</b>, the table with High / Normal tags, and <b>How Medisynix reached this reading</b> (confidence + reasoning steps)."],
  say: "The idea is explainable AI: not just an answer, but how sure the system is and why. The summary is saved to her records automatically.",
  behind: "This is a prototype: the explanation is a sample for the selected test type, and the page says so. The roadmap connects it to a medical model that reads the file.",
  imgs: ["pat-upload-form", "pat-upload-result"],
});

step({
  role: "Patient", num: 9, title: "Medical records and medicines",
  goal: "A tidy personal health file.",
  click: ["Sidebar → <b>Medical Records</b>: use the type chips and search, click <b>View</b> to open a record, show Delete on her own record.", "Sidebar → <b>Medications</b>: show today's reminders and the table; <b>Add Medication</b> then <b>Remove</b>."],
  say: "Records from doctors and from the patient live together. Patients can add or delete their own, but cannot change what a doctor uploaded.",
  behind: "Doctor-uploaded reports arrive here automatically with the doctor's name. Attachments up to 2 MB are stored with the record. Medicines are saved per patient.",
  imgs: ["pat-records", "pat-record-modal"],
});

step({
  role: "Patient", num: 10, title: "Visits and health insights",
  goal: "See care history and trends.",
  click: ["Sidebar → <b>Consultations</b>: open the completed visit to read the doctor's diagnosis and notes.", "Sidebar → <b>Analytics</b>: change the range (1 / 3 / 12 months) and show the charts.", "Finish by clicking the avatar → <b>Logout</b>."],
  say: "What the doctor wrote after the visit appears here for the patient: the loop is closed. The insights page only uses real data from her account.",
  behind: "Consultations are the completed appointments. Analytics counts her appointments and plots her saved vitals over time; if she has none, a helpful empty state appears instead of fake numbers.",
  imgs: ["pat-consultations", "pat-analytics"],
});

/* ============================================================ DOCTOR */
divider("Doctor", "teal", "Dr. Sarah Johnson, Cardiologist", "Sees patients through Medisynix next to a clinic. Opens the app before the first visit and again between consultations.", "Know who is coming today, spot patients who need attention, record each visit quickly and keep her public profile correct.", [
  "Sign in", "Dashboard", "Patients", "AI analysis", "Consultations", "Reports & profile",
]);

step({
  role: "Doctor", num: 1, title: "Sign in and start the day",
  goal: "A live overview of the doctor's workload.",
  click: ["In the Doctor browser tab: <b>Log in</b> → tab <b>Doctor</b> → <b>dr.sarah@medisynix.com</b> / <b>doctor123</b>.", "Read the five counters: Patients, Today, Upcoming, Completed, Need attention.", "Show <b>Today's schedule</b>, <b>Coming up</b> and <b>Needs attention</b>. Click the bell to see new bookings."],
  say: "A patient booked yesterday and the doctor sees it today. Names, times and reasons are real; the list of people who need attention is generated from vitals.",
  behind: "The overview API only returns patients who have booked with this doctor. If past visits are still open, an amber banner reminds the doctor to complete or cancel them.",
  imgs: ["doc-dashboard"],
});

step({
  role: "Doctor", num: 2, title: "Patients and the patient file",
  goal: "Everything about one patient on a single page.",
  click: ["Sidebar → <b>Patients</b>: search, use <b>Needs attention</b> filter.", "Click <b>Ayesha Khan</b>: latest vitals, history, screening flags, medical profile, medicines, records.", "Show the <b>Upload report</b> button on this page."],
  say: "No more hunting through papers: vitals are colour-coded, and a reading like 152/96 is explained as 'stage 2 range' with a suggestion to confirm with repeat readings.",
  behind: "A doctor can open only patients who booked with them; any other patient looks like 'not found'. This is enforced on the server, not just hidden in the interface.",
  imgs: ["doc-patients", "doc-patient-detail"],
});

step({
  role: "Doctor", num: 3, title: "AI analysis: who needs attention first?",
  goal: "Rank patients by how urgently their vitals deserve a look.",
  click: ["Sidebar → <b>AI Analysis</b>.", "Click the <b>High priority</b> tile to filter. Expand a patient with <b>flags</b> to see the reading and reason.", "Click <b>Open</b> to jump to that patient's file."],
  say: "This is decision support, not a verdict. The banner on the page says it is rule-based screening of what patients entered. It tells the doctor where to look first.",
  behind: "Rules compare blood pressure, heart rate, glucose and BMI to reference ranges. Combined flags raise priority. The same logic powers the 'Needs attention' panel on the dashboard.",
  imgs: ["doc-ai-analysis"],
});

step({
  role: "Doctor", num: 4, title: "Consultations: complete, reschedule or cancel",
  goal: "Run the day and record what happened.",
  click: ["Sidebar → <b>Consultations</b>. Tabs: Today, Upcoming, Overdue, Completed, Cancelled.", "In <b>Today</b> click <b>Complete</b> on a visit, type a diagnosis and notes, click <b>Mark completed</b>.", "Show <b>Reschedule</b> (only free slots) and <b>Cancel</b> (optional reason)."],
  say: "The diagnosis and notes written here are exactly what the patient reads in their own Consultations page. One entry, both sides updated.",
  behind: "Rules: only today's or past visits can be completed, finished visits cannot be reopened, rescheduling to a taken slot is refused, and cancelled visits are final.",
  imgs: ["doc-consultations", "doc-complete-dialog"],
});

step({
  role: "Doctor", num: 5, title: "Send a report and review the practice",
  goal: "Deliver results to the patient and see the numbers.",
  click: ["Sidebar → <b>Upload Report</b>: choose the patient, lab or imaging, test, title, date, findings, optional PDF/PNG/JPEG (up to 2 MB).", "Sidebar → <b>Analytics</b>: visits per month, outcomes, busiest weekdays, top reasons."],
  say: "The doctor's findings are typed by the doctor. Nothing is auto-generated. The patient sees the report in their records with the doctor's name.",
  behind: "Validation refuses unknown tests, missing findings, future dates, wrong file types and files over 2 MB. Analytics are calculated from real appointments only.",
  imgs: ["doc-upload", "doc-analytics"],
});

step({
  role: "Doctor", num: 6, title: "Public profile and availability",
  goal: "Control what patients see and when they can book.",
  click: ["Sidebar → <b>Profile</b>.", "Show specialty, city, qualifications, fee, languages and the <b>available time slots</b> chips.", "Optional: remove a slot, save, then show that the patient booking form no longer offers it."],
  say: "A change here is instantly reflected in Find a Doctor and in the booking form. The doctor owns their schedule.",
  behind: "Dropdowns restrict values (specialty, city). Invalid phone numbers, fees or empty slot lists are rejected. The photo is stored with the profile.",
  imgs: ["doc-profile"],
});

/* ============================================================ ADMIN */
divider("Administrator", "violet", "Mohsin Furkh, Platform Admin", "Owns the platform's accounts and health. Signs in a few times a day to look for problems and onboard doctors.", "See what needs attention in seconds, manage accounts safely, and be stopped before doing something destructive.", [
  "Sign in & dashboard", "Manage users", "Health & security", "Reports & settings",
]);

step({
  role: "Admin", num: 1, title: "Admin dashboard and system status",
  goal: "Platform health in one glance.",
  click: ["In the Admin tab: <b>Log in</b> → tab <b>Admin</b> → <b>admin@medisynix.com</b> / <b>admin123</b>.", "Read the counters: users, doctors, patients, consultations. Click the tabs <b>Recent Users / System Alerts / Reports</b>.", "Click <b>System Status</b> to open the status dialog."],
  say: "The administrator manages accounts and platform health, not clinical records. Numbers here always match the Users and Analytics pages.",
  behind: "System Status shows database mode (database or local files), environment, uptime and totals. Role guards: a doctor or patient calling any admin API gets 403, a forged token gets 401.",
  imgs: ["adm-dashboard", "adm-system-status"],
});

step({
  role: "Admin", num: 2, title: "User management",
  goal: "Create, find, edit and remove accounts safely.",
  click: ["Sidebar → <b>Users</b>. Search by name or e-mail, filter by role.", "Click <b>Add New User</b>: fill the form (patient, doctor or admin) and <b>Create account</b>. Show the weak-password message first.", "Open the edit icon, then show the delete confirmation (do not confirm)."],
  say: "A new doctor appears immediately in Find a Doctor. Deleting someone also removes their appointments, records and medicines so statistics stay correct.",
  behind: "Guard-rails: duplicate e-mails refused, passwords need upper/lower case, a number and a symbol, admins cannot delete or demote themselves, and the last administrator cannot be removed.",
  imgs: ["adm-users", "adm-add-user"],
});

step({
  role: "Admin", num: 3, title: "Security, alerts and analytics",
  goal: "Know what is healthy and what needs fixing.",
  click: ["Sidebar → <b>Security</b>: score of 4 checks. Explain the red items.", "Sidebar → <b>Alerts</b> and <b>Analytics</b>: users by role, appointments by status.", "Press <b>Refresh</b> to show it is live."],
  say: "Two checks fail honestly on this laptop: the default admin password is still in use and MongoDB is not connected, so we run on local files. In production both would be fixed.",
  behind: "The page inspects the real configuration (JWT secret, default password, database connectivity, number of admins). It is not a mock-up.",
  imgs: ["adm-security", "adm-analytics"],
});

step({
  role: "Admin", num: 4, title: "Reports and settings",
  goal: "Export data and manage the admin's own account.",
  click: ["Sidebar → <b>Reports</b>: click <b>User Activity Report</b> (CSV) and <b>System Health Report</b> (JSON).", "Sidebar → <b>Settings</b>: change-password form with live rule checklist.", "Click <b>Logout</b>: you are returned to the login page."],
  say: "Reports open in Excel or any tool. Spreadsheet formula characters in names are neutralised so a malicious name cannot run code.",
  behind: "Change password needs the current password and enforces the same rules as registration. Direct URLs such as /dashboard/admin redirect to login when signed out.",
  imgs: ["adm-reports", "adm-settings"],
});

/* ---------------------------------------------------------------- loop */
add(
  `<h2>Closing the loop: what one role does, the other sees</h2>
   ${table(["Someone does this…", "…and this person sees it"], [
     ["Patient books a slot", "Doctor: shows in Coming up and the bell; slot disappears for other patients"],
     ["Patient updates blood pressure to 152/96", "Doctor: patient gets a High priority flag in AI Analysis and the dashboard"],
     ["Doctor completes a visit with diagnosis and notes", "Patient: Consultations page shows the diagnosis and notes; Appointments moves it to Past"],
     ["Doctor cancels or reschedules", "Patient: visit appears in Cancelled or with the new time"],
     ["Doctor uploads a report", "Patient: Medical Records shows it with the doctor's name"],
     ["Doctor changes fee or time slots", "Patient: Find a Doctor, doctor page and booking form update at once"],
     ["Admin creates a doctor", "Patients: the new doctor appears in Find a Doctor"],
     ["Admin deletes a user", "All their appointments, records and medicines are removed; statistics stay correct"],
   ])}`
);

/* ---------------------------------------------------------------- safety */
add(
  `<h2>Safety, privacy and the rules the app enforces</h2>
   <div class="twocol">
     <div>
       <h4>Patient safety</h4>
       ${list(["\"Not a diagnosis\" reminders on AI, symptom checker, reports and analytics", "Emergency red flags (chest pain, difficulty breathing, bleeding, stroke signs) point to Edhi 115 and Rescue 1122", "No invented numbers: empty states instead of fake charts", "Doctor-written information is clearly separate from automated summaries"])}
       <h4>Data protection</h4>
       ${list(["Passwords hashed (bcrypt); signed tokens with expiry", "Server-side role checks on every API", "A patient can only read their own data; a doctor only their own patients", "Admin screens manage accounts and platform health, not clinical records"])}
     </div>
     <div>
       <h4>Validation examples</h4>
       ${table(["Situation", "Result"], [
         ["Double booking of one slot", "Refused (409)"],
         ["Booking a past or impossible date", "Refused (400)"],
         ["Weight 9000 kg or BP 999/999", "Refused (400)"],
         ["Doctor opens another doctor's patient", "Not found (404)"],
         ["Patient calls an admin API", "Forbidden (403)"],
         ["Forged or expired token", "Unauthorised (401)"],
         ["Weak password / duplicate e-mail", "Refused with a clear message"],
       ], "compact")}
       <p class="small"><b>Tested:</b> 49 end-to-end checks across the three roles in the final round, plus earlier suites for admin, doctor (140 checks) and booking (29 checks); every page loaded without console errors on desktop and phone width.</p>
     </div>
   </div>`
);

/* ---------------------------------------------------------------- market 1 */
add(
  `<h2>Market research 1/3: what already exists (global)</h2>
   ${table(["Product", "What it does", "How we differ"], [
     ["Ada Health", "AI symptom assessment and care guidance; huge user base; reviewed by doctors", "No Urdu, no Pakistani hospitals or doctor booking"],
     ["Infermedica / Symptomate", "Medical-grade symptom checker API, 24 languages", "Sold to enterprises; no Urdu; no local doctors"],
     ["K Health", "AI chat that connects to doctors in the US; raised $50M in 2024", "US-only, insurance-based"],
     ["Healthily, Buoy", "Self-care and symptom checking apps", "General Western content"],
     ["Babylon Health", "AI + video GP (UK / Rwanda)", "Collapsed into bankruptcy in 2023 — a warning about over-promising"],
     ["ChatGPT Health, Microsoft Copilot Health (2026)", "Large-model health assistants for personal records (US first)", "Not local, not integrated with local doctors, not for Pakistan yet"],
   ])}
   <p class="note"><b>Lesson:</b> global tools are strong at triage but weak locally. The big failure (Babylon) came from promising too much, so our "assistant, not doctor" positioning is deliberate.</p>`
);

/* ---------------------------------------------------------------- market 2 */
add(
  `<h2>Market research 2/3: what exists in Pakistan</h2>
   ${table(["Product", "What it does", "Gap we address"], [
     ["Marham", "Doctor search and booking; claims 14,000+ doctors and 10M+ users", "Directory first; limited AI explanation of reports"],
     ["Oladoc", "Booking, online consultation; claims 25,000+ doctors; \"Fit by oladoc\" wellness AI", "Marketplace focus; no full doctor-side screening workspace"],
     ["Sehat Kahani", "Telemedicine run by women doctors; community e-clinics", "Telehealth, not an AI health companion"],
     ["Dawaai", "Online pharmacy and lab tests", "Pharmacy / diagnostics, not consultation"],
     ["Ilaaj AI (closest AI rival)", "AI health chat in Urdu / Roman Urdu with voice and doctor review, priced PKR 200–1,500", "Urdu and voice: our biggest gap to close"],
     ["Hospital WhatsApp bots (AKUH 2023, Shifa)", "Appointment and information bots for one hospital", "Single-hospital; we aim to span providers"],
   ])}
   <p class="note"><b>Honest take:</b> Pakistan already has strong booking and telehealth players. We should not try to out-list them; we win by being the <i>understanding and tracking</i> layer (AI explanations + a complete doctor and admin workspace) and by partnering with them and with hospitals.</p>`
);

/* ---------------------------------------------------------------- market 3 */
add(
  `<h2>Market research 3/3: size and signals</h2>
   <div class="stats">
     <div><b>USD 946 B</b><span>global digital health by 2030 (Grand View Research)</span></div>
     <div><b>USD 1.4 B → 4.3 B</b><span>symptom-checker chatbots 2025 → 2030 (indicative)</span></div>
     <div><b>~USD 546 M</b><span>Pakistan digital health by 2028 (Statista, indicative)</span></div>
     <div><b>194 M</b><span>mobile connections in Pakistan</span></div>
   </div>
   <div class="twocol">
     <div><h4>Tailwinds</h4>${list(["Young, mobile-first population; internet use growing every year", "Doctor shortage and high out-of-pocket costs push people toward cheaper first advice", "Hospitals already invest in WhatsApp and AI bots, so partners exist", "Large-language-model quality and cost keep improving"])}</div>
     <div><h4>Headwinds</h4>${list(["Trust: studies (Oxford / Nature Medicine, 2026) show chatbots can mislead real users", "No enacted data-protection law yet (draft bill), so we must self-regulate", "Telemedicine licensing (DRAP / PMDC) and clinical liability", "Language: most people prefer Urdu / Roman Urdu"])}</div>
   </div>
   <p class="note">Market-size figures come from commercial research firms and vary by method. Treat them as indicative, not exact.</p>`
);

/* ---------------------------------------------------------------- differentiators */
add(
  `<h2>What makes Medisynix different</h2>
   <div class="grid3">
     <div class="card"><h3>1 · One workspace for all three roles</h3><p>Most apps serve patients <i>or</i> doctors. We connect patient, doctor and administrator on one data model, so what one does is instantly visible to the other.</p></div>
     <div class="card"><h3>2 · Explain, don't just answer</h3><p>Reports come with a plain-language summary, a confidence score and the reasoning steps behind it. The goal: understandable and checkable AI.</p></div>
     <div class="card"><h3>3 · Local grounding</h3><p>The assistant is grounded on Pakistani hospital information (Aga Khan University Hospital, Al Shifa) and prices in rupees, not on generic Western content.</p></div>
     <div class="card"><h3>4 · Safety by design</h3><p>Positioned as information, never diagnosis. Red-flag escalation, disclaimers, and doctors in the loop.</p></div>
     <div class="card"><h3>5 · Works even offline from a database</h3><p>Automatic fallback to local files means a clinic with poor infrastructure still gets a working system.</p></div>
     <div class="card accent"><h3>Where we are not (yet) different</h3><p>Urdu and voice (Ilaaj AI has it), the size of doctor networks (Marham, Oladoc), and clinical validation. These are our next priorities.</p></div>
   </div>`
);

/* ---------------------------------------------------------------- pros & cons */
add(
  `<h2>Pros and cons</h2>
   <div class="twocol">
     <div class="pc pros"><h3>Strengths</h3>${list([
       "Complete working product: 3 roles, ~40 pages, validated APIs",
       "Real AI chat, transparent rule-based tools",
       "Clean, modern, responsive interface (desktop and phone)",
       "Strong server-side rules and tested edge cases",
       "Runs without a database; easy to deploy",
       "Honest design: clear \"not a diagnosis\" messages, no fake data",
       "Low cost to run; open code on GitHub",
     ])}</div>
     <div class="pc cons"><h3>Weaknesses</h3>${list([
       "Report explainer is a prototype; symptom checker covers only 10 conditions",
       "AI chat depends on a third-party service (Chatbase) and internet",
       "No Urdu / voice yet; no payments, video calls or chat with doctors",
       "Not clinically validated; no regulatory approval",
       "Attachments stored with records (2 MB), not in cloud storage",
       "Notification read-state is per browser",
       "Small seed dataset; no real hospital integration yet",
     ])}</div>
   </div>
   <div class="twocol">
     <div class="pc"><h3>Opportunities</h3>${list(["Urdu + voice assistant for first-time smartphone users", "Partner hospitals, labs, pharmacies and insurers", "Corporate wellness and community health workers"])}</div>
     <div class="pc"><h3>Threats</h3>${list(["Well-funded local players adding AI (Marham, Oladoc, Ilaaj)", "Trust and liability if the AI is wrong", "Evolving data-protection and telemedicine regulation"])}</div>
   </div>`
);

/* ---------------------------------------------------------------- limitations */
add(
  `<h2>Known limitations (say them before someone asks)</h2>
   ${table(["Limitation", "Why it exists", "How we fix it"], [
     ["Report explanation is a sample", "Time and cost of integrating a medical model", "Connect the uploaded file to a vision / language model with doctor review"],
     ["Google / GitHub sign-in need keys", "OAuth credentials are not in the repo", "Add client IDs in .env.local on deployment"],
     ["MongoDB not running on the demo laptop", "Local development uses file storage", "Use MongoDB Atlas in production (code paths exist)"],
     ["Chat depends on Chatbase", "Fast way to ship a real LLM with a knowledge base", "Own retrieval + model with logging, cost control and evaluation"],
     ["No clinical validation", "FYP scope", "Pilot with a clinic, measure accuracy and safety with doctors"],
     ["No Urdu / voice", "Content and speech model work", "Roman Urdu and Urdu first; voice via speech-to-text"],
     ["Data protection law not enacted", "Pakistan's bill is still a draft", "Follow HIPAA / GDPR-style consent, encryption and audit logs now"],
   ])}`
);

/* ---------------------------------------------------------------- roadmap */
add(
  `<h2>How we make it better: roadmap</h2>
   <div class="road">
     <div class="phase"><h3>Next 3 months</h3>${list(["Roman Urdu / Urdu interface and chat", "Connect report upload to a medical model (with doctor review)", "Expand symptom checker; red-flag escalation to a nurse line", "Privacy centre: consent, export, delete my data", "Evaluation set: test the AI on 200 reviewed cases"])}</div>
     <div class="phase"><h3>3 – 9 months</h3>${list(["WhatsApp channel for low-bandwidth users", "Lab and hospital integrations (HL7 / FHIR)", "e-prescriptions and medicine reminders", "Video consultation and secure chat with doctors", "Payments (JazzCash / Easypaisa / cards)"])}</div>
     <div class="phase"><h3>9 – 18 months</h3>${list(["Clinical pilot with a partner hospital and published results", "Insurance and corporate-wellness plans", "Chronic-care programmes (hypertension, diabetes)", "Regulatory approvals and ISO 27001-style audit", "Wearable data (blood pressure, glucose, steps)"])}</div>
   </div>`
);

/* ---------------------------------------------------------------- go to market */
add(
  `<h2>How people will reach Medisynix</h2>
   <div class="grid3">
     <div class="card"><h3>Meet people where they are</h3><p>WhatsApp and a lightweight, mobile-friendly web app in Urdu; short videos and health tips on social media.</p></div>
     <div class="card"><h3>Partner for trust</h3><p>Hospitals, clinics, labs and pharmacies recommend it; doctors review content. Universities and medical colleges run pilots.</p></div>
     <div class="card"><h3>Reach underserved areas</h3><p>Community health workers and Lady Health Workers use it to explain results and refer patients; kiosks in pharmacies.</p></div>
     <div class="card"><h3>Business model</h3><p>Free for patients' basic use. Revenue from clinic subscriptions, hospital integrations, corporate wellness and insurer partnerships.</p></div>
     <div class="card"><h3>Grow responsibly</h3><p>Start with one city and two partners, publish accuracy results, then scale. Honesty about limits is part of the brand.</p></div>
     <div class="card accent"><h3>Success measures</h3><p>Users who understood their report · visits booked · time saved per doctor · red-flag cases correctly escalated · patient satisfaction.</p></div>
   </div>`
);

/* ---------------------------------------------------------------- impact */
add(
  `<h2>How it can make lives better</h2>
   <div class="grid3">
     <div class="card story"><h3>The worried parent</h3><p>At 2 a.m. a child has fever. The symptom checker explains likely causes, what to do tonight and when to rush to hospital, in clear words, instead of panic and random web searches.</p></div>
     <div class="card story"><h3>The patient with high blood pressure</h3><p>She records her readings, sees colour-coded trends and books a cardiologist. The doctor sees her history before she walks in, so the visit is about treatment, not paperwork.</p></div>
     <div class="card story"><h3>The overloaded doctor</h3><p>AI analysis shows who needs attention first. Notes are written once and appear to the patient. Less admin, more care.</p></div>
     <div class="card story"><h3>The small clinic</h3><p>An administrator can set up staff accounts in minutes, export reports and keep the system secure, without an IT team.</p></div>
     <div class="card story"><h3>The first-time smartphone user</h3><p>With Urdu voice (roadmap) they can ask a question out loud and get an answer they understand.</p></div>
     <div class="card accent"><h3>The big idea</h3><p>Better understanding → earlier care → fewer emergencies and lower costs for families and for the health system.</p></div>
   </div>`
);

/* ---------------------------------------------------------------- Q&A 1 */
add(
  `<h2>Likely questions and good answers (1/2)</h2>
   <div class="qa">
     <div><b>Is the AI real?</b><p>The chat is a real language model (Chatbase) grounded on AKUH and Al Shifa information. The symptom checker and vitals screening are rules we can explain. The report explainer is a prototype.</p></div>
     <div><b>Does it replace a doctor?</b><p>No. It gives information and helps people reach the right doctor. Every screen carries a "not a diagnosis" reminder.</p></div>
     <div><b>How accurate is it?</b><p>We have not clinically validated it yet; that is the first step of the roadmap (evaluation set + pilot with doctors).</p></div>
     <div><b>Where is the data stored and is it safe?</b><p>MongoDB, or local files if the database is down. Passwords are hashed, tokens expire, every API checks the role. For production we would add encryption at rest, audit logs and consent.</p></div>
     <div><b>What if the AI gives wrong advice?</b><p>Answers are general, include when to see a doctor, and emergency phrases escalate to Edhi 115 / Rescue 1122. We would log and review chats in a pilot.</p></div>
     <div><b>Why Chatbase?</b><p>It let us ship a working knowledge-based assistant quickly. Later we can swap in our own retrieval + model.</p></div>
   </div>`
);

/* ---------------------------------------------------------------- Q&A 2 */
add(
  `<h2>Likely questions and good answers (2/2)</h2>
   <div class="qa">
     <div><b>Marham and Oladoc already exist — why this?</b><p>They are great at finding doctors. We focus on understanding and tracking health with AI, and on giving doctors and admins a complete workspace. We would partner with them, not fight them.</p></div>
     <div><b>How will you make money?</b><p>Basic use is free. Revenue comes from clinic subscriptions, hospital and lab integrations, corporate wellness and insurer partnerships.</p></div>
     <div><b>Can it scale?</b><p>The Next.js app is stateless; with MongoDB Atlas it can be deployed on Vercel or any cloud and scaled horizontally. AI cost is per message and can be limited.</p></div>
     <div><b>What was the hardest part?</b><p>Keeping three roles consistent: booking rules, permissions and the same data shown correctly to patient, doctor and admin, with the system staying safe when things fail.</p></div>
     <div><b>What would you do with more time?</b><p>Urdu and voice, a real report-reading model with doctor review, payments and video, and a clinical pilot.</p></div>
     <div><b>Is it legal?</b><p>It is positioned as information, not diagnosis or treatment. Pakistan's data-protection bill is still draft, so we follow good-practice consent and security now and would seek DRAP / PMDC guidance before offering consultations commercially.</p></div>
   </div>`
);

/* ---------------------------------------------------------------- checklist */
add(
  `<h2>Demo-day checklist and "if something goes wrong"</h2>
   <div class="twocol">
     <div>
       <h4>Morning of the demo</h4>
       ${list(["Charge laptop, plug in power, disable sleep and notifications", "<b>npm run demo:reset</b> (fresh data dated for today)", "<b>npm run build</b> then <b>npm start</b>; open localhost:3000", "Log in once as each role in its own browser window; leave them open", "Test internet: open the General AI Doctor and ask one question", "Zoom 100%, full screen; close other apps", "Keep this PDF open on a second screen or phone"])}
     </div>
     <div>
       <h4>If something goes wrong</h4>
       ${table(["Problem", "Do this"], [
         ["Page shows an error", "Press F5. If it persists, restart <b>npm start</b>"],
         ["AI chat is blank or slow", "Check internet; click <i>Start New Chat</i>; or show the screenshot slide"],
         ["'Invalid credentials'", "Choose the right role tab on the login page"],
         ["Doctor has no visits today", "Run <b>npm run demo:reset</b> and refresh"],
         ["Port 3000 busy", "Close the old terminal or run <b>npm start -- -p 3001</b>"],
         ["Data looks messy after rehearsal", "<b>npm run demo:reset</b>"],
       ], "compact")}
     </div>
   </div>
   <p class="note"><b>Golden rule:</b> demonstrate the happy path; mention limits yourself (slide 7) before anyone else does.</p>`
);

/* ---------------------------------------------------------------- sources */
add(
  `<h2>Sources and caveats</h2>
   ${list([
     "DataReportal, <i>Digital 2026: Pakistan</i> — population 256 M, internet users 117 M (45.6%), mobile connections 194 M.",
     "Government of Pakistan, <i>Economic Survey 2024-25</i> — about 319,000 registered doctors; health spending under 1% of GDP.",
     "Pakistan National Health Accounts 2019-20 — out-of-pocket about 52.8% of total health expenditure.",
     "Grand View Research — global digital health about USD 946 B by 2030. Statista — Pakistan digital health about USD 546 M by 2028 (base year not verified). Market-size sources for symptom-checker chatbots are indicative.",
     "Competitor information from company websites and press, searched 4 Oct 2026: Ada Health, Infermedica, K Health (funding July 2024), Babylon (US Chapter 7, Aug 2023), Healthily, ChatGPT Health (7 Jan 2026), Microsoft Copilot Health (12 Mar 2026), Marham, Oladoc, Sehat Kahani, Dawaai, Ilaaj AI, Aga Khan University Hospital WhatsApp assistant (July 2023), Shifa International WhatsApp service.",
     "Oxford / <i>Nature Medicine</i> (Feb 2026) on the limits of LLM health advice for lay users.",
   ])}
   <p class="note"><b>Caveat:</b> company claims such as "25,000 doctors" are self-reported. Prices and features change; double-check any number you plan to quote aloud. Screenshots in this deck were taken from the running application with the demo data.</p>`
);

/* ---------------------------------------------------------------- thanks */
add(
  `<div class="cover">
    <img class="logo" src="img/logo-light.png" alt="Medisynix"/>
    <h1>Thank you</h1>
    <p class="lead">Questions? Let's talk about making health information understandable for everyone.</p>
    <div class="pills"><span>github.com/dvlprasher5</span><span>Medisynix · AI-powered medical assistant</span></div>
  </div>`,
  "dark cover-slide"
);

/* ---------------------------------------------------------------- css */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
@page { size: 1280px 720px; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #e2e8f0; font-family: Inter, "Segoe UI", system-ui, sans-serif; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.slide { width: 1280px; height: 720px; position: relative; overflow: hidden; background: #fff; page-break-after: always; break-after: page; margin: 0 auto; }
@media screen { .slide { margin: 18px auto; box-shadow: 0 8px 30px rgba(15,23,42,.18); } }
.inner { position: absolute; inset: 0; padding: 40px 56px 54px; display: flex; flex-direction: column; gap: 14px; }
.foot { position: absolute; left: 56px; right: 56px; bottom: 16px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
.dark .foot { color: rgba(255,255,255,.55); }
h1, h2, h3, h4 { font-family: "Plus Jakarta Sans", Inter, sans-serif; letter-spacing: -0.02em; }
h2 { font-size: 34px; font-weight: 800; line-height: 1.15; color: #0b1b3a; }
h2 small { font-size: 18px; font-weight: 600; color: #64748b; }
h3 { font-size: 20px; font-weight: 700; color: #0b1b3a; margin-bottom: 6px; }
h4 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #2563eb; margin: 10px 0 5px; }
p { font-size: 16px; line-height: 1.5; color: #334155; }
p.small { font-size: 14px; color: #475569; }
ul { padding-left: 18px; } li { font-size: 16px; line-height: 1.45; margin: 4px 0; color: #1e293b; }
li::marker { color: #2563eb; }
b { font-weight: 700; color: #0f172a; }
.note { font-size: 15px; background: #f1f5f9; border-left: 4px solid #2563eb; padding: 10px 14px; border-radius: 6px; margin-top: auto; }
pre { background: #0b1b3a; color: #e2e8f0; border-radius: 8px; padding: 14px 16px; font-size: 14.5px; line-height: 1.55; font-family: Consolas, "Cascadia Mono", monospace; white-space: pre-wrap; }
.say { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 13px; font-size: 15px; line-height: 1.45; color: #1e3a8a; margin: 10px 0 2px; }
.say b { color: #1d4ed8; }
.tag { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; white-space: nowrap; }
.tag.green { background: #dcfce7; color: #166534; } .tag.amber { background: #fef3c7; color: #92400e; } .tag.red { background: #fee2e2; color: #991b1b; } .tag.slate { background: #e2e8f0; color: #334155; } .tag.blue { background: #dbeafe; color: #1e40af; }
table { width: 100%; border-collapse: collapse; font-size: 15px; }
th { text-align: left; background: #0b1b3a; color: #fff; padding: 10px 12px; font-size: 13px; letter-spacing: .03em; }
th:first-child { border-top-left-radius: 8px; } th:last-child { border-top-right-radius: 8px; }
td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; line-height: 1.4; color: #1e293b; }
tbody tr:nth-child(even) td { background: #f8fafc; }
td:first-child { font-weight: 600; }
table.compact { font-size: 14px; } table.compact td, table.compact th { padding: 7px 9px; }
.grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.inner > .grid3:not(.tight) { flex: 1; } .grid3.tight { margin-top: auto; } .grid3.tight .card p { font-size: 14px; }
.card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 22px; display: flex; flex-direction: column; justify-content: center; }
.card .num { width: 30px; height: 30px; border-radius: 50%; background: #2563eb; color: #fff; font-weight: 800; display: grid; place-items: center; margin-bottom: 8px; }
.card.accent { background: linear-gradient(135deg, #2563eb, #0d9488); border: none; } .card.accent h3, .card.accent p { color: #fff; }
.card.story { background: #fff; border-top: 4px solid #0d9488; }
.twocol { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
.stats { display: grid; grid-auto-flow: column; gap: 12px; }
.stats > div { background: linear-gradient(160deg, #0b1b3a, #1e3a8a); color: #fff; border-radius: 12px; padding: 18px 18px; }
.stats b { display: block; color: #fff; font-family: "Plus Jakarta Sans", sans-serif; font-size: 30px; font-weight: 800; letter-spacing: -0.02em; }
.stats span { font-size: 14px; color: #cbd5e1; line-height: 1.35; display: block; margin-top: 3px; }
.roles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; flex: 1; } .roles li { font-size: 17px; margin: 8px 0; }
.role { border-radius: 14px; padding: 22px 24px; color: #fff; }
.role h3, .role li { color: #fff; } .role li::marker { color: #fff; }
.role.blue { background: linear-gradient(160deg, #2563eb, #1e40af); } .role.teal { background: linear-gradient(160deg, #0d9488, #115e59); } .role.violet { background: linear-gradient(160deg, #7c3aed, #4c1d95); }
.arch { display: flex; align-items: stretch; gap: 14px; justify-content: center; }
.arch.second { margin-top: -2px; }
.box { background: #eff6ff; border: 1.5px solid #93c5fd; border-radius: 12px; padding: 14px 18px; min-width: 250px; }
.box b { display: block; font-family: "Plus Jakarta Sans", sans-serif; font-size: 18px; margin-bottom: 4px; }
.box span { font-size: 14px; color: #334155; line-height: 1.4; display: block; }
.box.a2 { background: #ecfeff; border-color: #67e8f9; } .box.a3 { background: #f0fdf4; border-color: #86efac; } .box.a4 { background: #fefce8; border-color: #fde047; }
.box.a5 { background: #faf5ff; border-color: #d8b4fe; min-width: 420px; } .box.a6 { background: #fff7ed; border-color: #fdba74; min-width: 420px; }
.arrow { align-self: center; font-size: 28px; color: #2563eb; font-weight: 700; }
.stack { display: flex; flex-direction: column; gap: 8px; }
.flow { display: flex; gap: 10px; align-items: stretch; flex: 1; } .lane li { font-size: 17px; margin: 10px 0; }
.lane { flex: 1; border-radius: 14px; padding: 22px 22px; color: #fff; }
.lane h3, .lane li { color: #fff; } .lane li::marker { color: #fff; } .lane ol { padding-left: 20px; }
.lane.blue { background: linear-gradient(160deg, #2563eb, #1e40af); } .lane.teal { background: linear-gradient(160deg, #0d9488, #115e59); } .lane.violet { background: linear-gradient(160deg, #7c3aed, #4c1d95); }
.mid { align-self: center; font-size: 30px; color: #64748b; font-weight: 700; }
.pc { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; }
.pc.pros { background: #f0fdf4; border-color: #bbf7d0; } .pc.cons { background: #fef2f2; border-color: #fecaca; }
.road { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.phase { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 18px; border-top: 5px solid #2563eb; }
.phase:nth-child(2) { border-top-color: #0d9488; } .phase:nth-child(3) { border-top-color: #7c3aed; }
.qa { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 24px; }
.qa > div { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 11px 14px; }
.qa b { color: #1d4ed8; font-size: 16px; display: block; margin-bottom: 3px; } .qa p { font-size: 14px; }
/* step slides */
.step { display: grid; grid-template-columns: 3fr 5fr; gap: 28px; height: 100%; }
.step .text { overflow: hidden; }
.kicker { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .09em; margin-bottom: 6px; }
.kicker.blue { color: #2563eb; } .kicker.teal { color: #0d9488; } .kicker.violet { color: #7c3aed; }
.step h2 { font-size: 29px; margin-bottom: 6px; }
.goal { font-size: 15px; color: #475569; margin-bottom: 4px; font-style: italic; }
.step li { font-size: 14px; margin: 3px 0; } .step .small { font-size: 13px; } .step .say { font-size: 14px; }
.shots { display: flex; flex-direction: column; justify-content: center; gap: 12px; }
.shots.two .browser { flex: 1 1 0; min-height: 0; }
.browser { margin: 0; border-radius: 10px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 10px 28px rgba(15,23,42,.18); background: #fff; display: flex; flex-direction: column; }
.browser .bar { height: 20px; background: #e2e8f0; display: flex; align-items: center; gap: 5px; padding-left: 10px; flex: none; }
.browser .bar i { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; display: block; }
.browser img { width: 100%; display: block; object-fit: cover; object-position: top left; min-height: 0; }
.shots:not(.two) .browser img { height: auto; }
.shots.two .browser img { height: 100%; flex: 1 1 0; }
.browser figcaption { font-size: 11px; text-align: center; padding: 4px; color: #64748b; background: #f8fafc; }
/* roomy text-only slides */
.roomy li { font-size: 18px; margin: 6px 0; } .roomy table { font-size: 17px; } .roomy td { padding: 12px 14px; } .roomy th { font-size: 14px; padding: 12px 14px; } .roomy table.compact { font-size: 16px; } .roomy .qa p { font-size: 16px; } .roomy .qa b { font-size: 18px; } .roomy .qa { gap: 18px 26px; align-content: start; } .roomy .qa > div { padding: 16px 18px; } .roomy .pc li { font-size: 16.5px; margin: 4px 0; } .roomy .phase li { font-size: 16.5px; margin: 6px 0; } .roomy .card p { font-size: 17px; } .roomy .say { font-size: 16.5px; } .roomy h4 { font-size: 14px; } .roomy .note { font-size: 16px; } .roomy pre { font-size: 16px; }
/* dark slides */
.dark { background: linear-gradient(135deg, #0b1b3a 0%, #1e3a8a 60%, #0d9488 130%); color: #fff; }
.dark h1 { color: #fff; } .dark .lead { color: #dbeafe; }
.cover { margin: auto 0; text-align: left; }
.cover .logo { height: 58px; margin-bottom: 28px; }
.cover h1 { font-size: 78px; font-weight: 800; line-height: 1; margin-bottom: 16px; }
.cover .lead { font-size: 24px; line-height: 1.4; max-width: 820px; }
.cover .pills { display: flex; gap: 10px; margin-top: 28px; flex-wrap: wrap; }
.cover .pills span { padding: 8px 16px; border-radius: 999px; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.28); font-size: 14px; font-weight: 600; }
.cover .meta { margin-top: 26px; color: #bfdbfe; font-size: 14px; }
.divider { margin: auto 0; max-width: 940px; }
.divider .big { font-family: "Plus Jakarta Sans", sans-serif; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: .25em; padding: 6px 14px; border-radius: 999px; display: inline-block; background: rgba(255,255,255,.16); margin-bottom: 18px; }
.divider h1 { font-size: 58px; font-weight: 800; line-height: 1.05; margin-bottom: 14px; }
.divider .lead { font-size: 21px; line-height: 1.45; margin-bottom: 20px; }
.goalbox { background: rgba(255,255,255,.12); border-left: 4px solid #fff; padding: 12px 16px; border-radius: 6px; font-size: 16px; line-height: 1.45; color: #fff; margin-bottom: 22px; }
.goalbox b { color: #fff; }
.divider .steps { display: flex; flex-wrap: wrap; gap: 8px; }
.divider .steps span { background: rgba(255,255,255,.14); border-radius: 999px; padding: 6px 14px 6px 8px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.divider .steps em { font-style: normal; width: 22px; height: 22px; border-radius: 50%; background: #fff; color: #0b1b3a; display: grid; place-items: center; font-size: 12px; font-weight: 800; }
.divider.blue .big { background: #2563eb; } .divider.teal .big { background: #0d9488; } .divider.violet .big { background: #7c3aed; }
.slide.dark:has(.divider.teal) { background: linear-gradient(135deg, #042f2e 0%, #115e59 70%, #0d9488 140%); }
.slide.dark:has(.divider.violet) { background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 70%, #7c3aed 140%); }
`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>Medisynix — User Journey Presentation</title><style>${css}</style></head><body>${slides.join("\n")}</body></html>`;
fs.writeFileSync(path.join(dir, "index.html"), html);
console.log(`Wrote ${slides.length} slides to docs/presentation/index.html`);
