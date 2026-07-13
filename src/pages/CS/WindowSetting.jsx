import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { ACTIVE_PLAN_YEAR } from '../../data/mockData';

const PLAN_YEARS = [2025, 2026, 2027, 2028, 2029];

export const WindowSetting = () => {
  const toast = useToast();

  // Panel 1 — active planning year
  const [planYear, setPlanYear] = useState(ACTIVE_PLAN_YEAR);

  // Panel 2 — annual planning window
  const [windowActive, setWindowActive] = useState(true);
  const [startDate, setStartDate] = useState(`${ACTIVE_PLAN_YEAR}-01-01`);
  const [endDate, setEndDate] = useState(`${ACTIVE_PLAN_YEAR}-02-28`);

  // Panel 3 — reminder & locking
  const [reminderDays, setReminderDays] = useState(5);
  const [recipients, setRecipients] = useState({
    user: true,
    superior: true,
    corporate: true,
  });

  const toggleRecipient = (key) =>
    setRecipients((prev) => ({ ...prev, [key]: !prev[key] }));

  const savePlanYear = () =>
    toast(
      `Tahun perencanaan aktif diubah ke ${planYear}. Semua menu kini menampilkan data tahun ${planYear}.`
    );

  const savePlanningWindow = () =>
    toast(`Setting jendela waktu Planning ${ACTIVE_PLAN_YEAR} disimpan.`);

  const saveReminder = () => toast('Setting reminder & locking Actual Data disimpan.');

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-nlg-text">
          Setting Jendela Waktu &amp; Reminder
        </h1>
        <p className="text-sm text-nlg-text-muted mt-1">
          Kelola tahun perencanaan aktif, jendela waktu Annual Planning, serta aturan
          reminder &amp; locking untuk Input Actual Data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Panel 1: Tahun Perencanaan Aktif */}
        <div className="border-2 border-nlg-primary rounded-nlg-card p-5 bg-white">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-nlg-text">Tahun Perencanaan Aktif</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-nlg-primary text-white">
              {ACTIVE_PLAN_YEAR}
            </span>
          </div>
          <div className="text-xs text-nlg-text-muted mb-4">
            Tahun ini yang terbuka untuk Planning KPI &amp; Input Actual oleh seluruh User.
            Ganti hanya di awal tahun baru setelah Planning periode sebelumnya selesai.
          </div>
          <div className="mb-4">
            <label className="text-xs font-medium text-nlg-text-muted">
              Ganti Tahun Perencanaan
            </label>
            <div className="flex gap-2 mt-1">
              <select
                value={planYear}
                onChange={(e) => setPlanYear(parseInt(e.target.value, 10))}
                className="flex-1 border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white"
              >
                {PLAN_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                    {yr === ACTIVE_PLAN_YEAR ? ' (aktif saat ini)' : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={savePlanYear}
                className="px-3 py-2 text-xs font-medium rounded-nlg-input bg-nlg-primary text-white"
              >
                Simpan
              </button>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-nlg-input px-3 py-2 text-[11px] text-amber-700">
            ⚠️ Mengubah tahun aktif akan mempengaruhi seluruh menu Planning, Actual,
            Dashboard, Riwayat, dan Approval Queue untuk semua User.
          </div>
        </div>

        {/* Panel 2: Jendela Waktu Planning */}
        <div className="border border-nlg-border rounded-nlg-card p-5 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-nlg-text">
                Jendela Waktu — Annual Planning {ACTIVE_PLAN_YEAR}
              </div>
              <div className="text-xs text-nlg-text-muted">
                hanya 1x/tahun · semua user wajib submit dalam periode ini
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWindowActive((v) => !v)}
              className={
                'px-3 py-1.5 rounded-full text-xs font-semibold ' +
                (windowActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-nlg-text-muted')
              }
            >
              {windowActive ? 'AKTIF' : 'NONAKTIF'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium text-nlg-text-muted">Tanggal Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-nlg-text-muted">Tanggal Berakhir</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={savePlanningWindow}
            className="w-full px-4 py-2 text-sm rounded-nlg-input bg-nlg-primary text-white font-medium"
          >
            Simpan Setting Planning
          </button>
        </div>

        {/* Panel 3: Reminder & Locking (full width) */}
        <div className="lg:col-span-2 border border-nlg-border rounded-nlg-card p-5 bg-white">
          <div className="mb-3">
            <div className="text-sm font-semibold text-nlg-text">
              Reminder &amp; Locking — Input Actual Data
            </div>
            <div className="text-xs text-nlg-text-muted mt-1">
              Actual <b>tidak punya jendela waktu manual</b> — mengikuti periode KPI
              masing-masing, otomatis <b>Locked saat memasuki periode berikutnya</b>.
              Setting di bawah hanya mengatur kapan &amp; ke siapa reminder dikirim sebelum
              locking.
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-nlg-text-muted">
                Kirim reminder H- (hari sebelum locking)
              </label>
              <input
                type="number"
                min="1"
                max="15"
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
                className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-nlg-text-muted">
                Penerima Notifikasi
              </label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={recipients.user}
                    onChange={() => toggleRecipient('user')}
                    className="rounded accent-nlg-primary"
                  />
                  User yang belum input Actual
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={recipients.superior}
                    onChange={() => toggleRecipient('superior')}
                    className="rounded accent-nlg-primary"
                  />
                  Superior/Atasan terkait (jika tim belum input/belum approve)
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={recipients.corporate}
                    onChange={() => toggleRecipient('corporate')}
                    className="rounded accent-nlg-primary"
                  />
                  Corporate Strategy (rekap seluruh Dept mendekati deadline)
                </label>
              </div>
            </div>
          </div>
          <div className="text-[11px] bg-nlg-primary-tint text-nlg-primary rounded-nlg-input px-3 py-2 mt-3 mb-3">
            📩 Pratinjau: Reminder akan dikirim H-{reminderDays || 0} sebelum jendela ditutup,
            terkirim <b>{reminderDays || 0} hari</b> sebelum locking ke User, Superior, dan
            Corporate Strategy.
          </div>
          <button
            type="button"
            onClick={saveReminder}
            className="px-4 py-2 text-sm rounded-nlg-input bg-nlg-primary text-white font-medium"
          >
            Simpan Setting Reminder
          </button>
        </div>
      </div>
    </div>
  );
};
