import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { ICustomer, ICustomerProductPricing, ApiResponse, CreateCustomerForm } from '../../types';

interface CustomersState {
    items: ICustomer[];
    selectedCustomer: ICustomer | null;
    customerPricing: ICustomerProductPricing[];
    loading: boolean;
    pricingLoading: boolean;
    error: string | null;
}

const initialState: CustomersState = {
    items: [],
    selectedCustomer: null,
    customerPricing: [],
    loading: false,
    pricingLoading: false,
    error: null,
};

// Async thunks
export const fetchCustomers = createAsyncThunk(
    'customers/fetchCustomers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get<ApiResponse<ICustomer[]>>('/customers');
            return response.data.data || [];
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to fetch customers');
        }
    }
);

export const fetchCustomerById = createAsyncThunk(
    'customers/fetchCustomerById',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await api.get<ApiResponse<ICustomer>>(`/customers/${id}`);
            return response.data.data;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to fetch customer');
        }
    }
);

export const fetchCustomerBySlug = createAsyncThunk(
    'customers/fetchCustomerBySlug',
    async (slug: string, { rejectWithValue }) => {
        try {
            const response = await api.get<ApiResponse<ICustomer>>(`/customers/slug/${slug}`);
            return response.data.data;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to fetch customer');
        }
    }
);

export const fetchCustomerPricing = createAsyncThunk(
    'customers/fetchCustomerPricing',
    async (customerId: string, { rejectWithValue }) => {
        try {
            const response = await api.get<ApiResponse<ICustomerProductPricing[]>>(`/customers/${customerId}/pricing`);
            return response.data.data || [];
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to fetch customer pricing');
        }
    }
);

export const createCustomer = createAsyncThunk(
    'customers/createCustomer',
    async (customer: CreateCustomerForm, { rejectWithValue }) => {
        try {
            const response = await api.post<ApiResponse<ICustomer>>('/customers', customer);
            return response.data.data;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to create customer');
        }
    }
);

export const updateCustomer = createAsyncThunk(
    'customers/updateCustomer',
    async ({ id, data }: { id: string; data: Partial<CreateCustomerForm> }, { rejectWithValue }) => {
        try {
            const response = await api.put<ApiResponse<ICustomer>>(`/customers/${id}`, data);
            return response.data.data;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to update customer');
        }
    }
);

export const deleteCustomer = createAsyncThunk(
    'customers/deleteCustomer',
    async (id: string, { rejectWithValue }) => {
        try {
            await api.delete(`/customers/${id}`);
            return id;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to delete customer');
        }
    }
);

const customersSlice = createSlice({
    name: 'customers',
    initialState,
    reducers: {
        clearCustomersError: (state) => {
            state.error = null;
        },
        clearSelectedCustomer: (state) => {
            state.selectedCustomer = null;
            state.customerPricing = [];
        },
        setSelectedCustomer: (state, action: PayloadAction<ICustomer>) => {
            state.selectedCustomer = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch all customers
            .addCase(fetchCustomers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCustomers.fulfilled, (state, action: PayloadAction<ICustomer[]>) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchCustomers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch customer by ID
            .addCase(fetchCustomerById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCustomerById.fulfilled, (state, action: PayloadAction<ICustomer | undefined>) => {
                state.loading = false;
                if (action.payload) {
                    state.selectedCustomer = action.payload;
                }
            })
            .addCase(fetchCustomerById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch customer by slug
            .addCase(fetchCustomerBySlug.fulfilled, (state, action: PayloadAction<ICustomer | undefined>) => {
                if (action.payload) {
                    state.selectedCustomer = action.payload;
                }
            })
            // Fetch customer pricing
            .addCase(fetchCustomerPricing.pending, (state) => {
                state.pricingLoading = true;
            })
            .addCase(fetchCustomerPricing.fulfilled, (state, action: PayloadAction<ICustomerProductPricing[]>) => {
                state.pricingLoading = false;
                state.customerPricing = action.payload;
            })
            .addCase(fetchCustomerPricing.rejected, (state) => {
                state.pricingLoading = false;
            })
            // Create customer
            .addCase(createCustomer.fulfilled, (state, action: PayloadAction<ICustomer | undefined>) => {
                if (action.payload) {
                    state.items.push(action.payload);
                }
            })
            // Update customer
            .addCase(updateCustomer.fulfilled, (state, action: PayloadAction<ICustomer | undefined>) => {
                if (action.payload) {
                    const index = state.items.findIndex((c) => c._id === action.payload!._id);
                    if (index !== -1) {
                        state.items[index] = action.payload;
                    }
                    if (state.selectedCustomer?._id === action.payload._id) {
                        state.selectedCustomer = action.payload;
                    }
                }
            })
            // Delete customer
            .addCase(deleteCustomer.fulfilled, (state, action: PayloadAction<string>) => {
                state.items = state.items.filter((c) => c._id !== action.payload);
                if (state.selectedCustomer?._id === action.payload) {
                    state.selectedCustomer = null;
                }
            });
    },
});

export const { clearCustomersError, clearSelectedCustomer, setSelectedCustomer } = customersSlice.actions;
export default customersSlice.reducer;
