export default function Roster({ employees, onAdd, onPatch, onCommit, onRemove }) {
  return (
    <section className="panel">
      <p className="phead">
        <span className="n">2</span> Team &amp; salaries
        <span className="aside">{employees.length} on the team</span>
      </p>
      <div className="rlist">
        <div className="rrow rhdr"><span>Name</span><span className="r">Monthly salary</span><span /></div>
        {employees.map((e) => (
          <div className="rrow" key={e._id}>
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
            <button className="xbtn" title="Remove" onClick={() => onRemove(e._id)}>&times;</button>
          </div>
        ))}
        {employees.length === 0 && <div className="muted" style={{ padding: '10px 0' }}>No employees yet — add one to begin.</div>}
      </div>
      <button className="addbtn" onClick={onAdd}>+ Add employee</button>
    </section>
  );
}
