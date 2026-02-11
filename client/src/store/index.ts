import { configureStore } from '@reduxjs/toolkit';
import {
    productsReducer,
    harvestLocationsReducer,
    customersReducer,
    ordersReducer,
    invoicesReducer
} from './slices';

export const store = configureStore({
    reducer: {
        products: productsReducer,
        harvestLocations: harvestLocationsReducer,
        customers: customersReducer,
        orders: ordersReducer,
        invoices: invoicesReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these paths in the state
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
    devTools: import.meta.env.DEV,
});

// Infer the `RootState` and `AppDispatch` types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
