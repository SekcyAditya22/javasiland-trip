import { useState } from "react";
import { useLocation } from "react-router-dom";
import PageTransition from "../components/PageTransition";
import Header from "../components/site/Header";
import Footer from "../components/site/Footer";
import SettingsModal from "../components/site/SettingsModal";
import WelcomeGate from "../components/site/WelcomeGate";

export default function SiteLayout({
  children,
  lang,
  preferences,
  showWelcome = true,
}) {
  const [settings, setSettings] = useState(false);
  const { pathname } = useLocation();
  return (
    <>
      <Header lang={lang} onSettings={() => setSettings(true)} />
      <PageTransition transitionKey={pathname}>{children}</PageTransition>
      <Footer lang={lang} />
      {settings && (
        <SettingsModal {...preferences} close={() => setSettings(false)} />
      )}
      {showWelcome && !preferences.region && (
        <WelcomeGate chooseRegion={preferences.chooseRegion} />
      )}
    </>
  );
}
