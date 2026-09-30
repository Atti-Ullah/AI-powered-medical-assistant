"use client";

import { createContext, useContext, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import NotificationBell from "./NotificationBell";
import Logo, { LogoMark } from "./Logo";
import {
  Bars3Icon,
  XMarkIcon,
  Squares2X2Icon,
  UserCircleIcon,
  UsersIcon,
  HeartIcon,
  MagnifyingGlassCircleIcon,
  SparklesIcon,
  FolderOpenIcon,
  ChatBubbleLeftRightIcon,
  ChartBarSquareIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ShieldCheckIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";

const userTypeNavigation = {
  patient: [
    { name: "Dashboard", href: "/dashboard/patient", icon: Squares2X2Icon },
    { name: "Health Profile", href: "/dashboard/patient/profile", icon: HeartIcon },
    { name: "Find a Doctor", href: "/dashboard/patient/find-doctor", icon: MagnifyingGlassCircleIcon },
    { name: "AI Doctor", href: "/dashboard/patient/ai-doctor", icon: SparklesIcon },
    { name: "Medical Records", href: "/dashboard/patient/records", icon: FolderOpenIcon },
    { name: "Consultations", href: "/dashboard/patient/consultations", icon: ChatBubbleLeftRightIcon },
    { name: "Analytics", href: "/dashboard/patient/analytics", icon: ChartBarSquareIcon },
  ],
  doctor: [
    { name: "Dashboard", href: "/dashboard/doctor", icon: Squares2X2Icon },
    { name: "Profile", href: "/dashboard/doctor/profile", icon: UserCircleIcon },
    { name: "Patients", href: "/dashboard/doctor/patients", icon: UsersIcon },
    { name: "Consultations", href: "/dashboard/doctor/consultations", icon: ChatBubbleLeftRightIcon },
    { name: "AI Analysis", href: "/dashboard/doctor/ai-analysis", icon: SparklesIcon },
    { name: "Analytics", href: "/dashboard/doctor/analytics", icon: ChartBarSquareIcon },
  ],
  admin: [
    { name: "Dashboard", href: "/dashboard/admin", icon: Squares2X2Icon },
    { name: "Users", href: "/dashboard/admin/users", icon: UsersIcon },
    { name: "Reports", href: "/dashboard/admin/reports", icon: DocumentChartBarIcon },
    { name: "Analytics", href: "/dashboard/admin/analytics", icon: ChartBarSquareIcon },
    { name: "Alerts", href: "/dashboard/admin/alerts", icon: BellAlertIcon },
    { name: "Security", href: "/dashboard/admin/security", icon: ShieldCheckIcon },
    { name: "Settings", href: "/dashboard/admin/settings", icon: Cog6ToothIcon },
  ],
};

// Set once the shell is mounted so nested DashboardLayout wrappers do not render a second one
const ShellContext = createContext(false);

const ROLE_LABELS = { patient: "Patient", doctor: "Doctor", admin: "Administrator" };
const STORAGE_KEY = "medisynix_sidebar_collapsed";

function BrandMark({ collapsed }) {
  return (
    <span className="flex items-center">
      {collapsed ? (
        <LogoMark className="h-9 w-9" variant="light" />
      ) : (
        <Logo className="h-9" variant="light" />
      )}
    </span>
  );
}

function DashboardShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Remember the sidebar state between visits
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // storage unavailable
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // storage unavailable
      }
      return next;
    });
  };

  // Close the mobile drawer after navigating
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Keep users on their own dashboard
  const userType = user?.type;
  const dashboardPrefix = `/dashboard/${userType}`;
  const onWrongDashboard = !!user && !pathname.startsWith(dashboardPrefix);
  useEffect(() => {
    if (onWrongDashboard) router.push(dashboardPrefix);
  }, [onWrongDashboard, dashboardPrefix, router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600"></div>
          <p className="mt-4 text-sm text-slate-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }
  if (onWrongDashboard) return null;

  const navigation = userTypeNavigation[userType] || [];
  const isActive = (href) =>
    href === dashboardPrefix ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const activeItem = navigation.find((item) => isActive(item.href));
  // Pages outside the sidebar (e.g. Profile) are titled from their URL
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "";
  const pageTitle =
    activeItem?.name ||
    (lastSegment && lastSegment !== userType ? lastSegment.replace(/-/g, " ").replace(/w/g, (c) => c.toUpperCase()) : "Dashboard");
  const displayName = user.name || ROLE_LABELS[userType] || "User";

  const renderNav = (isCollapsed) => (
    <nav className="flex flex-1 flex-col px-3 py-4" aria-label="Main navigation">
      {!isCollapsed && (
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Menu</p>
      )}
      <ul className="space-y-1">
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isCollapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-primary-600 text-white shadow-md shadow-primary-900/30"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`}
                  aria-hidden="true"
                />
                {isCollapsed ? <span className="sr-only">{item.name}</span> : <span className="truncate">{item.name}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={logout}
          title={isCollapsed ? "Logout" : undefined}
          className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-red-500/10 hover:text-red-300 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <ArrowRightStartOnRectangleIcon className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-red-300" aria-hidden="true" />
          {isCollapsed ? <span className="sr-only">Logout</span> : "Logout"}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`} role={mobileOpen ? "dialog" : undefined} aria-modal={mobileOpen ? "true" : undefined} aria-hidden={!mobileOpen}>
        <div
          className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-slate-900 transition-transform duration-300 ease-in-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between px-5">
            <BrandMark collapsed={false} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          {renderNav(false)}
        </aside>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col bg-slate-900 transition-[width] duration-300 ease-in-out lg:flex ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        <div className={`flex h-16 shrink-0 items-center border-b border-white/10 ${collapsed ? "justify-center px-2" : "px-5"}`}>
          <Link href={dashboardPrefix} aria-label="Medisynix home">
            <BrandMark collapsed={collapsed} />
          </Link>
        </div>
        {renderNav(collapsed)}
      </aside>

      {/* Main column */}
      <div className={`transition-[padding] duration-300 ease-in-out ${collapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-expanded={mobileOpen}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:inline-flex"
          >
            {collapsed ? (
              <ChevronDoubleRightIcon className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDoubleLeftIcon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{pageTitle}</p>
            <p className="hidden truncate text-xs text-slate-500 sm:block">{ROLE_LABELS[userType]} workspace</p>
          </div>

          <NotificationBell user={user} />

          <div className="h-6 w-px bg-slate-200" aria-hidden="true" />

          <Link
            href={`/dashboard/${userType}/profile`}
            className="flex items-center gap-3 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-slate-100"
          >
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-semibold text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="hidden text-left leading-tight sm:block">
              <span className="block max-w-[10rem] truncate text-sm font-semibold text-slate-900">{displayName}</span>
              <span className="block text-xs text-slate-500">{ROLE_LABELS[userType]}</span>
            </span>
          </Link>
        </header>

        <main className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

// Renders the dashboard shell once; pages that still wrap themselves in it simply pass through
export default function DashboardLayout({ children }) {
  const insideShell = useContext(ShellContext);
  if (insideShell) return children;
  return (
    <ShellContext.Provider value={true}>
      <DashboardShell>{children}</DashboardShell>
    </ShellContext.Provider>
  );
}
