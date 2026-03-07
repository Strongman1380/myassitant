// Timesheet Entry
export interface TimesheetEntry {
  id: string;
  date: string;          // MM/DD/YYYY
  billing_code: string;
  time_in: string;       // HH:MM (e.g. "8:00", "10:30")
  time_out: string;      // HH:MM (e.g. "5:00", "14:30")
  hours: number;         // auto-calculated from time_in/time_out
  client: string;
  direct: boolean;
  indirect: boolean;
  mileage: number;
  notes: string;
}

// Invoice Line Item
export interface InvoiceItem {
  id: string;
  date: string;          // MM/DD/YYYY
  description: string;
  quantity: number;
  rate: number;
  amount: number;        // auto-calculated: quantity * rate
}

// Timesheet
export interface Timesheet {
  id: string;
  staff_name: string;
  pay_period_start: string; // MM/DD/YYYY
  pay_period_end: string;   // MM/DD/YYYY
  entries: TimesheetEntry[];
  invoice_items: InvoiceItem[];
}

// API Response
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
