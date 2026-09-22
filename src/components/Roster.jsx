import { useState } from 'react';

const GRID = '1fr 150px auto 34px';
const inputStyle = {
  width: '100%', background: 'var(--field)', color: 'var(--ink)',
  border: '1px solid var(--field-line)', borderRadius: 7, padding: '8px 10px',
  fontFamily: 'var(--sys)', fontSize: 13,
};

export default function Roster({ employees, onAdd, onPatch, onCommit, onRemove, onCreateLogin }) {
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

  return (
    <section className="panel">
      <p className="phead">
        <span className="n">2</span> Team &amp; salaries
        <span className="aside">{employees.length} on the team</span>
      </p>

      {okMsg && <div className="banner ok" style={{ marginBottom: 12 }}><span>{okMsg}</span></div>}

      <div className="rlist">
        <div className="rrow rhdr" style={{ gridTemplateColumns: GRID }}>
          <span>Name</span><span className="r">Monthly salary</span><span>Login</span><span />
        </div>

        {employees.map((e) => (
          <div key={e._id}>
            <div className="rrow" style={{ gridTemplateColumns: GRID }}>
              <input
                type="text" value={e.name}
                onChange={(ev) => onPatch(e._id, { name: ev.target.value })}
                onBlur={(ev) => onCommit(e._id, { name: ev.target.value })}
              />
              <div className="money-in">
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
                style={{
                  border: '1px solid var(--field-line)',
                  background: e.loginEmail ? 'var(--tint)' : 'var(--field)',
                  color: e.loginEmail ? 'var(--brand)' : 'var(--muted)',
                  borderRadius: 7, padding: '7px 10px', fontSize: 12, fontFamily: 'var(--sys)',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {e.loginEmail ? '\u2713 Login set' : 'Set up login'}
              </button>
              <button className="xbtn" title="Remove" onClick={() => onRemove(e._id)}>&times;</button>
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