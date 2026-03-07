import React, { useRef } from 'react';
import { HBHTimesheet, HBHInvoiceItem, Day, DAYS } from '../types/hbh';
import { calcWeek, calcDay, splitHM, fmtHM } from '../utils/timesheetCalc';
import { SignaturePad } from './SignaturePad';
import './HBHTimesheetEditor.css';

const DAY_LABELS: Record<Day, string> = {
  monday: 'MONDAY',
  tuesday: 'TUESDAY',
  wednesday: 'WEDNESDAY',
  thursday: 'THURSDAY',
  friday: 'FRIDAY',
  saturday: 'SATURDAY',
  sunday: 'SUNDAY',
};

interface Props {
  ts: HBHTimesheet;
  onChange: (ts: HBHTimesheet) => void;
  onSave: () => void;
  onBack: () => void;
}

/** Parse "HH:MM" 24h into separate hrs/min numbers */
function parseHM(time: string): { h: string; m: string } {
  if (!time) return { h: '', m: '' };
  const [hStr, mStr] = time.split(':');
  return { h: String(parseInt(hStr, 10)), m: mStr };
}

/** Build "HH:MM" from separate h/m strings */
function buildHM(h: string, m: string): string {
  const hNum = parseInt(h, 10);
  const mNum = parseInt(m, 10);
  if (isNaN(hNum) && isNaN(mNum)) return '';
  const hh = isNaN(hNum) ? 0 : Math.min(Math.max(hNum, 0), 23);
  const mm = isNaN(mNum) ? 0 : Math.min(Math.max(mNum, 0), 59);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Given the Sunday "week ending" date string (YYYY-MM-DD), return the Monday date string */
function getWeekMonday(weekEndingSunday: string): string {
  const d = new Date(weekEndingSunday + 'T00:00:00');
  d.setDate(d.getDate() - 6); // Sunday minus 6 = Monday
  return d.toISOString().slice(0, 10);
}

/** Map a YYYY-MM-DD date to the Day key (monday..sunday) based on the week-ending Sunday */
function dateToDayKey(dateStr: string, weekEndingSunday: string): Day | null {
  const monday = new Date(getWeekMonday(weekEndingSunday) + 'T00:00:00');
  const target = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((target.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0 || diff > 6) return null;
  return DAYS[diff]; // DAYS = [monday, tuesday, ..., sunday]
}

export function HBHTimesheetEditor({ ts, onChange, onSave, onBack }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const calc = calcWeek(ts.days);

  // Ensure invoiceItems exists for older saved timesheets
  const invoiceItems = ts.invoiceItems || [];

  // Compute Mon–Sun date range from week-ending Sunday
  const weekMonday = ts.weekEndingDate ? getWeekMonday(ts.weekEndingDate) : '';
  const weekSunday = ts.weekEndingDate || '';

  /** Look up total worked hours for a given YYYY-MM-DD date from the timesheet grid */
  function hoursForDate(dateStr: string): number {
    if (!ts.weekEndingDate || !dateStr) return 0;
    const dayKey = dateToDayKey(dateStr, ts.weekEndingDate);
    if (!dayKey) return 0;
    const { workedMinutes } = calcDay(ts.days[dayKey]);
    return Math.round((workedMinutes / 60) * 100) / 100;
  }

  function addInvoiceItem() {
    const newItem: HBHInvoiceItem = {
      id: generateId(),
      date: '',
      description: '',
      hours: 0,
      notes: '',
    };
    onChange({ ...ts, invoiceItems: [...invoiceItems, newItem] });
  }

  function updateInvoiceItem(id: string, patch: Partial<HBHInvoiceItem>) {
    const items = invoiceItems.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, ...patch };
      // Auto-populate hours when a date is selected
      if ('date' in patch && patch.date) {
        updated.hours = hoursForDate(patch.date);
      }
      return updated;
    });
    onChange({ ...ts, invoiceItems: items });
  }

  function deleteInvoiceItem(id: string) {
    onChange({ ...ts, invoiceItems: invoiceItems.filter(item => item.id !== id) });
  }

  const totalInvoiceHours = invoiceItems.reduce((sum, item) => sum + (item.hours || 0), 0);

  function setDayTime(day: Day, field: keyof (typeof ts.days)[Day], part: 'h' | 'm', value: string) {
    const current = ts.days[day][field];
    const { h, m } = parseHM(current);
    const newTime = part === 'h' ? buildHM(value, m) : buildHM(h, value);
    onChange({
      ...ts,
      days: {
        ...ts.days,
        [day]: { ...ts.days[day], [field]: newTime },
      },
    });
  }

  function handlePrint() {
    window.print();
  }

  const rows: { key: keyof (typeof ts.days)[Day]; label: string }[] = [
    { key: 'timeIn',   label: 'TIME\nIN' },
    { key: 'lunchOut', label: 'LUNCH\nOUT' },
    { key: 'lunchIn',  label: 'LUNCH\nIN' },
    { key: 'timeOut',  label: 'TIME\nOUT' },
  ];

  return (
    <div className="hbh-editor">
      {/* Toolbar */}
      <div className="hbh-toolbar no-print">
        <button onClick={onBack} className="btn btn-ghost">← Saved Timesheets</button>
        <div className="hbh-toolbar-right">
          <button onClick={onSave} className="btn btn-primary">Save</button>
          <button onClick={handlePrint} className="btn btn-secondary">Print / Export</button>
        </div>
      </div>

      {/* Printable Timecard */}
      <div className="tc" ref={printRef}>

        {/* Header */}
        <div className="tc-header">
          <div className="tc-header-left">
            <div className="tc-name-row">
              <span className="tc-bold">NAME</span>
              <span className="tc-name-line">
                <input
                  className="tc-inline-input no-print"
                  value={ts.employeeName}
                  onChange={e => onChange({ ...ts, employeeName: e.target.value })}
                  placeholder="Employee name"
                />
                <span className="tc-print-val print-only">{ts.employeeName}</span>
              </span>
            </div>
            <div className="tc-week-row">
              <span className="tc-bold">Week Ending</span>
              <span className="tc-week-line">
                <input
                  type="date"
                  className="tc-inline-input no-print"
                  value={ts.weekEndingDate}
                  onChange={e => onChange({ ...ts, weekEndingDate: e.target.value })}
                />
                <span className="tc-print-val print-only">
                  {ts.weekEndingDate
                    ? (() => {
                        const [y, m, d] = ts.weekEndingDate.split('-');
                        return `${m} / ${d} / ${y}`;
                      })()
                    : '___/___/___'}
                </span>
              </span>
            </div>
            <div className="tc-sunday-label">(Sunday Date)</div>
          </div>
          <div className="tc-header-right">
            <div className="tc-company">Heartland Boys Home, LLC</div>
            <div>914 Road P</div>
            <div>Geneva, Nebraska 68361</div>
            <div>402-759-4334</div>
          </div>
        </div>

        {/* Body: sidebar + table + right boxes */}
        <div className="tc-body">

          {/* PRESS DOWN HARD sidebar */}
          <div className="tc-sidebar">
            <span>P</span><span>R</span><span>E</span><span>S</span><span>S</span>
            <span className="tc-sidebar-gap"></span>
            <span>D</span><span>O</span><span>W</span><span>N</span>
            <span className="tc-sidebar-gap"></span>
            <span>H</span><span>A</span><span>R</span><span>D</span>
          </div>

          {/* Main table */}
          <table className="tc-table">
            <thead>
              <tr>
                <th className="tc-label-col" rowSpan={2}></th>
                {DAYS.map(day => (
                  <th key={day} colSpan={2} className="tc-day-th">{DAY_LABELS[day]}</th>
                ))}
              </tr>
              <tr>
                {DAYS.map(day => (
                  <React.Fragment key={day}>
                    <th className="tc-hm-th">HRS</th>
                    <th className="tc-hm-th">MIN</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Time entry rows */}
              {rows.map(row => (
                <tr key={row.key}>
                  <td className="tc-row-label">
                    {row.label.split('\n').map((line, i) => (
                      <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>
                    ))}
                  </td>
                  {DAYS.map(day => {
                    const { h, m } = parseHM(ts.days[day][row.key]);
                    return (
                      <React.Fragment key={day}>
                        <td className="tc-input-cell">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            className="tc-cell-input"
                            value={h}
                            onChange={e => setDayTime(day, row.key, 'h', e.target.value)}
                            aria-label={`${DAY_LABELS[day]} ${row.key} hours`}
                          />
                        </td>
                        <td className="tc-input-cell">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            className="tc-cell-input"
                            value={m}
                            onChange={e => setDayTime(day, row.key, 'm', e.target.value)}
                            aria-label={`${DAY_LABELS[day]} ${row.key} minutes`}
                          />
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}

              {/* Total Straight Time row */}
              <tr className="tc-total-row">
                <td className="tc-row-label tc-total-label">TOTAL<br />STRAIGHT<br />TIME</td>
                {DAYS.map(day => {
                  const { straightMinutes } = calc.days[day];
                  const { hrs, min } = splitHM(straightMinutes);
                  return (
                    <React.Fragment key={day}>
                      <td className="tc-calc-cell">{straightMinutes > 0 ? hrs : ''}</td>
                      <td className="tc-calc-cell">{straightMinutes > 0 ? String(min).padStart(2, '0') : ''}</td>
                    </React.Fragment>
                  );
                })}
              </tr>

              {/* Total Overtime row */}
              <tr className="tc-total-row">
                <td className="tc-row-label tc-total-label">TOTAL<br />OVERTIME</td>
                {DAYS.map(day => {
                  const { overtimeMinutes } = calc.days[day];
                  const { hrs, min } = splitHM(overtimeMinutes);
                  return (
                    <React.Fragment key={day}>
                      <td className="tc-calc-cell">{overtimeMinutes > 0 ? hrs : ''}</td>
                      <td className="tc-calc-cell">{overtimeMinutes > 0 ? String(min).padStart(2, '0') : ''}</td>
                    </React.Fragment>
                  );
                })}
              </tr>
            </tbody>
          </table>

          {/* Right panel boxes */}
          <div className="tc-right">
            <div className="tc-check-row">
              <div className="tc-check-box">
                <input
                  className="tc-check-input no-print"
                  value={ts.mailCheck}
                  onChange={e => onChange({ ...ts, mailCheck: e.target.value })}
                />
                <span className="tc-check-print print-only">{ts.mailCheck}</span>
              </div>
              <span className="tc-check-text">MAIL CHECK</span>
            </div>

            <div className="tc-check-row">
              <div className="tc-check-box">
                <input
                  className="tc-check-input no-print"
                  value={ts.pickupCheck}
                  onChange={e => onChange({ ...ts, pickupCheck: e.target.value })}
                />
                <span className="tc-check-print print-only">{ts.pickupCheck}</span>
              </div>
              <span className="tc-check-text">PICK-UP<br />CHECK</span>
            </div>

            <div className="tc-total-section">
              <div className="tc-total-heading">TOTAL</div>
              <div className="tc-total-item">
                <div className="tc-total-box">
                  <span className="tc-total-val">
                    {calc.totalStraightMinutes > 0 ? fmtHM(calc.totalStraightMinutes) : ''}
                  </span>
                </div>
                <span className="tc-total-text">STRAIGHT<br />TIME</span>
              </div>
              <div className="tc-total-item">
                <div className="tc-total-box">
                  <span className="tc-total-val">
                    {calc.totalOvertimeMinutes > 0 ? fmtHM(calc.totalOvertimeMinutes) : ''}
                  </span>
                </div>
                <span className="tc-total-text">OVERTIME</span>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Row */}
        <div className="tc-sig-row">
          <div className="tc-sig-section">
            <div className="tc-sig-field no-print">
              <SignaturePad
                value={ts.signatureDataUrl}
                employeeName={ts.employeeName}
                onChange={dataUrl => onChange({ ...ts, signatureDataUrl: dataUrl })}
              />
            </div>
            <div className="tc-sig-print print-only">
              {ts.signatureDataUrl
                ? <img src={ts.signatureDataUrl} alt="Signature" className="tc-sig-img" />
                : <span className="tc-sig-cursive">{ts.employeeName}</span>}
            </div>
            <div className="tc-sig-line"></div>
            <div className="tc-sig-label">EMPLOYEE SIGNATURE</div>
          </div>

          <div className="tc-date-section">
            <input
              type="date"
              className="tc-inline-input no-print"
              value={ts.signatureDate}
              onChange={e => onChange({ ...ts, signatureDate: e.target.value })}
            />
            <div className="tc-sig-print print-only">
              {ts.signatureDate
                ? new Date(ts.signatureDate + 'T00:00:00').toLocaleDateString('en-US')
                : ''}
            </div>
            <div className="tc-sig-line"></div>
            <div className="tc-sig-label">DATE</div>
          </div>
        </div>

        {/* ═══════ INVOICE — DAILY ACTIVITY LOG ═══════ */}
        <div className="tc-invoice">
          <h3 className="tc-invoice-title">Daily Activity Log / Invoice</h3>
          <table className="tc-invoice-table">
            <thead>
              <tr>
                <th className="tc-inv-date">Date</th>
                <th className="tc-inv-desc">Description of Work Performed</th>
                <th className="tc-inv-hrs">Hours</th>
                <th className="tc-inv-notes">Notes</th>
                <th className="tc-inv-actions no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="tc-inv-empty">
                    No entries yet. Click "+ Add Entry" to log your daily activities.
                  </td>
                </tr>
              )}
              {invoiceItems.map(item => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="date"
                      value={item.date}
                      onChange={e => updateInvoiceItem(item.id, { date: e.target.value })}
                      min={weekMonday}
                      max={weekSunday}
                      className="tc-inv-input tc-inv-date-input"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateInvoiceItem(item.id, { description: e.target.value })}
                      placeholder="What did you do?"
                      className="tc-inv-input tc-inv-desc-input"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.hours || ''}
                      onChange={e => updateInvoiceItem(item.id, { hours: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      min="0"
                      step="0.25"
                      className="tc-inv-input tc-inv-hrs-input"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={e => updateInvoiceItem(item.id, { notes: e.target.value })}
                      placeholder="Additional details..."
                      className="tc-inv-input tc-inv-notes-input"
                    />
                  </td>
                  <td className="no-print">
                    <button
                      onClick={() => deleteInvoiceItem(item.id)}
                      className="tc-inv-delete"
                      title="Delete entry"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="tc-inv-totals">
                <td colSpan={2} className="tc-inv-totals-label">TOTAL HOURS</td>
                <td className="tc-inv-totals-val">{totalInvoiceHours > 0 ? totalInvoiceHours.toFixed(2) : '—'}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
          <div className="tc-inv-add-row no-print">
            <button onClick={addInvoiceItem} className="tc-inv-add-btn">+ Add Entry</button>
          </div>
        </div>

      </div>
    </div>
  );
}
