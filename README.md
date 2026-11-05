# JAVA ISLAND TRIP — React + Express

Project ini sekarang dibagi menjadi dua aplikasi:

- `frontend/`: React + Vite + Tailwind, termasuk route publik dan `/login-admin`.
- `backend/`: Express API modular untuk katalog, quote, booking, dan autentikasi admin.

Struktur frontend menggunakan pemisahan tanggung jawab:

```text
frontend/src/
|-- components/   # komponen UI reusable
|   |-- admin/    # shell, tabel, modal, dan form admin
|   |-- home/     # hero, service cards, FAQ
|   `-- site/     # header, footer, modal publik
|-- data/         # fallback katalog
|-- hooks/        # state dan data fetching React
|-- layouts/      # shell halaman publik
|-- lib/          # API client, formatter, dan helper form
`-- pages/        # halaman publik dan admin
    `-- admin/    # dashboard dan panel CRUD admin
```

`src/main.jsx` hanya menangani bootstrap aplikasi dan routing.

## Menjalankan

```bash
npm install
npm install --prefix frontend
npm install --prefix backend
npm run dev
```

Buka `http://localhost:4172`. API berjalan di `http://localhost:4173`.

Konfigurasi frontend berada di `frontend/.env`, sedangkan konfigurasi API, MySQL, CORS, dan cookie berada di `backend/.env`. Setelah mengubah nilai `.env`, restart proses Vite dan backend.

Untuk menjalankan keduanya melalui PM2:

```bash
npm run pm2:start
npm run pm2:logs
```

Konfigurasi `ecosystem.config.cjs` menjalankan `npm run dev` pada folder frontend dan backend sebagai dua proses terpisah. Perintah pengelolaannya:

```bash
npm run pm2:restart
npm run pm2:stop
```

Cloudflare Tunnel diarahkan ke origin lokal berikut:

```text
trip.peachypunk.icu      -> http://127.0.0.1:4172
trip-back.peachypunk.icu -> http://127.0.0.1:4173
```

`COOKIE_SECURE=auto` membuat cookie admin tetap berfungsi melalui HTTP localhost dan otomatis memakai Secure ketika request datang dari HTTPS Cloudflare.

## Login admin

Buka `http://localhost:4172/login-admin`.

Default development credential:

- Username: `admin`
- Password: `admin123`

`ADMIN_USERNAME` dan `ADMIN_PASSWORD` digunakan saat seed awal. Untuk akun yang sudah tersimpan, ubah password melalui menu **Users**; mengubah `.env` tidak mereset password akun yang sudah ada.

## MySQL + Prisma

Backend memakai Prisma ORM dengan MySQL database `javaisland`. Konfigurasi lokal menggunakan user `root` tanpa password melalui `backend/.env`. File SQLite lama di folder `data/` tetap dibiarkan dan tidak digunakan oleh backend baru.

Setelah MySQL/MariaDB aktif, sinkronkan schema dan seed katalog:

```bash
npm run db:setup --prefix backend
```

Perintah tersebut menjalankan `prisma generate`, `prisma db push`, seed data katalog dan admin, lalu mengimpor katalog dari `trip/trip.txt`.

Untuk mengimpor ulang isi `trip/trip.txt` tanpa melakukan seed ulang:

```bash
npm run trip:import --prefix backend
```

Import bersifat idempotent untuk paket yang berasal dari file tersebut. Paket Jogja A-H, Sunrise Magelang, Sunrise Dieng, harga per pax, dan fasilitas perjalanan akan diperbarui di MySQL.

## Production

```bash
npm run build
NODE_ENV=production npm start
```

Express akan menyajikan hasil build `frontend/dist` ketika `NODE_ENV=production`.

## Admin CRUD dan gambar

Dashboard admin memiliki CRUD untuk paket trip, varian, itinerary, harga per pax, armada, promo, FAQ, dan konten homepage. Gambar bisa memakai URL atau di-upload melalui endpoint admin lalu disimpan di `backend/uploads/` dan tersedia melalui `/uploads/...`.

Modal tambah/edit Paket Trip dan Unit Armada memiliki **Galeri & carousel**. Upload beberapa JPG/PNG/WebP sekaligus (maksimal 1 MB per gambar) atau tambahkan URL. Gambar pertama menjadi sampul; gunakan tombol bintang untuk memilih sampul, panah untuk mengurutkan, dan hapus untuk mengeluarkan gambar dari galeri. Klik Simpan untuk menerapkan perubahan.

Galeri tersimpan di kolom JSON `Package.gallery` dan `Vehicle.gallery`. Untuk instalasi lain yang sudah memiliki database, hentikan backend sementara, jalankan `npm run prisma:push --prefix backend`, lalu jalankan kembali backend. Penambahan kolom ini tidak memerlukan seed ulang.

Kartu di homepage, daftar paket, dan daftar rental menggunakan carousel yang sama. Pergantian otomatis setiap 5 detik hanya berjalan pada kartu yang terlihat; berhenti saat hover/fokus, tab browser tidak aktif, atau Reduce Motion aktif. Panah, indikator gambar, tombol jeda/putar, dan swipe tersedia. Halaman detail menampilkan seluruh thumbnail yang dapat dipilih dan tidak memutar otomatis. Galeri khusus varian paket tetap digunakan bersama galeri paket.

Uji penyimpanan galeri dan publikasi katalog (memerlukan MySQL aktif): masuk ke folder `backend`, lalu jalankan `node --test tests/gallery.test.js`.

Landing page, login admin, dan dashboard admin menggunakan mode terang sebagai satu-satunya tema.

Halaman customer menampilkan skeleton selama katalog dimuat. Permintaan katalog dibatasi 12 detik, lalu menampilkan tombol Coba kembali jika gagal; data contoh tidak ditampilkan sebagai pengganti katalog asli. URL yang tidak dikenal serta ID paket, kendaraan, atau varian booking yang tidak tersedia menampilkan halaman 404 dengan tautan kembali ke beranda dan daftar paket.

Gambar menggunakan placeholder dengan ukuran tetap selama dimuat dan tampilan pengganti jika gagal. Gambar Unsplash memakai ukuran responsif, thumbnail 160px, kualitas 75, dan format otomatis. Gambar utama detail dan hero mendapat prioritas; carousel memulai hitungan pergantian setelah gambar selesai dan menyiapkan hanya satu gambar berikutnya saat terlihat. Preload tidak dijalankan pada mode hemat data atau koneksi 2G. File upload memakai cache browser 7 hari dengan ETag; nama file baru yang unik membuat penggantian foto tetap tampil sebagai file baru.

Hasil tambah/edit/hapus di dashboard ditampilkan sebagai notifikasi di pojok kanan atas. Notifikasi sukses hilang setelah 4 detik dan kesalahan setelah 6 detik; waktu dihentikan saat notifikasi diarahkan pointer atau difokuskan. Notifikasi dapat ditutup manual dan tidak menggeser tata letak halaman.

Pada form paket, pilih tab varian lalu klik **Hapus varian** dan konfirmasi. Penghapusan diterapkan setelah **Simpan paket**. Varian terakhir juga dapat dihapus; daftar kosong tetap kosong saat form dibuka kembali. Varian baru memakai kode yang belum digunakan, dan varian yang dipertahankan tetap menggunakan ID yang sama agar hubungan booking tidak terputus.

## Pengguna admin dan bahasa

Menu **Users** tersedia untuk role Owner. Owner dapat menambah, mengubah username/password/role/status, serta menghapus pengguna melalui modal konfirmasi. Role Admin dapat mengelola konten dan booking tanpa akses pengelolaan pengguna. Akun sendiri tidak dapat dihapus, dinonaktifkan, atau diturunkan menjadi Admin. Setiap perubahan akun mencabut sesi login akun tersebut. Password disimpan sebagai hash bcrypt dan tidak dikirim pada API daftar pengguna.

Halaman `/admin` memeriksa sesi sebelum merender dashboard sehingga pengunjung yang belum login langsung diarahkan ke `/login-admin` tanpa kilasan sidebar atau kartu dashboard.

Pengaturan bahasa customer memiliki Auto (mengikuti bahasa browser), Indonesia, dan English. Teks UI memakai terjemahan lokal dalam `frontend/src/lib/i18n.js`. Konten editorial memakai field English di form paket, varian, itinerary, fasilitas, catatan, FAQ, promo, dan homepage. Jika English kosong, konten Indonesia tetap ditampilkan. Terjemahan mesin tidak dijalankan pada konten; isi English dapat diperiksa dan disesuaikan oleh admin sebelum ditayangkan.

Uji CRUD pengguna dan keamanan sesi (memerlukan MySQL yang aktif, akun uji dibersihkan setelah selesai):

```bash
cd backend
node --test tests/users.test.js
```

## Blog perjalanan

Menu **Admin → Blog → Artikel** menyediakan tambah/edit artikel melalui modal, gambar sampul (URL atau upload), kategori, penulis, ringkasan, isi Indonesia/English, dan pratinjau. Pilih **Draft** untuk menyimpan tanpa tampil ke customer, atau **Publikasikan** untuk menerbitkan. Tanggal publikasi mendatang menjadwalkan artikel; tanggal kosong menerbitkan saat disimpan. Hapus menggunakan modal konfirmasi dan sekaligus mengeluarkan artikel dari pilihan homepage.

Di **Tampilan homepage**, atur judul, deskripsi, visibilitas, dan jumlah artikel (1–9) yang muncul tepat sebelum FAQ. Tersedia empat mode:

- **Otomatis · Terbaru:** berdasarkan tanggal terbit terbaru.
- **Paling banyak dibaca:** berdasarkan jumlah pembaca, kemudian tanggal terbit.
- **Pilihan admin:** centang artikel dan atur urutannya dengan tombol naik/turun. Draft dan jadwal mendatang dilewati.
- **Acak:** pilihan diacak setiap homepage dimuat kembali, tanpa artikel berulang pada satu tampilan.

Customer dapat membuka `/blog` untuk mencari, memfilter kategori, mengurutkan, dan berpindah halaman; `/blog/:slug` menampilkan artikel lengkap serta cerita terkait. Menyembunyikan bagian homepage tidak menonaktifkan halaman blog. Pembaca dihitung setelah artikel terlihat selama 2 detik, maksimal satu kali per browser per hari (UTC), menggunakan cookie anonim. Membuka daftar atau mengambil data artikel tidak menambah hitungan.

Isi artikel mendukung paragraf, `## Subjudul`, `### Subjudul kecil`, `**teks tebal**`, daftar `- Poin` / `1. Urutan`, `> Kutipan`, `[tautan](https://...)`, dan gambar pada baris tersendiri `![keterangan](https://...)`. Pisahkan setiap blok dengan baris kosong. HTML ditampilkan sebagai teks. English opsional dan mengikuti pengaturan bahasa customer dengan fallback Indonesia.

Data tersimpan melalui Prisma/MySQL pada model `BlogPost`, `BlogSettings`, `BlogHomepageItem`, dan `BlogView`. Untuk database instalasi lain yang sudah ada, hentikan backend sementara, jalankan `npm run prisma:push --prefix backend`, lalu mulai kembali backend. Tidak perlu seed ulang; artikel ditambahkan sendiri melalui dashboard.

Halaman `/book/:id?variant=...` memiliki tombol **Kembali ke detail paket** yang mengembalikan customer ke paket dan varian pilihannya.

Uji seluruh alur backend dengan MySQL aktif (data uji dibersihkan dan pengaturan blog dipulihkan setelah selesai):

```bash
cd backend
npm test
```

## Galeri blog, homepage, dan animasi

Form **Blog** dan **Konten Homepage** menyediakan **Galeri & carousel**: upload beberapa gambar sekaligus atau tambahkan URL, pilih sampul, ubah urutan, dan hapus gambar. Klik **Atur gambar** untuk menyesuaikan tiap foto melalui drag pada pratinjau, slider posisi horizontal/vertikal, zoom 100–250%, serta pilihan Penuhi frame atau Tampilkan utuh. Rasio galeri dapat dipilih 16:9, 3:2, 4:3, 1:1, atau 4:5. Pengaturan tampilan tersimpan saat form disimpan; file aslinya tidak diubah.

Pratinjau artikel menampilkan carousel dan thumbnail yang dapat diklik. Galeri juga tersedia pada kartu blog dan halaman artikel. Kartu memakai frame tetap supaya susunannya sejajar; halaman artikel memakai rasio yang dipilih admin. Kolom **Blog populer** berisi hingga lima artikel terbit lainnya, diurutkan berdasarkan pembaca, kemudian tanggal terbit. Kolom ini berada di kanan isi artikel pada desktop dan di bawah pada layar kecil; draft dan publikasi mendatang tidak ditampilkan.

Gambar hero dan section lain di homepage sekarang mengikuti konten dashboard. Gambar pertama menjadi sampul dan beberapa gambar mengaktifkan carousel. Judul, isi, dan status tampil/sembunyi juga diterapkan. Model `BlogPost` dan `HomepageSection` memakai kolom JSON `gallery` serta `imageSettings`; instalasi lain dapat disinkronkan dengan `npm run prisma:push --prefix backend` tanpa seed ulang.

Halaman customer, login, dan pergantian tab admin memakai Framer Motion: fade 160 ms tanpa pergeseran layout halaman. Section pilihan memiliki reveal sekali saat masuk viewport, maksimal 3px selama 160 ms, tanpa parallax atau jeda beruntun per kartu. Fitur animasi dimuat terpisah melalui LazyMotion, dan pengaturan Reduce Motion pada perangkat dihormati. Lihat [dokumentasi Motion](https://motion.dev/docs/react-reduce-bundle-size).

Jalankan seluruh pengujian backend secara berurutan agar fixture publik antarfile tidak saling memengaruhi:

```bash
npm test --prefix backend
```

## Posisi scroll saat kembali

Navigasi Kembali/Maju browser memulihkan posisi scroll per entri riwayat, termasuk setelah reload dalam tab yang sama. Tombol Kembali di halaman detail, booking, dan blog juga memulihkan posisi tujuan terakhir. Filter paket disimpan pada query `?filter=...`, sehingga daftar dan filter tetap sesuai ketika kembali dari detail. Navigasi baru melalui menu dimulai dari atas; tautan section seperti `/#faq` tetap menuju section tersebut.

Pemulihan menunggu tinggi konten yang cukup ketika data masih dimuat dan berhenti jika pengguna mulai berinteraksi. Cache dibatasi 80 entri per tab melalui sessionStorage, dengan fallback memori jika storage tidak tersedia. Implementasi dipisahkan pada `useNavigationScroll`, `scrollPositions`, dan `BackLink`. Jalankan `npm test --prefix frontend` untuk pengujian penyimpanan posisi.

## Pilihan paket dan armada di homepage

Bagian paket dan armada pada homepage masing-masing menampilkan hingga **3 kartu pilihan + 1 kartu Lihat lainnya**, menuju `/packages` atau `/rental`. Susunan responsif menjadi dua kolom pada tablet dan satu kolom pada mobile. Katalog lengkap tetap menampilkan seluruh data yang tersedia.

Pada dashboard, buka **Paket Trip** atau **Unit Armada → Tampilan homepage**. Admin dapat mengatur judul Indonesia/English, tampil/sembunyi, serta mode **Otomatis**, **Pilihan admin**, atau **Acak**. Mode otomatis mempertahankan urutan katalog; mode manual menyediakan pencarian, daftar pilihan hingga 30 item, dan panah pengatur urutan. Hanya tiga kartu tampil per giliran. Pilihan draft paket tetap tersimpan di admin, tetapi dilewati pada homepage. Paket Malaysia tetap berada di katalog Malaysia. Item yang dihapus dikeluarkan dari pilihan saat dibaca.

Di tab yang sama terdapat dua pengaturan terpisah untuk setiap jenis katalog:

- **Carousel gambar**: manual atau otomatis setiap **2–60 detik** (default 5 detik). Berlaku untuk foto kartu di homepage/katalog serta halaman detail paket dan armada, termasuk paket Malaysia. Tidak ada tombol play/pause; panah, indikator, swipe, dan thumbnail detail tetap tersedia. Gambar tunggal tetap statis.
- **Pergantian kartu homepage**: tetap menampilkan tiga pilihan pertama (default), atau mengganti tiga kartu setiap **5–120 detik** (default 10 detik). Mode otomatis/acak memakai seluruh daftar terbit, sedangkan Pilihan admin memakai daftar yang dipilih dan urutannya. Jika pilihan tidak lebih dari tiga, kartu tetap diam. Kartu Lihat lainnya selalu tersedia; panah bagian homepage bisa dipakai untuk mengganti kelompok kartu saat rotasi diaktifkan.

Pemutaran berhenti sementara ketika area diarahkan mouse, disentuh, mendapat fokus keyboard, keluar viewport, atau tab browser tidak aktif. Pergantian foto menunggu gambar selesai dimuat; pilihan Reduce Motion pada perangkat menonaktifkan pergantian otomatis. Setelah interaksi manual dan fokus keluar dari carousel, timer dimulai kembali dari jeda penuh.

Pengaturan tersimpan di model Prisma `CatalogHomepageSettings`, termasuk `imageAutoPlay`, `imageIntervalSeconds`, `rotateItems`, dan `rotationIntervalSeconds`. Untuk instalasi lain, hentikan backend, jalankan `npm run prisma:push --prefix backend` tanpa seed/reset database, lalu jalankan kembali backend. Pengaturan awal mempertahankan tiga pilihan sebelumnya.

## Keamanan admin dan koneksi login

Autentikasi memakai bcrypt dan sesi database melalui Prisma; project ini **belum memakai Better Auth**. Akun dan role Owner/Admin tetap memakai tabel yang sudah ada. Password dengan bcrypt cost lama ditingkatkan ke cost 12 setelah login berhasil, tanpa mengganti password pengguna. Token sesi baru memiliki 256 bit acak dan hanya hash SHA-256 dengan penanda versi yang disimpan di database. Sesi lama dapat ditingkatkan otomatis saat dibaca, atau sekaligus melalui `npm run auth:upgrade-sessions --prefix backend`.

Cookie sesi bersifat HttpOnly, host-only, SameSite, dan otomatis Secure pada HTTPS ketika `COOKIE_SECURE=auto`. Login merotasi sesi browser sebelumnya. Sesi memiliki batas waktu absolut, dihapus saat logout, serta dicabut ketika akun/password/role/status diubah. Respons autentikasi dan dashboard menggunakan `private, no-store`.

Permintaan tambah/edit/hapus admin dan logout membutuhkan `X-CSRF-Token`, yang diterima bersama respons login/session dan hanya disimpan di memori frontend. Origin/Referer diperiksa terhadap daftar yang diizinkan, dan request berisi data harus memakai JSON. Jika cookie berubah dari tab lain, frontend mengambil token baru dan hanya mengulang request yang sudah ditolak sebelum perubahan data dijalankan. Proteksi header HTTP memakai Helmet; upload diperiksa berdasarkan signature file dan dibatasi 1 MB per gambar. Detail error internal serta kredensial tidak dikirim ke browser.

Pembatasan kegagalan login disimpan pada model Prisma `LoginThrottle`, sehingga tetap berlaku setelah restart atau pada beberapa proses backend. Key IP/username disimpan sebagai hash. Login memiliki pembatasan burst tambahan dan API memiliki batas permintaan per menit.

| Variabel backend | Default | Penggunaan |
| --- | --- | --- |
| `SESSION_SECRET` | Wajib diatur untuk production | Minimal 32 karakter acak; konfigurasi lokal sudah diisi. |
| `AUTH_SESSION_HOURS` | `12` | Masa berlaku sesi. |
| `AUTH_LOGIN_WINDOW_MINUTES` | `15` | Jendela perhitungan kegagalan login. |
| `AUTH_LOGIN_MAX_FAILURES` | `8` | Kegagalan per kombinasi IP dan username. |
| `AUTH_LOGIN_IP_MAX_FAILURES` | `60` | Kegagalan gabungan per IP. |
| `API_RATE_LIMIT_PER_MINUTE` | `300` | Batas request API per IP per menit. |

Untuk instalasi lain dengan database lama, jalankan `npm run prisma:push --prefix backend` dan `npm run auth:upgrade-sessions --prefix backend` sebelum menjalankan backend baru. Tidak perlu seed ulang. Buat secret jika belum tersedia dengan `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` dan simpan hasilnya di `.env`.

Frontend menggunakan **API pada origin yang sama** secara default (`VITE_USE_API_PROXY=true`): browser meminta `/api/...` dan `/uploads/...` melalui domain frontend, lalu Vite meneruskannya ke `VITE_API_PROXY_TARGET=http://127.0.0.1:4173`. Ini berlaku untuk dev dan preview. Saat Express menyajikan build production, endpoint tersebut sudah berada pada origin yang sama. `VITE_API_URL` dan `VITE_LOCAL_API_URL` tetap tersedia jika sengaja memilih `VITE_USE_API_PROXY=false`. Sesuaikan `FRONTEND_ORIGINS` backend jika domain atau port frontend berubah.

Jalur ini menghindari preflight, cookie antardomain, dan pemeriksaan domain API terpisah pada browser. Perubahan origin cookie mungkin memerlukan satu kali login ulang pada domain publik. Pengaturan Cloudflare tidak diubah oleh project; penolakan halaman frontend oleh Cloudflare tetap harus diperiksa pada aturan Cloudflare.

Login memverifikasi cookie melalui endpoint session sebelum membuka dashboard. Jika koneksi terputus atau proxy belum siap, frontend memeriksa apakah sesi sebenarnya sudah terbentuk, kemudian melakukan paling banyak satu pengiriman ulang login bila diperlukan. Password salah dan status 429 tidak dicoba ulang otomatis. Request baca memiliki satu retry singkat; booking dan operasi CRUD tidak diulang otomatis saat terjadi gangguan jaringan, sehingga risiko data tersimpan dua kali dihindari. UI menyediakan pesan koneksi dan hitung mundur sesuai `Retry-After`.

Dependensi keamanan diperbarui melalui lockfile. Override `@prisma/config → deepmerge-ts 8.0.0` memperbaiki advisory rekursi pada dependency CLI tanpa memindahkan project ke Prisma major baru; schema divalidasi dan integrasi database diuji setelah perubahan. Rujukan: [Express security](https://expressjs.com/en/advanced/best-practice-security/), [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), dan [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
