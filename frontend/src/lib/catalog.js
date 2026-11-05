export const PHONE = "6287839456221";
export const isMalaysia = (item) =>
  String(item?.area || "")
    .toLowerCase()
    .includes("malaysia");
export const titleOf = (item, lang) =>
  lang === "en" ? item.enTitle || item.title : item.title;
export const descOf = (item, lang) =>
  lang === "en" ? item.enDesc || item.desc : item.desc;
export const money = (value, currency = "IDR") =>
  new Intl.NumberFormat(currency === "MYR" ? "en-MY" : "id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
export const priceFor = (item, pax = 4) =>
  (item?.priceTiers || []).find((tier) => Number(tier.pax) === Number(pax))
    ?.price ||
  item?.price ||
  0;
