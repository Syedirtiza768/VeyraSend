function VariancePage() {
  // 8 cost centers × 6 months variance grid; heatmap intensity + flagged cells
  const months = ['Nov 25','Dec 25','Jan 26','Feb 26','Mar 26','Apr 26'];
  const rows = [
    ['Plant 1 — Munich',      [ 1.2, -0.8,  0.4, -2.1,  0.9,  0.6 ]],
    ['Plant 2 — Stuttgart',   [-0.4,  2.1,  1.8,  3.2,  5.4,  7.8 ]],
    ['Plant 3 — Poznań',      [ 0.1, -0.3,  0.8,  0.2, -0.7, -1.1 ]],
    ['Warehouse 4 — Munich',  [ 4.2,  3.1,  2.8,  3.8,  4.1,  6.2 ]],
    ['Warehouse 5 — Rotterdam',[-1.2, -0.4,  0.6,  0.8,  0.4,  0.2 ]],
    ['Service — EU West',     [ 0.8,  0.6,  0.4,  0.2, -0.1, -0.4 ]],
    ['Service — NA',          [ 2.1,  1.8,  2.4,  3.1,  3.8,  4.2 ]],
    ['Corporate',             [ 0.2,  0.1,  0.3, -0.1,  0.2,  0.4 ]],
  ];
  const level = (v) => {
    const a = Math.abs(v);
    if (a >= 5) return 'h3 flag';
    if (a >= 3) return 'h3';
    if (a >= 1.5) return 'h2';
    if (a >= 0.5) return 'h1';
    return '';
  };
  return (
    <>
      <div className="page-h">
        <div>
          <div className="micro" style={{marginBottom:6}}>Monthly operating variance</div>
          <h1>Budget vs. actual — cost centers</h1>
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <span className="strap">as of 08:43 · reconciled through Apr 18 · % of budget</span>
          <button className="btn btn-secondary">Export CSV</button>
          <button className="btn btn-primary">Open close packet</button>
        </div>
      </div>

      <div className="split">
        <div className="panel">
          <h3>Material variance by plant<span className="sub">USD · trailing 6 months</span></h3>
          <div className="chart-frame"><BarsChart/></div>
        </div>
        <div className="panel">
          <h3>Flagged lines<span className="sub">&gt; ±5% of budget</span></h3>
          <ul className="xlist">
            <li><span className="glyph danger">■</span><div className="txt">Plant 2 — Stuttgart · Apr 26<span className="meta">+7.8% · material cost, $412k over</span></div><a href="#">Drill →</a></li>
            <li><span className="glyph danger">■</span><div className="txt">Warehouse 4 — Munich · Apr 26<span className="meta">+6.2% · overtime labor</span></div><a href="#">Drill →</a></li>
            <li><span className="glyph warn">▲</span><div className="txt">Service — NA · Apr 26<span className="meta">+4.2% · subcontractor utilization</span></div><a href="#">Drill →</a></li>
            <li><span className="glyph info">◆</span><div className="txt">FX — EUR weaker than budgeted rate<span className="meta">Avg 1.062 vs. 1.080 budget</span></div><a href="#">Model →</a></li>
          </ul>
        </div>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-h">
          <h3>Variance heatmap — %</h3>
          <div className="tbl-filters">
            <span className="chip indigo"><b>View:</b> % of budget <span className="x">×</span></span>
            <span className="chip"><b>Horizon:</b> 6 months <span className="x">×</span></span>
            <span className="chip"><b>Threshold:</b> ±5% <span className="x">×</span></span>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Cost center</th>
              {months.map(m => <th key={m} className="num">{m}</th>)}
              <th className="num">Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i) => (
              <tr key={i}>
                <td>{r[0]}</td>
                {r[1].map((v,j) => (
                  <td key={j} className={'v ' + level(v)}>{(v>0?'+':'') + v.toFixed(1)}</td>
                ))}
                <td className="num mono" style={{color:'#8A8A8A'}}>
                  {(() => {
                    const last = r[1][r[1].length-1] - r[1][0];
                    return (last>0?'↗ +':'↘ ') + last.toFixed(1);
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Consolidated</td>
              <td className="num">+0.9</td><td className="num">+0.8</td><td className="num">+1.2</td><td className="num">+1.4</td><td className="num">+1.8</td><td className="num">+2.4</td>
              <td className="num">↗ +1.5</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="micro" style={{marginTop: 18, fontFamily:'var(--enxi-font-mono)', letterSpacing:0, textTransform:'none', fontWeight: 400}}>
        Source: GL posted + subledger accruals · computed 2026-04-20 08:43 CET · methodology: variance = (actual − budget) / budget
      </p>
    </>
  );
}

function BarsChart() {
  const series = [
    { name: 'Materials', color: '#3B5D82' },
    { name: 'Labor',     color: '#A97A1E' },
    { name: 'Overhead',  color: '#6B8C6F' },
  ];
  const data = [
    [38, 18, 12], [42, 22, 14], [45, 24, 15], [48, 26, 16], [52, 28, 18], [58, 32, 20],
  ];
  const labels = ['Nov','Dec','Jan','Feb','Mar','Apr'];
  const gap = 2, bw = (100 - gap*(data.length+1)) / data.length;
  return (
    <svg viewBox="0 0 100 90" preserveAspectRatio="none">
      {[20, 40, 60, 80].map(gy => <line key={gy} x1="0" x2="100" y1={gy} y2={gy} stroke="#D8D4CA" strokeWidth="0.2"/>)}
      {data.map((stack, i) => {
        const x = gap + i*(bw+gap);
        const total = stack.reduce((a,b)=>a+b,0);
        let y = 80;
        return (
          <g key={i}>
            {stack.map((v, si) => {
              const h = v * 0.7;
              y -= h;
              return <rect key={si} x={x} y={y} width={bw} height={h} fill={series[si].color}/>;
            })}
            <text x={x+bw/2} y="88" fontSize="2.6" textAnchor="middle" fill="#8A8A8A" fontFamily="JetBrains Mono">{labels[i]}</text>
          </g>
        );
      })}
      {/* legend */}
      {series.map((s, i) => (
        <g key={s.name} transform={`translate(${2 + i*22}, 4)`}>
          <rect width="3" height="3" fill={s.color}/>
          <text x="5" y="2.8" fontSize="2.6" fill="#4A4A4A" fontFamily="Inter">{s.name}</text>
        </g>
      ))}
    </svg>
  );
}

window.VariancePage = VariancePage;
