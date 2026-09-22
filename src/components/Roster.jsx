import { useState, useEffect } from 'react';

// track narrow screens so the row can reflow on mobile
function useNarrow(bp = 560) {
  const [n, setN] = useState(() => typeof window !== 'undefined' && window.matchMedia(`(max-width:${bp}px)`).matches);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp}px)`);
    const on = () => setN(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [bp]);
  return n;
}

const inputStyle = {
  width: '100%', background: 'var(--field)', color: 'var(--ink)',
  border: '1px solid var(--field-line)', borderRadius: 7, padding: '8px 10px',
  fontFamily: 'var(--sys)', fontSize: 13,
};

export default function Roster({ employees, onAdd, onPatch, onCommit, onRemove, onCreateLogin }) {
  const narrow = useNarrow();
  const [openId, setOpenId] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const open = (e) => { setOpenId(e._id); setEmail(e.loginEmail || ''); setPassword(''); setErr(''); };
  const close = () => { setOpenId(null); setErr(''); setPassword(''); };

  const save = async (empId) => {
    setErr(''); setBusy(true);
    try {
      const res = await onCreateLogin(empId, { email: email.trim(), password });
      setOkMsg(`Login ready: ${res.loginEmail}`);
      setOpenId(null); setPassword('');
      setTimeout(() => setOkMsg(''), 4000);
    } catch (e) {
      setErr(e.message || 'Could not create login.');
    } finally { setBusy(false); }
  };

  const rowStyle = { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--rule)' };
  const nameCell = { flex: narrow ? '1 1 100%' : '1 1 180px', minWidth: 0 };
  const salCell = { flex: narrow ? '1 1 120px' : '0 0 150px' };

  const loginBtnStyle = (has) => ({
    flex: '0 0 auto', border: '1px solid var(--field-line)',
    background: has ? 'var(--tint)' : 'var(--field)', color: has ? 'var(--brand)' : 'var(--muted)',
    borderRadius: 7, padding: '7px 10px', fontSize: 12, fontFamily: 'var(--sys)', cursor: 'pointer', whiteSpace: 'nowrap',
  });

  return (
    <section className="panel">
      <p className="phead">
        <span className="n">2</span> Team &amp; salaries
        <span className="aside">{employees.length} on the team</span>
      </p>

      {okMsg && <div className="banner ok" style={{ marginBottom: 12 }}><span>{okMsg}</span></div>}

      <div>
        {!narrow && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '0 0 9px', borderBottom: '1px solid var(--rule-strong)' }}>
            <span style={{ flex: '1 1 180px', fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Name</span>
            <span style={{ flex: '0 0 150px', textAlign: 'right', paddingRight: 6, fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Monthly salary</span>
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Login</span>
            <span style={{ width: 30 }} />
          </div>
        )}

        {employees.map((e) => (
          <div key={e._id}>
            <div style={rowStyle}>
              <div style={nameCell}>
                <input
                  type="text" style={{ width: '100%' }} value={e.name}
                  onChange={(ev) => onPatch(e._id, { name: ev.target.value })}
                  onBlur={(ev) => onCommit(e._id, { name: ev.target.value })}
                />
              </div>
              <div className="money-in" style={salCell}>
                <span className="cur">&#8377;</span>
                <input
                  type="number" min="0" step="500" value={e.monthlySalary}
                  onChange={(ev) => onPatch(e._id, { monthlySalary: Number(ev.target.value) })}
                  onBlur={(ev) => onCommit(e._id, { monthlySalary: Number(ev.target.value) })}
                />
              </div>
              <button
                type="button"
                onClick={() => (openId === e._id ? close() : open(e))}
                title={e.loginEmail ? `Login: ${e.loginEmail} — click to reset password` : 'Create a login for this employee'}
                style={loginBtnStyle(!!e.loginEmail)}
              >
                {e.loginEmail ? '\u2713 Login set' : 'Set up login'}
              </button>
              <button className="xbtn" style={{ flex: '0 0 auto' }} title="Remove" onClick={() => onRemove(e._id)}>&times;</button>
            </div>

            {openId === e._id && (
              <div style={{ background: 'var(--tint)', border: '1px solid var(--rule)', borderRadius: 8, padding: '12px 14px', margin: '2px 0 8px' }}>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>
                  {e.loginEmail ? `Reset the login for ${e.name}` : `Create a login for ${e.name}`} — they sign in with this email and password.
                </div>
                {err && <div className="banner err" style={{ marginBottom: 10 }}><span>{err}</span></div>}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <label className="lbl">Login email</label>
                    <input type="email" style={inputStyle} value={email} onChange={(ev) => setEmail(ev.target.value)} autoComplete="off" />
                  </div>
                  <div style={{ flex: '1 1 150px' }}>
                    <label className="lbl">Password</label>
                    <input type="password" style={inputStyle} value={password} onChange={(ev) => setPassword(ev.target.value)} autoComplete="new-password" />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" style={{ padding: '8px 14px', fontSize: 13 }} disabled={busy} onClick={() => save(e._id)}>
                      {busy ? 'Saving\u2026' : 'Save login'}
                    </button>
                    <button
                      style={{ border: '1px solid var(--field-line)', background: 'var(--field)', color: 'var(--muted)', borderRadius: 7, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
                      onClick={close}
                    >Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {employees.length === 0 && <div className="muted" style={{ padding: '10px 0' }}>No employees yet — add one to begin.</div>}
      </div>

      <button className="addbtn" onClick={onAdd}>+ Add employee</button>
    </section>
  );
}
