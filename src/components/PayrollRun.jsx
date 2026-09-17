import { inr, round2 } from '../lib/format';

// Build a CSV of the whole run — every employee plus a totals row.
function csvCell(v) {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function runToCsv(run) {
  const header = ['Employee', 'Gross salary', 'Present', 'Absent', 'Half day',
                  'Short/late', 'Paid leave', 'LOP days', 'Deduction', 'Net payable'];
  const body = run.rows.map((r) => [
    r.name, r.grossSalary,
    r.counts.present, r.counts.absent, r.counts.half, r.counts.short, r.counts.paid,
    r.lopDays, r.deduction, r.netPayable,
  ]);
  const totals = [`Total (${run.totals.employees} employees)`, run.totals.grossSalary,
                  '', '', '', '', '', round2(run.totals.lopDays), run.totals.deduction, run.totals.netPayable];
  return [header, ...body, totals].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

function downloadCsv(run) {
  const csv = runToCsv(run);
  // BOM so Excel opens it as UTF-8
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const mm = String(run.period.month).padStart(2, '0');
  const a = document.createElement('a');
  a.href = url;
  a.download = `musterpay-payroll-${run.period.year}-${mm}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function PayrollRun({ run, loading, selectedId, onSelect }) {
  return (
    <section className="panel">
      <p className="phead">
        <span className="n">4</span> Payroll run
        {run && (
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--sys)', fontWeight: 400, color: 'var(--faint)', fontSize: 12 }}>
              click a row for its payslip
            </span>
            <button
              className="btn"
              style={{ padding: '6px 12px', fontSize: 12.5 }}
              onClick={() => downloadCsv(run)}
              title="Download the whole run as a spreadsheet"
            >
              ⭳ Download CSV
            </button>
          </span>
        )}
      </p>

      {!run ? (
        <div className="muted">{loading ? 'Loading…' : 'No run yet.'}</div>
      ) : (
        <div className="ptwrap">
          <table className="ptable">
            <thead>
              <tr><th>Employee</th><th>Gross</th><th>LOP days</th><th>Deduction</th><th>Net payable</th></tr>
            </thead>
            <tbody>
              {run.rows.map((r) => (
                <tr
                  key={r.employeeId}
                  className={String(r.employeeId) === String(selectedId) ? 'sel' : ''}
                  onClick={() => onSelect(String(r.employeeId))}
                >
                  <td>{r.name}</td>
                  <td className="num">{inr(r.grossSalary)}</td>
                  <td className={`num${r.lopDays === 0 ? ' zero' : ''}`}>{r.lopDays}</td>
                  <td className={`num ded${r.deduction === 0 ? ' zero' : ''}`}>
                    {r.deduction > 0 ? `− ${inr(r.deduction)}` : inr(0)}
                  </td>
                  <td className="num net">{inr(r.netPayable)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>{run.totals.employees} employees</td>
                <td className="num">{inr(run.totals.grossSalary)}</td>
                <td className="num">{round2(run.totals.lopDays)}</td>
                <td className="num" style={{ color: 'var(--debit)' }}>− {inr(run.totals.deduction)}</td>
                <td className="num pay">{inr(run.totals.netPayable)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
