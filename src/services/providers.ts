import { api } from './api';
import type { ProviderInfo, ProviderConfigResponse, TestResult } from '@/types/providers';

export const providerService = {
    /** List all providers with manifest + current status */
    async list(): Promise<ProviderInfo[]> {
        return api.get<ProviderInfo[]>('/providers');
    },

    /** Get config for a specific provider (secrets are masked) */
    async getConfig(providerId: string): Promise<ProviderConfigResponse> {
        return api.get<ProviderConfigResponse>(`/providers/${providerId}/config`);
    },

    /** Update config for a provider (merge semantics) */
    async updateConfig(providerId: string, config: Record<string, unknown>): Promise<ProviderConfigResponse> {
        return api.put<ProviderConfigResponse, { config: Record<string, unknown> }>(
            `/providers/${providerId}/config`,
            { config }
        );
    },

    /** Enable or disable a provider */
    async toggle(providerId: string, enabled: boolean): Promise<void> {
        return api.post<void, { enabled: boolean }>(`/providers/${providerId}/toggle`, { enabled });
    },

    /** Reorder providers — first in array gets highest priority */
    async reorder(order: string[]): Promise<void> {
        return api.put<void, { order: string[] }>('/providers/order', { order });
    },

    /** Test a provider's connection / API key */
    async test(providerId: string): Promise<TestResult> {
        return api.post<TestResult>(`/providers/${providerId}/test`);
    },
};
