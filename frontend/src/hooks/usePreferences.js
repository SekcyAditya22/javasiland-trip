import { useEffect, useState } from "react";

export default function usePreferences() {
  const [langMode, setLangMode] = useState(() => {
    const saved = localStorage.getItem("jit_lang");
    return ["id", "en"].includes(saved) ? saved : "auto";
  });
  const [browserLang, setBrowserLang] = useState(() =>
    navigator.language?.startsWith("id") ? "id" : "en",
  );
  const lang = langMode === "auto" ? browserLang : langMode;
  useEffect(() => {
    const sync = () =>
      setBrowserLang(navigator.language?.startsWith("id") ? "id" : "en");
    window.addEventListener("languagechange", sync);
    return () => window.removeEventListener("languagechange", sync);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const [region, setRegion] = useState(() =>
    localStorage.getItem("jit_region"),
  );
  const chooseRegion = (value) => {
    setRegion(value);
    localStorage.setItem("jit_region", value);
  };
  const chooseLang = (value) => {
    setLangMode(value);
    if (value === "auto") localStorage.removeItem("jit_lang");
    else localStorage.setItem("jit_lang", value);
  };
  return { lang, langMode, region, chooseRegion, chooseLang };
}
