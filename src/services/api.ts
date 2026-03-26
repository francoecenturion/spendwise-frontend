import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Category, PaymentMethod, Expense, Currency, Income, Saving, SavingsWallet, IssuingEntity, Debt, RecurrentExpense, RecurrentExpenseFilter, Budget, BudgetFilter, PageResponse, CategoryFilter, PaymentMethodFilter, ExpenseFilter, CurrencyFilter, IncomeFilter, SavingFilter, SavingsWalletFilter, IssuingEntityFilter, DebtFilter, LoginRequest, AuthResponse, UpdateProfileRequest, AuthUser, MailImport, MailImportFilter, MailImportConfirm, GmailStatus, MerchantBinding, SetupRecommendations, RegisterWithSetupRequest, RecommendedCurrency, RecommendedEntity, RecommendedPaymentMethod, HistorySummary } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const TOKEN_KEY = 'sw_token';
const USER_KEY = 'sw_user';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT to every request (except public auth endpoints)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const isPublicEndpoint = config.url === '/auth/login' || config.url === '/auth/register';
  if (token && !isPublicEndpoint) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear session and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = '/login';
    }
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },
  register: async (data: RegisterWithSetupRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/register', data);
    return response.data;
  },
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await apiClient.get<{ message: string }>('/auth/verify', { params: { token } });
    return response.data;
  },
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', { token, newPassword });
    return response.data;
  },
};

export const profileService = {
  getProfile: async (): Promise<AuthUser> => {
    const response = await apiClient.get<AuthUser>('/auth/profile');
    return response.data;
  },
  updateProfile: async (data: UpdateProfileRequest): Promise<AuthUser> => {
    const response = await apiClient.put<AuthUser>('/auth/profile', data);
    return response.data;
  },
  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/auth/account');
  },
};

interface CrudService<T, F = any> {
  getAll: (filters?: F, page?: number, size?: number) => Promise<PageResponse<T>>;
  getById: (id: number) => Promise<T>;
  create: (data: Omit<T, 'id'>) => Promise<T>;
  update: (id: number, data: Partial<T>) => Promise<T>;
  enable: (id: number) => Promise<T>;
  disable: (id: number) => Promise<T>;
  delete: (id: number) => Promise<void>;
}

const createCrudService = <T, F = any>(resourceName: string): CrudService<T, F> => ({
  getAll: async (filters?: F, page: number = 0, size: number = 1000): Promise<PageResponse<T>> => {
    const params: any = {
      page,
      size,
      sort: 'id,desc', // Ordenar por ID descendente por defecto
    };

    // Agregar filtros a los params
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params[key] = value;
        }
      });
    }

    const response: AxiosResponse<PageResponse<T>> = await apiClient.get(`/${resourceName}`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<T> => {
    const response: AxiosResponse<T> = await apiClient.get(`/${resourceName}/${id}`);
    return response.data;
  },

  create: async (data: Omit<T, 'id'>): Promise<T> => {
    const response: AxiosResponse<T> = await apiClient.post(`/${resourceName}`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<T>): Promise<T> => {
    const response: AxiosResponse<T> = await apiClient.put(`/${resourceName}/${id}`, data);
    return response.data;
  },

  enable: async (id: number): Promise<T> => {
    const response: AxiosResponse<T> = await apiClient.patch(`/${resourceName}/${id}/enable`);
    return response.data;
  },

  disable: async (id: number): Promise<T> => {
    const response: AxiosResponse<T> = await apiClient.patch(`/${resourceName}/${id}/disable`);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/${resourceName}/${id}`);
  },
});

export const categoryService = createCrudService<Category, CategoryFilter>('categories');
export const paymentMethodService = createCrudService<PaymentMethod, PaymentMethodFilter>('payment-methods');
export const expenseService = createCrudService<Expense, ExpenseFilter>('expenses');
const currencyBase = createCrudService<Currency, CurrencyFilter>('currencies');
export const currencyService = {
  ...currencyBase,
  setDefault: async (id: number): Promise<Currency> => {
    const response = await apiClient.patch<Currency>(`/currencies/${id}/setDefault`);
    return response.data;
  },
  removeDefault: async (id: number): Promise<Currency> => {
    const response = await apiClient.patch<Currency>(`/currencies/${id}/removeDefault`);
    return response.data;
  },
};
export const incomeService = createCrudService<Income, IncomeFilter>('income');
export const savingService = createCrudService<Saving, SavingFilter>('savings');
export const savingsWalletService = createCrudService<SavingsWallet, SavingsWalletFilter>('savings-wallets');
export const issuingEntityService = createCrudService<IssuingEntity, IssuingEntityFilter>('issuing-entities');
export const recurrentExpenseService = createCrudService<RecurrentExpense, RecurrentExpenseFilter>('recurrent-expenses');

const budgetBase = createCrudService<Budget, BudgetFilter>('budgets');
export const budgetService = {
  ...budgetBase,
  createNextMonth: async (): Promise<Budget> => {
    const response = await apiClient.post<Budget>('/budgets/next-month');
    return response.data;
  },
};

const debtBase = createCrudService<Debt, DebtFilter>('debts');
export const debtService = {
  ...debtBase,
  cancel: async (id: number): Promise<Debt> => {
    const response = await apiClient.patch(`/debts/${id}/cancel`);
    return response.data;
  },
  uncancel: async (id: number): Promise<Debt> => {
    const response = await apiClient.patch(`/debts/${id}/uncancel`);
    return response.data;
  },
};

export const setupService = {
  getRecommendations: () =>
    apiClient.get<SetupRecommendations>('/setup/recommendations').then(r => r.data),
};

export const gmailService = {
  getStatus: () => apiClient.get<GmailStatus>('/gmail/status').then(r => r.data),
  saveCredential: (gmailEmail: string, appPassword: string) =>
    apiClient.post<GmailStatus>('/gmail/credential', { gmailEmail, appPassword }).then(r => r.data),
  disconnect: () => apiClient.delete('/gmail/credential'),
};

const mailImportBase = createCrudService<MailImport, MailImportFilter>('mail/imports');
export const mailImportService = {
  ...mailImportBase,
  confirm: (id: number, data: MailImportConfirm) =>
    apiClient.post<MailImport>(`/mail/imports/${id}/confirm`, data).then(r => r.data),
  ignore: (id: number) =>
    apiClient.post<MailImport>(`/mail/imports/${id}/ignore`).then(r => r.data),
  getPendingCount: () =>
    apiClient.get<{ count: number }>('/mail/imports/pending-count').then(r => r.data),
  lookupBinding: async (merchant: string): Promise<MerchantBinding | null> => {
    try {
      const response = await apiClient.get<MerchantBinding>('/mail/imports/binding', { params: { merchant } });
      return response.status === 204 ? null : response.data;
    } catch {
      return null;
    }
  },
};

export const adminService = {
  // Recommended Entities
  listEntities: () =>
    apiClient.get<RecommendedEntity[]>('/admin/recommended-entities').then(r => r.data),
  createEntity: (data: Omit<RecommendedEntity, 'id'>) =>
    apiClient.post<RecommendedEntity>('/admin/recommended-entities', data).then(r => r.data),
  updateEntity: (id: number, data: Partial<RecommendedEntity>) =>
    apiClient.put<RecommendedEntity>(`/admin/recommended-entities/${id}`, data).then(r => r.data),
  deleteEntity: (id: number) =>
    apiClient.delete(`/admin/recommended-entities/${id}`),

  // Recommended Payment Methods
  listPaymentMethods: () =>
    apiClient.get<RecommendedPaymentMethod[]>('/admin/recommended-payment-methods').then(r => r.data),
  createPaymentMethod: (data: Omit<RecommendedPaymentMethod, 'id'>) =>
    apiClient.post<RecommendedPaymentMethod>('/admin/recommended-payment-methods', data).then(r => r.data),
  updatePaymentMethod: (id: number, data: Partial<RecommendedPaymentMethod>) =>
    apiClient.put<RecommendedPaymentMethod>(`/admin/recommended-payment-methods/${id}`, data).then(r => r.data),
  deletePaymentMethod: (id: number) =>
    apiClient.delete(`/admin/recommended-payment-methods/${id}`),

  // Recommended Currencies
  listCurrencies: () =>
    apiClient.get<RecommendedCurrency[]>('/admin/recommended-currencies').then(r => r.data),
  createCurrency: (data: Omit<RecommendedCurrency, 'id'>) =>
    apiClient.post<RecommendedCurrency>('/admin/recommended-currencies', data).then(r => r.data),
  updateCurrency: (id: number, data: Partial<RecommendedCurrency>) =>
    apiClient.put<RecommendedCurrency>(`/admin/recommended-currencies/${id}`, data).then(r => r.data),
  deleteCurrency: (id: number) =>
    apiClient.delete(`/admin/recommended-currencies/${id}`),
};

export const historyService = {
  getSummary: () => apiClient.get<HistorySummary>('/history/summary').then(r => r.data),
};

export default apiClient;
