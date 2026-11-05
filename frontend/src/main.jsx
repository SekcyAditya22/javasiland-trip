import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import useCatalog from "./hooks/useCatalog";
import usePreferences from "./hooks/usePreferences";
import SiteLayout from "./layouts/SiteLayout";
import HomePage from "./pages/HomePage";
import PackagesPage from "./pages/PackagesPage";
import RentalPage from "./pages/RentalPage";
import PackageDetailPage from "./pages/PackageDetailPage";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import BookingPage from "./pages/BookingPage";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminRoute from "./components/admin/AdminRoute";
import PageLoading from "./components/PageLoading";
import CatalogError from "./components/CatalogError";
import NotFoundPage from "./pages/NotFoundPage";
import BlogPage from "./pages/BlogPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import MotionProvider from "./components/MotionProvider";
import NavigationScrollManager from "./components/NavigationScrollManager";
import "./styles.css";
import "./styles/motion.css";
import "./styles/carousel.css";
import "./styles/gallery-editor.css";
import "./styles/notifications.css";
import "./styles/page-states.css";
import "./styles/blog.css";
import "./styles/admin-blog.css";
import "./styles/media-editor.css";
import "./styles/homepage-catalog.css";

function App() {
  const { catalog, loading, error, retry } = useCatalog();
  const { pathname } = useLocation();
  const preferences = usePreferences();
  const publicPage = (page, dataRequired = true) => (
    <SiteLayout
      lang={preferences.lang}
      preferences={preferences}
      showWelcome={dataRequired && pathname === "/" && !loading && !error}
    >
      {dataRequired && loading ? (
        <main>
          <PageLoading
            lang={preferences.lang}
            detail={/^\/(packages|malaysia|vehicle|book)\/[^/]+/.test(pathname)}
          />
        </main>
      ) : dataRequired && error ? (
        <CatalogError lang={preferences.lang} retry={retry} />
      ) : (
        page
      )}
    </SiteLayout>
  );
  return (
    <Routes>
      <Route
        path="/blog"
        element={publicPage(<BlogPage lang={preferences.lang} />, false)}
      />
      <Route
        path="/blog/:slug"
        element={publicPage(<BlogDetailPage lang={preferences.lang} />, false)}
      />
      <Route path="/login-admin" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminRoute />} />
      <Route
        path="/"
        element={publicPage(
          <HomePage catalog={catalog} lang={preferences.lang} />,
        )}
      />
      <Route
        path="/packages"
        element={publicPage(
          <PackagesPage catalog={catalog} lang={preferences.lang} />,
        )}
      />
      <Route
        path="/packages/:id"
        element={publicPage(
          <PackageDetailPage catalog={catalog} lang={preferences.lang} />,
        )}
      />
      <Route
        path="/malaysia"
        element={publicPage(
          <PackagesPage
            catalog={catalog}
            lang={preferences.lang}
            malaysiaOnly
          />,
        )}
      />
      <Route
        path="/malaysia/:id"
        element={publicPage(
          <PackageDetailPage
            catalog={catalog}
            lang={preferences.lang}
            malaysia
          />,
        )}
      />
      <Route
        path="/rental"
        element={publicPage(
          <RentalPage catalog={catalog} lang={preferences.lang} />,
        )}
      />
      <Route
        path="/vehicle/:id"
        element={publicPage(
          <VehicleDetailPage catalog={catalog} lang={preferences.lang} />,
        )}
      />
      <Route
        path="/book/:id"
        element={publicPage(
          <BookingPage catalog={catalog} lang={preferences.lang} />,
        )}
      />
      <Route
        path="*"
        element={publicPage(<NotFoundPage lang={preferences.lang} />, false)}
      />
    </Routes>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MotionProvider>
      <BrowserRouter>
        <NavigationScrollManager />
        <App />
      </BrowserRouter>
    </MotionProvider>
  </React.StrictMode>,
);
