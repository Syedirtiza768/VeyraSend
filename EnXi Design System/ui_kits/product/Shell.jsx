const { useState } = React;

function Shell({ page, setPage, children, toast, setToast }) {
  const nav = [
    { group: 'General', items: [
      { id: 'dashboard', label: 'Overview', icon: 'M3 12h4l3-8 4 16 3-8h4' },
      { id: 'close', label: 'Period close', count: '3' },
      { id: 'reports', label: 'Reports' },
    ]},
    { group: 'Financials', items: [
      { id: 'gl', label: 'General ledger' },
      { id: 'ar', label: 'Receivables', count: '24' },
      { id: 'ap', label: 'Payables', count: '11' },
      { id: 'variance', label: 'Variance analysis', active: page === 'variance' },
    ]},
    { group: 'Operations', items: [
      { id: 'po', label: 'Purchase orders', active: page === 'po' },
      { id: 'inv', label: 'Inventory' },
      { id: 'vendors', label: 'Vendors' },
    ]},
  ];

  return (
    <div className="app">
      <header className="topbar">
        <div className="workspace">
          <span className="mark"><i/><i/><i/><i/><i/><i/></span>
          <span>EnXi</span>
          <span className="sep">/</span>
          <span className="ctx">Kraus-Maffei Industrial</span>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="#8A8A8A" strokeWidth="1.25"/></svg>
        </div>
        <div className="cmdk" onClick={() => setToast && setToast({msg:'Command palette would open', action:null})}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="#8A8A8A" strokeWidth="1.25"/><path d="M10.5 10.5l3 3" stroke="#8A8A8A" strokeWidth="1.25"/></svg>
          <span>Search or jump to…</span>
          <span className="kbd">⌘K</span>
        </div>
        <div className="user">
          <span>Period: Apr 2026</span>
          <div className="avatar">DR</div>
        </div>
      </header>

      <div className="main">
        <aside className="rail">
          {nav.map(g => (
            <div className="rail-group" key={g.group}>
              <div className="rail-label">{g.group}</div>
              {g.items.map(it => {
                const active = it.active || (page === it.id);
                return (
                  <div
                    key={it.id}
                    className={'rail-item' + (active ? ' active' : '')}
                    onClick={() => setPage && setPage(it.id)}
                  >
                    <span>{it.label}</span>
                    {it.count && <span className="count">{it.count}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </aside>

        <main className="content">{children}</main>
      </div>

      {toast && (
        <div className="toast">
          <span>{toast.msg}</span>
          {toast.action && <button onClick={toast.action.onClick}>{toast.action.label}</button>}
          <button onClick={() => setToast(null)}>×</button>
        </div>
      )}
    </div>
  );
}

window.Shell = Shell;
