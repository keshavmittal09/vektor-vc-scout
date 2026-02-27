import "../styles/globals.css";
import { useState, useEffect } from "react";

export default function App({ Component, pageProps }) {
  const [theme, setTheme] = useState("dark");

  // Load saved theme preference
  useEffect(() => {
    const saved = localStorage.getItem("vk_theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
  }, []);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("vk_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  return <Component {...pageProps} theme={theme} toggleTheme={toggleTheme} />;
}
