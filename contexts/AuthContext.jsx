// "use client";

// import { createContext, useState, useContext, useEffect } from "react";
// import { useRouter, usePathname } from "next/navigation";

// // Create authentication context
// const AuthContext = createContext();

// // Custom hook to use auth context
// export const useAuth = () => useContext(AuthContext);

// export const AuthProvider = ({ children }) => {
//   const router = useRouter();
//   const pathname = usePathname();
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Check if there's an existing user session in localStorage on initial load
//   useEffect(() => {
//     const storedUser = localStorage.getItem("medisynix_user");
//     if (storedUser) {
//       setUser(JSON.parse(storedUser));
//     }
//     setLoading(false);
//   }, []);

//   // Check routing based on user type
//   useEffect(() => {
//     // Only run after initial load
//     if (loading) return;

//     // Public routes that don't require authentication
//     const publicRoutes = [
//       "/",
//       "/login",
//       "/register",
//       "/forgot-password",
//       "/reset-password",
//       "/job-description",
//       "/white-paper",
//       "/nda-doc",
//     ];
//     const isPublicRoute = publicRoutes.some(
//       (route) => pathname === route || pathname.startsWith(route + "?")
//     );

//     console.log(pathname, "pathname");

//     // If no user and on a protected route, redirect to login
//     if (!user && !isPublicRoute) {
//       router.push("/login");
//       return;
//     }

//     // If logged in user is on the wrong dashboard type
//     if (user) {
//       const inPatientDashboard = pathname.startsWith("/dashboard/patient");
//       const inDoctorDashboard = pathname.startsWith("/dashboard/doctor");
//       const inAdminDashboard = pathname.startsWith("/dashboard/admin");

//       // Redirect if wrong dashboard
//       if (user.type === "patient" && (inDoctorDashboard || inAdminDashboard)) {
//         router.push("/dashboard/patient");
//       } else if (
//         user.type === "doctor" &&
//         (inPatientDashboard || inAdminDashboard)
//       ) {
//         router.push("/dashboard/doctor");
//       } else if (
//         user.type === "admin" &&
//         (inPatientDashboard || inDoctorDashboard)
//       ) {
//         router.push("/dashboard/admin");
//       }
//     }
//   }, [user, loading, pathname, router]);

//   // Login function
//   const login = (userData) => {
//     // Make sure we have the token
//     if (!userData.token) {
//       console.error("Login failed: No token provided");
//       return;
//     }

//     // Check if we have existing stored data for this user to preserve
//     let existingUserData = {};
//     const storedUser = localStorage.getItem("medisynix_user");

//     if (storedUser) {
//       try {
//         const parsedData = JSON.parse(storedUser);
//         // Only use stored data if it's for the same user
//         if (
//           parsedData.email === userData.email &&
//           (parsedData.id === userData.id || parsedData._id === userData._id)
//         ) {
//           // Extract health metrics and other data we want to preserve
//           const {
//             bloodPressure,
//             heartRate,
//             glucoseLevel,
//             weight,
//             height,
//             lastMetricsUpdate,
//             healthHistory,
//             appointments,
//             reports,
//             medications,
//             allergies,
//           } = parsedData;

//           // Add these properties to our object if they exist
//           existingUserData = {
//             ...(bloodPressure && { bloodPressure }),
//             ...(heartRate && { heartRate }),
//             ...(glucoseLevel && { glucoseLevel }),
//             ...(weight && { weight }),
//             ...(height && { height }),
//             ...(lastMetricsUpdate && { lastMetricsUpdate }),
//             ...(healthHistory && { healthHistory }),
//             ...(appointments && { appointments }),
//             ...(reports && { reports }),
//             ...(medications && { medications }),
//             ...(allergies && { allergies }),
//           };
//         }
//       } catch (e) {
//         console.error("Error parsing stored user data during login", e);
//       }
//     }

//     // Save user data with token, preserving existing health data
//     const userWithToken = {
//       ...userData,
//       ...existingUserData, // Merge existing data with new login data
//     };

//     setUser(userWithToken);
//     localStorage.setItem("medisynix_user", JSON.stringify(userWithToken));

//     // Redirect based on user type
//     if (userData.type === "patient") {
//       router.push("/dashboard/patient");
//     } else if (userData.type === "doctor") {
//       router.push("/dashboard/doctor");
//     } else if (userData.type === "admin") {
//       router.push("/dashboard/admin");
//     }
//   };

//   // Logout function
//   const logout = () => {
//     setUser(null);
//     localStorage.removeItem("medisynix_user");
//     router.push("/");
//   };

//   // Update user profile
//   const updateProfile = (newUserData) => {
//     try {
//       // Get the latest stored user data first to ensure we have the most up-to-date data
//       const storedUser = localStorage.getItem("medisynix_user");
//       let currentUserData = user;

//       if (storedUser) {
//         try {
//           const parsedData = JSON.parse(storedUser);
//           // Only use stored data if it's for the current user
//           if (parsedData.email === user.email && parsedData.id === user.id) {
//             currentUserData = parsedData;
//           }
//         } catch (e) {
//           console.error("Error parsing stored user data", e);
//         }
//       }

//       // Create a new user object with the updated data
//       const updatedUser = {
//         ...currentUserData,
//         ...newUserData,
//         // Always preserve token to maintain authentication
//         token: user.token,
//       };

//       // Update state and localStorage
//       setUser(updatedUser);
//       localStorage.setItem("medisynix_user", JSON.stringify(updatedUser));

//       // Log success message
//       console.log("Profile updated successfully", updatedUser);

//       return true;
//     } catch (error) {
//       console.error("Error updating profile", error);
//       return false;
//     }
//   };

//   // Get the auth token
//   const getToken = () => {
//     return user?.token;
//   };

//   // Function to make authenticated API requests
//   const authFetch = async (url, options = {}) => {
//     const token = getToken();
//     if (!token) {
//       throw new Error("No authentication token available");
//     }

//     const headers = {
//       ...options.headers,
//       Authorization: `Bearer ${token}`,
//     };

//     const response = await fetch(url, {
//       ...options,
//       headers,
//     });

//     // Handle token expiration
//     if (response.status === 401) {
//       logout();
//       throw new Error("Your session has expired. Please login again.");
//     }

//     return response;
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         loading,
//         login,
//         logout,
//         updateProfile,
//         getToken,
//         authFetch,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export default AuthContext;


"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";

// ============================================================
// AUTHENTICATION CONTEXT
// ============================================================
// Stores the currently logged-in user and provides authentication
// functions to the rest of the application.
// ============================================================
const AuthContext = createContext(null);

// ============================================================
// USE AUTH
// ============================================================
// Custom hook used by components such as Header, Dashboard,
// Profile, LoginForm, etc. to access authentication state.
// ============================================================
export const useAuth = () => {
  return useContext(AuthContext);
};

// ============================================================
// AUTH PROVIDER
// ============================================================
export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  // Currently authenticated user.
  const [user, setUser] = useState(null);

  // True while the application is checking localStorage
  // for an existing login session.
  const [loading, setLoading] = useState(true);

  // ============================================================
  // RESTORE LOGIN SESSION
  // ============================================================
  // Reads the previously saved user from localStorage.
  //
  // This is important because React state is reset when the
  // page is refreshed or when the user navigates to another
  // page.
  //
  // The JWT token is required for the session to be considered
  // valid by the frontend.
  // ============================================================
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("medisynix_user");

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);

        // Only restore the session if the saved object
        // contains a valid authentication token.
        if (
          parsedUser &&
          typeof parsedUser === "object" &&
          parsedUser.token
        ) {
          setUser(parsedUser);
        } else {
          // Remove invalid authentication data.
          localStorage.removeItem("medisynix_user");
        }
      }
    } catch (error) {
      console.error(
        "Error restoring authentication session:",
        error
      );

      // Remove corrupted localStorage data.
      localStorage.removeItem("medisynix_user");
    } finally {
      // Authentication initialization has finished.
      setLoading(false);
    }
  }, []);

  // ============================================================
  // PROTECTED ROUTE CHECK
  // ============================================================
  // Redirects users who are not logged in away from protected
  // pages.
  //
  // Public pages remain accessible without authentication:
  //
  // /
  // /login
  // /register
  // /forgot-password
  // /reset-password
  // /job-description
  // /white-paper
  // /nda-doc
  //
  // IMPORTANT:
  // We wait for "loading" to become false before redirecting.
  // Otherwise, a logged-in user could briefly have user === null
  // while localStorage is being read and could incorrectly be
  // redirected to the login page.
  // ============================================================
  useEffect(() => {
    // Do not perform authentication redirects until the saved
    // session has been checked.
    if (loading) {
      return;
    }

    // ==========================================================
    // PUBLIC ROUTES
    // ==========================================================
    const publicRoutes = [
      "/",
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/auth/callback",
      "/job-description",
      "/white-paper",
      "/nda-doc",
    ];

    // Check whether the current pathname is public.
    //
    // Example:
    // "/"              -> public
    // "/login"         -> public
    // "/register"      -> public
    // "/dashboard/..." -> protected
    const isPublicRoute = publicRoutes.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(`${route}/`)
    );

    // ==========================================================
    // PROTECTED ROUTE
    // ==========================================================
    // If the user is not logged in and attempts to access a
    // protected page, redirect to login.
    // ==========================================================
    if (!user && !isPublicRoute) {
      router.replace("/login");
      return;
    }

    // ==========================================================
    // DASHBOARD ACCESS CONTROL
    // ==========================================================
    // Prevent users from accessing dashboards belonging to
    // another user type.
    // ==========================================================
    if (user) {
      const userType = user.type || user.userType;

      const inPatientDashboard =
        pathname.startsWith("/dashboard/patient");

      const inDoctorDashboard =
        pathname.startsWith("/dashboard/doctor");

      const inAdminDashboard =
        pathname.startsWith("/dashboard/admin");

      // --------------------------------------------------------
      // PATIENT
      // --------------------------------------------------------
      if (
        userType === "patient" &&
        (inDoctorDashboard || inAdminDashboard)
      ) {
        router.replace("/dashboard/patient");
        return;
      }

      // --------------------------------------------------------
      // DOCTOR
      // --------------------------------------------------------
      if (
        userType === "doctor" &&
        (inPatientDashboard || inAdminDashboard)
      ) {
        router.replace("/dashboard/doctor");
        return;
      }

      // --------------------------------------------------------
      // ADMIN
      // --------------------------------------------------------
      if (
        userType === "admin" &&
        (inPatientDashboard || inDoctorDashboard)
      ) {
        router.replace("/dashboard/admin");
        return;
      }
    }
  }, [user, loading, pathname, router]);

  // ============================================================
  // LOGIN
  // ============================================================
  // Saves the authenticated user's information and JWT token
  // in React state and localStorage.
  //
  // localStorage allows the user to remain logged in when they:
  //
  // - Navigate between pages
  // - Refresh the browser
  // - Open another page of the application
  // ============================================================
  const login = useCallback(
    (userData) => {
      // Login response must contain a JWT token.
      if (!userData || !userData.token) {
        console.error(
          "Login failed: No authentication token provided."
        );

        return false;
      }

      try {
        // Read existing user data.
        const storedUser =
          localStorage.getItem("medisynix_user");

        let existingUserData = {};

        if (storedUser) {
          try {
            const parsedData = JSON.parse(storedUser);

            // Get both possible ID formats.
            const existingId =
              parsedData.id || parsedData._id;

            const newUserId =
              userData.id || userData._id;

            // Preserve existing information only if it belongs
            // to the same user.
            if (
              parsedData.email === userData.email &&
              existingId &&
              newUserId &&
              String(existingId) === String(newUserId)
            ) {
              existingUserData = parsedData;
            }
          } catch (error) {
            console.error(
              "Error reading previous user data:",
              error
            );
          }
        }

        // ======================================================
        // CREATE FINAL USER OBJECT
        // ======================================================
        // Fresh login information takes priority over old data.
        // Existing information is preserved where appropriate.
        const userWithToken = {
          ...existingUserData,
          ...userData,

          // Always use the newest authentication token.
          token: userData.token,
        };

        // Save in React state.
        setUser(userWithToken);

        // Save in browser storage.
        localStorage.setItem(
          "medisynix_user",
          JSON.stringify(userWithToken)
        );

        console.log(
          "Login session saved successfully."
        );

        // ======================================================
        // REDIRECT TO USER'S DASHBOARD
        // ======================================================
        const userType =
          userWithToken.type ||
          userWithToken.userType;

        if (userType === "patient") {
          router.replace("/dashboard/patient");
        } else if (userType === "doctor") {
          router.replace("/dashboard/doctor");
        } else if (userType === "admin") {
          router.replace("/dashboard/admin");
        } else {
          console.warn(
            "Login successful, but no valid user type was found."
          );
        }

        return true;
      } catch (error) {
        console.error(
          "Login session error:",
          error
        );

        return false;
      }
    },
    [router]
  );

  // ============================================================
  // LOGOUT
  // ============================================================
  // Removes the current authentication session from both React
  // state and localStorage.
  // ============================================================
  const logout = useCallback(() => {
    setUser(null);

    localStorage.removeItem("medisynix_user");

    // Return the user to the public home page.
    router.replace("/");
  }, [router]);

  // ============================================================
  // UPDATE PROFILE
  // ============================================================
  // Updates the current user's information while preserving
  // the authentication token.
  // ============================================================
  const updateProfile = useCallback(
    (newUserData) => {
      try {
        // There must be a logged-in user.
        if (!user) {
          console.error(
            "Cannot update profile: no logged-in user."
          );

          return false;
        }

        // Create the updated user object.
        const updatedUser = {
          ...user,
          ...newUserData,

          // Never remove the current JWT token.
          token: user.token,
        };

        // Update React state.
        setUser(updatedUser);

        // Update localStorage.
        localStorage.setItem(
          "medisynix_user",
          JSON.stringify(updatedUser)
        );

        console.log(
          "User profile updated successfully."
        );

        return true;
      } catch (error) {
        console.error(
          "Error updating profile:",
          error
        );

        return false;
      }
    },
    [user]
  );

  // ============================================================
  // GET TOKEN
  // ============================================================
  // Returns the JWT token belonging to the currently logged-in
  // user.
  // ============================================================
  const getToken = useCallback(() => {
    return user?.token || null;
  }, [user]);

  // ============================================================
  // AUTHENTICATED FETCH
  // ============================================================
  // Makes an authenticated API request.
  //
  // The JWT token is automatically added to:
  //
  // Authorization: Bearer <token>
  //
  // If the backend returns HTTP 401, the user's session is
  // considered expired/invalid and logout() is called.
  // ============================================================
  const authFetch = useCallback(
    async (url, options = {}) => {
      const token = getToken();

      // Do not make authenticated requests without a token.
      if (!token) {
        throw new Error(
          "No authentication token available."
        );
      }

      // Preserve any headers supplied by the caller.
      const headers = {
        ...options.headers,

        // Add JWT authentication.
        Authorization: `Bearer ${token}`,
      };

      // Only add JSON Content-Type if the caller has not
      // already supplied another Content-Type.
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // ========================================================
      // TOKEN EXPIRED / INVALID
      // ========================================================
      if (response.status === 401) {
        logout();

        throw new Error(
          "Your session has expired. Please login again."
        );
      }

      return response;
    },
    [getToken, logout]
  );

  // ============================================================
  // AUTH CONTEXT VALUE
  // ============================================================
  return (
    <AuthContext.Provider
      value={{
        // Current logged-in user.
        user,

        // True while authentication is being initialized.
        loading,

        // Authentication functions.
        login,
        logout,
        updateProfile,
        getToken,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Export context itself if another part of the application
// needs direct access.
export default AuthContext;