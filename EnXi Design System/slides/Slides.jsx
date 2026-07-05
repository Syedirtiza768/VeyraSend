function SlideFooter({ deck, section, page, date }) {
  return (
    <div className="slide-footer">
      <div className="hr"/>
      <div className="wm">
        <span className="tick-sig"><i/><i/><i/><i/><i/><i/></span>
        <span>EnXi</span>
        <span style={{color:'var(--enxi-color-ink-15)', fontWeight:400}}>·</span>
        <span style={{color:'var(--enxi-color-ink-40)', fontWeight:400}}>{deck}</span>
      </div>
      <div className="meta">{section} · {date} · {page}</div>
    </div>
  );
}

function TitleSlide() {
  return (
    <div className="slide slide-title">
      <div className="slide-pad">
        <div className="kicker">Customer case · Kraus-Maffei Industrial</div>
        <h1>We closed our March books on April 4th. Last year we were still closing on April 21st.</h1>
        <div className="rule"/>
        <p className="dek">A controlled post-mortem of a 14-month ERP migration, presented to the EnXi 2026 customer forum. What changed, what didn't, what's still in flight.</p>
        <div className="fact">
          <div><b>Presented by</b>D. Reyes, CFO<br/>Kraus-Maffei Industrial</div>
          <div><b>For</b>EnXi 2026 Customer Forum<br/>Amsterdam · 2026-05-14</div>
          <div><b>Prepared</b>2026-04-18 by the<br/>EnXi Implementation Team</div>
        </div>
      </div>
      <SlideFooter deck="Customer case · Kraus-Maffei" section="I. Case" page="01 / 28" date="2026-05-14"/>
    </div>
  );
}

function ClaimSlide() {
  return (
    <div className="slide slide-claim">
      <div className="slide-pad">
        <div className="eyebrow">III. Close cycle impact.</div>
        <h2>Kraus-Maffei cut their month-end close from 17 days to 4.</h2>
        <div className="midrule"/>
        <div className="proof">
          <div className="chart">
            <h4>Business days to consolidated trial balance</h4>
            <div className="sub">Trailing 18 months · posted, not estimated</div>
            <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid meet">
              {[60, 120, 180].map(y => <line key={y} x1="30" x2="390" y1={y} y2={y} stroke="#D8D4CA" strokeWidth="0.5"/>)}
              {[{x:20,h:130},{x:45,h:125},{x:70,h:135},{x:95,h:118},{x:120,h:112},
                {x:145,h:108},{x:170,h:88},{x:195,h:70},{x:220,h:62},{x:245,h:50},
                {x:270,h:44},{x:295,h:38},{x:320,h:34},{x:345,h:32},{x:370,h:30}
              ].map((b,i) => (
                <g key={i}>
                  <rect x={b.x+30} y={200-b.h} width="16" height={b.h} fill="#3B5D82" opacity={i<6?0.4:1}/>
                </g>
              ))}
              {/* Cinnabar vertical: EnXi go-live */}
              <line x1="193" x2="193" y1="10" y2="200" stroke="#B4442C" strokeWidth="1.5"/>
              <text x="198" y="22" fontFamily="JetBrains Mono" fontSize="11" fill="#B4442C">EnXi go-live · Jul 2025</text>
              <text x="198" y="36" fontFamily="JetBrains Mono" fontSize="10" fill="#B4442C" opacity="0.7">phase 2 of 4</text>
              {/* x-axis months */}
              {['Nov 24','Feb 25','May 25','Aug 25','Nov 25','Feb 26'].map((t,i) => (
                <text key={i} x={40 + i*60} y="220" fontFamily="JetBrains Mono" fontSize="11" fill="#8A8A8A">{t}</text>
              ))}
              {/* y-axis */}
              {[0, 5, 10, 15].map((v,i) => (
                <text key={v} x="20" y={205 - i*45} fontFamily="JetBrains Mono" fontSize="11" fill="#8A8A8A" textAnchor="end">{v}d</text>
              ))}
            </svg>
            <div className="cite">Source: Kraus-Maffei Industrial internal close records · Verified 2026-03-30 · n=18 monthly closes</div>
          </div>
          <div className="stats">
            <div className="stat">
              <div className="n">4<span className="unit">days</span></div>
              <div className="lbl">March 2026 close cycle, consolidated trial balance</div>
            </div>
            <div className="stat">
              <div className="n"><span className="accent">−76%</span></div>
              <div className="lbl">Reduction in manual reconciliations, year-over-year</div>
            </div>
          </div>
        </div>
      </div>
      <SlideFooter deck="Customer case · Kraus-Maffei" section="III. Close cycle impact" page="14 / 28" date="2026-05-14"/>
    </div>
  );
}

function SectionSlide() {
  return (
    <div className="slide slide-section">
      <div className="slide-pad">
        <div className="rule"/>
        <div className="roman">IV</div>
        <h2>What still isn't solved.</h2>
        <div className="topic">Honest accounting · Intercompany FX · HR integration · Consolidated cash forecasting</div>
      </div>
      <SlideFooter deck="Customer case · Kraus-Maffei" section="IV. Open questions" page="22 / 28" date="2026-05-14"/>
    </div>
  );
}

window.TitleSlide = TitleSlide;
window.ClaimSlide = ClaimSlide;
window.SectionSlide = SectionSlide;
