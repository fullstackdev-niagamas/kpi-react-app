import { describe, it } from 'vitest';
import { deptScoreAt, deptScoreYTD, kpiMonthStats, kpiYTDStats } from './helpers';

const raw = [
  {"sourceKpiId":"kpi1783869944952_1nkwd","mandatory":true,"persp":"Financial","so":"Increase Revenue Growth","name":"Revenue Achievement","type":"Max","uom":"Rp","period":"Bulanan","mtdCat":"RATIO","ytdCat":"SUM","target":100,"weight":0.15,"status":"Approved","factor1":[2232816598,1992964278,1318241401,2273599257,2161443338,1880154244,null,null,null,null,null,null],"factor2":[2178000000,2363000000,1641000000,2696000000,2355000000,2560000000,null,null,null,null,null,null],"id":"uk1784616116792_bn6o2"},
  {"sourceKpiId":"kpi1783891966696_yrupm","mandatory":true,"persp":"Financial","so":"Maintain Liquidity","name":"AR Rate Ratio","type":"Min","uom":"Point","period":"Bulanan","mtdCat":"DIRECT","ytdCat":"LAST","target":1.07,"weight":0.1,"status":"Approved","factor1":[1.12,0.55,0.59,0.84,0.86,1,null,null,null,null,null,null],"factor2":[1.12,0.55,0.59,0.84,0.86,1,null,null,null,null,null,null],"id":"uk1784616131009_k6y7f"},
  {"sourceKpiId":"kpi1783892151698_sugbd","mandatory":true,"persp":"Customer","so":"Dealer Relationship Management","name":"9V 9R","type":"Max","uom":"%","period":"Bulanan","mtdCat":"RATIO","ytdCat":"AVG","target":100,"weight":0.1,"status":"Approved","factor1":[null,null,null,null,null,null,null,null,null,null,null,null],"factor2":[null,null,null,null,null,null,null,null,null,null,null,null],"id":"uk1784616142871_sbsgs"},
  {"sourceKpiId":"kpi1783892430705_ec7g0","mandatory":true,"persp":"Customer","so":"Distribution Network","name":"%Toko Potensi Contribution","type":"Max","uom":"%","period":"Bulanan","mtdCat":"RATIO","ytdCat":"SUM","target":20,"weight":0.1,"status":"Approved","factor1":[1611186767,1595086146,1172637733,1844785014,1350880656,1063548729,null,null,null,null,null,null],"factor2":[2226485549,2035625382,1318241401,2273599257,2161443338,1880154244,null,null,null,null,null,null],"id":"uk1784616160672_fu1p2"},
  {"sourceKpiId":"kpi1783892655649_0p3w0","mandatory":true,"persp":"Customer","so":"Dealer Relationship Management","name":"#NOO","type":"Max","uom":"Number","period":"Bulanan","mtdCat":"RATIO","ytdCat":"SUM","target":100,"weight":0.05,"status":"Approved","factor1":[0,1,0,0,1,0,null,null,null,null,null,null],"factor2":[2,2,2,2,2,2,null,null,null,null,null,null],"id":"uk1784616176851_he0qf"},
  {"sourceKpiId":"kpi1783892798264_1ws51","mandatory":true,"persp":"Internal Process","so":"Stock & Asset Management","name":"Aging Stock Level","type":"Min","uom":"%","period":"Bulanan","mtdCat":"DIRECT","ytdCat":"LAST","target":30,"weight":0.05,"status":"Approved","factor1":[null,null,null,null,null,null,null,null,null,null,null,null],"factor2":[null,null,null,null,null,null,null,null,null,null,null,null],"id":"uk1784616263219_h9cuc"},
  {"persp":"Financial","so":"","name":"Sell In (PUSH)","type":"Max","mtdCat":"RATIO","ytdCat":"SUM","period":"Bulanan","target":100,"uom":"%","weight":0.2,"status":"Approved","factor1":[528444512,546750466,105247399,169102560,169102560,169102560,null,null,null,null,null,null],"factor2":[481085300,481085300,130532472,130532472,130532472,130532472,null,null,null,null,null,null],"id":"uk1784616390825_g7vj1"},
  {"persp":"Financial","so":"","name":"Omset by Category Product","type":"Max","mtdCat":"RATIO","ytdCat":"LAST","period":"Bulanan","target":100,"uom":"%","weight":0.05,"status":"Draft","factor1":[90,50,50,80,80,50,null,null,null,null,null,null],"factor2":[100,100,100,100,100,100,null,null,null,null,null,null],"id":"uk1784616442468_limuj"},
  {"persp":"Internal Process","so":"","name":"Visit Achievement Rate (All Team)","type":"Max","mtdCat":"RATIO","ytdCat":"SUM","period":"Bulanan","target":100,"uom":"%","weight":0.05,"status":"Approved","factor1":[5,6,10,null,null,null,null,null,null,null,null,null],"factor2":[10,10,10,null,null,null,null,null,null,null,null,null],"id":"uk1784616492771_ysiqj"},
  {"sourceKpiId":"kpi1783893321417_rhqzq","mandatory":true,"persp":"Learning & Growth","so":"Winning Team","name":"Training Realization","type":"Max","uom":"%","period":"Bulanan","mtdCat":"RATIO","ytdCat":"SUM","target":100,"weight":0.1,"status":"Approved","factor1":[3,0,5,null,null,null,null,null,null,null,null,null],"factor2":[3,3,6,null,null,null,null,null,null,null,null,null],"id":"uk1784616689578_f4ooi"},
  {"persp":"Internal Process","so":"","name":"Reporting Fulfillment","type":"Max","mtdCat":"RATIO","ytdCat":"SUM","period":"Bulanan","target":100,"uom":"%","weight":0.05,"status":"Approved","factor1":[80,80,100,100,100,null,null,null,null,null,null,null],"factor2":[100,100,100,100,100,null,null,null,null,null,null,null],"id":"uk1784616826656_x144e"},
];

describe('debug rizaldi real data', () => {
  it('prints totals', () => {
    console.log('Total weight all:', raw.reduce((s, k) => s + k.weight, 0));
    console.log('deptScoreAt Jun (idx5):', deptScoreAt(raw, 5));
    console.log('deptScoreYTD Jun (idx5):', deptScoreYTD(raw, 5));
    console.log('---per KPI MTD (idx5)---');
    raw.forEach(k => {
      const st = kpiMonthStats(k, 5);
      console.log(k.name, st ? { score: st.score, ach: (st.ach*100).toFixed(2)+'%' } : 'NULL');
    });
    console.log('---per KPI YTD (idx5)---');
    raw.forEach(k => {
      const st = kpiYTDStats(k, 5);
      console.log(k.name, st ? { score: st.score, ach: (st.ach*100).toFixed(2)+'%' } : 'NULL');
    });
  });
});
