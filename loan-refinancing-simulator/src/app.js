import { compareRefinancing } from './finance.js';

const form = document.querySelector('#comparison-form');
const error = document.querySelector('#form-error');
const result = document.querySelector('#results');
const tableBody = document.querySelector('#schedule-body');
const tableCaption = document.querySelector('#schedule-caption');
const toggle = document.querySelector('#schedule-choice');
const csvButton = document.querySelector('#download-csv');
const currencySelector = document.querySelector('#currency');
let latest = null;

const format = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: currencySelector.value, maximumFractionDigits: 2,
}).format(value);

function numeric(id) {
  const element = document.getElementById(id);
  const value = element.value.trim();
  if (value === '') throw new Error(`${element.labels?.[0]?.textContent || id} is required.`);
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Invalid value for ${id}.`);
  return number;
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function renderSchedule() {
  if (!latest) return;
  const selected = toggle.value === 'current' ? latest.current : latest.proposed;
  tableCaption.textContent = `${toggle.value === 'current' ? 'Current loan' : 'Refinanced loan'} · ${selected.monthsToPayoff} monthly payments`;
  tableBody.replaceChildren();
  const fragment = document.createDocumentFragment();
  selected.schedule.forEach((entry) => {
    const tr = document.createElement('tr');
    [entry.month, format(entry.payment), format(entry.principal), format(entry.interest), format(entry.balance)]
      .forEach((value) => {
        const td = document.createElement('td');
        td.textContent = String(value);
        tr.append(td);
      });
    fragment.append(tr);
  });
  tableBody.append(fragment);
}

function renderComparison(comparison) {
  latest = comparison;
  result.hidden = false;
  setText('current-payment', format(comparison.current.monthlyPayment));
  setText('new-payment', format(comparison.proposed.monthlyPayment));
  setText('monthly-savings', `${comparison.monthlySavings >= 0 ? '+' : ''}${format(comparison.monthlySavings)}`);
  setText('total-savings', `${comparison.totalSavings >= 0 ? '+' : ''}${format(comparison.totalSavings)}`);
  setText('current-cost', format(comparison.currentRemainingCost));
  setText('new-cost', format(comparison.newRemainingCost));
  setText('fees-display', format(comparison.upfrontFees));
  setText('break-even', comparison.breakEvenMonths === null ? 'Not applicable' :
    comparison.breakEvenMonths === 0 ? 'Immediate (no fees)' : `${comparison.breakEvenMonths} months`);
  const maxCost = Math.max(comparison.currentRemainingCost, comparison.newRemainingCost, 1);
  document.querySelector('#bar-current').style.width = `${(comparison.currentRemainingCost / maxCost) * 100}%`;
  document.querySelector('#bar-new').style.width = `${(comparison.newRemainingCost / maxCost) * 100}%`;
  const note = document.querySelector('#term-warning');
  note.hidden = !comparison.differentTerms;
  renderSchedule();
}

function calculate(event) {
  event?.preventDefault();
  error.hidden = true;
  try {
    renderComparison(compareRefinancing({
      balance: numeric('balance'),
      currentRate: numeric('current-rate'),
      remainingMonths: numeric('remaining-months'),
      newRate: numeric('new-rate'),
      newMonths: numeric('new-months'),
      upfrontFees: numeric('fees'),
    }));
  } catch (exception) {
    error.textContent = exception.message;
    error.hidden = false;
    result.hidden = true;
    latest = null;
  }
}

form.addEventListener('submit', calculate);
toggle.addEventListener('change', renderSchedule);
currencySelector.addEventListener('change', () => { if (latest) renderComparison(latest); });

csvButton.addEventListener('click', () => {
  if (!latest) return;
  const selected = toggle.value === 'current' ? latest.current : latest.proposed;
  const rows = [
    ['Month', 'Payment', 'Principal', 'Interest', 'Remaining balance'],
    ...selected.schedule.map((r) => [r.month, r.payment.toFixed(2), r.principal.toFixed(2), r.interest.toFixed(2), r.balance.toFixed(2)]),
  ];
  const csv = rows.map((row) => row.join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${toggle.value}-amortization-schedule.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

calculate();
