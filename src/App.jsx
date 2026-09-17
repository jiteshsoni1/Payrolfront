import { useEffect, useState, useCallback } from 'react';
import { api, API_BASE, getToken, setUnauthorizedHandler } from './api';
import { daysInMonth } from './lib/format';
import Login from './components/Login.jsx';
import PolicyBar from './components/PolicyBar.jsx';
import Roster from './components/Roster.jsx';
import MusterMatrix from './components/MusterMatrix.jsx';
import PayrollRun from './components/PayrollRun.jsx';
import PayslipDetail from './components/PayslipDetail.jsx';

export default function App() {
  // ---- auth ----
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    let active = true;
    (async () => {
      if (getToken()) {
        try { const data = await api.me(); if (active) setUser(data.user); }
        catch (_) { /* token invalid; already cleared */ }
      }
      if (active) setAuthChecking(false);
    })();
    return () => { active = false; };
  }, []);

  const logout = () => { api.logout(); setUser(null); };

  // ---- payroll state ----
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(9); // 1-12

  const [employees, setEmployees] = useState([]);
  const [attMap, setAttMap] = useState({}); // { empId: { day: status } }
  const [run, setRun] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [brush, setBrush] = useState('absent');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const buildAttMap = (records) => {
    const m = {};
    for (const r of records) {
      const day = new Date(r.date).getUTCDate();
      const id = String(r.employeeId);
      if (!m[id]) m[id] = {};
      m[id][day] = r.status;
    }
    return m;
  };

  const loadMonth = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [emps, att, r] = await Promise.all([
        api.listEmployees(),
        api.listAttendance(year, month),
        api.runPayroll(year, month),
      ]);
      setEmployees(emps);
      setAttMap(buildAttMap(att));
      setRun(r);
      setSelectedId((prev) =>
        prev && emps.some((e) => String(e._id) === String(prev))
          ? prev
          : emps.length ? String(emps[0]._id) : null
      );
    } catch (e) {
      const net = e instanceof TypeError;
      setError(net
        ? `Couldn't reach the API. Start the server (npm run dev) — expecting it at ${API_BASE}.`
        : (e.message || 'Something went wrong.'));
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  // only load data once signed in
  useEffect(() => { if (user) loadMonth(); }, [loadMonth, user]);

  const refreshRun = useCallback(async () => {
    try { setRun(await api.runPayroll(year, month)); } catch (e) { setError(e.message); }
  }, [year, month]);

  const markCell = async (empId, day, status) => {
    const id = String(empId);
    setAttMap((prev) => {
      const next = { ...prev, [id]: { ...(prev[id] || {}) } };
      if (status === 'present') delete next[id][day];
      else next[id][day] = status;
      return next;
    });
    setSaving(true);
    try {
      await api.markAttendance({ employeeId: empId, year, month, day, status });
      await refreshRun();
    } catch (e) {
      setError(e.message);
      try { setAttMap(buildAttMap(await api.listAttendance(year, month))); } catch (_) {}
    } finally { setSaving(false); }
  };

  const addEmployee = async () => {
    setSaving(true);
    try {
      const emp = await api.createEmployee({ name: `Employee ${employees.length + 1}`, monthlySalary: 10000 });
      setEmployees((prev) => [...prev, emp]);
      if (!selectedId) setSelectedId(String(emp._id));
      await refreshRun();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const patchEmployeeLocal = (id, patch) =>
    setEmployees((prev) => prev.map((e) => (String(e._id) === String(id) ? { ...e, ...patch } : e)));

  const commitEmployee = async (id, patch) => {
    setSaving(true);
    try { await api.updateEmployee(id, patch); await refreshRun(); }
    catch (e) { setError(e.message); await loadMonth(); }
    finally { setSaving(false); }
  };

  const removeEmployee = async (id) => {
    setSaving(true);
    try {
      await api.deleteEmployee(id);
      setEmployees((prev) => prev.filter((e) => String(e._id) !== String(id)));
      setAttMap((prev) => { const n = { ...prev }; delete n[String(id)]; return n; });
      if (String(selectedId) === String(id)) setSelectedId(null);
      await refreshRun();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const savePolicy = async (patch) => {
    setSaving(true);
    try { await api.updatePolicy(patch); await refreshRun(); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const finalize = async () => {
    setSaving(true); setNotice('');
    try {
      const res = await api.finalize(year, month);
      setNotice(`Finalized ${res.finalized} payslip(s) for this month.`);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  // ---- auth gates ----
  if (authChecking) {
    return <div className="wrap" style={{ marginTop: 90, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>;
  }
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const nDays = daysInMonth(year, month);
  const selectedRow = run?.rows?.find((r) => String(r.employeeId) === String(selectedId));
  const selectedEmp = employees.find((e) => String(e._id) === String(selectedId));

  return (
    <div className="wrap">
      <header className="mast">
        <div className="brand"><span className="mark">&#8377;</span><h1>MusterPay</h1></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12.5, color: 'var(--faint)' }}>{user.email}</span>
          <button className="btn" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={logout}>Sign out</button>
        </div>
      </header>

      {error && (
        <div className="banner err">
          <span>{error}</span>
          <button onClick={loadMonth}>Retry</button>
        </div>
      )}
      {notice && (
        <div className="banner ok">
          <span>{notice}</span>
          <button onClick={() => setNotice('')}>Dismiss</button>
        </div>
      )}

      <div className="sheet">
        <PolicyBar
          year={year} setYear={setYear} month={month} setMonth={setMonth}
          nDays={nDays} saving={saving} loading={loading} onFinalize={finalize}
          policy={run?.policy} onSavePolicy={savePolicy}
        />
        <Roster
          employees={employees} onAdd={addEmployee}
          onPatch={patchEmployeeLocal} onCommit={commitEmployee} onRemove={removeEmployee}
        />
        <MusterMatrix
          employees={employees} attMap={attMap} year={year} month={month} nDays={nDays}
          brush={brush} setBrush={setBrush} onMark={markCell}
        />
        <PayrollRun run={run} loading={loading} selectedId={selectedId} onSelect={setSelectedId} />
        <PayslipDetail row={selectedRow} emp={selectedEmp} year={year} month={month} />
      </div>

      <div className="foot">
        <span>MusterPay client &middot; React + Vite &middot; talking to the MusterPay API.</span>
      </div>
    </div>
  );
}
