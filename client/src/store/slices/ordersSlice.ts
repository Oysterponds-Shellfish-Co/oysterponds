import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { IOrder, IOrderStats, ApiResponse, CreateOrderForm, PublicOrderForm, PaginatedResponse, OrderStatus } from '../../types';

interface OrdersState {
    items: IOrder[];
    selectedOrder: IOrder | null;
    stats: IOrderStats | null;
    loading: boolean;
    statsLoading: boolean;
    error: string | null;
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    filters: {
        customer?: string;
        status?: OrderStatus;
        startDate?: string;
        endDate?: string;
    };
}

const initialState: OrdersState = {
    items: [],
    selectedOrder: null,
    stats: null,
    loading: false,
    statsLoading: false,
    error: null,
    pagination: {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0,
    },
    filters: {},
};

// Async thunks
export const fetchOrders = createAsyncThunk(
    'orders/fetchOrders',
    async (params: { page?: number; limit?: number; customer?: string; status?: string } = {}, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.customer) queryParams.append('customer', params.customer);
            if (params.status) queryParams.append('status', params.status);

            const response = await api.get<ApiResponse<PaginatedResponse<IOrder>>>(`/orders?${queryParams}`);
            return response.data.data;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to fetch orders');
        }
    }
);

export const fetchOrderById = createAsyncThunk(
    'orders/fetchOrderById',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await api.get<ApiResponse<IOrder>>(`/orders/${id}`);
            return response.data.data;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to fetch order');
        }
    }
);

export const fetchOrderStats = createAsyncThunk(
    'orders/fetchOrderStats',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get<ApiResponse<IOrderStats>>('/orders/stats');
            return response.data.data;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to fetch order stats');
        }
    }
);

export const createOrder = createAsyncThunk(
    'orders/createOrder',
    async (order: CreateOrderForm, { rejectWithValue }) => {
        try {
            const response = await api.post<ApiResponse<IOrder>>('/orders', order);
            return response.data.data;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to create order');
        }
    }
);

export const createPublicOrder = createAsyncThunk(
    'orders/createPublicOrder',
    async (order: PublicOrderForm, { rejectWithValue }) => {
        try {
            const response = await api.post<ApiResponse<IOrder>>('/orders/public', order);
            return response.data.data;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to submit order');
        }
    }
);

export const updateOrderStatus = createAsyncThunk(
    'orders/updateOrderStatus',
    async ({ id, status }: { id: string; status: OrderStatus }, { rejectWithValue }) => {
        try {
            const response = await api.patch<ApiResponse<IOrder>>(`/orders/${id}/status`, { status });
            return response.data.data;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to update order status');
        }
    }
);

export const deleteOrder = createAsyncThunk(
    'orders/deleteOrder',
    async (id: string, { rejectWithValue }) => {
        try {
            await api.delete(`/orders/${id}`);
            return id;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to delete order');
        }
    }
);

export const updateOrder = createAsyncThunk(
    'orders/updateOrder',
    async ({ id, order }: { id: string; order: any }, { rejectWithValue }) => {
        try {
            const response = await api.put<ApiResponse<IOrder>>(`/orders/${id}`, order);
            return response.data.data;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to update order');
        }
    }
);

const ordersSlice = createSlice({
    name: 'orders',
    initialState,
    reducers: {
        clearOrdersError: (state) => {
            state.error = null;
        },
        clearSelectedOrder: (state) => {
            state.selectedOrder = null;
        },
        setFilters: (state, action: PayloadAction<OrdersState['filters']>) => {
            state.filters = action.payload;
        },
        clearFilters: (state) => {
            state.filters = {};
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch orders
            .addCase(fetchOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload) {
                    state.items = action.payload.orders;
                    state.pagination = action.payload.pagination;
                }
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch order by ID
            .addCase(fetchOrderById.fulfilled, (state, action: PayloadAction<IOrder | undefined>) => {
                if (action.payload) {
                    state.selectedOrder = action.payload;
                }
            })
            // Fetch stats
            .addCase(fetchOrderStats.pending, (state) => {
                state.statsLoading = true;
            })
            .addCase(fetchOrderStats.fulfilled, (state, action: PayloadAction<IOrderStats | undefined>) => {
                state.statsLoading = false;
                if (action.payload) {
                    state.stats = action.payload;
                }
            })
            .addCase(fetchOrderStats.rejected, (state) => {
                state.statsLoading = false;
            })
            // Create order
            .addCase(createOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createOrder.fulfilled, (state, action: PayloadAction<IOrder | undefined>) => {
                state.loading = false;
                if (action.payload) {
                    state.items.unshift(action.payload);
                }
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Create public order
            .addCase(createPublicOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createPublicOrder.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createPublicOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Update order status
            .addCase(updateOrderStatus.fulfilled, (state, action: PayloadAction<IOrder | undefined>) => {
                if (action.payload) {
                    const index = state.items.findIndex((o) => o._id === action.payload!._id);
                    if (index !== -1) {
                        state.items[index] = action.payload;
                    }
                    if (state.selectedOrder?._id === action.payload._id) {
                        state.selectedOrder = action.payload;
                    }
                }
            })
            // Update order
            .addCase(updateOrder.fulfilled, (state, action: PayloadAction<IOrder | undefined>) => {
                if (action.payload) {
                    const index = state.items.findIndex((o) => o._id === action.payload!._id);
                    if (index !== -1) {
                        state.items[index] = action.payload;
                    }
                    if (state.selectedOrder?._id === action.payload._id) {
                        state.selectedOrder = action.payload;
                    }
                }
            })
            // Delete order
            .addCase(deleteOrder.fulfilled, (state, action: PayloadAction<string>) => {
                state.items = state.items.filter((o) => o._id !== action.payload);
                if (state.selectedOrder?._id === action.payload) {
                    state.selectedOrder = null;
                }
            });
    },
});

export const { clearOrdersError, clearSelectedOrder, setFilters, clearFilters } = ordersSlice.actions;
export default ordersSlice.reducer;
