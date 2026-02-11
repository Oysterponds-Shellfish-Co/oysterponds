import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { IHarvestLocation, ApiResponse } from '../../types';

interface HarvestLocationsState {
    items: IHarvestLocation[];
    loading: boolean;
    error: string | null;
}

const initialState: HarvestLocationsState = {
    items: [],
    loading: false,
    error: null,
};

// Async thunks
export const fetchHarvestLocations = createAsyncThunk(
    'harvestLocations/fetchHarvestLocations',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get<ApiResponse<IHarvestLocation[]>>('/harvest-locations');
            return response.data.data || [];
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            return rejectWithValue(err.response?.data?.error || 'Failed to fetch harvest locations');
        }
    }
);

const harvestLocationsSlice = createSlice({
    name: 'harvestLocations',
    initialState,
    reducers: {
        clearHarvestLocationsError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchHarvestLocations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchHarvestLocations.fulfilled, (state, action: PayloadAction<IHarvestLocation[]>) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchHarvestLocations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearHarvestLocationsError } = harvestLocationsSlice.actions;
export default harvestLocationsSlice.reducer;
