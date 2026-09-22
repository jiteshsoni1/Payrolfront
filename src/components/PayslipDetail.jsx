import { jsPDF } from 'jspdf';
import { inr, MONTHS } from '../lib/format';

// PDFs use "Rs." because the built-in PDF fonts don't include the ₹ glyph.
const rs = (n) => 'Rs. ' + Math.abs(Number(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function downloadPayslipPdf(row, month, year) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  const GREEN = [14, 90, 70], INK = [27, 37, 48], MUTED = [94, 106, 118], DEBIT = [165, 53, 42], TINT = [234, 241, 236];
  const c = row.counts;
  const b = row.breakdown || { absent: 0, half: 0, short: 0, excessPaid: 0 };

  const line = (label, amount, y, o = {}) => {
    doc.setFont('helvetica', o.bold ? 'bold' : 'normal');
    doc.setFontSize(o.size || 10.5);
    doc.setTextColor(...(o.color || INK));
    doc.text(label, M, y);
    if (amount != null) {
      doc.setTextColor(...(o.amtColor || o.color || INK));
      doc.text(amount, W - M, y, { align: 'right' });
    }
  };
  const rule = (y, color = [215, 219, 223], w = 0.7) => { doc.setDrawColor(...color); doc.setLineWidth(w); doc.line(M, y, W - M, y); };
  const heading = (t, y, color) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...color); doc.text(t.toUpperCase(), M, y); };

  // header band
  doc.setFillColor(...GREEN); doc.rect(0, 0, W, 84, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text('MusterPay', M, 40);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.text('Salary Payslip', M, 60);
  doc.setFontSize(11); doc.text(`${MONTHS[month - 1]} ${year}`, W - M, 46, { align: 'right' });

  // employee
  let y = 120;
  doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.text(row.name, M, y);
  y += 15; doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...MUTED);
  doc.text(`Per-day rate ${rs(row.perDay)}  (gross salary divided by days in month)`, M, y);

  // earnings
  y += 28; heading('Earnings', y, GREEN);
  y += 16; line('Gross salary', rs(row.grossSalary), y);
  y += 10; rule(y);

  // deductions
  y += 22; heading('Deductions', y, DEBIT);
  const ded = (label, amt, y2) => line(label, '- ' + rs(amt), y2, { amtColor: DEBIT });
  if (c.absent > 0) { y += 16; ded(`Absent (${c.absent} day${c.absent === 1 ? '' : 's'})`, b.absent, y); }
  if (c.half > 0) { y += 16; ded(`Half day (${c.half})`, b.half, y); }
  if (c.short > 0) { y += 16; ded(`Short leave / late (${c.short})`, b.short, y); }
  if (row.excessPaid > 0) { y += 16; ded(`Paid leave beyond allowance (${row.excessPaid})`, b.excessPaid, y); }
  if (c.absent === 0 && c.half === 0 && c.short === 0 && row.excessPaid === 0) { y += 16; line('No deductions this month', null, y, { color: MUTED }); }
  y += 10; rule(y);
  y += 18; line(`Total Loss of Pay (${row.lopDays} day${row.lopDays === 1 ? '' : 's'})`, '- ' + rs(row.deduction), y, { bold: true, amtColor: DEBIT });

  // net payable
  y += 14; doc.setFillColor(...TINT); doc.rect(M, y, W - 2 * M, 34, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...INK); doc.text('NET PAYABLE', M + 12, y + 22);
  doc.setFontSize(15); doc.setTextColor(...GREEN); doc.text(rs(row.netPayable), W - M - 12, y + 23, { align: 'right' });
  y += 34;

  // attendance summary
  y += 26; heading('Attendance summary', y, MUTED);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...INK);
  y += 16; doc.text(`Present ${c.present}     Absent ${c.absent}     Half day ${c.half}     Short/late ${c.short}`, M, y);
  y += 14; doc.text(`Paid leave ${c.paid}     Holiday ${c.holiday}     Weekly-off ${c.off}`, M, y);

  // footer
  doc.setFontSize(8.5); doc.setTextColor(...MUTED);
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  doc.text(`Generated on ${today}  \u00b7  MusterPay`, M, doc.internal.pageSize.getHeight() - 40);

  const safe = String(row.name).replace(/[^a-z0-9]+/gi, '-');
  doc.save(`payslip-${safe}-${year}-${String(month).padStart(2, '0')}.pdf`);
}

function Line({ label, calc, amt }) {
  return (
    <div className="lrow debit">
      <div className="desc">Less: {label} <span className="calc">{calc}</span></div>
      <div className="amt">&minus; {inr(amt)}</div>
    </div>
  );
}

export default function PayslipDetail({ row, month, year }) {
  return (
    <section className="ledger">
      <p className="phead">
        <span className="n">5</span> Payslip detail
        {row ? (
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="dsel" style={{ marginLeft: 0 }}>{row.name} &middot; {MONTHS[month - 1]} {year}</span>
            <button className="btn" style={{ padding: '6px 12px', fontSize: 12.5 }}
              onClick={() => downloadPayslipPdf(row, month, year)}
              title="Download this payslip as a PDF">
              ⭳ Payslip PDF
            </button>
          </span>
        ) : <span className="dsel">&mdash;</span>}
      </p>

      {!row ? (
        <div className="muted">Select an employee in the run above.</div>
      ) : (() => {
        const c = row.counts;
        const b = row.breakdown || { absent: 0, half: 0, short: 0, excessPaid: 0 };
        return (
          <>
            <div className="lrow credit">
              <div className="desc">Gross salary <span className="calc">{inr(row.grossSalary)} &divide; day = {inr(row.perDay)}</span></div>
              <div className="amt">{inr(row.grossSalary)}</div>
            </div>
            {c.absent > 0 && <Line label="Absent" calc={`${c.absent} day${c.absent === 1 ? '' : 's'}`} amt={b.absent} />}
            {c.half > 0 && <Line label="Half day" calc={`${c.half} marked`} amt={b.half} />}
            {c.short > 0 && <Line label="Short leave" calc={`${c.short} \u00B7 late arrival`} amt={b.short} />}
            {row.coveredPaid > 0 && (
              <div className="lrow zero">
                <div className="desc">Paid leave <span className="calc">{row.coveredPaid} free this month</span></div>
                <div className="amt">covered &middot; &#8377;0.00</div>
              </div>
            )}
            {row.excessPaid > 0 && <Line label="Paid leave" calc={`${row.excessPaid} \u00B7 beyond allowance`} amt={b.excessPaid} />}
            <div className="lrow zero">
              <div className="desc">Present, holidays &amp; weekly-offs <span className="calc">{c.present + c.holiday + c.off} paid days</span></div>
              <div className="amt">no deduction</div>
            </div>
            <div className="lrow sub">
              <div className="desc">Total Loss of Pay ({row.lopDays} day{row.lopDays === 1 ? '' : 's'})</div>
              <div className="amt" style={{ color: 'var(--debit)' }}>&minus; {inr(row.deduction)}</div>
            </div>
            <div className="lrow">
              <div className="desc" style={{ fontWeight: 600 }}>Net payable</div>
              <div className="amt" style={{ fontWeight: 600 }}>{inr(row.netPayable)}</div>
            </div>
          </>
        );
      })()}
    </section>
  );
}