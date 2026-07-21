import { createContext, useContext, useEffect, useState, useCallback } from "react";
import client from "../api/client";
import { requestPushPermission } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("sitetrack_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await client.get("/users/me");
      setUser(res.data);
      
      // NEW: Silently request push permissions and save the token to the database
      if (res.data.role !== "admin") {
         const fcmToken = await requestPushPermission();
         if (fcmToken) {
            await client.post("/users/me/fcm-token", { token: fcmToken });
         }
      }
      
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  async function login(username, password) {
    const res = await client.post("/auth/login", { username, password });
    localStorage.setItem("sitetrack_token", res.data.access_token);
    localStorage.setItem("sitetrack_role", res.data.role);
    await fetchMe();
    return res.data;
  }

  function logout() {
    localStorage.removeItem("sitetrack_token");
    localStorage.removeItem("sitetrack_role");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, refresh: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
