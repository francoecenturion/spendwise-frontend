import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Category, PaymentMethod, Expense, Currency, Income, Saving, SavingsWallet, IssuingEntity, PersonalDebt, RecurrentExpense, RecurrentExpenseFilter, Budget, BudgetFilter, PageResponse, CategoryFilter, PaymentMethodFilter, ExpenseFilter, CurrencyFilter, IncomeFilter, SavingFilter, SavingsWalletFilter, IssuingEntityFilter, MerchantShortcut, MerchantShortcutFilter, LoginRequest, AuthResponse, UpdateProfileRequest, AuthUser, SetupRecommendations, RegisterWithSetupRequest, RecommendedCurrency, RecommendedEntity, RecommendedCategory, HistorySummary } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const TOKEN_KEY = 'sw_token';
const REFRESH_TOKEN_KEY = 'sw_refresh_token';
const USER_KEY = 'sw_user';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT to every request (except public auth endpoints)
const PUBLIC_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout',
  '/auth/forgot-password', '/auth/reset-password', '/auth/verify'];

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const isPublic = PUBLIC_ENDPOINTS.some(ep => config.url?.startsWith(ep));
  if (token && !isPublic) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh token logic: queue concurrent 401s and retry after a single refresh call
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  refreshQueue = [];
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// On 401: try refresh token before redirecting to login.
// On network error (no response): retry up to 3 times with increasing delays (Render cold starts can take 30-50s).
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config;

    if (error.response?.status === 401 && !originalConfig?._retried) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        clearSession();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalConfig.headers.Authorization = `Bearer ${newToken}`;
          originalConfig._retried = true;
          return apiClient(originalConfig);
        });
      }

      originalConfig._retried = true;
      isRefreshing = true;

      try {
        const { data } = await apiClient.post('/auth/refresh', { refreshToken });
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        if (data.email) localStorage.setItem(USER_KEY, JSON.stringify({
          email: data.email, name: data.name, surname: data.surname,
          profilePicture: data.profilePicture, role: data.role,
        }));
        apiClient.defaults.headers.common.Authorization = `Bearer ${data.token}`;
        originalConfig.headers.Authorization = `Bearer ${data.token}`;
        processQueue(null, data.token);
        return apiClient(originalConfig);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearSession();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Network error (backend sleeping / cold start): retry up to 3 times
    if (!error.response) {
      const retryCount = error.config?._networkRetryCount ?? 0;
      if (retryCount < 3) {
        error.config._networkRetryCount = retryCount + 1;
        const delay = [5000, 15000, 30000][retryCount];
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiClient(error.config);
      }
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
const paymentMethodBase = createCrudService<PaymentMethod, PaymentMethodFilter>('payment-methods');
export const paymentMethodService = {
  ...paymentMethodBase,
  setDefault: async (id: number): Promise<PaymentMethod> => {
    const response = await apiClient.patch<PaymentMethod>(`/payment-methods/${id}/setDefault`);
    return response.data;
  },
  removeDefault: async (id: number): Promise<PaymentMethod> => {
    const response = await apiClient.patch<PaymentMethod>(`/payment-methods/${id}/removeDefault`);
    return response.data;
  },
};
export const merchantShortcutService = createCrudService<MerchantShortcut, MerchantShortcutFilter>('merchant-shortcuts');
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

const personalDebtBase = createCrudService<PersonalDebt, {}>('personal-debts');
export const personalDebtService = {
  ...personalDebtBase,
  cancel: async (id: number): Promise<PersonalDebt> => {
    const response = await apiClient.patch(`/personal-debts/${id}/cancel`);
    return response.data;
  },
  uncancel: async (id: number): Promise<PersonalDebt> => {
    const response = await apiClient.patch(`/personal-debts/${id}/uncancel`);
    return response.data;
  },
};

export const setupService = {
  getRecommendations: () =>
    apiClient.get<SetupRecommendations>('/setup/recommendations').then(r => r.data),
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

  // Recommended Categories
  listCategories: () =>
    apiClient.get<RecommendedCategory[]>('/admin/recommended-categories').then(r => r.data),
  createCategory: (data: Omit<RecommendedCategory, 'id'>) =>
    apiClient.post<RecommendedCategory>('/admin/recommended-categories', data).then(r => r.data),
  updateCategory: (id: number, data: Partial<RecommendedCategory>) =>
    apiClient.put<RecommendedCategory>(`/admin/recommended-categories/${id}`, data).then(r => r.data),
  deleteCategory: (id: number) =>
    apiClient.delete(`/admin/recommended-categories/${id}`),

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
