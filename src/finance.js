/**
 * Loan and refinancing calculations for an educational demo.
 * Rates are nominal annual rates, with monthly compounding.
 * Amounts are represented in cents internally to reduce rounding drift.
 * This is NOT a bank quote, APR calculator, or financial advice.
 */

function assertFinitePositive(value, label, allowZero = false) {
  if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) {
    throw new RangeError(`${label} must be ${allowZero ? 'non-negative' : 'positive'} and finite.`);
  }
}

function assertTerm(termMonths) {
  if (!Number.isInteger(termMonths) || termMonths < 1 || termMonths > 600) {
    throw new RangeError('Term must be an integer between 1 and 600 months.');
  }
}

function toCents(amount) {
  return Math.round(amount * 100);
}

function fromCents(cents) {
  return cents / 100;
}

/** Calculate the standard monthly instalment for a fixed-rate amortizing loan. */
export function monthlyPayment(principal, annualRate, termMonths) {
  assertFinitePositive(principal, 'Principal');
  assertFinitePositive(annualRate, 'Annual rate', true);
  assertTerm(termMonths);
  if (annualRate > 100) throw new RangeError('Annual rate cannot exceed 100%.');
  const monthlyRate = annualRate / 1200;
  if (monthlyRate === 0) return fromCents(Math.ceil(toCents(principal) / termMonths));
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return fromCents(Math.round(toCents(principal) * (monthlyRate * factor) / (factor - 1)));
}

/**
 * Build a month-by-month amortization schedule.
 * extraPayment is an optional fixed monthly overpayment; early payoff is supported.
 */
export function amortizationSchedule({ principal, annualRate, termMonths, extraPayment = 0 }) {
  assertFinitePositive(principal, 'Principal');
  assertFinitePositive(annualRate, 'Annual rate', true);
  assertFinitePositive(extraPayment, 'Extra payment', true);
  assertTerm(termMonths);
  if (annualRate > 100) throw new RangeError('Annual rate cannot exceed 100%.');
  if (principal > 1_000_000_000) throw new RangeError('Principal is outside demo limits.');

  const monthlyRate = annualRate / 1200;
  const regularCents = toCents(monthlyPayment(principal, annualRate, termMonths));
  const extraCents = toCents(extraPayment);
  let balanceCents = toCents(principal);
  let totalInterestCents = 0;
  let totalPaidCents = 0;
  const schedule = [];

  for (let month = 1; month <= termMonths && balanceCents > 0; month += 1) {
    const interestCents = Math.round(balanceCents * monthlyRate);
    const dueCents = balanceCents + interestCents;
    const paymentCents = Math.min(dueCents, regularCents + extraCents);
    if (paymentCents <= interestCents && dueCents > paymentCents) {
      throw new RangeError('Payment does not cover accrued interest.');
    }
    const principalCents = paymentCents - interestCents;
    balanceCents = Math.max(0, balanceCents - principalCents);
    totalInterestCents += interestCents;
    totalPaidCents += paymentCents;
    schedule.push({
      month,
      payment: fromCents(paymentCents),
      principal: fromCents(principalCents),
      interest: fromCents(interestCents),
      balance: fromCents(balanceCents),
    });
  }
  // Final cent-level residual from rounded monthly instalments is settled in the final month.
  if (balanceCents > 0) {
    const last = schedule[schedule.length - 1];
    last.payment = fromCents(toCents(last.payment) + balanceCents);
    last.principal = fromCents(toCents(last.principal) + balanceCents);
    last.balance = 0;
    totalPaidCents += balanceCents;
    balanceCents = 0;
  }

  return {
    monthlyPayment: fromCents(regularCents),
    monthsToPayoff: schedule.length,
    totalInterest: fromCents(totalInterestCents),
    totalPaid: fromCents(totalPaidCents),
    schedule,
  };
}

/**
 * Compare remaining payments on an existing loan with a new fixed-rate loan.
 * Closing fees are assumed paid upfront, not financed.
 * This is a simple cost comparison, not a present-value or APR comparison.
 */
export function compareRefinancing({
  balance,
  currentRate,
  remainingMonths,
  newRate,
  newMonths,
  upfrontFees = 0,
}) {
  assertFinitePositive(upfrontFees, 'Upfront fees', true);
  const current = amortizationSchedule({ principal: balance, annualRate: currentRate, termMonths: remainingMonths });
  const proposed = amortizationSchedule({ principal: balance, annualRate: newRate, termMonths: newMonths });
  const monthlySavings = Math.round((current.monthlyPayment - proposed.monthlyPayment) * 100) / 100;
  const currentRemainingCost = current.totalPaid;
  const newRemainingCost = Math.round((proposed.totalPaid + upfrontFees) * 100) / 100;
  const totalSavings = Math.round((currentRemainingCost - newRemainingCost) * 100) / 100;
  const breakEvenMonths = monthlySavings > 0 && upfrontFees > 0
    ? Math.ceil(upfrontFees / monthlySavings)
    : upfrontFees === 0 && monthlySavings > 0 ? 0 : null;
  return {
    current,
    proposed,
    monthlySavings,
    totalSavings,
    currentRemainingCost,
    newRemainingCost,
    upfrontFees,
    breakEvenMonths,
    differentTerms: remainingMonths !== newMonths,
  };
}
