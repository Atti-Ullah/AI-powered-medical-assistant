// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import Image from "next/image";
// import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
// import { useAuth } from "../contexts/AuthContext";

// export default function Header() {
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   // Add a fallback if useAuth() is not available
//   const auth = useAuth() || { user: null, logout: () => {} };
//   const { user, logout } = auth;

//   // Define different navigation options based on user type
//   const getNavigation = () => {
//     const defaultNav = [
//       { name: "Home", href: "/" },
//       { name: "Features", href: "/#features" },
//       { name: "Testimonials", href: "/#testimonials" },
//       { name: "Contact", href: "/#contact" },
//       { name: "Documents", href: "/#documents" },
//     ];

//     // If user is logged in, add dashboard link specific to their type
//     if (user) {
//       return [
//         ...defaultNav,
//         { name: "Dashboard", href: `/dashboard/${user.type}` },
//       ];
//     }

//     return defaultNav;
//   };

//   const navigation = getNavigation();

//   // Handle logo click - prevent logout if user is already logged in
//   const handleLogoClick = (e) => {
//     if (user) {
//       e.preventDefault();
//       window.location.href = `/dashboard/${user.type}`;
//     }
//   };

//   return (
//     <header className="bg-white shadow">
//       <nav
//         className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
//         aria-label="Global"
//       >
//         <div className="flex lg:flex-1">
//           <Link
//             href={user ? `/dashboard/${user.type}` : "/"}
//             className="-m-1.5 p-1.5 flex items-center"
//           >
//             <Image
//               src="/images/logo.png"
//               alt="Medisynix Logo"
//               width={300}
//               height={90}
//               className="h-20 w-auto"
//               priority
//             />
//           </Link>
//         </div>
//         <div className="flex lg:hidden">
//           <button
//             type="button"
//             className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
//             onClick={() => setMobileMenuOpen(true)}
//           >
//             <span className="sr-only">Open main menu</span>
//             <Bars3Icon className="h-6 w-6" aria-hidden="true" />
//           </button>
//         </div>
//         <div className="hidden lg:flex lg:gap-x-12">
//           {navigation.map((item) => (
//             <Link
//               key={item.name}
//               href={item.href}
//               className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600"
//             >
//               {item.name}
//             </Link>
//           ))}
//         </div>
//         <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-6">
//           {user ? (
//             <>
//               <Link
//                 href={`/dashboard/${user.type}/profile`}
//                 className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600"
//               >
//                 Profile
//               </Link>
//               <button
//                 onClick={logout}
//                 className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600"
//               >
//                 Logout
//               </button>
//             </>
//           ) : (
//             <>
//               <Link
//                 href="/login"
//                 className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600"
//               >
//                 Log in
//               </Link>
//               <Link
//                 href="/register"
//                 className="rounded-md bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
//               >
//                 Get started
//               </Link>
//             </>
//           )}
//         </div>
//       </nav>

//       {/* Mobile menu */}
//       <div
//         className={`lg:hidden ${mobileMenuOpen ? "block" : "hidden"}`}
//         role="dialog"
//         aria-modal="true"
//       >
//         <div className="fixed inset-0 z-50"></div>
//         <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
//           <div className="flex items-center justify-between">
//             <Link href="#" className="-m-1.5 p-1.5">
//               <Image
//                 src="/images/logo.png"
//                 alt="Medisynix Logo"
//                 width={260}
//                 height={80}
//                 className="h-16 w-auto"
//                 priority
//               />
//             </Link>
//             <button
//               type="button"
//               className="-m-2.5 rounded-md p-2.5 text-gray-700"
//               onClick={() => setMobileMenuOpen(false)}
//             >
//               <span className="sr-only">Close menu</span>
//               <XMarkIcon className="h-6 w-6" aria-hidden="true" />
//             </button>
//           </div>
//           <div className="mt-6 flow-root">
//             <div className="-my-6 divide-y divide-gray-500/10">
//               <div className="space-y-2 py-6">
//                 {navigation.map((item) => (
//                   <Link
//                     key={item.name}
//                     href={item.href}
//                     className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
//                     onClick={() => setMobileMenuOpen(false)}
//                   >
//                     {item.name}
//                   </Link>
//                 ))}
//               </div>
//               <div className="py-6">
//                 {user ? (
//                   <>
//                     <Link
//                       href={`/dashboard/${user.type}/profile`}
//                       className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
//                       onClick={() => setMobileMenuOpen(false)}
//                     >
//                       Profile
//                     </Link>
//                     <button
//                       onClick={() => {
//                         logout();
//                         setMobileMenuOpen(false);
//                       }}
//                       className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 w-full text-left"
//                     >
//                       Logout
//                     </button>
//                   </>
//                 ) : (
//                   <>
//                     <Link
//                       href="/login"
//                       className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
//                       onClick={() => setMobileMenuOpen(false)}
//                     >
//                       Log in
//                     </Link>
//                     <Link
//                       href="/register"
//                       className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
//                       onClick={() => setMobileMenuOpen(false)}
//                     >
//                       Sign up
//                     </Link>
//                   </>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// }







"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import { cancelSmoothScroll, smoothScrollTo, smoothScrollToElement } from "../lib/smooth-scroll";

// Plain nav link with an underline that slides in from the left on hover
const navLink =
  "relative text-sm font-semibold leading-6 text-gray-900 transition-colors duration-200 hover:text-blue-600 " +
  "after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 " +
  "after:rounded-full after:bg-blue-600 after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100";

const textButton =
  "text-sm font-semibold leading-6 text-gray-900 transition-colors duration-200 hover:text-blue-600";

const ctaButton =
  "rounded-md bg-blue-600 px-3.5 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm " +
  "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-md active:translate-y-0";

const mobileLink =
  "-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 transition-colors duration-200 hover:bg-gray-50 hover:text-blue-600";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Compact bar: shrinks while scrolling down, grows back while scrolling up or at the top
  const [compact, setCompact] = useState(false);
  const auth = useAuth() || { user: null, logout: () => {} };
  const { user, logout } = auth;

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY;

      if (y < 24) {
        setCompact(false);
        lastY = y;
      } else if (Math.abs(delta) > 6) {
        // Ignore tiny jitters so the bar doesn't flicker between sizes
        setCompact(delta > 0);
        lastY = y;
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Smooth, eased scrolling for every same-page link (navbar, hero buttons, footer). Registered in the
  // capture phase and calls preventDefault, which makes Next's <Link> skip its own instant navigation.
  useEffect(() => {
    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      let url;
      try {
        url = new URL(link.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;

      if (url.hash && url.hash !== "#") {
        const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
        if (!target) return;
        event.preventDefault();
        smoothScrollToElement(target);
        window.history.pushState(null, "", url.pathname + url.search + url.hash);
      } else if (!url.hash && url.search === window.location.search && url.pathname === "/") {
        // "Home" while already on the home page: glide back to the top
        event.preventDefault();
        smoothScrollTo(0);
        window.history.pushState(null, "", url.pathname + url.search);
      }
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      cancelSmoothScroll();
    };
  }, []);

  // Define different navigation options based on user type
  const getNavigation = () => {
    const defaultNav = [
      { name: "Home", href: "/" },
      { name: "Features", href: "/#features" },
      { name: "How It Works", href: "/#how-it-works" },
      { name: "Contact", href: "/#contact" },
    ];

    // If user is logged in, add dashboard link specific to their type
    if (user) {
      return [
        ...defaultNav,
        { name: "Dashboard", href: `/dashboard/${user.type}` },
      ];
    }

    return defaultNav;
  };

  const navigation = getNavigation();

  return (
    <>
      {/* Fixed bar + constant-height spacer: the bar can change size without moving the page, which
          would otherwise trigger scroll anchoring and flip the compact state back and forth.
          No backdrop-filter on the bar: it would become the containing block for the fixed mobile menu. */}
      <div aria-hidden="true" className="h-16 sm:h-[72px]" />
    <header
      className={`fixed inset-x-0 top-0 z-40 bg-white transition-shadow duration-300 ease-out ${
        compact ? "shadow-md" : "shadow-sm"
      }`}
    >
      <nav
        className={`mx-auto flex max-w-7xl items-center justify-between px-6 transition-[padding] duration-300 ease-out lg:px-8 ${
          compact ? "py-2.5" : "py-4"
        }`}
      >
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link
            href={user ? `/dashboard/${user.type}` : "/"}
            className="-m-1.5 flex items-center p-1.5 transition-transform duration-200 ease-out hover:scale-[1.03]"
          >
            <Logo
              className={`transition-[height] duration-300 ease-out ${
                compact ? "h-7 sm:h-8" : "h-8 sm:h-10"
              }`}
              priority
            />
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 transition-colors duration-200 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        {/* Desktop nav - all links in a row */}
        <div className="hidden lg:flex lg:items-center lg:gap-x-10">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} className={navLink}>
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:gap-x-6">
          {user ? (
            <>
              <Link href={`/dashboard/${user.type}/profile`} className={textButton}>
                Profile
              </Link>
              <button onClick={logout} className={textButton}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={textButton}>
                Log in
              </Link>
              <Link href="/register" className={ctaButton}>
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile menu: the overlay fades in and the panel slides in from the right each time it opens */}
      <div className={`lg:hidden ${mobileMenuOpen ? "block" : "hidden"}`}>
        <div className="menu-overlay-enter fixed inset-0 z-50 bg-gray-500 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
        <div className="menu-panel-enter fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 shadow-xl sm:max-w-sm">
          <div className="flex items-center justify-between">
            <Link href={user ? `/dashboard/${user.type}` : "/"} className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
              <Logo className="h-9 sm:h-10" />
            </Link>
            <button
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-gray-700 transition-colors duration-200 hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href} className={mobileLink} onClick={() => setMobileMenuOpen(false)}>
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6">
                {user ? (
                  <>
                    <Link href={`/dashboard/${user.type}/profile`} className={mobileLink} onClick={() => setMobileMenuOpen(false)}>
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className={`${mobileLink} w-full text-left`}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className={mobileLink} onClick={() => setMobileMenuOpen(false)}>
                      Log in
                    </Link>
                    <Link href="/register" className={mobileLink} onClick={() => setMobileMenuOpen(false)}>
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
    </>
  );
}
