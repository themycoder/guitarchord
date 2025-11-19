import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

const API_BASE =
  (typeof window !== "undefined" && window.__API_BASE__) ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000";

function loadTokens() {
  try {
    return JSON.parse(localStorage.getItem("auth_tokens_v1") || "{}");
  } catch {
    return {};
  }
}

export default function RequireAuth({ children }) {
  const loc = useLocation();
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const { accessToken } = loadTokens();
        if (!accessToken) {
          setOk(false);
          return;
        }
        const res = await fetch(`${API_BASE}/api/profile/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setOk(res.ok);
      } catch {
        setOk(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    check();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Đang xác thực phiên đăng nhập...
      </div>
    );
  }

  if (!ok) {
    const redirect = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
}
