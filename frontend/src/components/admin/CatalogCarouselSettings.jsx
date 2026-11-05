import CarouselPlaybackFields from "./CarouselPlaybackFields";

export default function CatalogCarouselSettings({ form, update }) {
  return (
    <div className="catalog-playback-grid">
      <CarouselPlaybackFields
        title="Carousel gambar"
        label="Gambar"
        description={`Atur foto di dalam kartu dan halaman detail. Pengaturan ini berlaku di homepage dan katalog${form.kind === "packages" ? ", termasuk paket Malaysia" : " armada"}.`}
        enabled={form.imageAutoPlay}
        seconds={form.imageIntervalSeconds}
        min={2}
        max={60}
        onModeChange={(value) => update("imageAutoPlay", value)}
        onSecondsChange={(value) => update("imageIntervalSeconds", value)}
      />
      <CarouselPlaybackFields
        title="Pergantian kartu homepage"
        label="Kartu homepage"
        description="Ganti tiga kartu paket atau armada secara bergiliran dari daftar pilihan. Kartu Lihat lainnya tetap tersedia."
        enabled={form.rotateItems}
        seconds={form.rotationIntervalSeconds}
        min={5}
        max={120}
        manualHint="Tiga kartu pertama tetap tampil; pergantian kartu otomatis dimatikan."
        onModeChange={(value) => update("rotateItems", value)}
        onSecondsChange={(value) => update("rotationIntervalSeconds", value)}
      />
    </div>
  );
}
