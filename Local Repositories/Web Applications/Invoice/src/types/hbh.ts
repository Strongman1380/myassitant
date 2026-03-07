export interface DayEntry {
  timeIn: string;    // "HH:MM" 24-hr
  lunchOut: string;
  lunchIn: string;
  timeOut: string;
}

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type Day = typeof DAYS[number];

export type WeekDays = Record<Day, DayEntry>;

export interface HBHInvoiceItem {
  id: string;
  date: string;             // MM/DD/YYYY
  description: string;      // what was done
  hours: number;            // hours spent
  notes: string;            // additional details
}

export interface HBHTimesheet {
  id: string;
  employeeName: string;
  weekEndingDate: string;   // MM/DD/YYYY — the Sunday date
  days: WeekDays;
  mailCheck: string;
  pickupCheck: string;
  signatureDataUrl: string; // base64 canvas PNG or empty string
  signatureDate: string;
  invoiceItems: HBHInvoiceItem[];
  savedAt: string;          // ISO timestamp
}
