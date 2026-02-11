import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { IInvoice, CreateInvoiceForm, CompanyInfo } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface InvoicesState {
    invoices: IInvoice[];
    currentInvoice: IInvoice | null;
    companyInfo: CompanyInfo | null;
    loading: boolean;
    error: string | null;
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

const initialState: InvoicesState = {
    invoices: [],
    currentInvoice: null,
    companyInfo: null,
    loading: false,
    error: null,
    pagination: {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0,
    },
};

// Fetch all invoices
export const fetchInvoices = createAsyncThunk(
    'invoices/fetchInvoices',
    async (params: { customer?: string; status?: string; page?: number } | undefined, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();
            if (params?.customer) queryParams.append('customer', params.customer);
            if (params?.status) queryParams.append('status', params.status);
            if (params?.page) queryParams.append('page', params.page.toString());

            const response = await api.get(`/invoices?${queryParams}`);
            const data = response.data;

            if (!data.success) {
                return rejectWithValue(data.message || 'Failed to fetch invoices');
            }

            return data.data;
        } catch (error) {
            return rejectWithValue('Failed to fetch invoices');
        }
    }
);

// Fetch invoice by order ID
export const fetchInvoiceByOrder = createAsyncThunk(
    'invoices/fetchInvoiceByOrder',
    async (orderId: string, { rejectWithValue }) => {
        try {
            const response = await api.get(`/invoices/order/${orderId}`);
            const data = response.data;

            if (!data.success) {
                return rejectWithValue(data.message || 'Failed to fetch invoice');
            }

            return data.data;
        } catch (error) {
            return rejectWithValue('Failed to fetch invoice');
        }
    }
);

// Fetch company info
export const fetchCompanyInfo = createAsyncThunk(
    'invoices/fetchCompanyInfo',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get(`/invoices/company-info`);
            const data = response.data;

            if (!data.success) {
                return rejectWithValue(data.message || 'Failed to fetch company info');
            }

            return data.data;
        } catch (error) {
            return rejectWithValue('Failed to fetch company info');
        }
    }
);

// Create invoice
export const createInvoice = createAsyncThunk(
    'invoices/createInvoice',
    async (invoiceData: CreateInvoiceForm, { rejectWithValue }) => {
        try {
            const response = await api.post(`/invoices`, invoiceData);
            const data = response.data;

            if (!data.success) {
                return rejectWithValue(data.message || 'Failed to create invoice');
            }

            return data.data;
        } catch (error) {
            return rejectWithValue('Failed to create invoice');
        }
    }
);

// Update invoice
export const updateInvoice = createAsyncThunk(
    'invoices/updateInvoice',
    async ({ id, updates }: { id: string; updates: Partial<IInvoice> }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/invoices/${id}`, updates);
            const data = response.data;

            if (!data.success) {
                return rejectWithValue(data.message || 'Failed to update invoice');
            }

            return data.data;
        } catch (error) {
            return rejectWithValue('Failed to update invoice');
        }
    }
);

// Send invoice via email
export const sendInvoiceEmail = createAsyncThunk(
    'invoices/sendInvoiceEmail',
    async (invoiceId: string, { rejectWithValue }) => {
        try {
            const response = await api.post(`/invoices/${invoiceId}/send-email`, {}, { timeout: 300000 });
            const data = response.data;

            if (!data.success) {
                return rejectWithValue(data.message || 'Failed to send invoice email');
            }

            return { invoiceId, ...data.data };
        } catch (error) {
            return rejectWithValue('Failed to send invoice email');
        }
    }
);

// Mark invoice as paid
export const markInvoiceAsPaid = createAsyncThunk(
    'invoices/markInvoiceAsPaid',
    async ({ invoiceId, checkNumber, paidAt }: { invoiceId: string; checkNumber?: string; paidAt?: string }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/invoices/${invoiceId}/mark-paid`, { checkNumber, paidAt });

            const data = response.data;
            if (!data.success) {
                return rejectWithValue(data.error || 'Failed to mark invoice as paid');
            }

            return data.data;
        } catch (error) {
            return rejectWithValue('Failed to mark invoice as paid');
        }
    }
);

// Download invoice PDF (returns URL)
export const getInvoicePDFUrl = (invoiceId: string): string => {
    const token = localStorage.getItem('token');
    return `${API_URL}/invoices/${invoiceId}/pdf?token=${token}`;
};

const invoicesSlice = createSlice({
    name: 'invoices',
    initialState,
    reducers: {
        clearCurrentInvoice: (state) => {
            state.currentInvoice = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Invoices
            .addCase(fetchInvoices.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchInvoices.fulfilled, (state, action: PayloadAction<{ invoices: IInvoice[]; pagination: typeof initialState.pagination }>) => {
                state.loading = false;
                state.invoices = action.payload.invoices;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchInvoices.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch Invoice by Order
            .addCase(fetchInvoiceByOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchInvoiceByOrder.fulfilled, (state, action: PayloadAction<IInvoice | null>) => {
                state.loading = false;
                state.currentInvoice = action.payload;
            })
            .addCase(fetchInvoiceByOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch Company Info
            .addCase(fetchCompanyInfo.fulfilled, (state, action: PayloadAction<CompanyInfo>) => {
                state.companyInfo = action.payload;
            })
            // Create Invoice
            .addCase(createInvoice.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createInvoice.fulfilled, (state, action: PayloadAction<IInvoice>) => {
                state.loading = false;
                state.invoices.unshift(action.payload);
                state.currentInvoice = action.payload;
            })
            .addCase(createInvoice.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Update Invoice
            .addCase(updateInvoice.fulfilled, (state, action: PayloadAction<IInvoice>) => {
                const index = state.invoices.findIndex((inv) => inv._id === action.payload._id);
                if (index !== -1) {
                    state.invoices[index] = action.payload;
                }
                if (state.currentInvoice?._id === action.payload._id) {
                    state.currentInvoice = action.payload;
                }
            })
            // Send Invoice Email
            .addCase(sendInvoiceEmail.pending, (state) => {
                state.loading = true;
            })
            .addCase(sendInvoiceEmail.fulfilled, (state, action) => {
                state.loading = false;
                const invoice = state.invoices.find((inv) => inv._id === action.payload.invoiceId);
                if (invoice) {
                    invoice.status = 'sent';
                    invoice.emailSentAt = action.payload.sentAt;
                    invoice.emailSentTo = action.payload.sentTo;
                }
            })
            .addCase(sendInvoiceEmail.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Mark Invoice as Paid
            .addCase(markInvoiceAsPaid.pending, (state) => {
                state.loading = true;
            })
            .addCase(markInvoiceAsPaid.fulfilled, (state, action: PayloadAction<IInvoice>) => {
                state.loading = false;
                const index = state.invoices.findIndex((inv) => inv._id === action.payload._id);
                if (index !== -1) {
                    state.invoices[index] = action.payload;
                }
                if (state.currentInvoice?._id === action.payload._id) {
                    state.currentInvoice = action.payload;
                }
            })
            .addCase(markInvoiceAsPaid.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearCurrentInvoice, clearError } = invoicesSlice.actions;
export default invoicesSlice.reducer;
