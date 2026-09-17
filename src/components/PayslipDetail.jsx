import { inr, MONTHS } from '../lib/format';

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
        <span className="dsel">{row ? `${row.name} \u00B7 ${MONTHS[month - 1]} ${year}` : '\u2014'}</span>
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
