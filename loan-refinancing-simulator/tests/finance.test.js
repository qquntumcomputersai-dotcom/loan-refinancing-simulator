import test from 'node:test';
import assert from 'node:assert/strict';
import { monthlyPayment, amortizationSchedule, compareRefinancing } from '../src/finance.js';

test('standard monthly payment for a fixed-rate loan', () => {
  assert.ok(Math.abs(monthlyPayment(100_000, 6, 360) - 599.55) < 0.01);
});

test('zero-interest monthly payment', () => {
  assert.equal(monthlyPayment(1200, 0, 12), 100);
});

test('schedule pays off exactly and reconciles totals', () => {
  const loan = amortizationSchedule({ principal: 100_000, annualRate: 6, termMonths: 360 });
  assert.equal(loan.schedule.length, 360);
  assert.equal(loan.schedule.at(-1).balance, 0);
  assert.ok(Math.abs(loan.totalPaid - loan.totalInterest - 100_000) < 0.01);
});

test('extra payment shortens loan and reduces interest', () => {
  const base = amortizationSchedule({ principal: 80_000, annualRate: 7, termMonths: 180 });
  const extra = amortizationSchedule({ principal: 80_000, annualRate: 7, termMonths: 180, extraPayment: 150 });
  assert.ok(extra.monthsToPayoff < base.monthsToPayoff);
  assert.ok(extra.totalInterest < base.totalInterest);
});

test('single-month loan includes one month of interest', () => {
  const loan = amortizationSchedule({ principal: 1200, annualRate: 12, termMonths: 1 });
  assert.equal(loan.totalInterest, 12);
  assert.equal(loan.totalPaid, 1212);
});

test('refinancing can save money when new rate is lower', () => {
  const comparison = compareRefinancing({ balance: 120_000, currentRate: 7.5, remainingMonths: 180, newRate: 5.4, newMonths: 180, upfrontFees: 1200 });
  assert.ok(comparison.monthlySavings > 0);
  assert.ok(comparison.totalSavings > 0);
  assert.ok(comparison.breakEvenMonths > 0);
});

test('lower payment from longer term does not imply lower total cost', () => {
  const comparison = compareRefinancing({ balance: 100_000, currentRate: 5, remainingMonths: 120, newRate: 5, newMonths: 240, upfrontFees: 0 });
  assert.ok(comparison.monthlySavings > 0);
  assert.ok(comparison.totalSavings < 0);
  assert.equal(comparison.differentTerms, true);
});

test('rejects invalid values', () => {
  assert.throws(() => monthlyPayment(-1, 5, 12), RangeError);
  assert.throws(() => monthlyPayment(1000, 5, 0), RangeError);
  assert.throws(() => monthlyPayment(1000, -1, 12), RangeError);
  assert.throws(() => amortizationSchedule({ principal: 1000, annualRate: 5, termMonths: 12, extraPayment: -1 }), RangeError);
  assert.throws(() => compareRefinancing({ balance: 1000, currentRate: 5, remainingMonths: 12, newRate: 4, newMonths: 12, upfrontFees: -1 }), RangeError);
});
