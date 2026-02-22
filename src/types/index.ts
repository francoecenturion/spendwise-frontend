// Tipos base para tu aplicación

export enum CategoryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  SAVING = 'SAVING',
  DEBT = 'DEBT',
  INVESTMENT = 'INVESTMENT',
}

export interface Category {
  id?: number;
  name: string;
  enabled?: boolean;
  type?: CategoryType;
}

export interface PaymentMethod {
  id?: number;
  name: string;
  paymentMethodType: string;
  enabled?: boolean;
  icon?: string;
  issuingEntity?: string;
  brand?: string;
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
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
}

// Tipo para las columnas de la tabla
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
}

// Tipo para respuestas paginadas
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface Currency {
  id?: number;
  name: string;
  symbol: string;
  enabled?: boolean;
}

// Filtros
export interface CurrencyFilter {
  name?: string;
  enabled?: boolean;
}

export interface CategoryFilter {
  name?: string;
  enabled?: boolean;
  type?: CategoryType;
}

export interface PaymentMethodFilter {
  name?: string;
  paymentMethodType?: string;
  enabled?: boolean;
}

export interface ExpenseFilter {
  description?: string;
  minAmountInPesos?: number;
  maxAmountInPesos?: number;
  minAmountInDollars?: number;
  maxAmountInDollars?: number;
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  paymentMethodId?: number;
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

export interface CurrencyFormProps {
  currency?: Currency | null;
  onSubmit: (data: Currency) => void;
  onCancel: () => void;
}

export interface Income {
  id?: number;
  description: string;
  amountInPesos: number;
  amountInDollars?: number;
  source: Category;
  date: string;
}

export interface IncomeFilter {
  description?: string;
}

export interface IncomeFormProps {
  income: Income | null;
  onSubmit: (data: Income) => void;
  onCancel: () => void;
}

export enum SavingsWalletType {
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  VIRTUAL_WALLET = 'VIRTUAL_WALLET',
  MUTUAL_FUND = 'MUTUAL_FUND',
  FIXED_TERM = 'FIXED_TERM',
  CASH = 'CASH',
}

export interface SavingsWallet {
  id?: number;
  name: string;
  savingsWalletType: SavingsWalletType | string;
  enabled?: boolean;
  icon?: string;
}

export interface SavingsWalletFilter {
  name?: string;
  savingsWalletType?: string;
  enabled?: boolean;
}

export interface Saving {
  id?: number;
  description: string;
  currency: Currency;
  savingsWallet?: SavingsWallet;
  inputAmount?: number;
  amountInPesos: number;
  amountInDollars?: number;
  date: string;
}

export interface SavingFilter {
  description?: string;
  minAmountInPesos?: number;
  maxAmountInPesos?: number;
  minAmountInDollars?: number;
  maxAmountInDollars?: number;
  startDate?: string;
  endDate?: string;
  currencyId?: number;
  savingsWalletId?: number;
}

export interface SavingFormProps {
  saving: Saving | null;
  onSubmit: (data: Saving) => void;
  onCancel: () => void;
}

export interface SavingsWalletFormProps {
  savingsWallet?: SavingsWallet | null;
  onSubmit: (data: SavingsWallet) => void;
  onCancel: () => void;
}

export interface IssuingEntity {
  id?: number;
  description: string;
  enabled?: boolean;
}

export interface IssuingEntityFilter {
  description?: string;
  enabled?: boolean;
}

export interface IssuingEntityFormProps {
  issuingEntity?: IssuingEntity | null;
  onSubmit: (data: IssuingEntity) => void;
  onCancel: () => void;
}

export interface Debt {
  id?: number;
  description: string;
  amountInPesos: number;
  amountInDollars?: number;
  date: string;
  dueDate?: string;
  cancelled?: boolean;
  personal: boolean;
  creditor?: string;
  issuingEntity?: IssuingEntity;
  paymentMethod?: PaymentMethod;
}

export interface DebtFilter {
  description?: string;
  cancelled?: boolean;
  personal?: boolean;
  startDate?: string;
  endDate?: string;
  minAmountInPesos?: number;
  maxAmountInPesos?: number;
  paymentMethodId?: number;
  issuingEntityId?: number;
}

export interface DebtFormProps {
  debt?: Debt | null;
  onSubmit: (data: Debt) => void;
  onCancel: () => void;
}
