const { useState: useStateM, useEffect: useEffectM } = React;

function SiteHeader({ page, setPage }) {
  const [scrolled, setScrolled] = useStateM(false);
  useEffectM(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const go = (p) => (e) => { e.preventDefault(); setPage(p); window.scrollTo({top:0}); };
  return (
    <header className={'site-header' + (scrolled ? ' scrolled':'')}>
      <div className="site-header-inner">
        <a className="wm" href="#" onClick={go('home')}>
          <span className="tick"><i/><i/><i/><i/><i/><i/></span>
          <span>EnXi</span>
        </a>
        <nav className="site-nav">
          <a onClick={go('home')} className={page==='home'?'active':''}>Product</a>
          <a>Solutions</a>
          <a onClick={go('case')} className={page==='case'?'active':''}>Customers</a>
          <a>Analyst desk</a>
          <a>Pricing</a>
          <span className="divider">·</span>
          <a onClick={go('notfor')} className={page==='notfor'?'active':''}>Not for</a>
          <a>Sign in</a>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="ledger">
        <div className="col-full site-footer-cols">
          <div>
            <div className="wm"><span className="tick"><i/><i/><i/><i/><i/><i/></span><span>EnXi</span></div>
            <p className="msig">ERP for operators who have run one before. Made in Utrecht and Brooklyn.</p>
          </div>
          <div>
            <h5>Product</h5>
            <ul><li><a>Financials</a></li><li><a>Operations</a></li><li><a>Supply chain</a></li><li><a>Close cycle</a></li></ul>
          </div>
          <div>
            <h5>Trust</h5>
            <ul><li><a>Public changelog</a></li><li><a>Incident history</a></li><li><a>Security</a></li><li><a>Not good for</a></li></ul>
          </div>
          <div>
            <h5>Company</h5>
            <ul><li><a>Analyst desk</a></li><li><a>Print quarterly</a></li><li><a>Careers (4)</a></li><li><a>Contact</a></li></ul>
          </div>
        </div>
        <div className="col-full row">
          <span>© 2026 EnXi Systems B.V. · Utrecht, NL</span>
          <span>Build 2026.04.20-r318 · Compiled 08:12 CET</span>
        </div>
      </div>
    </footer>
  );
}

function Home({ setPage }) {
  return (
    <>
      <section className="ledger hero">
        <div className="col-main">
          <p className="hero-quote">
            "We closed our March books on April 4th. Last year we were still closing on April&nbsp;21st."
          </p>
          <hr className="hairline" style={{margin:'24px 0 16px'}}/>
          <p className="hero-byline">— Dana Reyes, CFO · Kraus-Maffei Industrial · Posted 2026-04-14</p>
          <p className="hero-subline">EnXi is an ERP for operators who have run one before. Financial close, procure-to-pay, project accounting, and variance analysis on a single ledger.</p>
          <a className="hero-cta" onClick={(e) => { e.preventDefault(); setPage('case'); }}>
            See a customer's live dashboard <span className="arrow">↗</span>
          </a>
        </div>
        <div className="col-marg hero-filed">
          <b>Filed under</b>
          Close cycles<br/>Manufacturing<br/>Mid-market<br/><br/>
          <b>Reading time</b>
          4 min to the claim.<br/>12 min to the proof.<br/><br/>
          <b>Audited</b>
          By buyer's internal finance.<br/>See § "Methodology".
        </div>
      </section>

      <section className="ledger section">
        <div className="col-main">
          <div className="section-label">I · The claim</div>
          <h2 className="lede">Close the books in 4 days, not 17.</h2>
          <p className="nut">Mid-market manufacturers close, on median, in 9.4 business days. EnXi customers close in 4.1 — because the ledger, the subledgers, the intercompany book, and the variance model sit on one substrate, reconciled continuously, not at period-end.</p>
        </div>

        <div className="col-main stat-strip">
          <div className="stat">
            <div className="n">4.1<span style={{fontSize:20, color:'var(--enxi-color-ink-40)', marginLeft:6}}>d</span></div>
            <div className="lbl">Median close time, EnXi customers</div>
          </div>
          <div className="stat">
            <div className="n">9.4<span style={{fontSize:20, color:'var(--enxi-color-ink-40)', marginLeft:6}}>d</span></div>
            <div className="lbl">Industry median, mid-market manufacturing</div>
          </div>
          <div className="stat">
            <div className="n"><span className="accent">76%</span></div>
            <div className="lbl">Reduction in late journal entries, year-one</div>
          </div>
          <div className="stat">
            <div className="n">312</div>
            <div className="lbl">Firms in the 2026 benchmark cohort</div>
          </div>
        </div>

        <div className="col-prose body-serif">
          <p>We built EnXi because the people who use an ERP for 7 hours a day did not ask for a reimagined experience. They asked to stop waiting for the subledger to close. To see AR aging without running a report. To find the five journal entries that are actually wrong, without scrolling past the 400 that aren't.</p>
          <p>The work of an operations leader is not glamorous, and neither is the software they want. Our product is designed to get out of the way of what they already know how to do — not to teach them a new way of thinking about their business.</p>
        </div>
        <div className="col-marg marg">
          <div className="entry"><b>Cohort · 2026 benchmark</b>312 mid-market firms, $50M–$2B revenue, surveyed Jan–Mar 2026. Full methodology at /analyst/methodology.</div>
          <div className="entry"><b>Close cycle</b>From period-end calendar date to posted consolidated trial balance. Excludes statutory audit adjustments.</div>
          <div className="entry"><b>Footnote</b>Median is used rather than mean. The mean is pulled by four outliers with 60+ day close cycles.</div>
        </div>

        <div className="col-main pullq">
          "The first month on EnXi, I found a $412,000 variance my old ERP had been quietly distributing across four cost centers for two years. The variance didn't cost us money. The software hiding it did."
          <cite>— R. Okafor, Controller · Helianthus Processing · 2026-03-02</cite>
        </div>
      </section>

      <section className="ledger section">
        <div className="col-main">
          <div className="section-label">II · The evidence</div>
          <h2 className="lede">Close cycle by cohort, 2022–2026.</h2>
        </div>
        <div className="col-main chart-block">
          <h4>Business days to posted consolidated trial balance</h4>
          <div className="meta">n=312 firms · reported by CFO or controller · verified against posted close date</div>
          <div className="chart-svg">
            <SmallMultiples/>
          </div>
          <div className="cite">Source: EnXi 2026 Close Benchmarks · n=312 firms · Published 2026-04-18 · Methodology: analyst/methodology</div>
        </div>
        <div className="col-marg marg">
          <div className="entry"><b>Chart note</b>Small multiples, not stacked. Pie charts are forbidden in our style guide — they obscure change over time.</div>
          <div className="entry"><b>Cohort drift</b>7 firms left the cohort 2024→2026 (acquisition, divestiture). They are excluded from trend.</div>
        </div>
      </section>

      <section className="ledger section">
        <div className="col-main">
          <div className="section-label">III · The counter-argument</div>
          <h2 className="lede">EnXi is not the right ERP for everyone.</h2>
          <p className="nut">We publish a dedicated page listing the organizations we are a poor fit for: pre-Series A startups, pure e-commerce retailers without inventory, consultancies under 50 people. If you're in one of those categories, save the six months and buy NetSuite.</p>
          <a className="hero-cta" onClick={(e) => { e.preventDefault(); setPage('notfor'); }}>
            Read "Not good for" <span className="arrow">↗</span>
          </a>
        </div>
      </section>
    </>
  );
}

function SmallMultiples() {
  const cohorts = [
    { label: 'EnXi customers', data: [7.2, 6.4, 5.2, 4.6, 4.1], accent: true },
    { label: 'Industry median', data: [11.2, 10.8, 10.1, 9.6, 9.4] },
    { label: 'Top quartile',    data: [6.8, 6.2, 5.9, 5.6, 5.4] },
    { label: 'Bottom quartile', data: [19.4, 18.8, 18.1, 17.6, 17.1] },
  ];
  const years = ['2022','2023','2024','2025','2026'];
  const max = 20;
  return (
    <svg viewBox="0 0 800 240" preserveAspectRatio="xMidYMid meet">
      {cohorts.map((c, i) => {
        const ox = (i % 4) * 200;
        const oy = 10;
        const w = 170, h = 180;
        const pts = c.data.map((v, j) => {
          const x = ox + 14 + (j/(c.data.length-1)) * (w-28);
          const y = oy + (1 - v/max) * h;
          return [x, y];
        });
        const path = pts.map((p,j) => (j===0?'M':'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
        return (
          <g key={i}>
            <text x={ox+14} y={oy-2} fontSize="11" fontFamily="Inter" fill="#4A4A4A" fontWeight="600">{c.label}</text>
            <line x1={ox+14} x2={ox+w-14} y1={oy+h} y2={oy+h} stroke="#D8D4CA" strokeWidth="0.5"/>
            <path d={path} stroke={c.accent ? '#B4442C' : '#1B2A3A'} strokeWidth={c.accent ? 1.8 : 1.2} fill="none"/>
            {pts.map((p,j) => <circle key={j} cx={p[0]} cy={p[1]} r="2" fill={c.accent ? '#B4442C' : '#1B2A3A'}/>)}
            <text x={pts[pts.length-1][0]} y={pts[pts.length-1][1]-8} fontSize="11" fontFamily="JetBrains Mono" fill={c.accent ? '#B4442C' : '#1A1A1A'} textAnchor="end">{c.data[c.data.length-1].toFixed(1)}d</text>
            {years.map((y, yi) => (
              <text key={yi} x={ox + 14 + (yi/(years.length-1)) * (w-28)} y={oy+h+14} fontSize="9" fontFamily="JetBrains Mono" fill="#8A8A8A" textAnchor="middle">{y.slice(2)}</text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function CaseStudy() {
  return (
    <>
      <section className="ledger page-lede">
        <div className="col-main">
          <div className="kicker">Customer · Post-mortem · 6 min read</div>
          <h1 className="title">Kraus-Maffei Industrial cut their month-end close from 17 days to 4.</h1>
          <p className="dek">A controlled post-mortem of a 14-month implementation. Includes what we got wrong, what the customer had to change, and what still isn't solved.</p>
          <p className="byline">By the EnXi implementation team · Written with D. Reyes, CFO · Verified 2026-03-30 · 4,182 words</p>
        </div>
      </section>

      <section className="ledger section">
        <div className="col-main">
          <div className="roman">I</div>
          <h2 className="sect-title">Situation before</h2>
        </div>
        <div className="col-prose body-serif">
          <p>In December 2024, Kraus-Maffei's finance team closed their November books on December 18th. The controller's team had worked through the weekend twice. Three journal entries were posted after the board meeting. The CFO filed the Q4 report late.</p>
          <p>The ERP in place — a 2008-era on-prem installation, heavily customized — had last been upgraded in 2017. Ten of the twenty-two customizations had undocumented dependencies. The intercompany book was reconciled quarterly, in Excel. The close cycle was a recurring crisis.</p>
        </div>
        <div className="col-marg marg">
          <div className="entry"><b>Baseline · Nov 2024</b>Close: 17 business days<br/>Unposted JEs at close: 41<br/>Manual reconciliations: 64</div>
          <div className="entry"><b>Team</b>1 CFO, 1 Controller, 4 senior accountants, 2 AP, 2 AR, 3 analysts</div>
        </div>

        <div className="col-main" style={{marginTop: 96}}>
          <div className="roman">II</div>
          <h2 className="sect-title">What we changed</h2>
        </div>
        <div className="col-prose body-serif">
          <p>Implementation ran from January 2025 to March 2026, in four phases. The first phase migrated the GL and AP; the second, AR and fixed assets; the third, intercompany and consolidation; the fourth, the close workflow itself.</p>
          <p>We were wrong twice. Once, we underestimated the intercompany remediation — a six-week slip. Once, we shipped a variance model that silently rounded a class of micro-entries; we caught it in UAT and fixed it, but it belongs in this document.</p>
        </div>
        <div className="col-marg marg">
          <div className="entry"><b>Milestone · Jul 2025</b>Phase 2 go-live. First close on EnXi: 11 days.</div>
          <div className="entry"><b>Slip · Sep 2025</b>Intercompany remediation +6 weeks. Root cause: undocumented allocation rules.</div>
        </div>

        <div className="col-main pullq">
          "We were prepared to hear 'your data is clean.' We were not prepared to hear 'half of your allocation rules have never been written down, and the one person who remembered them retired in 2019.' We had to do that work ourselves."
          <cite>— D. Reyes, CFO · Kraus-Maffei Industrial</cite>
        </div>

        <div className="col-main" style={{marginTop: 96}}>
          <div className="roman">III</div>
          <h2 className="sect-title">Results, as of Mar 2026</h2>
        </div>
        <div className="col-main stat-strip">
          <div className="stat">
            <div className="n">4<span style={{fontSize:20, color:'var(--enxi-color-ink-40)'}}>d</span></div>
            <div className="lbl">March 2026 close</div>
          </div>
          <div className="stat">
            <div className="n">76%</div>
            <div className="lbl">Reduction in manual reconciliations</div>
          </div>
          <div className="stat">
            <div className="n"><span className="accent">3</span></div>
            <div className="lbl">Senior accountants reassigned from close to FP&amp;A</div>
          </div>
          <div className="stat">
            <div className="n">$412k</div>
            <div className="lbl">Variance recovered in month one (historical error)</div>
          </div>
        </div>

        <div className="col-main" style={{marginTop: 96}}>
          <div className="roman">IV</div>
          <h2 className="sect-title">What still isn't solved</h2>
        </div>
        <div className="col-prose body-serif">
          <p>Consolidated cash forecasting across the six operating entities still runs partly in Excel. The integration with Kraus-Maffei's Oracle HR instance is scheduled for Q3 2026 and carries implementation risk. Intercompany FX settlement takes two days longer than it should, because of a Bundesbank filing step we have not yet automated.</p>
          <p>These are honest. We will update this case study when they are resolved, and we will update it when they are not.</p>
        </div>
        <div className="col-marg marg">
          <div className="entry"><b>Next review</b>2026-Q3, with D. Reyes</div>
          <div className="entry"><b>Change log for this page</b>2026-03-30 — initial publication<br/>2026-04-14 — updated March 2026 close figure from 5d to 4d</div>
        </div>
      </section>
    </>
  );
}

function NotFor({ setPage }) {
  return (
    <>
      <section className="ledger page-lede">
        <div className="col-main">
          <div className="kicker">Trust · 3 min read</div>
          <h1 className="title">EnXi is not the right ERP for everyone. Here's who we're a poor fit for.</h1>
          <p className="dek">We publish this page because the alternative — letting you find out during implementation — is worse for both of us. If you are in one of these categories, save the six months and the legal fees.</p>
          <p className="byline">Maintained by the EnXi sales engineering team · Last updated 2026-04-02</p>
        </div>
      </section>

      <section className="ledger section">
        <div className="col-wide">
          <table className="not-for">
            <thead>
              <tr><th>You are…</th><th>Why EnXi is a poor fit</th><th>What we recommend</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>A pre-Series A startup.</td>
                <td>You don't need an ERP. You need QuickBooks and a good bookkeeper. EnXi's implementation costs more than your Series A valuation.</td>
                <td>QuickBooks Online ↗</td>
              </tr>
              <tr>
                <td>A pure e-commerce retailer without physical inventory.</td>
                <td>Our inventory, manufacturing, and supply-chain modules are 60% of the product. You'd pay for sophistication you will never use.</td>
                <td>Brightpearl or NetSuite ↗</td>
              </tr>
              <tr>
                <td>A consultancy with fewer than 50 people.</td>
                <td>You need project accounting, not enterprise financials. EnXi's project module is built for manufacturers running multi-year capital projects, not billable-hour shops.</td>
                <td>Harvest + Xero ↗</td>
              </tr>
              <tr>
                <td>A Fortune 100 enterprise with 40+ operating entities and SAP already deeply embedded.</td>
                <td>Our upper bound is 20 entities and $2B revenue. Past that, the consolidation engine has latency we have not yet engineered away. We will tell you this on the first call.</td>
                <td>Stay on SAP ↗</td>
              </tr>
              <tr>
                <td>A firm that needs a GRC / SOX-certified ERP for a public filing this fiscal year.</td>
                <td>We are SOC 2 Type II and ISO 27001, but we are not yet SOX-certified for accelerated filers. That work is in progress for 2027.</td>
                <td>Workday or Oracle Fusion ↗</td>
              </tr>
              <tr>
                <td>Looking for a low-code platform you can heavily customize in-house.</td>
                <td>EnXi is opinionated. We believe most customizations are a workaround for a bad process. If your procurement policy is "we need to customize everything," we are the wrong vendor.</td>
                <td>Acumatica ↗</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="col-main pullq" style={{marginTop: 48}}>
          "The 'Not good for' page is the thing we point every prospect to in the first call. Half the time they say, 'oh, we're definitely in your fit.' The other half, we save everybody a wasted quarter."
          <cite>— J. Wen, VP Sales Engineering · EnXi</cite>
        </div>
      </section>
    </>
  );
}

window.SiteHeader = SiteHeader;
window.SiteFooter = SiteFooter;
window.Home = Home;
window.CaseStudy = CaseStudy;
window.NotFor = NotFor;
