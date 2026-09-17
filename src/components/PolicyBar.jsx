import { useState, useEffect } from 'react';
import { MONTHS } from '../lib/format';

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
const FIELDS = [
  { key: 'absentWeight', label: 'Absent = day', step: '0.05' },
  { key: 'halfWeight', label: 'Half day = day', step: '0.05' },
  { key: 'shortWeight', label: 'Short / late = day', step: '0.05' },
  { key: 'freePaidLeavesPerMonth', label: 'Free paid leaves / month', step: '1' },
];

export default function PolicyBar({ year, setYear, month, setMonth, nDays, saving, loading, onFinalize, policy, onSavePolicy }) {
  const [local, setLocal] = useState({ absentWeight: 1, halfWeight: 0.5, shortWeight: 0.25, freePaidLeavesPerMonth: 1 });

  useEffect(() => {
    if (policy) {
      setLocal({
        absentWeight: policy.absentWeight,
        halfWeight: policy.halfWeight,
        shortWeight: policy.shortWeight,
        freePaidLeavesPerMonth: policy.freePaidLeavesPerMonth,
      });
    }
  }, [policy]);

  const onChange = (k) => (e) => setLocal((p) => ({ ...p, [k]: e.target.value }));
  const onCommit = (k) => (e) => {
    const v = Number(e.target.value);
    if (!Number.isNaN(v) && policy && v !== policy[k]) onSavePolicy({ [k]: v });
  };

  return (
    <section className="panel">
      <p className="phead">
        <span className="n">1</span> Pay period &amp; deduction policy
        {(saving || loading) && <span className="aside">{saving ? 'saving\u2026' : 'loading\u2026'}</span>}
      </p>

      <div className="toolbar">
        <div className="tfield">
          <label className="lbl">Month</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="tfield">
          <label className="lbl">Year</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="tfield end">
          <button className="btn" onClick={onFinalize} disabled={saving}>Finalize payslips</button>
        </div>
      </div>

      <div className="toolbar" style={{ marginTop: 12 }}>
        {FIELDS.map((f) => (
          <div className="tfield" key={f.key}>
            <label className="lbl">{f.label}</label>
            <input
              type="number" min="0" step={f.step}
              value={local[f.key]}
              onChange={onChange(f.key)}
              onBlur={onCommit(f.key)}
              disabled={!policy}
            />
          </div>
        ))}
      </div>

      <div className="readout">
        <b>{MONTHS[month - 1]} {year}</b> &middot; {nDays} days &middot; each salary is divided by these days.
        The deduction weights above apply to everyone and save as you change them.
      </div>
    </section>
  );
}
