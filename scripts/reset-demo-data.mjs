// Restores the known-good demo data (docs/demo-data-backup -> data/) and moves the appointment
// dates so the story works on the day you run it:
//   - the two "demo-day" visits for Dr. Sarah Johnson are scheduled for TODAY (so "Complete" works)
//   - everything else keeps its distance from the original snapshot date
// Usage: npm run demo:reset
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backup = path.join(root, "docs", "demo-data-backup");
const data = path.join(root, "data");
const SNAPSHOT_DAY = "2026-10-04"; // the day the backup was taken

const dayNumber = (iso) => Math.round(Date.parse(iso + "T00:00:00Z") / 86400000);
const isoFromDay = (n) => new Date(n * 86400000).toISOString().slice(0, 10);
const today = new Date().toLocaleDateString("en-CA"); // local date, YYYY-MM-DD
const shift = dayNumber(today) - dayNumber(SNAPSHOT_DAY);

for (const file of fs.readdirSync(backup).filter((f) => f.endsWith(".json"))) {
  fs.copyFileSync(path.join(backup, file), path.join(data, file));
}
fs.rmSync(path.join(data, "contact_messages.json"), { force: true });

const file = path.join(data, "appointments.json");
const appointments = JSON.parse(fs.readFileSync(file, "utf8"));
for (const a of appointments) {
  if (String(a.id).startsWith("apt-demo-")) {
    a.date = today; // visits the doctor can complete during the demo
  } else if (a.date) {
    a.date = isoFromDay(dayNumber(a.date) + shift);
  }
}
fs.writeFileSync(file, JSON.stringify(appointments, null, 2));

console.log(`Demo data restored. Today is ${today} (shifted dates by ${shift} day(s)).`);
console.log("Dr. Sarah Johnson now has 2 visits today; Ayesha Khan can book from tomorrow.");
