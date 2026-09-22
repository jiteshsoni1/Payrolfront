import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { api } from '../api';
import { inr, MONTHS } from '../lib/format';

const rs = (n) => 'Rs. ' + Math.abs(Number(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function downloadPayslipPdf(p, employeeName) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  const GREEN = [14, 90, 70], INK = [27, 37, 48], MUTED = [94, 106, 118], DEBIT = [165, 53, 42], TINT = [234, 241, 236];
  const c = p.counts || { present: 0, absent: 0, half: 0, short: 0, paid: 0, holiday: 0, off: 0 };

  const line = (label, amount, y, o = {}) => {
    doc.setFont('helvetica', o.bold ? 'bold' : 'normal'); doc.setFontSize(o.size || 10.5);
    doc.setTextColor(...(o.color || INK)); doc.text(label, M, y);
    if (amount != null) { doc.setTextColor(...(o.amtColor || o.color || INK)); doc.text(amount, W - M, y, { align: 'right' }); }
  };
  const rule = (y) => { doc.setDrawColor(215, 219, 223); doc.setLineWidth(0.7); doc.line(M, y, W - M, y); };
  const heading = (t, y, color) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...color); doc.text(t.toUpperCase(), M, y); };

  doc.setFillColor(...GREEN); doc.rect(0, 0, W, 84, 'F'); doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text('MusterPay', M, 40);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.text('Salary Payslip', M, 60);
  doc.setFontSize(11); doc.text(`${MONTHS[p.month - 1]} ${p.year}`, W - M, 46, { align: 'right' });

  let y = 120;
  doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.text(employeeName, M, y);
  y += 15; doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...MUTED);
  doc.text(`Per-day rate ${rs(p.perDay)}  (gross salary divided by days in month)`, M, y);

  y += 28; heading('Earnings', y, GREEN);
  y += 16; line('Gross salary', rs(p.grossSalary), y);
  y += 10; rule(y);

  y += 22; heading('Deductions', y, DEBIT);
  y += 16; line(`Loss of Pay (${p.lopDays} day${p.lopDays === 1 ? '' : 's'})`, '- ' + rs(p.deduction), y, { amtColor: DEBIT });
  y += 10; rule(y);

  y += 14; doc.setFillColor(...TINT); doc.rect(M, y, W - 2 * M, 34, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...INK); doc.text('NET PAYABLE', M + 12, y + 22);
  doc.setFontSize(15); doc.setTextColor(...GREEN); doc.text(rs(p.netPayable), W - M - 12, y + 23, { align: 'right' }); y += 34;

  y += 26; heading('Attendance summary', y, MUTED);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...INK);
  y += 16; doc.text(`Present ${c.present}     Absent ${c.absent}     Half day ${c.half}     Short/late ${c.short}`, M, y);
  y += 14; doc.text(`Paid leave ${c.paid}     Holiday ${c.holiday}     Weekly-off ${c.off}`, M, y);

  doc.setFontSize(8.5); doc.setTextColor(...MUTED);
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  doc.text(`Generated on ${today}  \u00b7  MusterPay`, M, doc.internal.pageSize.getHeight() - 40);

  const safe = String(employeeName).replace(/[^a-z0-9]+/gi, '-');
  doc.save(`payslip-${safe}-${p.year}-${String(p.month).padStart(2, '0')}.pdf`);
}

export default function EmployeePortal({ user, onLogout }) {
  const [name, setName] = useState(user?.name || 'You');
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true); setError('');
      try {
        const data = await api.getMyPayslips();
        if (data.employee?.name) setName(data.employee.name);
        setPayslips(data.payslips || []);
      } catch (e) {
        setError(e instanceof TypeError ? "Couldn't reach the server." : (e.message || 'Could not load your payslips.'));
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="wrap">
      <header className="mast">
        <div className="brand"><span className="mark">&#8377;</span><h1>MusterPay</h1></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12.5, color: 'var(--faint)' }}>{name}</span>
          <button className="btn" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={onLogout}>Sign out</button>
        </div>
      </header>

      {error && <div className="banner err"><span>{error}</span></div>}

      <div className="sheet">
        <section className="panel">
          <p className="phead">Your payslips</p>

          {loading ? (
            <div className="muted">Loading…</div>
          ) : payslips.length === 0 ? (
            <div className="muted">No payslips yet — they’ll appear here once HR finalizes payroll for a month.</div>
          ) : (
            <div className="ptwrap">
              <table className="ptable">
                <thead>
                  <tr><th>Period</th><th>Gross</th><th>LOP days</th><th>Deduction</th><th>Net payable</th><th /></tr>
                </thead>
                <tbody>
                  {payslips.map((p) => (
                    <tr key={p._id} style={{ cursor: 'default' }}>
                      <td>{MONTHS[p.month - 1]} {p.year}</td>
                      <td className="num">{inr(p.grossSalary)}</td>
                      <td className={`num${p.lopDays === 0 ? ' zero' : ''}`}>{p.lopDays}</td>
                      <td className={`num ded${p.deduction === 0 ? ' zero' : ''}`}>
                        {p.deduction > 0 ? `\u2212 ${inr(p.deduction)}` : inr(0)}
                      </td>
                      <td className="num net">{inr(p.netPayable)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn" style={{ padding: '5px 10px', fontSize: 12 }}
                          onClick={() => downloadPayslipPdf(p, name)}>⭳ PDF</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <div className="foot"><span>MusterPay &middot; your payslips are visible only to you.</span></div>
    </div>
  );
}