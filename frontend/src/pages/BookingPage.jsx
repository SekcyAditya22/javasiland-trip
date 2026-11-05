import { translate } from "../lib/i18n";
import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, ChevronLeft } from "lucide-react";
import PageHero from "../components/PageHero";
import { api } from "../lib/api";
import { isMalaysia, money, priceFor, titleOf } from "../lib/catalog";
import NotFoundPage from "./NotFoundPage";
import ScrollReveal from "../components/ScrollReveal";
import BackLink from "../components/BackLink";

export default function BookingPage({ catalog, lang }) {
  const t = (text) => translate(lang, text);
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const item = catalog.packages.find(
    (entry) => entry.id === id || entry.slug === id,
  );
  const requestedVariant = searchParams.get("variant");
  const variant = requestedVariant
    ? item?.variantDetails?.find(
        (entry) => String(entry.id) === requestedVariant,
      )
    : item?.variantDetails?.[0];
  const invalidVariant =
    requestedVariant &&
    !variant &&
    !(requestedVariant === "default" && !item?.variantDetails?.length);
  const malaysia = isMalaysia(item);
  const [form, setForm] = useState({
    pax: malaysia ? 4 : 2,
    name: "",
    phone: "",
    email: "",
    date: "",
    pickup: "",
    notes: "",
    serviceType: "driver_only",
    vehicleId: "",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const update = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  if (!item || invalidVariant) return <NotFoundPage lang={lang} />;
  const paxOptions = variant?.priceTiers?.length
    ? variant.priceTiers.map((tier) => Number(tier.pax))
    : malaysia
      ? [4, 5, 6, 7, 8, 9, 10]
      : [2, 3, 4, 5, 6, 7, 8, 9, 10];
  const perPax =
    priceFor(variant || item, Number(form.pax)) ||
    priceFor(item, Number(form.pax));
  const estimatedTotal = perPax * Number(form.pax);
  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setMessage(t("Menyimpan booking..."));
    try {
      await api.inquiry({
        ...form,
        pax: Number(form.pax),
        packageId: item.id,
        packageTitle: titleOf(item, lang),
        variantId: variant?.id,
        variantTitle: variant?.title || "",
        locale: lang,
        audience: malaysia ? "international" : "local",
      });
      setMessage(
        t("Booking tersimpan. Owner akan menghubungi Anda melalui WhatsApp."),
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <main>
      <PageHero
        back={
          <BackLink
            className="back-link"
            to={`${malaysia ? "/malaysia" : "/packages"}/${item.id}${variant ? `?variant=${variant.id}` : ""}`}
          >
            <ChevronLeft size={16} />
            {lang === "en" ? "Back to trip details" : "Kembali ke detail paket"}
          </BackLink>
        }
        kicker="JAVA ISLAND TRIP · BOOKING"
        title={
          lang === "en" ? "Send a booking request" : "Kirim permintaan booking"
        }
        desc={`${titleOf(item, lang)} · ${(lang === "en" ? variant?.enTitle || variant?.title : variant?.title) || t("Pilihan perjalanan")}`}
      />
      <ScrollReveal as="section" className="booking-section">
        <form className="booking-form" onSubmit={submit}>
          <div className="booking-summary">
            <p className="section-kicker">{t("Ringkasan booking")}</p>
            <h2>{titleOf(item, lang)}</h2>
            <p>
              {item.area} · {item.duration} {t("hari")}
            </p>
            <strong>
              {estimatedTotal > 0
                ? money(
                    malaysia
                      ? Math.round(estimatedTotal / 3550)
                      : estimatedTotal,
                    malaysia ? "MYR" : "IDR",
                  )
                : t("Harga dikonfirmasi Owner")}
            </strong>
          </div>
          <div className="form-grid">
            {[
              ["name", t("Nama lengkap"), "text"],
              ["phone", t("Nomor WhatsApp"), "tel"],
              ["email", t("Email (opsional)"), "email"],
              ["date", t("Tanggal perjalanan"), "date"],
              ["pickup", t("Titik jemput"), "text"],
            ].map(([name, label, type]) => (
              <label
                className={name === "pickup" ? "field full" : "field"}
                key={name}
              >
                {label}
                <input
                  name={name}
                  type={type}
                  value={form[name]}
                  onChange={update}
                  required={["name", "phone", "date"].includes(name)}
                />
              </label>
            ))}
            <label className="field">
              {t("Jumlah peserta")}
              <select name="pax" value={form.pax} onChange={update}>
                {paxOptions.map((value) => (
                  <option value={value} key={value}>
                    {value} pax
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              {t("Model layanan")}
              <select
                name="serviceType"
                value={form.serviceType}
                onChange={update}
              >
                <option value="driver_only">{t("Mobil + driver")}</option>
                <option value="driver_fuel">{t("Driver + BBM")}</option>
                <option value="all_in">{t("Paket All-In")}</option>
              </select>
            </label>
            <label className="field full">
              {t("Catatan tambahan")}
              <textarea
                name="notes"
                rows="4"
                value={form.notes}
                onChange={update}
              />
            </label>
            <div className="field full">
              <button
                className="button button-block"
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting
                  ? t("Menyimpan booking...")
                  : t("Kirim permintaan booking")}{" "}
                <ArrowRight size={16} />
              </button>
              {message && (
                <p className="form-message" role="status">
                  {message}
                </p>
              )}
            </div>
          </div>
        </form>
      </ScrollReveal>
    </main>
  );
}
