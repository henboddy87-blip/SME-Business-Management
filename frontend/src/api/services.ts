import { apiClient } from './client';
import {
  User, Organization, OrganizationSettings, Product, Category, Warehouse,
  StockMovement, Customer, Supplier, Sale, PurchaseOrder, Purchase,
  Expense, ExpenseCategory, Payment, Employee, Attendance, LeaveRequest,
  KPICards, BusinessInsight, NotificationItem, SubscriptionPlan
} from '../types';

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },
  register: async (payload: any) => {
    const res = await apiClient.post('/auth/register', payload);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  changePassword: async (payload: any) => {
    const res = await apiClient.post('/auth/change-password', payload);
    return res.data;
  }
};

export const orgApi = {
  getCurrent: async (): Promise<Organization> => {
    const res = await apiClient.get('/organizations/current');
    return res.data;
  },
  updateCurrent: async (data: any): Promise<Organization> => {
    const res = await apiClient.put('/organizations/current', data);
    return res.data;
  },
  updateSettings: async (data: any): Promise<OrganizationSettings> => {
    const res = await apiClient.put('/organizations/current/settings', data);
    return res.data;
  },
  getProvinces: async (): Promise<Array<{ en: string; kh: string }>> => {
    const res = await apiClient.get('/organizations/provinces');
    return res.data;
  },
  completeOnboarding: async () => {
    const res = await apiClient.post('/organizations/onboarding/complete');
    return res.data;
  },
  testTelegram: async () => {
    const res = await apiClient.post('/organizations/test-telegram');
    return res.data;
  }
};

export const userApi = {
  listUsers: async (): Promise<User[]> => {
    const res = await apiClient.get('/users');
    return res.data;
  },
  createUser: async (data: any): Promise<User> => {
    const res = await apiClient.post('/users', data);
    return res.data;
  },
  updateUser: async (id: string, data: any): Promise<User> => {
    const res = await apiClient.put(`/users/${id}`, data);
    return res.data;
  },
  deleteUser: async (id: string) => {
    const res = await apiClient.delete(`/users/${id}`);
    return res.data;
  },
  listRoles: async () => {
    const res = await apiClient.get('/users/roles');
    return res.data;
  }
};

export const productApi = {
  listProducts: async (params?: any) => {
    const res = await apiClient.get('/products', { params });
    return res.data;
  },
  getProduct: async (id: string): Promise<Product> => {
    const res = await apiClient.get(`/products/${id}`);
    return res.data;
  },
  createProduct: async (data: any): Promise<Product> => {
    const res = await apiClient.post('/products', data);
    return res.data;
  },
  updateProduct: async (id: string, data: any): Promise<Product> => {
    const res = await apiClient.put(`/products/${id}`, data);
    return res.data;
  },
  deleteProduct: async (id: string) => {
    const res = await apiClient.delete(`/products/${id}`);
    return res.data;
  },
  importCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/products/import-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

export const categoryApi = {
  listCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get('/categories');
    return res.data;
  },
  createCategory: async (data: any): Promise<Category> => {
    const res = await apiClient.post('/categories', data);
    return res.data;
  },
  deleteCategory: async (id: string) => {
    const res = await apiClient.delete(`/categories/${id}`);
    return res.data;
  },
  listBrands: async () => {
    const res = await apiClient.get('/categories/brands/all');
    return res.data;
  },
  createBrand: async (data: any) => {
    const res = await apiClient.post('/categories/brands/all', data);
    return res.data;
  },
  listUnits: async () => {
    const res = await apiClient.get('/categories/units/all');
    return res.data;
  },
  createUnit: async (data: any) => {
    const res = await apiClient.post('/categories/units/all', data);
    return res.data;
  }
};

export const warehouseApi = {
  listWarehouses: async (): Promise<Warehouse[]> => {
    const res = await apiClient.get('/warehouses');
    return res.data;
  },
  createWarehouse: async (data: any): Promise<Warehouse> => {
    const res = await apiClient.post('/warehouses', data);
    return res.data;
  },
  updateWarehouse: async (id: string, data: any): Promise<Warehouse> => {
    const res = await apiClient.put(`/warehouses/${id}`, data);
    return res.data;
  },
  deleteWarehouse: async (id: string) => {
    const res = await apiClient.delete(`/warehouses/${id}`);
    return res.data;
  }
};

export const inventoryApi = {
  getStock: async (warehouseId?: string) => {
    const res = await apiClient.get('/inventory/stock', { params: { warehouse_id: warehouseId } });
    return res.data;
  },
  getMovements: async (params?: any): Promise<StockMovement[]> => {
    const res = await apiClient.get('/inventory/movements', { params });
    return res.data;
  },
  adjustStock: async (data: any) => {
    const res = await apiClient.post('/inventory/adjust', data);
    return res.data;
  },
  listTransfers: async () => {
    const res = await apiClient.get('/inventory/transfers');
    return res.data;
  },
  createTransfer: async (data: any) => {
    const res = await apiClient.post('/inventory/transfers', data);
    return res.data;
  },
  updateTransferStatus: async (id: string, status: string) => {
    const res = await apiClient.put(`/inventory/transfers/${id}/status`, { status });
    return res.data;
  }
};

export const partnerApi = {
  listCustomers: async (params?: any): Promise<Customer[]> => {
    const res = await apiClient.get('/customers', { params });
    return res.data;
  },
  createCustomer: async (data: any): Promise<Customer> => {
    const res = await apiClient.post('/customers', data);
    return res.data;
  },
  updateCustomer: async (id: string, data: any): Promise<Customer> => {
    const res = await apiClient.put(`/customers/${id}`, data);
    return res.data;
  },
  deleteCustomer: async (id: string) => {
    const res = await apiClient.delete(`/customers/${id}`);
    return res.data;
  },
  listSuppliers: async (params?: any): Promise<Supplier[]> => {
    const res = await apiClient.get('/suppliers', { params });
    return res.data;
  },
  createSupplier: async (data: any): Promise<Supplier> => {
    const res = await apiClient.post('/suppliers', data);
    return res.data;
  },
  updateSupplier: async (id: string, data: any): Promise<Supplier> => {
    const res = await apiClient.put(`/suppliers/${id}`, data);
    return res.data;
  },
  deleteSupplier: async (id: string) => {
    const res = await apiClient.delete(`/suppliers/${id}`);
    return res.data;
  }
};

export const purchaseApi = {
  listOrders: async (status?: string): Promise<PurchaseOrder[]> => {
    const res = await apiClient.get('/purchases/orders', { params: { status_filter: status } });
    return res.data;
  },
  createOrder: async (data: any): Promise<PurchaseOrder> => {
    const res = await apiClient.post('/purchases/orders', data);
    return res.data;
  },
  receiveOrder: async (poId: string): Promise<Purchase> => {
    const res = await apiClient.put(`/purchases/orders/${poId}/receive`);
    return res.data;
  },
  listPurchases: async (): Promise<Purchase[]> => {
    const res = await apiClient.get('/purchases');
    return res.data;
  },
  createDirectPurchase: async (data: any): Promise<Purchase> => {
    const res = await apiClient.post('/purchases', data);
    return res.data;
  },
  createReturn: async (data: any) => {
    const res = await apiClient.post('/purchases/returns', data);
    return res.data;
  }
};

export const saleApi = {
  listSales: async (params?: any): Promise<Sale[]> => {
    const res = await apiClient.get('/sales', { params });
    return res.data;
  },
  getSale: async (id: string): Promise<Sale> => {
    const res = await apiClient.get(`/sales/${id}`);
    return res.data;
  },
  completeSale: async (data: any): Promise<Sale> => {
    const res = await apiClient.post('/sales', data);
    return res.data;
  },
  createReturn: async (data: any) => {
    const res = await apiClient.post('/sales/returns', data);
    return res.data;
  },
  listReturns: async () => {
    const res = await apiClient.get('/sales/returns');
    return res.data;
  },
  generateKhqr: async (payload: { amount: number; currency?: string; invoice_number?: string }) => {
    const res = await apiClient.post('/payments/khqr/generate', payload);
    return res.data;
  },
  verifyKhqr: async (md5Hash: string) => {
    const res = await apiClient.get(`/payments/khqr/verify/${md5Hash}`);
    return res.data;
  }
};

export const quotationApi = {
  listQuotations: async (): Promise<any[]> => {
    const res = await apiClient.get('/quotations');
    return res.data;
  },
  createQuotation: async (data: any) => {
    const res = await apiClient.post('/quotations', data);
    return res.data;
  },
  updateStatus: async (id: string, newStatus: string) => {
    const res = await apiClient.put(`/quotations/${id}/status?new_status=${newStatus}`);
    return res.data;
  }
};

export const invoiceApi = {
  listInvoices: async (): Promise<any[]> => {
    const res = await apiClient.get('/invoices');
    return res.data;
  },
  getDetails: async (id: string): Promise<any> => {
    const res = await apiClient.get(`/invoices/${id}`);
    return res.data;
  }
};

export const financeApi = {
  listExpenses: async (categoryId?: string): Promise<Expense[]> => {
    const res = await apiClient.get('/expenses', { params: { category_id: categoryId } });
    return res.data;
  },
  createExpense: async (data: any): Promise<Expense> => {
    const res = await apiClient.post('/expenses', data);
    return res.data;
  },
  listExpenseCategories: async (): Promise<ExpenseCategory[]> => {
    const res = await apiClient.get('/expenses/categories');
    return res.data;
  },
  createExpenseCategory: async (data: any): Promise<ExpenseCategory> => {
    const res = await apiClient.post('/expenses/categories', data);
    return res.data;
  },
  listPayments: async (): Promise<Payment[]> => {
    const res = await apiClient.get('/finance/payments');
    return res.data;
  },
  createPayment: async (data: any): Promise<Payment> => {
    const res = await apiClient.post('/finance/payments', data);
    return res.data;
  },
  getCashFlow: async () => {
    const res = await apiClient.get('/finance/cash-flow');
    return res.data;
  },
  getProfitAndLoss: async () => {
    const res = await apiClient.get('/finance/profit-and-loss');
    return res.data;
  }
};

export const hrApi = {
  listEmployees: async (): Promise<Employee[]> => {
    const res = await apiClient.get('/employees');
    return res.data;
  },
  createEmployee: async (data: any): Promise<Employee> => {
    const res = await apiClient.post('/employees', data);
    return res.data;
  },
  updateEmployee: async (id: string, data: any): Promise<Employee> => {
    const res = await apiClient.put(`/employees/${id}`, data);
    return res.data;
  },
  listDepartments: async () => {
    const res = await apiClient.get('/employees/departments');
    return res.data;
  },
  createDepartment: async (data: any) => {
    const res = await apiClient.post('/employees/departments', data);
    return res.data;
  },
  listPositions: async () => {
    const res = await apiClient.get('/employees/positions');
    return res.data;
  },
  createPosition: async (data: any) => {
    const res = await apiClient.post('/employees/positions', data);
    return res.data;
  },
  listAttendance: async (dateStr?: string): Promise<Attendance[]> => {
    const res = await apiClient.get('/attendance', { params: { target_date: dateStr } });
    return res.data;
  },
  recordAttendance: async (data: any): Promise<Attendance> => {
    const res = await apiClient.post('/attendance', data);
    return res.data;
  },
  getPayrollPreview: async () => {
    const res = await apiClient.get('/attendance/payroll-preview');
    return res.data;
  },
  listLeaves: async (): Promise<LeaveRequest[]> => {
    const res = await apiClient.get('/leaves');
    return res.data;
  },
  submitLeave: async (data: any): Promise<LeaveRequest> => {
    const res = await apiClient.post('/leaves', data);
    return res.data;
  },
  updateLeaveStatus: async (id: string, status: string): Promise<LeaveRequest> => {
    const res = await apiClient.put(`/leaves/${id}/status`, { status });
    return res.data;
  }
};

export const dashboardApi = {
  getDashboard: async (period: string = 'month') => {
    const res = await apiClient.get('/dashboard', { params: { period } });
    return res.data;
  },
  getAnalytics: async () => {
    const res = await apiClient.get('/analytics');
    return res.data;
  },
  getReports: {
    sales: async (groupBy: string = 'product') => {
      const res = await apiClient.get('/reports/sales', { params: { group_by: groupBy } });
      return res.data;
    },
    inventory: async () => {
      const res = await apiClient.get('/reports/inventory');
      return res.data;
    },
    purchases: async () => {
      const res = await apiClient.get('/reports/purchases');
      return res.data;
    }
  }
};

export const subscriptionApi = {
  listPlans: async (): Promise<SubscriptionPlan[]> => {
    const res = await apiClient.get('/subscriptions/plans');
    return res.data;
  },
  getCurrent: async () => {
    const res = await apiClient.get('/subscriptions/current');
    return res.data;
  },
  getUsage: async () => {
    const res = await apiClient.get('/subscriptions/usage');
    return res.data;
  },
  upgrade: async (planSlug: string) => {
    const res = await apiClient.post('/subscriptions/upgrade', { plan_slug: planSlug });
    return res.data;
  }
};

export const superadminApi = {
  getDashboard: async () => {
    const res = await apiClient.get('/superadmin/dashboard');
    return res.data;
  },
  listBusinesses: async (): Promise<Organization[]> => {
    const res = await apiClient.get('/superadmin/businesses');
    return res.data;
  },
  toggleStatus: async (orgId: string) => {
    const res = await apiClient.put(`/superadmin/businesses/${orgId}/toggle-status`);
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await apiClient.get('/superadmin/audit-logs');
    return res.data;
  }
};

export const searchApi = {
  search: async (q: string) => {
    const res = await apiClient.get('/search', { params: { q } });
    return res.data;
  }
};

export const notificationApi = {
  list: async (): Promise<NotificationItem[]> => {
    const res = await apiClient.get('/notifications');
    return res.data;
  },
  markRead: async (id: string) => {
    const res = await apiClient.put(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await apiClient.put('/notifications/read-all');
    return res.data;
  }
};

export const auditApi = {
  list: async (params?: any) => {
    const res = await apiClient.get('/audit-logs', { params });
    return res.data;
  }
};
