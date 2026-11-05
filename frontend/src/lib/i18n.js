// Fixed interface copy is translated locally. Editorial content comes from its
// English fields in the catalog, with Indonesian as the fallback.
const english = {
  "Kembali ke daftar paket": "Back to packages",
  "Paket tidak ditemukan atau belum tersedia.":
    "This package is unavailable or could not be found.",
  "Galeri paket": "Package gallery",
  "Lihat gambar": "View image",
  hari: "days",
  "Minimal 4 pax": "Minimum 4 guests",
  "Pilih varian trip": "Choose a trip option",
  "Mulai dari": "From",
  "Sesuai request": "Price on request",
  "Jumlah peserta": "Number of guests",
  "Estimasi total": "Estimated total",
  "Tanya & booking": "Enquire & book",
  "DETAIL PERJALANAN": "TRIP DETAILS",
  "Informasi utama perjalanan disusun ringkas agar mudah dipahami sebelum mengirim permintaan booking.":
    "Review the itinerary, inclusions, and prices before sending your booking request.",
  Itinerary: "Itinerary",
  "Fasilitas paket": "Package inclusions",
  Termasuk: "Included",
  "Tidak termasuk": "Not included",
  "Harga per peserta": "Price per guest",
  "Catatan sebelum booking": "Before you book",
  "Harga akhir dan ketersediaan perjalanan dikonfirmasi oleh Owner melalui WhatsApp setelah permintaan booking diterima.":
    "Our team will confirm the final price and availability via WhatsApp after receiving your booking request.",
  "Penjemputan dan perjalanan menuju destinasi":
    "Pickup and transfer to your destination",
  "Eksplorasi utama bersama tim lokal":
    "Explore the highlights with our local team",
  "Kembali dengan pengalaman dan cerita baru":
    "Return with new memories and stories",
  "Kendaraan private dan driver": "Private vehicle and driver",
  "Air mineral": "Drinking water",
  "Pengeluaran pribadi": "Personal expenses",
  "Kebutuhan di luar paket": "Services outside the package",
  "Lihat semua paket": "View all packages",
  "Lihat paket": "View packages",
  "Lihat detail": "View details",
  "Lihat pilihan": "Explore options",
  "PROMO MUSIM INI": "SEASONAL OFFERS",
  "Perjalanan yang tinggal lebih lama.": "Journeys that stay with you.",
  "Booking tersimpan sebelum dikonfirmasi Owner.":
    "Our team will review and confirm your booking request.",
  "CATATAN BOOKING": "BOOKING INFORMATION",
  "Booking disimpan sebelum dikonfirmasi.":
    "Send a request. We will take care of the details.",
  "Permintaan booking tersimpan di database, diperiksa Owner, lalu dilanjutkan melalui WhatsApp.":
    "Our team will review your request and contact you via WhatsApp to confirm the details.",
  "Rute terkurasi dengan itinerary dan kalkulator instan.":
    "Curated routes with detailed itineraries and instant price estimates.",
  "Armada terawat dengan driver untuk perjalanan pribadi.":
    "Well-maintained vehicles with a driver for your private journey.",
  "Pilih pengalaman yang paling sesuai dengan caramu menjelajah Jawa.":
    "Find an experience that suits your way of exploring Java.",
  "Pendakian gunung yang dikurasi untuk tamu Malaysia — harga dalam RM, minimal 4 peserta.":
    "Mountain adventures curated for Malaysian guests. Prices in RM, with a minimum of 4 guests.",
  "Kendaraan dengan driver yang terawat dan tim yang siap membantu.":
    "Well-maintained vehicles, experienced drivers, and a team ready to help.",
  Semua: "All",
  Kembali: "Back",
  "Data belum tersedia.": "No information available yet.",
  Kapasitas: "Capacity",
  Transmisi: "Transmission",
  "Harga 12 jam": "12-hour rates",
  "Mobil + driver": "Vehicle + driver",
  "Driver + BBM": "Driver + fuel",
  "Paket All-In": "All-inclusive package",
  "Ringkasan booking": "Booking summary",
  "Harga dikonfirmasi Owner": "Price confirmed by our team",
  "Nama lengkap": "Full name",
  "Nomor WhatsApp": "WhatsApp number",
  "Email (opsional)": "Email (optional)",
  "Tanggal perjalanan": "Travel date",
  "Titik jemput": "Pickup location",
  "Model layanan": "Service type",
  "Catatan tambahan": "Additional notes",
  "Kirim permintaan booking": "Send a booking request",
  "Menyimpan booking...": "Sending your booking request…",
  "Booking tersimpan. Owner akan menghubungi Anda melalui WhatsApp.":
    "Your request has been saved. Our team will contact you via WhatsApp.",
  "Pilihan perjalanan": "Trip option",
  "Paket Trip": "Trip Packages",
  "Rental Mobil": "Car Rental",
  Pengaturan: "Settings",
  Tutup: "Close",
  "Syarat & Ketentuan | Kebijakan Privasi":
    "Terms & Conditions | Privacy Policy",
};

export const translate = (lang, text) =>
  lang === "en" ? english[text] || text : text;

export const localizedList = (variant, key, lang, fallback = []) => {
  const translatedKey = `en${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  const translated = variant?.[translatedKey];
  const original = variant?.[key];
  const source = lang === "en" && translated?.length ? translated : original;
  return source?.length
    ? source
    : fallback.map((text) => translate(lang, text));
};
