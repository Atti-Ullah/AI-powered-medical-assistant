"use client";

import DashboardLayout from "../../../components/DashboardLayout";
import DoctorDashboardContent from "../../../components/DoctorDashboardContent";

export default function DoctorDashboardPage() {
  // DashboardLayout shows a loading state and redirects if nobody is signed in
  return (
    <DashboardLayout>
      <DoctorDashboardContent />
    </DashboardLayout>
  );
}
