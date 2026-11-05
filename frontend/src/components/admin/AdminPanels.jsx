export function StatCards({ stats }) {
  return (
    <div className="admin-stats">
      {[
        ["packages", "Paket aktif"],
        ["fleet", "Unit armada"],
        ["pending", "Menunggu konfirmasi"],
        ["totalBookings", "Total booking"],
      ].map(([key, label]) => (
        <div className="admin-stat" key={key}>
          <strong>{stats[key] || 0}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function BookingTable({ bookings, onConfirm, confirmingId }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Pelanggan</th>
            <th>Paket</th>
            <th>Tanggal</th>
            <th>Pax</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {bookings.length ? (
            bookings.map((booking) => (
              <tr key={booking.id}>
                <td>
                  <strong>{booking.name || "-"}</strong>
                  <br />
                  <small>{booking.phone || "-"}</small>
                </td>
                <td>{booking.packageTitle || booking.packageId || "-"}</td>
                <td>{booking.date || "-"}</td>
                <td>{booking.pax || "-"}</td>
                <td>
                  <span
                    className={
                      booking.status === "CONFIRMED" ? "status ok" : "status"
                    }
                  >
                    {booking.status}
                  </span>
                </td>
                <td>
                  <button
                    className="small-btn primary"
                    disabled={
                      booking.status === "CONFIRMED" ||
                      confirmingId === booking.id
                    }
                    onClick={() => onConfirm(booking.id)}
                  >
                    {confirmingId === booking.id
                      ? "Menyimpan..."
                      : booking.status === "CONFIRMED"
                        ? "Selesai"
                        : "Konfirmasi"}
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="empty-cell">
                Belum ada permintaan booking.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardPanel({ data, onConfirm, confirmingId }) {
  return (
    <>
      <div className="admin-welcome">
        <p className="section-kicker">OWNER CONTROL</p>
        <h1>Selamat datang kembali.</h1>
        <p>
          Kelola katalog dan periksa permintaan booking dari satu dashboard.
        </p>
      </div>
      <StatCards stats={data.stats} />
      <section className="admin-card">
        <div className="section-head">
          <div>
            <p className="section-kicker">BOOKING INBOX</p>
            <h2>Permintaan terbaru</h2>
          </div>
        </div>
        <BookingTable
          bookings={data.bookings.slice(0, 8)}
          onConfirm={onConfirm}
          confirmingId={confirmingId}
        />
      </section>
    </>
  );
}

export function PackagesPanel({ packages }) {
  return (
    <section className="admin-card">
      <div className="section-head">
        <div>
          <p className="section-kicker">CATALOG</p>
          <h2>Paket Trip</h2>
          <p>Data paket yang tampil dari database MySQL.</p>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Paket</th>
              <th>Area</th>
              <th>Durasi</th>
              <th>Harga mulai</th>
              <th>Varian</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.title}</strong>
                  <br />
                  <small>{item.tag || "Paket aktif"}</small>
                </td>
                <td>{item.area}</td>
                <td>{item.duration} hari</td>
                <td>
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  }).format(item.price || 0)}
                </td>
                <td>{item.variantDetails?.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function FleetPanel({ fleet }) {
  return (
    <section className="admin-card">
      <div className="section-head">
        <div>
          <p className="section-kicker">FLEET</p>
          <h2>Unit Armada</h2>
          <p>Armada dan tarif yang tersedia untuk booking.</p>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Unit</th>
              <th>Tipe</th>
              <th>Kapasitas</th>
              <th>Transmisi</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fleet.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.name}</strong>
                </td>
                <td>{item.type}</td>
                <td>{item.capacity} pax</td>
                <td>{item.transmission || "-"}</td>
                <td>
                  <span className="status ok">{item.status || "idle"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function SimpleDataPanel({ tab, catalog }) {
  const config = {
    promos: [
      "PROMO",
      "Promo tersimpan",
      catalog.promos || [],
      ["title", "discount_type", "active"],
    ],
    faqs: [
      "CONTENT",
      "FAQ",
      catalog.faqs || [],
      ["question", "category", "published"],
    ],
    homepage: [
      "CONTENT",
      "Konten Homepage",
      catalog.homepage || [],
      ["sectionKey", "title", "visible"],
    ],
  }[tab];
  if (!config)
    return (
      <section className="admin-card">
        <p className="section-kicker">SOCIAL PROOF</p>
        <h2>Review pelanggan</h2>
        <p className="empty-cell">Belum ada review yang tersimpan.</p>
      </section>
    );
  const [kicker, title, rows, columns] = config;
  return (
    <section className="admin-card">
      <div className="section-head">
        <div>
          <p className="section-kicker">{kicker}</p>
          <h2>{title}</h2>
          <p>Data dibaca langsung dari database MySQL.</p>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={row.id || row.sectionKey || index}>
                  {columns.map((column) => (
                    <td key={column}>{String(row[column] ?? "-")}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="empty-cell">
                  Belum ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function SettingsPanel({ catalog }) {
  return (
    <section className="admin-card">
      <p className="section-kicker">CONFIGURATION</p>
      <h2>Settings</h2>
      <p>Informasi koneksi aplikasi aktif.</p>
      <div className="admin-settings-grid">
        <div>
          <span>Database</span>
          <strong>MySQL · javaisland</strong>
        </div>
        <div>
          <span>API</span>
          <strong>Express + Prisma</strong>
        </div>
        <div>
          <span>Packages</span>
          <strong>{catalog.packages.length} data aktif</strong>
        </div>
        <div>
          <span>Fleet</span>
          <strong>{catalog.fleet.length} unit aktif</strong>
        </div>
      </div>
    </section>
  );
}
