const { useState: useStatePO } = React;

function POPage({ setPage, setToast }) {
  const [submitted, setSubmitted] = useStatePO(false);
  const [lines, setLines] = useStatePO([
    { sku: 'HX-4120-B', desc: 'Hex bolt M12×40 (zinc, grade 8.8)', qty: '2,500', uom: 'EA', price: '0.84', },
    { sku: 'GK-88-NBR', desc: 'Gasket NBR 88 — flange seal', qty: '400', uom: 'EA', price: '3.20' },
    { sku: 'BRG-6204-2Z', desc: 'Deep-groove ball bearing 6204-2Z', qty: '60', uom: 'EA', price: '11.40' },
  ]);
  const subtotal = lines.reduce((a,l) => a + parseFloat(l.qty.replace(',','')) * parseFloat(l.price), 0);
  const shipping = 480;
  const tax = subtotal * 0.195;

  return (
    <>
      <div className="crumb">
        <span style={{cursor:'pointer'}} onClick={() => setPage('dashboard')}>Operations</span>
        <span className="sep">/</span>
        <span style={{cursor:'pointer'}} onClick={() => setPage('dashboard')}>Purchase orders</span>
        <span className="sep">/</span>
        <b>PO-2026-04-0182 · Draft</b>
      </div>

      <div className="page-h">
        <div>
          <h1>Purchase order — Siemens AG</h1>
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn btn-secondary">Save draft</button>
          <button className="btn btn-secondary">Send for approval</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSubmitted(true);
              setToast({
                msg: 'PO-2026-04-0182 committed · $9,130.00',
                action: { label: 'Undo', onClick: () => setSubmitted(false) }
              });
              setTimeout(() => setToast(null), 7000);
            }}
          >Commit PO ⌘↵</button>
        </div>
      </div>

      <div className="panel" style={{marginBottom: 18}}>
        <div className="form-row">
          <div className="field">
            <label>Vendor</label>
            <input defaultValue="Siemens AG · DE-V-00472"/>
            <div className="help">On-contract vendor · NET-30</div>
          </div>
          <div className="field">
            <label>Requisitioner</label>
            <input defaultValue="K. Tanaka · Procurement"/>
          </div>
          <div className="field">
            <label>Requested ship-to</label>
            <input defaultValue="Warehouse 4 — Munich, DE"/>
          </div>
          <div className="field">
            <label>Need-by date</label>
            <input defaultValue="2026-05-04" className="mono"/>
            <div className="err">Vendor lead time is 16 days — confirm or choose a later date</div>
          </div>
          <div className="field">
            <label>GL coding</label>
            <input defaultValue="5100-PARTS · Cost center 402"/>
          </div>
          <div className="field">
            <label>Project / WBS</label>
            <input defaultValue="Q2-MX-FLANGE-RETROFIT" className="mono"/>
          </div>
        </div>
      </div>

      <div className="stanza" style={{marginTop:0, borderTop:0, paddingTop:0}}>
        <div className="stanza-h">
          <h2>Line items<span style={{fontFamily:'var(--enxi-font-mono)', fontSize:11, color:'#8A8A8A', fontWeight:400, marginLeft:10}}>3 lines · double-click a cell to edit</span></h2>
          <button className="btn btn-ghost">+ Add line</button>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Description</th>
                <th className="num">Qty</th>
                <th>UOM</th>
                <th className="num">Unit</th>
                <th className="num">Extended</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const ext = parseFloat(l.qty.replace(',','')) * parseFloat(l.price);
                return (
                  <tr key={i}>
                    <td className="mono">{l.sku}</td>
                    <td>{l.desc}</td>
                    <td className="num">{l.qty}</td>
                    <td className="mono">{l.uom}</td>
                    <td className="num">{l.price}</td>
                    <td className="num">{ext.toLocaleString('en-US',{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                    <td>
                      <span className={'chip ' + (i===1 ? 'warn' : 'success')}>
                        {i===1 ? 'Stock low @ vendor' : 'In stock'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="totals">
        <div className="row"><span>Subtotal</span><span className="num">{subtotal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
        <div className="row"><span>Shipping (est.)</span><span className="num">{shipping.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
        <div className="row"><span>VAT (19.5%)</span><span className="num">{tax.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
        <div className="row total"><span>Total — EUR</span><span className="num">{(subtotal+shipping+tax).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
      </div>

      <p className="micro" style={{marginTop: 24, fontFamily:'var(--enxi-font-mono)', letterSpacing:0, textTransform:'none', fontWeight: 400}}>
        Draft saved 08:47 · auto-saves every keystroke · ⌘↵ to commit, ⌘Z to undo last change
      </p>
    </>
  );
}

window.POPage = POPage;
