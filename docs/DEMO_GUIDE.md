# Medisynix: Demo Guide

Everything you need to run the demonstration, in plain language. The slide version is [Medisynix_Demo_Presentation.pdf](Medisynix_Demo_Presentation.pdf) (47 slides, 16:9). Full role journeys: [Patient](PATIENT_USER_JOURNEY.md) · [Doctor](DOCTOR_USER_JOURNEY.md) · [Admin](ADMIN_USER_JOURNEY.md).

## 1. Get ready (the day before and the morning of)

```bash
npm run demo:reset   # restores the known-good demo data, dated for today
npm run build        # once, about a minute
npm start            # http://localhost:3000
```

- To prepare the night before, run `npm run demo:reset -- --date 2026-10-05` (use the demo day's date). Visits then count as "today" on that day, with no internet needed.
- Or run `npm run demo:reset` **on the morning of the demo**: it schedules two visits for Dr. Sarah Johnson on that day, so "Complete visit" works live.
- MongoDB is not needed. The app uses local files when the database is not running (the admin Security page says so honestly).
- Internet is needed for the AI Doctor chat and the fonts.
- Do not click **Google / GitHub** sign-in: the OAuth keys are not set. Use e-mail and password.

### Demo accounts

| Role | E-mail | Password |
|---|---|---|
| Patient | `ayesha.khan@demo.medisynix.test` | `Demo@1234` |
| Doctor | `dr.sarah@medisynix.com` | `doctor123` |
| Admin | `admin@medisynix.com` | `admin123` |

On the login page choose the matching tab (Patient / Doctor / Admin) first.

### Three logins at once

The app keeps one login per browser address. Use **`localhost:3000`** for the patient, **`127.0.0.1:3000`** for the doctor and a **private (incognito) window** for the admin, so you can switch between roles without logging out.

## 2. The 15-minute script

### Minute 0–2: the idea
> "Medisynix is an AI-powered medical assistant. Many people in Pakistan cannot easily reach a doctor and find medical reports confusing. We built one place where a patient can understand their health and book care, a doctor can manage the day, and an administrator keeps the system safe."

Show slides 4–8 (problem, solution, architecture, what is real, big picture).

### Minute 2–7: patient (Ayesha)
1. **Landing page** → scroll Features, How it works → **Log in** → Patient → sign in.
2. **Dashboard:** "Her blood pressure is 152/96 and it is flagged High in red."
3. **Find a Doctor** → type `cardio` → **View Profile** (Dr. Sarah Johnson) → pick the first date and a time → **Book Appointment** → add a reason → confirm. Open **Appointments** to show it under Upcoming.
4. **AI Doctor** → **Select General AI Doctor** → ask: *"I have a fever and a sore throat since two days. What should I do?"* (real language model).
5. **Symptom Checker** → tap fever, cough, headache → **Check symptoms**. Then clear and tap chest pain + shortness of breath → red emergency alert.
6. **Upload report:** Dashboard → **Upload Report** → Lab test report → CBC → attach any image → **Upload and analyze** → show the plain-language summary, the table and the confidence + reasoning panel → **Open Medical Records**.
7. **Consultations** → open the completed visit: "This is what her doctor wrote."
8. **Logout** (or just switch window).

### Minute 7–10: doctor (Dr. Sarah)
1. Log in (Doctor tab). **Dashboard:** counters, Today's schedule, Needs attention, the bell shows Ayesha's new booking.
2. **Patients** → Ayesha Khan → vitals, flags, medicines, records.
3. **AI Analysis** → High priority tile → "rule-based screening, it tells the doctor where to look first".
4. **Consultations** → Today → **Complete** → diagnosis + notes → **Mark completed**.
5. (Optional) **Profile**: show the time slots the patients can book.

### Minute 10–12: admin (Mohsin)
1. Log in (Admin tab). **Dashboard**, **System Status**.
2. **Users** → **Add New User** (show the weak-password message, then a valid one) → search → do not confirm delete.
3. **Security** → "two checks are red on this laptop: the default admin password and MongoDB. In production both are fixed."
4. **Reports** → download the CSV.

### Minute 12–15: market, pros and cons, future
Show slides 34–42: competitors, what makes us different, pros and cons, limitations, roadmap, go-to-market, impact. Finish on the Q&A slides.

## 3. Things to say before anyone asks

- The **AI Doctor chat is a real language model**. The **symptom checker** and **vitals screening** are transparent rules. The **report explainer** is a prototype that shows the experience we will connect to a medical model next.
- Everything is **information, not diagnosis**. A doctor stays in charge.
- It is **not clinically validated** yet; that is step one of the roadmap.

## 4. If something goes wrong

| Problem | Do this |
|---|---|
| A page shows an error | Press F5. If it keeps happening, stop `npm start`, run it again |
| AI chat is blank or slow | Check internet, click **Start New Chat**, or show the screenshot slide |
| "Invalid credentials" | Pick the right role tab on the login page |
| The doctor has no visits today | `npm run demo:reset` and refresh |
| Data looks messy after rehearsing | `npm run demo:reset` |
| Port 3000 is busy | Close the old terminal or `npm start -- -p 3001` |
| Everything fails | Use the slide deck: every step has a real screenshot |

## 5. What was checked before the demo

- 49 end-to-end API checks across all three roles (login, booking rules, vitals validation, records, medicines, consultations, doctor and admin actions, role guards, contact form): all pass.
- Every page of every role loads with no console errors, no failed requests and no horizontal overflow at desktop (1440 px) and phone (375 px) widths.
- Production build (`npm run build`) completes without errors.

## 6. Fixes made during this preparation

- Symptom checker rewritten (plain "cough" no longer triggers a "coughing blood" emergency alert; empty entries no longer match everything).
- Medications "Remove" now actually deletes; records page rebuilt; the dashboard's reports link works.
- Removed invented AI statistics and fake ratings/reviews; every claim on screen now matches what the app does.
- Profile details (phone, date of birth, gender, blood type, allergies, conditions) now return from the server on login, so a new browser or laptop shows them.
- Booking date logic uses the local day (no off-by-one near midnight); appointment and profile pages use proper messages instead of browser alerts.
- Vitals validation on the server; duplicate history entries fixed.
- Landing page: headline spacing, copy that over-claimed, missing site manifest (404), blank placeholder pages now redirect home.
- Doctor profile page: empty "Certifications / Services" boxes hidden and the top bar reads "Doctor Profile".
- Admin dashboard table no longer overflows on phones.
- Added `npm run demo:reset` to restore clean demo data.
