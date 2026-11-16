# Loan & Refinance Lab

A responsive, dependency-free **JavaScript banking logic showcase**. Compare a fixed-rate loan against a refinancing offer, inspect month-by-month amortization, and export a schedule to CSV.

> **Portfolio demo only.** All input data is fictional. The project is not affiliated with any bank or employer, and contains no proprietary source code, customer data, or internal business rules.

## Features

- Fixed-rate amortization with monthly nominal interest and cent-level rounding
- Side-by-side monthly payments and total remaining cost comparison
- Upfront refinancing fees and a simple fee break-even estimate
- Warning when the two loan terms differ (lower instalments may increase total cost)
- Full amortization schedule with CSV export
- EUR, USD and RON display formatting
- Responsive, accessible HTML/CSS interface
- Pure, unit-tested calculation module and GitHub Actions CI

## Tech stack

**JavaScript ES modules**, semantic HTML5, modern CSS, Node.js built-in test runner. No runtime dependencies, API keys or backend required.

## Run locally

The interface uses JavaScript ES modules and must be served over HTTP rather than opened directly from the filesystem.

```bash
python -m http.server 8080
```

Open http://localhost:8080. Alternatively use any local static-file server.

## Run tests

Requires Node.js 20+.

```bash
npm test
```

## Core logic

The calculation engine lives in [`src/finance.js`](src/finance.js):

- `monthlyPayment(principal, annualRate, termMonths)`
- `amortizationSchedule({ principal, annualRate, termMonths, extraPayment })`
- `compareRefinancing({ balance, currentRate, remainingMonths, newRate, newMonths, upfrontFees })`

The project uses nominal annual rates divided by 12 and assumes equal monthly periods. Payments and interest are rounded to cents. Fees are paid upfront and **not** financed. The model does not calculate APR, effective annual rate, variable-rate resets, insurance, tax, prepayment penalties, or present value. The break-even estimate is a simple upfront-fees / monthly-payment-difference calculation, not a full cash-flow analysis.

## Suggested interview talking points

- Separating financial domain logic from the UI so it can be tested independently
- Handling zero-interest edge cases, rounding, and final-payment reconciliation
- Comparing total costs rather than relying only on monthly-payment savings
- Error handling and input validation
- Making calculations transparent and auditable with CSV export and unit tests

## Potential next steps

- Add configurable repayment frequencies and variable interest-rate periods
- Add business rules for eligibility and affordability checks
- Add a REST API and persistence layer in a separate banking API project
- Add end-to-end UI tests

## License

MIT. See [LICENSE](LICENSE).
