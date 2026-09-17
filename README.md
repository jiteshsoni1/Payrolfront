# MusterPay — Client (React + Vite)

The front end for MusterPay: HR marks the muster roll and the whole team's payroll
runs live. Every number comes from the MusterPay API — this app just displays and edits.

## Requirements

- Node 18+
- The **MusterPay API** running (see `musterpay-server`). Start it first.

## Setup

```bash
npm install
cp .env.example .env      # point VITE_API_URL at your API (default http://localhost:4000/api)
npm run dev               # opens http://localhost:5173
```

Make sure the server is running and seeded (`npm run seed` in musterpay-server) — you'll
then see the 8 demo employees and the September 2026 run, matching the prototype.

## What each screen does

1. **Pay period** — pick month/year (drives every API call); Finalize freezes payslips.
2. **Team & salaries** — the roster. Edit a name/salary (saves on blur), add or remove people.
3. **Muster roll** — the attendance grid. Pick a status, click cells. Each click is a
   `PUT /attendance`; the run re-tallies. "Present" clears a day back to the default.
4. **Payroll run** — every salary computed, plus the company payout. Click a row…
5. **Payslip detail** — …to see that person's itemized ledger.

## How it talks to the API

`src/api.js` wraps every endpoint. The month is **1-12**.

| Action                | Call                                    |
|-----------------------|-----------------------------------------|
| Load roster           | `GET /employees`                        |
| Load month's marks    | `GET /attendance?year=&month=`          |
| Load the run          | `GET /payroll/run?year=&month=`         |
| Mark a day            | `PUT /attendance`                       |
| Add / edit / remove   | `POST` / `PATCH` / `DELETE /employees`  |
| Freeze payslips       | `POST /payroll/finalize?year=&month=`   |

The client never re-does the payroll math — it trusts the run response. The payslip
ledger itemizes the deduction from the row's `counts` and `perDay`, with the short-leave
line taken as the residual so it always ties back to the server's total.

## Layout

```
index.html
src/
  main.jsx              mounts <App/>
  App.jsx               state + data loading, wires the sections together
  api.js                fetch wrapper for the API
  lib/format.js         currency, dates, status metadata
  components/
    PolicyBar.jsx       month / year / finalize
    Roster.jsx          employees + salaries
    MusterMatrix.jsx    attendance grid
    PayrollRun.jsx      run table + totals
    PayslipDetail.jsx   selected employee ledger
  styles.css            the design system
```

## Deploy

```bash
npm run build            # outputs static files to dist/
```

Host `dist/` anywhere static (Render Static Site, Netlify, Vercel). Set `VITE_API_URL`
to your deployed API URL at build time. Same Render + Atlas setup as your other apps.
Add auth before real use — anyone who can reach the API can currently run payroll.
