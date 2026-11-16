import { useEffect, useState } from "react";
import { readStored, writeStored } from "./storage.js";

export function readTheme() {
  return readStored("theme", "dark") === "light" ? "light" : "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === "dark" ? "#0b0b0c" : "#f6f6f2";
    writeStored("theme", theme);
  }, [theme]);

  useEffect(() => {
    const syncTheme = (event) => {
      if (event.key === "jdm:theme" || event.key === null)
        setTheme(readTheme());
    };
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  return [theme, setTheme];
}
