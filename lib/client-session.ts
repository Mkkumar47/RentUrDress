"use client";

export function clearClientSessionStorage() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.clear();
  window.sessionStorage.clear();
}
