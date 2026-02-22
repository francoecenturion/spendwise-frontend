import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Category, PaymentMethod, Expense, Currency, Income, Saving, SavingsWallet, IssuingEntity, Debt, PageResponse, CategoryFilter, PaymentMethodFilter, ExpenseFilter, CurrencyFilter, IncomeFilter, SavingFilter, SavingsWalletFilter, IssuingEntityFilter, DebtFilter } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

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
export const currencyService = createCrudService<Currency, CurrencyFilter>('currencies');
export const incomeService = createCrudService<Income, IncomeFilter>('income');
export const savingService = createCrudService<Saving, SavingFilter>('savings');
export const savingsWalletService = createCrudService<SavingsWallet, SavingsWalletFilter>('savings-wallets');
export const issuingEntityService = createCrudService<IssuingEntity, IssuingEntityFilter>('issuing-entities');

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

export default apiClient;
