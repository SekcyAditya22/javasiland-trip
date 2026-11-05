const arrayToLines = (value) =>
  (Array.isArray(value) ? value : []).filter(Boolean).join("\n");

export const linesToArray = (value) =>
  String(value || "")
    .split(/\r?\n/)
    .map((entry) => entry.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);

const tiersToLines = (tiers) =>
  (Array.isArray(tiers) ? tiers : [])
    .map((tier) => `${tier.pax}: ${tier.price}`)
    .join("\n");

const linesToTiers = (value) =>
  linesToArray(value)
    .map((line) => {
      const [paxValue, priceValue] = line.split(/\s*[:=|,]\s*/, 2);
      const pax = Number(String(paxValue || "").replace(/\D/g, ""));
      const price = Number(String(priceValue || "").replace(/\D/g, ""));
      return { pax, price, season: "normal" };
    })
    .filter((tier) => tier.pax > 0 && tier.price >= 0);

export function nextVariantCode(variants) {
  const used = new Set(
    variants.map((variant) => String(variant.code).trim().toUpperCase()),
  );
  let index = 0;
  let code;
  do {
    code = index < 26 ? String.fromCharCode(65 + index) : `V${index + 1}`;
    index += 1;
  } while (used.has(code));
  return code;
}

export const createVariantDraft = (variant = {}, fallback = {}) => ({
  ...variant,
  code: variant.code || fallback.code || "A",
  title: variant.title || fallback.title || "Paket utama",
  enTitle:
    variant.enTitle ||
    fallback.enTitle ||
    variant.title ||
    fallback.title ||
    "Main package",
  subtitle: variant.subtitle || fallback.trail || "",
  enSubtitle: variant.enSubtitle || fallback.trail || "",
  heroImage: variant.heroImage || fallback.image || "",
  active: variant.active !== false,
  priceTiersText: tiersToLines(variant.priceTiers || fallback.priceTiers),
  galleryText: arrayToLines(variant.gallery),
  itineraryText: arrayToLines(variant.itinerary),
  enItineraryText: arrayToLines(variant.enItinerary),
  includeText: arrayToLines(variant.include),
  enIncludeText: arrayToLines(variant.enInclude),
  excludeText: arrayToLines(variant.exclude),
  enExcludeText: arrayToLines(variant.enExclude),
  noteText: variant.note || "",
  enNoteText: variant.enNote || "",
});

export const createEmptyPackageForm = () => ({
  id: "",
  slug: "",
  title: "",
  enTitle: "",
  area: "Jogja",
  duration: 1,
  price: 0,
  tag: "",
  trail: "",
  theme: "culture",
  image: "",
  gallery: [],
  desc: "",
  enDesc: "",
  status: "PUBLISHED",
  variantDrafts: [createVariantDraft()],
});

export function packageToForm(item) {
  if (!item) return createEmptyPackageForm();
  const variants = Array.isArray(item.variantDetails)
    ? item.variantDetails
    : [
        {
          code: "A",
          title: item.title,
          enTitle: item.enTitle,
          priceTiers: item.priceTiers,
        },
      ];
  return {
    ...createEmptyPackageForm(),
    ...item,
    variantDrafts: variants.map((variant) => createVariantDraft(variant, item)),
  };
}

const draftToVariant = (draft, fallback, image) => ({
  id: draft.id,
  code: draft.code || "A",
  title: draft.title || fallback.title || "Paket utama",
  enTitle:
    draft.enTitle || fallback.enTitle || fallback.title || "Main package",
  subtitle: draft.subtitle || fallback.trail || "",
  enSubtitle: draft.enSubtitle || fallback.trail || "",
  heroImage: draft.heroImage || image,
  gallery: linesToArray(draft.galleryText),
  itinerary: linesToArray(draft.itineraryText),
  enItinerary: linesToArray(draft.enItineraryText),
  include: linesToArray(draft.includeText),
  enInclude: linesToArray(draft.enIncludeText),
  exclude: linesToArray(draft.excludeText),
  enExclude: linesToArray(draft.enExcludeText),
  note: draft.noteText || "",
  enNote: draft.enNoteText || "",
  active: draft.active !== false,
  priceTiers: linesToTiers(draft.priceTiersText),
});

export function packageFormToPayload(form, image) {
  const {
    variantDrafts,
    variantDetails: _variantDetails,
    ...packageFields
  } = form;
  const variants = (variantDrafts ?? [createVariantDraft({}, form)]).map(
    (draft) => draftToVariant(draft, form, image),
  );
  const priceTiers = variants[0]?.priceTiers || [];

  return {
    ...packageFields,
    id: form.id || undefined,
    slug: form.slug || form.id || undefined,
    image,
    duration: Number(form.duration),
    price: Number(form.price),
    priceTiers,
    variantDetails: variants,
  };
}
