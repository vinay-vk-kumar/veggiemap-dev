import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes (Data stays "fresh")
            gcTime: 1000 * 60 * 60 * 24, // 24 hours (Cache garbage collection)
            refetchOnWindowFocus: false, // Don't refetch just because I clicked alt-tab
        },
    },
});

// Persistence Setup (runs only in browser)
if (typeof window !== 'undefined') {
    const localStoragePersister = createSyncStoragePersister({
        storage: window.localStorage,
    });

    persistQueryClient({
        queryClient,
        persister: localStoragePersister,
        maxAge: 1000 * 60 * 60 * 12, // 12 hours
    });
}
