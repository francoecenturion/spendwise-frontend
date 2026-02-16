// Tipos base para tu aplicación

export interface Category {
  id?: number;
  name: string;
  enabled?: boolean;
}

export interface PaymentMethod {
  id?: number;
  name: string;
  paymentMethodType: string;
  enabled?: boolean;
}

export interface Expense {
  id?: number;
  description: string;
  amountInPesos: number;
  amountInDollars?: number;
  date: string; // ISO format: "2024-01-15"
  category: Category;
  paymentMethod: PaymentMethod;
}

export enum PaymentMethodType {
  CREDIT_CARD_VISA = 'CREDIT_CARD_VISA',
  CREDIT_CARD_MASTERCARD = 'CREDIT_CARD_MASTERCARD',
  CREDIT_CARD_AMERICAN_EXPRESS = 'CREDIT_CARD_AMERICAN_EXPRESS',
  DEBIT_CARD = 'DEBIT_CARD',
  CASH = 'CASH'
}

// Tipo para las columnas de la tabla
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
}

// Tipo para respuestas de API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

// Tipo para errores de API
export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

// Props de componentes
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

export interface CategoryFormProps {
  category?: Category | null;
  onSubmit: (data: Category) => void;
  onCancel: () => void;
}

export interface PaymentMethodFormProps {
  paymentMethod?: PaymentMethod | null;
  onSubmit: (data: PaymentMethod) => void;
  onCancel: () => void;
}

export interface ExpenseFormProps {
  expense?: Expense | null;
  onSubmit: (data: Expense) => void;
  onCancel: () => void;
}
