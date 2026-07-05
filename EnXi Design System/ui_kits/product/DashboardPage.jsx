const { useState: useStateD } = React;

function DashboardPage({ setPage }) {
  const kpis = [
    { lbl: 'Cash position', val: '$48.2M', delta: '+$1.4M WoW', state: 'up', strap: 'as of 08:43 · reconciled through Apr 18' },
    { lbl: 'AR 30/60/90', val: '12.4 / 3.1 / 1.2', delta: '−0.8d DSO', state: 'up', strap: 'as of 08:40 · Apr 19' },
    { lbl: 'AP due this week', val: '$6.81M', delta: '41 invoices', state: 'warn', strap: 'as of 08:43' },
    { lbl: 'Unposted entries', val: '27', delta: '+4 vs. yest.', state: 'down', strap: 'as of 08:43' },
    { lbl: 'Close progress', val: '62%', delta: 'Day 3 of 4', state: 'up', strap: 'Apr close · on track' },
  ];

  return (
    <>
      <div className="page-h">
        <div>
          <div className="micro" style={{marginBottom: 6}}>Morning readout</div>
          <h1>Controller's overview</h1>
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <span className="strap">Last refresh 08:43 · auto-updates every 15 min</span>
          <button className="btn btn-secondary">Export…</button>
          <button className="btn btn-primary">Post batch ⌘↵</button>
        </div>
      </div>

      <div className="kpi-row">
        {kpis.map((k,i) => (
          <div className="kpi" key={i}>
            <div className="lbl">{k.lbl}</div>
            <div className="val">{k.val}</div>
            <div className={'delta ' + k.state}>{k.delta}</div>
            <div className="strap">{k.strap}</div>
          </div>
        ))}
      </div>

      <div className="split">
        <div className="panel">
          <h3>Cash position — trailing 90 days<span className="sub">USD, reconciled</span></h3>
          <div className="chart-frame">
            <CashChart/>
          </div>
        </div>
        <div className="panel">
          <h3>Exceptions<span className="sub">7 open</span></h3>
          <ul className="xlist">
            <li><span className="glyph danger">■</span><div className="txt">Intercompany balance mismatch — DE07 ↔ US03<span className="meta">$12,480 · 3 JEs affected</span></div><a href="#">Review →</a></li>
            <li><span className="glyph warn">▲</span><div className="txt">AP auto-match confidence below threshold<span className="meta">14 invoices · vendor: Siemens AG</span></div><a href="#">Review →</a></li>
            <li><span className="glyph warn">▲</span><div className="txt">FX rate stale (EUR/USD, older than 6h)<span className="meta">Last fetched 02:14 UTC</span></div><a href="#">Refresh →</a></li>
            <li><span className="glyph info">◆</span><div className="txt">New lease obligation requires ASC 842 journal<span className="meta">Warehouse 4, Munich · $2.1M</span></div><a href="#">Open →</a></li>
            <li><span className="glyph info">◆</span><div className="txt">Bank reconciliation: 4 unmatched items<span className="meta">Deutsche Bank · op. account</span></div><a href="#">Open →</a></li>
          </ul>
        </div>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-h">
          <h3>Unposted journal entries — Apr 2026</h3>
          <div className="tbl-filters">
            <span className="chip indigo"><b>Period:</b> Apr 2026 <span className="x">×</span></span>
            <span className="chip"><b>Status:</b> Draft <span className="x">×</span></span>
            <span className="chip"><b>Prepared by:</b> Any <span className="x">×</span></span>
            <button className="ghost-btn">+ Filter</button>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{width:38}}></th>
              <th>Entry</th>
              <th>Description</th>
              <th>Prepared by</th>
              <th>Approver</th>
              <th className="num">Debit</th>
              <th className="num">Credit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['JE-04-1221','Accrue utilities — Munich plant','M. Fischer','D. Reyes','184,220.00','184,220.00','warn','Pending review'],
              ['JE-04-1222','FX revaluation — EUR AR','System','—','12,481.55','12,481.55','info','Auto-prepared'],
              ['JE-04-1223','Depreciation — Fleet Q2','K. Tanaka','D. Reyes','91,000.00','91,000.00','warn','Pending review'],
              ['JE-04-1224','Lease ASC 842 — Warehouse 4','S. Patel','D. Reyes','2,108,402.12','2,108,402.12','danger','Variance flagged'],
              ['JE-04-1225','Payroll accrual — bi-weekly','A. Novak','D. Reyes','612,304.00','612,304.00','success','Ready to post'],
              ['JE-04-1226','Intercompany settlement — DE07↔US03','System','—','52,118.00','52,118.00','danger','Mismatch'],
            ].map((r,i) => (
              <tr key={i} className={i===3 ? 'selected' : ''}>
                <td><input type="checkbox" defaultChecked={i===4}/></td>
                <td className="mono">{r[0]}</td>
                <td>{r[1]}</td>
                <td>{r[2]}</td>
                <td>{r[3]}</td>
                <td className="num">{r[4]}</td>
                <td className="num">{r[5]}</td>
                <td><span className={'chip ' + r[6]}>{r[7]}</span></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="5">Total — 6 entries</td>
              <td className="num">3,060,525.67</td>
              <td className="num">3,060,525.67</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="micro" style={{marginTop: 18, fontFamily:'var(--enxi-font-mono)', letterSpacing:0, textTransform:'none', fontWeight: 400}}>
        Source: EnXi GL · tenant: kraus-maffei-de · as of 2026-04-20 08:43 CET
      </p>
    </>
  );
}

function CashChart() {
  // generate a calm, monochrome sequential line chart
  const pts = [];
  const n = 90; let y = 44;
  for (let i = 0; i < n; i++) {
    y += (Math.sin(i*0.35)*0.6 + (Math.random()-0.4)*0.7);
    pts.push([i/(n-1)*100, y]);
  }
  const min = Math.min(...pts.map(p=>p[1])), max = Math.max(...pts.map(p=>p[1]));
  const path = pts.map((p,i) => {
    const yy = 10 + (1 - (p[1]-min)/(max-min)) * 70;
    return (i===0?'M':'L') + p[0].toFixed(2) + ',' + yy.toFixed(2);
  }).join(' ');
  const todayX = 86;
  return (
    <svg viewBox="0 0 100 90" preserveAspectRatio="none">
      {/* grid */}
      {[20, 40, 60, 80].map(gy => <line key={gy} x1="0" x2="100" y1={gy} y2={gy} stroke="#D8D4CA" strokeWidth="0.2"/>)}
      <path d={path} stroke="#1B2A3A" strokeWidth="0.6" fill="none" vectorEffect="non-scaling-stroke"/>
      {/* fill area */}
      <path d={path + ` L 100 85 L 0 85 Z`} fill="#1B2A3A" opacity="0.05"/>
      {/* cinnabar today marker */}
      <line x1={todayX} x2={todayX} y1="5" y2="85" stroke="#B4442C" strokeWidth="0.4" vectorEffect="non-scaling-stroke"/>
      <text x={todayX+1} y="9" fontSize="2.6" fill="#B4442C" fontFamily="JetBrains Mono">Today · Apr 20</text>
      {/* axes labels (static) */}
      <text x="0" y="89" fontSize="2.4" fill="#8A8A8A" fontFamily="JetBrains Mono">Jan 20</text>
      <text x="48" y="89" fontSize="2.4" fill="#8A8A8A" fontFamily="JetBrains Mono">Mar 05</text>
      <text x="92" y="89" fontSize="2.4" fill="#8A8A8A" fontFamily="JetBrains Mono">Apr 20</text>
    </svg>
  );
}

window.DashboardPage = DashboardPage;
