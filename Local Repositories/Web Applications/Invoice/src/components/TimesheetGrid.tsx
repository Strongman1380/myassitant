import React, { useState } from 'react';
import { Timesheet, TimesheetEntry, InvoiceItem } from '../types';
import './TimesheetGrid.css';

const BILLING_CODES = [
  'Database Development',
  'Intake Paperwork Development',
  'Website Development',
  'Revenue Plan',
  'Staff Meeting',
  'Case Management',
  'Administrative',
  'Training',
  'Other',
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function parseTime(val: string): number | null {
  if (!val) return null;
  const parts = val.split(':');
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h + m / 60;
}

function calcHours(timeIn: string, timeOut: string): number {
  const start = parseTime(timeIn);
  const end = parseTime(timeOut);
  if (start === null || end === null) return 0;
  const diff = end - start;
  return diff > 0 ? Math.round(diff * 100) / 100 : 0;
}

function buildEmptyEntry(payPeriodStart: string): TimesheetEntry {
  const today = payPeriodStart || new Date().toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric'
  });
  return {
    id: generateId(),
    date: today,
    billing_code: '',
    time_in: '',
    time_out: '',
    hours: 0,
    client: '',
    direct: false,
    indirect: false,
    mileage: 0,
    notes: '',
  };
}

function buildEmptyInvoiceItem(payPeriodStart: string): InvoiceItem {
  const today = payPeriodStart || new Date().toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric'
  });
  return {
    id: generateId(),
    date: today,
    description: '',
    quantity: 1,
    rate: 0,
    amount: 0,
  };
}

interface TimesheetGridProps {
  timesheet: Timesheet;
  onUpdate: (timesheet: Timesheet) => void;
}

export function TimesheetGrid({ timesheet, onUpdate }: TimesheetGridProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  // Ensure invoice_items exists for older saved timesheets
  const invoiceItems = timesheet.invoice_items || [];

  const updateEntry = (id: string, patch: Partial<TimesheetEntry>) => {
    const entries = timesheet.entries.map(e => {
      if (e.id !== id) return e;
      const updated = { ...e, ...patch };
      // Auto-calculate hours when time_in or time_out changes
      if ('time_in' in patch || 'time_out' in patch) {
        updated.hours = calcHours(updated.time_in, updated.time_out);
      }
      return updated;
    });
    onUpdate({ ...timesheet, entries });
  };

  const deleteEntry = (id: string) => {
    const entries = timesheet.entries.filter(e => e.id !== id);
    onUpdate({ ...timesheet, entries });
  };

  const addRow = () => {
    const newEntry = buildEmptyEntry(timesheet.pay_period_start);
    onUpdate({ ...timesheet, entries: [...timesheet.entries, newEntry] });
    setEditingId(newEntry.id);
  };

  // Invoice helpers
  const updateInvoiceItem = (id: string, patch: Partial<InvoiceItem>) => {
    const items = invoiceItems.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, ...patch };
      if ('quantity' in patch || 'rate' in patch) {
        updated.amount = Math.round((updated.quantity || 0) * (updated.rate || 0) * 100) / 100;
      }
      return updated;
    });
    onUpdate({ ...timesheet, invoice_items: items });
  };

  const deleteInvoiceItem = (id: string) => {
    const items = invoiceItems.filter(item => item.id !== id);
    onUpdate({ ...timesheet, invoice_items: items });
  };

  const addInvoiceRow = () => {
    const newItem = buildEmptyInvoiceItem(timesheet.pay_period_start);
    onUpdate({ ...timesheet, invoice_items: [...invoiceItems, newItem] });
  };

  const totalHours = timesheet.entries.reduce((sum, e) => sum + (e.hours || 0), 0);
  const totalMileage = timesheet.entries.reduce((sum, e) => sum + (e.mileage || 0), 0);
  const invoiceTotal = invoiceItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="ts-wrapper">
      <div className="ts-pay-period">
        <span>Pay Period:</span>
        <input
          type="text"
          placeholder="MM/DD/YYYY"
          value={timesheet.pay_period_start}
          onChange={e => onUpdate({ ...timesheet, pay_period_start: e.target.value })}
          className="ts-period-input"
        />
        <span>–</span>
        <input
          type="text"
          placeholder="MM/DD/YYYY"
          value={timesheet.pay_period_end}
          onChange={e => onUpdate({ ...timesheet, pay_period_end: e.target.value })}
          className="ts-period-input"
        />
      </div>

      {/* ═══════ TIMESHEET GRID ═══════ */}
      <div className="ts-table-scroll">
        <table className="ts-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Billing Code</th>
              <th>Time In</th>
              <th>Time Out</th>
              <th>Hours</th>
              <th>Client</th>
              <th className="ts-center">Direct</th>
              <th className="ts-center">Indirect</th>
              <th className="ts-center">Mileage</th>
              <th>Notes</th>
              <th className="ts-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {timesheet.entries.length === 0 && (
              <tr>
                <td colSpan={11} className="ts-empty">No entries yet. Click "+ Add Row" to begin.</td>
              </tr>
            )}
            {timesheet.entries.map(entry => {
              const isEditing = editingId === entry.id;
              return (
                <tr key={entry.id} className={isEditing ? 'ts-row-editing' : ''}>
                  {/* Date */}
                  <td>
                    <input
                      type="text"
                      value={entry.date}
                      onChange={e => updateEntry(entry.id, { date: e.target.value })}
                      placeholder="MM/DD/YYYY"
                      className="ts-input ts-date"
                    />
                  </td>

                  {/* Billing Code */}
                  <td>
                    <select
                      value={BILLING_CODES.includes(entry.billing_code) ? entry.billing_code : 'Other'}
                      onChange={e => {
                        if (e.target.value !== 'Other') {
                          updateEntry(entry.id, { billing_code: e.target.value });
                        }
                      }}
                      className="ts-select"
                    >
                      <option value="">Select...</option>
                      {BILLING_CODES.map(code => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                    </select>
                    {(!BILLING_CODES.includes(entry.billing_code) || entry.billing_code === 'Other') && (
                      <input
                        type="text"
                        value={entry.billing_code}
                        onChange={e => updateEntry(entry.id, { billing_code: e.target.value })}
                        placeholder="Custom billing code..."
                        className="ts-input ts-billing-custom"
                      />
                    )}
                  </td>

                  {/* Time In */}
                  <td>
                    <input
                      type="text"
                      value={entry.time_in || ''}
                      onChange={e => updateEntry(entry.id, { time_in: e.target.value })}
                      placeholder="8:00"
                      className="ts-input ts-time"
                    />
                  </td>

                  {/* Time Out */}
                  <td>
                    <input
                      type="text"
                      value={entry.time_out || ''}
                      onChange={e => updateEntry(entry.id, { time_out: e.target.value })}
                      placeholder="5:00"
                      className="ts-input ts-time"
                    />
                  </td>

                  {/* Hours (auto-calculated) */}
                  <td className="ts-center">
                    <span className="ts-hours-display">
                      {entry.hours ? entry.hours.toFixed(2) : '—'}
                    </span>
                  </td>

                  {/* Client */}
                  <td>
                    <input
                      type="text"
                      value={entry.client}
                      onChange={e => updateEntry(entry.id, { client: e.target.value })}
                      placeholder="Client / Organization"
                      className="ts-input ts-client"
                    />
                  </td>

                  {/* Direct */}
                  <td className="ts-center">
                    <input
                      type="checkbox"
                      checked={entry.direct}
                      onChange={e => updateEntry(entry.id, {
                        direct: e.target.checked,
                        indirect: e.target.checked ? false : entry.indirect
                      })}
                      className="ts-checkbox"
                    />
                  </td>

                  {/* Indirect */}
                  <td className="ts-center">
                    <input
                      type="checkbox"
                      checked={entry.indirect}
                      onChange={e => updateEntry(entry.id, {
                        indirect: e.target.checked,
                        direct: e.target.checked ? false : entry.direct
                      })}
                      className="ts-checkbox"
                    />
                  </td>

                  {/* Mileage */}
                  <td className="ts-center">
                    <input
                      type="number"
                      value={entry.mileage || ''}
                      onChange={e => updateEntry(entry.id, { mileage: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.1"
                      className="ts-input ts-mileage"
                      placeholder="0"
                    />
                  </td>

                  {/* Notes */}
                  <td>
                    <input
                      type="text"
                      value={entry.notes}
                      onChange={e => updateEntry(entry.id, { notes: e.target.value })}
                      placeholder="Notes..."
                      className="ts-input ts-notes"
                    />
                  </td>

                  {/* Actions */}
                  <td className="ts-center ts-actions">
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="ts-btn-delete"
                      title="Delete row"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="ts-totals">
              <td colSpan={4} className="ts-totals-label">TOTALS</td>
              <td className="ts-center ts-total-val">{totalHours.toFixed(2)}</td>
              <td colSpan={3}></td>
              <td className="ts-center ts-total-val">{totalMileage > 0 ? totalMileage : ''}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="ts-footer-actions">
        <button onClick={addRow} className="ts-btn-add">+ Add Row</button>
      </div>

      {/* ═══════ INVOICE / SERVICES PERFORMED ═══════ */}
      <div className="ts-invoice-section">
        <h3 className="ts-invoice-title">Invoice – Services Performed</h3>
        <div className="ts-table-scroll">
          <table className="ts-table ts-invoice-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description of Service</th>
                <th className="ts-center">Qty</th>
                <th className="ts-center">Rate ($)</th>
                <th className="ts-center">Amount ($)</th>
                <th className="ts-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="ts-empty">No invoice items yet. Click "+ Add Item" to begin.</td>
                </tr>
              )}
              {invoiceItems.map(item => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="text"
                      value={item.date}
                      onChange={e => updateInvoiceItem(item.id, { date: e.target.value })}
                      placeholder="MM/DD/YYYY"
                      className="ts-input ts-date"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateInvoiceItem(item.id, { description: e.target.value })}
                      placeholder="Describe the service performed..."
                      className="ts-input ts-description"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.quantity || ''}
                      onChange={e => updateInvoiceItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.5"
                      className="ts-input ts-qty"
                      placeholder="1"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.rate || ''}
                      onChange={e => updateInvoiceItem(item.id, { rate: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                      className="ts-input ts-rate"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="ts-center">
                    <span className="ts-amount-display">
                      {item.amount ? `$${item.amount.toFixed(2)}` : '—'}
                    </span>
                  </td>
                  <td className="ts-center ts-actions">
                    <button
                      onClick={() => deleteInvoiceItem(item.id)}
                      className="ts-btn-delete"
                      title="Delete item"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="ts-totals">
                <td colSpan={4} className="ts-totals-label">INVOICE TOTAL</td>
                <td className="ts-center ts-total-val">${invoiceTotal.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="ts-footer-actions">
          <button onClick={addInvoiceRow} className="ts-btn-add ts-btn-add-invoice">+ Add Item</button>
        </div>
      </div>
    </div>
  );
}
