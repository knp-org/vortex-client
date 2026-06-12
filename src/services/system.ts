import { api } from './api';
import type { SystemAction } from '@/types';

export const systemService = {
    async shutdown(): Promise<void> {
        return api.post<void>('/system/shutdown');
    },

    async restart(): Promise<void> {
        return api.post<void>('/system/restart');
    },

    async clearDatabase(): Promise<void> {
        return api.post<void>('/system/clear');
    },

    async execute(action: SystemAction): Promise<void> {
        switch (action) {
            case 'shutdown':
                return this.shutdown();
            case 'restart':
                return this.restart();
            case 'clear':
                return this.clearDatabase();
        }
    },
};

export type { SystemAction };
