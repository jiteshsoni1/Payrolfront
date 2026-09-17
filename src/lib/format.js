export const inr = (n) =>
  '\u20B9' + Math.abs(Number(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const round2 = (n) => Math.round(n * 100) / 100;

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// month is 1-12 (matches the API); UTC to line up with how the server stores dates
export const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();
export const isSunday = (year, month, day) => new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 0;

export const STATUS = {
  present: { label: 'Present', mcode: '', cls: '' },
  absent:  { label: 'Absent (A)', mcode: 'A', cls: 'absent' },
  half:    { label: 'Half day (\u00BD)', mcode: '\u00BD', cls: 'half' },
  short:   { label: 'Short/late (L)', mcode: 'L', cls: 'short' },
  paid:    { label: 'Paid leave (P)', mcode: 'P', cls: 'paid' },
  holiday: { label: 'Holiday (H)', mcode: 'H', cls: 'holiday' },
  off:     { label: 'Weekly off', mcode: '', cls: 'off' },
};
export const BRUSHES = ['present', 'absent', 'half', 'short', 'paid', 'holiday'];
