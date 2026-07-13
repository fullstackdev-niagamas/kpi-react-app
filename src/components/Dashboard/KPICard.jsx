import { calcMTD, calcYTD, computeAch, computeScore, badgeColorByPersp, scoreBg } from '../../utils/helpers';

export const KPICard = ({ kpi, viewMonthIdx }) => {
  const mtd = calcMTD(kpi, viewMonthIdx);
  const ytd = calcYTD(kpi, viewMonthIdx);
  const achMTD = computeAch(kpi.type, kpi.target, mtd);
  const achYTD = computeAch(kpi.type, kpi.target, ytd);
  const scoreMTD = computeScore(achMTD, kpi.type);
  const scoreYTD = computeScore(achYTD, kpi.type);
  
  const isDraft = kpi.isDraftOnly || kpi.status === 'Draft';
  const bgMTD = isDraft ? 'bg-gray-100 text-nlg-text-muted' : scoreBg(scoreMTD);
  const bgYTD = isDraft ? 'bg-gray-100 text-nlg-text-muted' : scoreBg(scoreYTD);

  return (
    <div className={`border border-nlg-border rounded-nlg-card p-4 bg-white ${isDraft ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wide">{kpi.persp}</span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badgeColorByPersp(kpi.persp)}`}>{kpi.type}</span>
      </div>
      <div className="font-semibold text-nlg-text text-sm mb-1 leading-snug">{kpi.name}</div>
      <div className="flex items-center justify-between mb-2 text-[11px] text-nlg-text-subdued">
        <span>{kpi.period} · {kpi.uom}</span>
        <span className="font-medium text-nlg-primary">Target: {kpi.target}{kpi.uom === '%' ? '%' : ''}</span>
      </div>
      <div className="flex gap-2">
        <div className={`flex-1 rounded-nlg-input py-2 text-center ${bgMTD}`}>
          <div className="text-[9px] mb-0.5 opacity-75">%Actual MTD</div>
          <div className="font-bold text-sm">{isDraft ? '—' : (achMTD * 100).toFixed(1) + '%'}</div>
        </div>
        <div className={`flex-1 rounded-nlg-input py-2 text-center ${bgYTD}`}>
          <div className="text-[9px] mb-0.5 opacity-75">%Actual YTD</div>
          <div className="font-bold text-sm">{isDraft ? '—' : (achYTD * 100).toFixed(1) + '%'}</div>
        </div>
      </div>
      {isDraft && <div className="text-[10px] text-nlg-text-subdued text-center mt-2">Draft — belum disubmit</div>}
    </div>
  );
};
