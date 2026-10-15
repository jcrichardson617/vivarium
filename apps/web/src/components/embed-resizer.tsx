"use client";

import { useEffect } from "react";

// Tells the host page how tall the embed is so its iframe can fit the content.
export function EmbedResizer() {
  useEffect(() => {
    const send = () => window.parent?.postMessage({ reptilyticsHeight: document.documentElement.scrollHeight }, "*");
    const observer = new ResizeObserver(send);
    observer.observe(document.body);
    send();
    return () => observer.disconnect();
  }, []);
  return null;
}
