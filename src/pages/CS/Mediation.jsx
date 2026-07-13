import { useToast } from '../../context/ToastContext';
import { useKPIContext } from '../../context/KPIContext';

export const Mediation = () => {
  const toast = useToast();
  const { batches, actOnBatch } = useKPIContext();
  const items = batches.filter(b => b.status === 'Pending Mediation');

  const resolve = (batch, approved) => {
    actOnBatch(batch.id, approved ? 'approve' : 'reject', batch.catatan, 'Corporate Strategy (Mediasi)');
    if (approved) {
      toast('Mediasi selesai — submission disetujui Corporate Strategy.');
    } else {
      toast('Mediasi selesai — submission ditolak Corporate Strategy.', 'danger');
    }
  };

  return (
    <div className="mb-5">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-nlg-text mb-1">Pending Mediation Queue</h1>
        <p className="text-sm text-nlg-text-muted">
          Submission yang mencapai batas 3x Request Revision tanpa kesepakatan Superior–User.
        </p>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((b) => (
            <div key={b.id} className="border border-nlg-border rounded-nlg-card bg-white p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-sm text-nlg-text">{b.batch}</div>
                  <div className="text-xs text-nlg-text-muted mt-0.5">
                    {b.dept} · User: {b.user} · Superior: {b.by || '—'}
                  </div>
                  <div className="text-[11px] text-nlg-text-subdued mt-1">{b.kpis.length} KPI dalam batch ini: {b.kpis.map(k => k.name).join(', ')}</div>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                  Revisi {b.revisi}/3
                </span>
              </div>

              <div className="text-xs bg-nlg-sidebar rounded-nlg-input px-3 py-2 mb-3 text-nlg-text-muted">
                Catatan ketidaksepakatan (revisi terakhir): {b.catatan || '—'}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => resolve(b, true)}
                  className="px-3 py-1.5 text-xs font-medium rounded-nlg-input bg-green-600 text-white"
                >
                  Approve (Final)
                </button>
                <button
                  onClick={() => resolve(b, false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-nlg-input border border-nlg-border text-nlg-text-muted"
                >
                  Reject (Final)
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-nlg-border rounded-nlg-card bg-white p-10 text-center">
          <div className="text-4xl mb-3">⚖️</div>
          <div className="text-lg font-bold text-nlg-text">Belum ada kasus mediasi</div>
          <p className="text-nlg-text-muted text-sm mt-1">
            Semua submission telah selesai dimediasi Corporate Strategy.
          </p>
        </div>
      )}
    </div>
  );
};
