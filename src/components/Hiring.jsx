import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { api } from '../api';

// Letterhead name for the generated letters. Change this to your company.
const COMPANY_NAME = 'Elbow Grease Business Solutions Pvt. Ltd.';

const rs = (n) => 'Rs. ' + Math.abs(Number(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inr = (n) => '₹' + Math.abs(Number(n || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
const dateInput = (d) => d ? String(d).slice(0, 10) : '';

const STAGES = [
  { key: 'applied', label: 'Applied' },
  { key: 'interviewing', label: 'Interviewing' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' },
];
const STAGE_COLOR = {
  applied: 'var(--muted)', interviewing: 'var(--sl-fg)', accepted: 'var(--brand)', rejected: 'var(--debit)',
};

// ---- PDF letters (client-side, like the payslips) ----
function letterShell(doc, title) {
  const W = doc.internal.pageSize.getWidth();
  const M = 56;
  const GREEN = [14, 90, 70], INK = [27, 37, 48], MUTED = [94, 106, 118];
  doc.setFillColor(...GREEN); doc.rect(0, 0, W, 78, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.text(COMPANY_NAME, M, 40);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.text(title, M, 58);
  doc.setTextColor(...MUTED); doc.setFontSize(9.5);
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(today, M, 104);
  return { W, M, INK };
}

function downloadOfferLetter(c) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const { W, M, INK } = letterShell(doc, 'Letter of Offer');
  const right = W - M;
  doc.setTextColor(...INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
  let y = 140;
  doc.text('Dear ' + c.name + ',', M, y); y += 26;
  const body = [
    'We are pleased to offer you the position of ' + (c.role || 'Team Member') + ' at ' + COMPANY_NAME + '.',
    '',
    'Your monthly salary will be ' + rs(c.offeredSalary) + ', and your start date is ' + fmtDate(c.startDate) + '.',
    '',
    'Your attendance and salary will be managed through our payroll system, and you will receive login',
    'details to view your own attendance and payslips.',
    '',
    'We look forward to welcoming you to the team. Please sign and return a copy of this letter to confirm',
    'your acceptance.',
  ];
  for (const line of body) { doc.text(line, M, y, { maxWidth: right - M }); y += line === '' ? 10 : 18; }
  y += 30;
  doc.text('Warm regards,', M, y); y += 34;
  doc.setDrawColor(180); doc.line(M, y, M + 180, y); y += 16;
  doc.setTextColor(90); doc.setFontSize(10);
  doc.text('Authorised Signatory', M, y); doc.text(COMPANY_NAME, M, y + 14);
  doc.save('offer-letter-' + String(c.name).replace(/[^a-z0-9]+/gi, '-') + '.pdf');
}

function downloadRejectionLetter(c) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const { W, M, INK } = letterShell(doc, 'Application Update');
  const right = W - M;
  doc.setTextColor(...INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
  let y = 140;
  doc.text('Dear ' + c.name + ',', M, y); y += 26;
  const body = [
    'Thank you for your interest in the ' + (c.role || 'role') + ' at ' + COMPANY_NAME + ' and for the time you',
    'spent with us during the process.',
    '',
    'After careful consideration, we have decided not to move forward with your application on this occasion.',
    'This was a difficult decision, and it does not take away from your strengths as a candidate.',
    '',
    'We wish you the very best in your search and would welcome an application from you in the future.',
  ];
  for (const line of body) { doc.text(line, M, y, { maxWidth: right - M }); y += line === '' ? 10 : 18; }
  y += 30;
  doc.text('Warm regards,', M, y); y += 34;
  doc.setDrawColor(180); doc.line(M, y, M + 180, y); y += 16;
  doc.setTextColor(90); doc.setFontSize(10);
  doc.text('Hiring Team', M, y); doc.text(COMPANY_NAME, M, y + 14);
  doc.save('decision-letter-' + String(c.name).replace(/[^a-z0-9]+/gi, '-') + '.pdf');
}

const inputStyle = {
  width: '100%', background: 'var(--field)', color: 'var(--ink)',
  border: '1px solid var(--field-line)', borderRadius: 7, padding: '8px 10px',
  fontFamily: 'var(--sys)', fontSize: 13,
};
const smallBtn = (bg, fg, br) => ({
  border: '1px solid ' + br, background: bg, color: fg, borderRadius: 7,
  padding: '6px 11px', fontSize: 12.5, fontFamily: 'var(--sys)', cursor: 'pointer', whiteSpace: 'nowrap',
});

export default function Hiring({ onRosterChanged }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [nm, setNm] = useState(''); const [em, setEm] = useState(''); const [rl, setRl] = useState('');
  const [panel, setPanel] = useState(null); // { id, type:'accept'|'reject'|'interview', ...fields }

  const load = async () => {
    setLoading(true); setError('');
    try { setCandidates(await api.listCandidates()); }
    catch (e) { setError(e instanceof TypeError ? "Couldn't reach the server." : (e.message || 'Could not load candidates.')); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const addCandidate = async (e) => {
    e.preventDefault();
    if (!nm.trim()) return;
    setSaving(true); setError('');
    try {
      const c = await api.createCandidate({ name: nm.trim(), email: em.trim(), role: rl.trim() });
      setCandidates((prev) => [c, ...prev]);
      setNm(''); setEm(''); setRl('');
    } catch (e2) { setError(e2.message); } finally { setSaving(false); }
  };

  const remove = async (c) => {
    setSaving(true);
    try { await api.deleteCandidate(c._id); setCandidates((prev) => prev.filter((x) => x._id !== c._id)); }
    catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  // save interview details; scheduling an interview moves an applied candidate to interviewing
  const doSchedule = async () => {
    setSaving(true); setError('');
    try {
      const patch = {
        interviewDate: panel.interviewDate || null,
        interviewer: panel.interviewer || '',
        score: (panel.score === '' || panel.score == null) ? null : Number(panel.score),
        notes: panel.notes || '',
      };
      const cand = candidates.find((x) => x._id === panel.id);
      if (cand && cand.status === 'applied') patch.status = 'interviewing';
      const u = await api.updateCandidate(panel.id, patch);
      setCandidates((prev) => prev.map((x) => (x._id === panel.id ? u : x)));
      setPanel(null);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const doAccept = async () => {
    setSaving(true); setError('');
    try {
      const res = await api.acceptCandidate(panel.id, { offeredSalary: Number(panel.salary), startDate: panel.start });
      setCandidates((prev) => prev.map((x) => (x._id === panel.id ? res.candidate : x)));
      setPanel(null);
      if (onRosterChanged) onRosterChanged(); // accepted candidate is now on the payroll roster
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const doReject = async () => {
    setSaving(true); setError('');
    try {
      const u = await api.rejectCandidate(panel.id, { reason: panel.reason || '' });
      setCandidates((prev) => prev.map((x) => (x._id === panel.id ? u : x)));
      setPanel(null);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const openInterview = (c) => setPanel({
    id: c._id, type: 'interview',
    interviewDate: dateInput(c.interviewDate), interviewer: c.interviewer || '',
    score: (c.score == null ? '' : c.score), notes: c.notes || '',
  });

  const byStage = (k) => candidates.filter((c) => c.status === k);
  const hasInterview = (c) => c.interviewDate || c.interviewer || (c.score != null && c.score !== '');

  return (
    <div className="sheet">
      <section className="panel">
        <p className="phead"><span className="n">+</span> Add a candidate</p>
        {error && <div className="banner err" style={{ marginBottom: 12 }}><span>{error}</span></div>}
        <form onSubmit={addCandidate}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '2 1 180px' }}>
              <label className="lbl">Name</label>
              <input style={inputStyle} value={nm} onChange={(e) => setNm(e.target.value)} placeholder="Candidate name" />
            </div>
            <div style={{ flex: '2 1 180px' }}>
              <label className="lbl">Email (optional)</label>
              <input style={inputStyle} value={em} onChange={(e) => setEm(e.target.value)} placeholder="name@example.com" />
            </div>
            <div style={{ flex: '2 1 150px' }}>
              <label className="lbl">Role applied for</label>
              <input style={inputStyle} value={rl} onChange={(e) => setRl(e.target.value)} placeholder="e.g. Sales Executive" />
            </div>
            <button className="btn" type="submit" disabled={saving} style={{ padding: '9px 16px' }}>Add</button>
          </div>
        </form>
      </section>

      <section className="panel">
        <p className="phead">
          <span className="n">≡</span> Hiring pipeline
          <span className="aside">{candidates.length} candidate{candidates.length === 1 ? '' : 's'}</span>
        </p>

        {loading ? (
          <div className="muted">Loading…</div>
        ) : candidates.length === 0 ? (
          <div className="muted">No candidates yet — add one above to start tracking applicants.</div>
        ) : (
          STAGES.map((stage) => {
            const rows = byStage(stage.key);
            if (rows.length === 0) return null;
            return (
              <div key={stage.key} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: STAGE_COLOR[stage.key], margin: '4px 0 8px', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  {stage.label} · {rows.length}
                </div>
                {rows.map((c) => (
                  <div key={c._id} style={{ border: '1px solid var(--rule)', borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                          {c.role || 'Role not set'}{c.email ? ' · ' + c.email : ''}
                        </div>
                        {hasInterview(c) && c.status !== 'accepted' && (
                          <div style={{ fontSize: 12.5, color: 'var(--sl-fg)', marginTop: 4 }}>
                            Interview{c.interviewDate ? ' ' + fmtDate(c.interviewDate) : ''}
                            {c.interviewer ? ' · with ' + c.interviewer : ''}
                            {(c.score != null && c.score !== '') ? ' · score ' + c.score + '/10' : ''}
                          </div>
                        )}
                        {c.notes && c.status !== 'accepted' && (
                          <div style={{ fontSize: 12.5, color: 'var(--faint)', marginTop: 3, fontStyle: 'italic' }}>“{c.notes}”</div>
                        )}
                        {c.status === 'accepted' && (
                          <div style={{ fontSize: 12.5, color: 'var(--brand)', marginTop: 4 }}>
                            Offered {inr(c.offeredSalary)}/mo · starts {fmtDate(c.startDate)} · added to roster
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(c.status === 'applied' || c.status === 'interviewing') && (
                          <>
                            <button style={smallBtn('var(--field)', 'var(--sl-fg)', 'var(--field-line)')} onClick={() => openInterview(c)}>
                              {hasInterview(c) ? 'Edit interview' : 'Interview'}
                            </button>
                            <button style={smallBtn('var(--tint)', 'var(--brand)', 'var(--brand)')}
                              onClick={() => setPanel({ id: c._id, type: 'accept', salary: '', start: '' })}>Accept</button>
                            <button style={smallBtn('var(--field)', 'var(--debit)', 'var(--field-line)')}
                              onClick={() => setPanel({ id: c._id, type: 'reject', reason: '' })}>Reject</button>
                          </>
                        )}
                        {c.status === 'accepted' && (
                          <button className="btn" style={{ padding: '6px 11px', fontSize: 12.5 }} onClick={() => downloadOfferLetter(c)}>⭳ Offer letter</button>
                        )}
                        {c.status === 'rejected' && (
                          <button style={smallBtn('var(--field)', 'var(--muted)', 'var(--field-line)')} onClick={() => downloadRejectionLetter(c)}>⭳ Decision letter</button>
                        )}
                        <button className="xbtn" title="Remove" onClick={() => remove(c)}>×</button>
                      </div>
                    </div>

                    {panel && panel.id === c._id && (
                      <div style={{ background: 'var(--tint)', border: '1px solid var(--rule)', borderRadius: 8, padding: '12px 14px', marginTop: 10 }}>
                        {panel.type === 'interview' && (
                          <>
                            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>
                              Interview details for {c.name}. Saving moves an applied candidate to Interviewing.
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                              <div style={{ flex: '1 1 150px' }}>
                                <label className="lbl">Interview date</label>
                                <input type="date" style={inputStyle}
                                  value={panel.interviewDate} onChange={(e) => setPanel({ ...panel, interviewDate: e.target.value })} />
                              </div>
                              <div style={{ flex: '1 1 150px' }}>
                                <label className="lbl">Interviewer</label>
                                <input style={inputStyle} placeholder="e.g. Priya"
                                  value={panel.interviewer} onChange={(e) => setPanel({ ...panel, interviewer: e.target.value })} />
                              </div>
                              <div style={{ flex: '0 1 110px' }}>
                                <label className="lbl">Score /10</label>
                                <input type="number" min="0" max="10" step="0.5" style={inputStyle}
                                  value={panel.score} onChange={(e) => setPanel({ ...panel, score: e.target.value })} />
                              </div>
                              <div style={{ flex: '1 1 100%' }}>
                                <label className="lbl">Notes</label>
                                <input style={inputStyle} placeholder="How did the interview go?"
                                  value={panel.notes} onChange={(e) => setPanel({ ...panel, notes: e.target.value })} />
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn" style={{ padding: '8px 14px', fontSize: 13 }} disabled={saving} onClick={doSchedule}>
                                  {saving ? 'Saving…' : 'Save interview'}
                                </button>
                                <button style={smallBtn('var(--field)', 'var(--muted)', 'var(--field-line)')} onClick={() => setPanel(null)}>Cancel</button>
                              </div>
                            </div>
                          </>
                        )}

                        {panel.type === 'accept' && (
                          <>
                            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>
                              Accepting adds {c.name} to the payroll roster and creates their offer letter.
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                              <div style={{ flex: '1 1 150px' }}>
                                <label className="lbl">Offered monthly salary</label>
                                <input type="number" min="0" step="500" style={inputStyle}
                                  value={panel.salary} onChange={(e) => setPanel({ ...panel, salary: e.target.value })} />
                              </div>
                              <div style={{ flex: '1 1 150px' }}>
                                <label className="lbl">Start date</label>
                                <input type="date" style={inputStyle}
                                  value={panel.start} onChange={(e) => setPanel({ ...panel, start: e.target.value })} />
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn" style={{ padding: '8px 14px', fontSize: 13 }} disabled={saving} onClick={doAccept}>
                                  {saving ? 'Saving…' : 'Confirm accept'}
                                </button>
                                <button style={smallBtn('var(--field)', 'var(--muted)', 'var(--field-line)')} onClick={() => setPanel(null)}>Cancel</button>
                              </div>
                            </div>
                          </>
                        )}

                        {panel.type === 'reject' && (
                          <>
                            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>
                              Reason (internal note — not printed on the candidate’s letter).
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                              <div style={{ flex: '1 1 240px' }}>
                                <label className="lbl">Reason</label>
                                <input style={inputStyle} value={panel.reason || ''}
                                  onChange={(e) => setPanel({ ...panel, reason: e.target.value })} placeholder="e.g. Not enough experience" />
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn" style={{ padding: '8px 14px', fontSize: 13, background: 'var(--debit)', borderColor: 'var(--debit)' }} disabled={saving} onClick={doReject}>
                                  {saving ? 'Saving…' : 'Confirm reject'}
                                </button>
                                <button style={smallBtn('var(--field)', 'var(--muted)', 'var(--field-line)')} onClick={() => setPanel(null)}>Cancel</button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}