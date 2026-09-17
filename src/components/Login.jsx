import { useState } from 'react';
import { api } from '../api';

const inputStyle = {
  width: '100%', background: 'var(--field)', color: 'var(--ink)',
  border: '1px solid var(--field-line)', borderRadius: 7, padding: '10px 12px',
  fontFamily: 'var(--sys)', fontSize: 14,
};

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const user = await api.login(email.trim(), password);
      onLogin(user);
    } catch (e2) {
      setErr(e2 instanceof TypeError ? "Couldn't reach the server. Is it running?" : (e2.message || 'Could not sign in.'));
    } finally { setBusy(false); }
  };

  return (
    <div className="wrap" style={{ maxWidth: 420, marginTop: 80 }}>
      <header className="mast" style={{ justifyContent: 'center', marginBottom: 18 }}>
        <div className="brand"><span className="mark">&#8377;</span><h1>MusterPay</h1></div>
      </header>
      <div className="sheet">
        <section className="panel">
          <p className="phead" style={{ marginBottom: 16 }}>Sign in to continue</p>
          {err && <div className="banner err" style={{ marginBottom: 14 }}><span>{err}</span></div>}
          <form onSubmit={submit}>
            <div style={{ marginBottom: 12 }}>
              <label className="lbl">Email</label>
              <input type="email" style={inputStyle} value={email}
                     onChange={(e) => setEmail(e.target.value)} autoFocus autoComplete="username" />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="lbl">Password</label>
              <input type="password" style={inputStyle} value={password}
                     onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <button className="btn" type="submit" disabled={busy} style={{ width: '100%', padding: '10px' }}>
              {busy ? 'Signing in\u2026' : 'Sign in'}
            </button>
          </form>
        </section>
      </div>
      <div className="foot" style={{ textAlign: 'center' }}>MusterPay &middot; HR access only</div>
    </div>
  );
}
