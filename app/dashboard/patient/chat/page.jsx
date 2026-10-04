import { redirect } from "next/navigation";

// The messaging mock-up was removed: patients talk to the AI Doctor or book a visit instead
export default function Page() {
  redirect("/dashboard/patient/ai-doctor");
}
