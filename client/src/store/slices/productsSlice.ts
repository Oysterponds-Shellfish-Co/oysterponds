import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { IProduct, ApiResponse } from '../../types';

interface ProductsState {
    items: IProduct[];
    loading: boolean;
    error: string | null;
}

const initialState: ProductsState = {
    items: [],
    loading: false,
    error: null,
};

// Async thunks
export const fetchProducts = createAsyncThunk(
    'products/fetchProducts',
    async (params: { all?: boolean } | void, { rejectWithValue }) => {
        try {
            const url = params && params.all ? '/products?all=true' : '/products';
            const response = await api.get<ApiResponse<IProduct[]>>(url);
            return response.data.data || [];
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to fetch products');
        }
    }
);

export const createProduct = createAsyncThunk(
    'products/createProduct',
    async (product: Partial<IProduct>, { rejectWithValue }) => {
        try {
            const response = await api.post<ApiResponse<IProduct>>('/products', product);
            return response.data.data;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to create product');
        }
    }
);

export const updateProduct = createAsyncThunk(
    'products/updateProduct',
    async ({ id, data }: { id: string; data: Partial<IProduct> }, { rejectWithValue }) => {
        try {
            const response = await api.put<ApiResponse<IProduct>>(`/products/${id}`, data);
            return response.data.data;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to update product');
        }
    }
);

export const deleteProduct = createAsyncThunk(
    'products/deleteProduct',
    async (id: string, { rejectWithValue }) => {
        try {
            await api.delete(`/products/${id}`);
            return id;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to archive product');
        }
    }
);

const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        clearProductsError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch products
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<IProduct[]>) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Create product
            .addCase(createProduct.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createProduct.fulfilled, (state, action: PayloadAction<IProduct | undefined>) => {
                state.loading = false;
                if (action.payload) {
                    state.items.push(action.payload);
                }
            })
            .addCase(createProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Update product
            .addCase(updateProduct.fulfilled, (state, action: PayloadAction<IProduct | undefined>) => {
                if (action.payload) {
                    const index = state.items.findIndex((p) => p._id === action.payload!._id);
                    if (index !== -1) {
                        state.items[index] = action.payload;
                    }
                }
            })
            // Delete (archive) product — server does soft-delete, sets active: false
            .addCase(deleteProduct.fulfilled, (state, action: PayloadAction<string>) => {
                const index = state.items.findIndex((p) => p._id === action.payload);
                if (index !== -1) {
                    state.items[index] = { ...state.items[index], active: false };
                }
            });
    },
});

export const { clearProductsError } = productsSlice.actions;
export default productsSlice.reducer;
