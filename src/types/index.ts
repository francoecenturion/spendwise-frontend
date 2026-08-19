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
  icon?: string;
}

export interface PaymentMethod {
  id?: number;
  name: string;
  paymentMethodType: string;
  enabled?: boolean;
  isDefault?: boolean;
  icon?: string;
  issuingEntity?: IssuingEntity;
}

export interface Expense {
  id?: number;
  description?: string;
  inputAmount?: number;
  amountInPesos: number;
  amountInDollars?: number;
  currency?: Currency;
  date: string; // ISO format: "2024-01-15"
  category: Category;
  paymentMethod: PaymentMethod;
  microExpense?: boolean;
}

export interface MerchantShortcut {
  id?: number;
  name: string;
  enabled?: boolean;
  icon?: string;
  category: Category;
}

export enum PaymentMethodType {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  QR = 'QR',
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
  isDefault?: boolean;
  icon?: string;
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

export interface MerchantShortcutFilter {
  name?: string;
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

export interface MerchantShortcutFormProps {
  merchantShortcut?: MerchantShortcut | null;
  onSubmit: (data: MerchantShortcut) => void;
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
  inputAmount?: number;
  currency?: Currency;
  source: Category;
  date: string;
}

export interface IncomeFilter {
  description?: string;
  startDate?: string;
  endDate?: string;
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
  issuingEntity?: IssuingEntity;
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
  icon?: string;
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


export interface PersonalDebt {
  id?: number;
  description: string;
  inputAmount?: number;
  amountInPesos: number;
  amountInDollars?: number;
  currency?: Currency;
  date: string;
  dueDate?: string;
  cancelled?: boolean;
  creditor: string;
}

export interface RecurrentExpense {
  id?: number;
  description: string;
  icon?: string;
  amountInPesos?: number;
  amountInDollars?: number;
  dayOfMonth?: number;
  category: Category;
  paymentMethod?: PaymentMethod;
  currency?: Currency;
  enabled?: boolean;
}

export interface RecurrentExpenseFilter {
  description?: string;
  categoryId?: number;
  paymentMethodId?: number;
  enabled?: boolean;
}

export interface RecurrentExpenseFormProps {
  recurrentExpense?: RecurrentExpense | null;
  onSubmit: (data: RecurrentExpense) => void;
  onCancel: () => void;
}

export interface Budget {
  id?: number;
  description: string;
  month: number;
  year: number;
  enabled?: boolean;
  recurrentExpenses: RecurrentExpense[];
  totalExpectedARS?: number;
  totalExpectedUSD?: number;
  totalCancelledARS?: number;
  totalCancelledUSD?: number;
  cancelledCount?: number;
  pendingCount?: number;
}

export interface BudgetFilter {
  description?: string;
  month?: number;
  year?: number;
  enabled?: boolean;
}

export interface BudgetFormProps {
  budget?: Budget | null;
  onSubmit: (data: Budget) => void;
  onCancel: () => void;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  surname: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  email: string;
  name: string;
  surname?: string;
  profilePicture?: string;
  role?: string;
}

export interface AuthUser {
  email: string;
  name: string;
  surname?: string;
  profilePicture?: string;
  role?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  surname?: string;
  profilePicture?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface RecommendedCategory {
  id: number;
  name: string;
  icon?: string;
  type: CategoryType;
  displayOrder?: number;
}

export interface RecommendedCurrency {
  id: number;
  name: string;
  symbol: string;
  displayOrder?: number;
  defaultSelected?: boolean;
}

export interface RecommendedEntity {
  id: number;
  name: string;
  iconUrl?: string;
}

export interface SetupRecommendations {
  currencies: RecommendedCurrency[];
  entities: RecommendedEntity[];
}

export interface RegisterWithSetupRequest {
  email: string;
  name: string;
  surname: string;
  password: string;
  currencies?: Array<{ name: string; symbol: string }>;
  selectedEntityIds?: number[];
}

export interface MonthlySummary {
  month: number;
  expensesARS: number;
  expensesUSD: number;
  incomeARS: number;
  incomeUSD: number;
}

export interface YearlySummary {
  year: number;
  expensesARS: number;
  expensesUSD: number;
  incomeARS: number;
  incomeUSD: number;
  months: MonthlySummary[];
}

export interface HistorySummary {
  years: YearlySummary[];
  allTimeExpensesARS: number;
  allTimeExpensesUSD: number;
  allTimeIncomeARS: number;
  allTimeIncomeUSD: number;
}
