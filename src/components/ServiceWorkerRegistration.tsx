"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator && typeof window !== "undefined") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Successfully registered
        })
        .catch((err) => {
          // Gracefully ignore in development / unsupported environments
        });
    }
  }, []);

  return null;
}
