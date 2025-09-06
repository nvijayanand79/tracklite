// API response types that match the backend schemas

export interface Receipt {
  id: string;
  receiver_name: string;
  contact_number: string;
  date: string;
  branch: string;
  company: string;
  count_of_boxes: number;
  receiving_mode: 'PERSON' | 'COURIER';
  forward_to_chennai: boolean;
  awb_no?: string;
  tracking_number?: string;
  created_at: string;
  updated_at?: string;
}

export interface LabTest {
  id: string;
  receipt_id: string;
  lab_doc_no: string;
  lab_person: string;
  test_status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'NEEDS_RETEST' | 'ON_HOLD';
  lab_report_status: 'NOT_STARTED' | 'DRAFT' | 'READY' | 'SIGNED_OFF';
  remarks?: string;
  created_at: string;
  updated_at: string;
  transfers?: LabTransfer[];
}

export interface LabTransfer {
  id: string;
  from_user: string;
  to_user: string;
  reason: string;
  transfer_date: string;
}

export interface Report {
  id: string;
  lab_test_id: string;
  report_type: string;
  file_name: string;
  file_path: string;
  upload_date: string;
  status: 'PENDING' | 'REVIEWED' | 'APPROVED' | 'REJECTED';
  comments?: string;
  created_at: string;
  updated_at?: string;
}

export interface Invoice {
  id: string;
  lab_test_id: string;
  invoice_number: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issued_date: string;
  due_date: string;
  paid_at?: string;
  created_at: string;
  updated_at?: string;
}

// Form data types for creating/updating
export interface CreateReceiptData {
  receiver_name: string;
  contact_number: string;
  date: string;
  branch: string;
  company: string;
  count_of_boxes: number;
  receiving_mode: 'PERSON' | 'COURIER';
  forward_to_chennai: boolean;
  awb_no?: string;
}

export interface UpdateReceiptData extends Partial<CreateReceiptData> {}

export interface CreateLabTestData {
  receipt_id: string;
  lab_doc_no: string;
  lab_person: string;
  test_status: LabTest['test_status'];
  lab_report_status: LabTest['lab_report_status'];
  remarks?: string;
}

export interface UpdateLabTestData extends Partial<CreateLabTestData> {}

// API response wrappers
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// Error types
export interface ApiError {
  detail: string | Array<{
    loc: (string | number)[];
    msg: string;
    type: string;
  }>;
}
