import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

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

export default function RequireOnboarding({ children }) {
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const { accessToken } = loadTokens();
        const res = await fetch(`${API_BASE}/api/ml/onboarding-status`, {
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });
        const data = await res.json();
        if (!mounted) return;
        setCompleted(!!data.completed);
      } catch (e) {
        console.error("onboarding-status error:", e);
        setCompleted(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Đang kiểm tra hồ sơ học viên...
      </div>
    );
  }

  if (!completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
