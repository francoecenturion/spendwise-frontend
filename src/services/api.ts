import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Category, PaymentMethod, Expense } from '../types';

const API_BASE_URL = 'http://localhost:8080';

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

interface CrudService<T> {
  getAll: () => Promise<T[]>;
  getById: (id: number) => Promise<T>;
  create: (data: Omit<T, 'id'>) => Promise<T>;
  update: (id: number, data: Partial<T>) => Promise<T>;
  delete: (id: number) => Promise<void>;
}

const createCrudService = <T>(resourceName: string): CrudService<T> => ({
  getAll: async (): Promise<T[]> => {
    const response: AxiosResponse<T[]> = await apiClient.get(`/${resourceName}`);
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

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/${resourceName}/${id}`);
  },
});

export const categoryService = createCrudService<Category>('categories');
export const paymentMethodService = createCrudService<PaymentMethod>('payment-methods');
export const expenseService = createCrudService<Expense>('expenses');

export default apiClient;
