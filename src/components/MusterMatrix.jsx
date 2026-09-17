import { STATUS, BRUSHES, isSunday } from '../lib/format';

export default function MusterMatrix({ employees, attMap, year, month, nDays, brush, setBrush, onMark }) {
  const days = Array.from({ length: nDays }, (_, i) => i + 1);
  const tpl = `132px repeat(${nDays}, 30px)`;

  const resolve = (empId, day) => {
    const m = attMap[String(empId)];
    if (m && m[day]) return m[day];
    return isSunday(year, month, day) ? 'off' : 'present';
  };

  return (
    <section className="panel">
      <p className="phead">
        <span className="n">3</span> Attendance &mdash; muster roll
        <span className="aside">pick a status, click cells &middot; scrolls sideways</span>
      </p>

      <div className="palette">
        {BRUSHES.map((k) => (
          <button key={k} className={`brush${k === brush ? ' active' : ''}`} onClick={() => setBrush(k)}>
            <span className={`dot ${k}`} />{STATUS[k].label}
          </button>
        ))}
      </div>

      <div className="matrix">
        <div className="mrow mhead" style={{ gridTemplateColumns: tpl }}>
          <div className="mcell mname">Employee</div>
          {days.map((d) => (
            <div key={d} className={`mcell${isSunday(year, month, d) ? ' sun' : ''}`}>{d}</div>
          ))}
        </div>
        {employees.map((e) => (
          <div className="mrow" key={e._id} style={{ gridTemplateColumns: tpl }}>
            <div className="mname" title={e.name}>{e.name}</div>
            {days.map((d) => {
              const meta = STATUS[resolve(e._id, d)];
              return (
                <div
                  key={d}
                  className={`mcell mday ${meta.cls}`}
                  onClick={() => onMark(e._id, d, brush)}
                >
                  {meta.mcode}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
