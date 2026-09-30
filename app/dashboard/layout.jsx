import DashboardLayout from "../../components/DashboardLayout";

export const metadata = {
  title: "Dashboard - Medisynix",
  description: "Access your Medisynix healthcare dashboard",
};

export default function DashboardRootLayout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
