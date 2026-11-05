export default function WelcomeGate({ chooseRegion }) {
  return (
    <div className="modal-backdrop">
      <section className="welcome-modal">
        <div className="welcome-mark">✦</div>
        <p className="section-kicker">
          <span lang="id">MULAI PERJALANANMU</span>
          <br />
          <span lang="en">START YOUR JOURNEY</span>
        </p>
        <h2>
          <span lang="id">Selamat datang!</span> <em lang="en">Welcome!</em>
        </h2>
        <p>
          <span lang="id">
            Pilih wilayah Anda untuk melihat harga yang sesuai.
          </span>
          <br />
          <i lang="en">Choose your region to see the applicable prices.</i>
        </p>
        <div className="region-grid">
          <button type="button" onClick={() => chooseRegion("id")}>
            <span>🇮🇩</span>
            <strong>Indonesia</strong>
            <small lang="id">Harga IDR · Bahasa Indonesia</small>
            <small lang="en">Prices in IDR · Indonesian</small>
          </button>
          <button type="button" onClick={() => chooseRegion("my")}>
            <span>🇲🇾</span>
            <strong>Malaysia</strong>
            <small lang="id">Harga RM · Bahasa Inggris</small>
            <small lang="en">Prices in RM · English</small>
          </button>
        </div>
        <small className="welcome-note">
          <span lang="id">
            Anda bisa mengubah pilihan kapan saja melalui ikon pengaturan.
          </span>
          <br />
          <i lang="en">
            You can change your selection anytime using the settings icon.
          </i>
        </small>
      </section>
    </div>
  );
}
