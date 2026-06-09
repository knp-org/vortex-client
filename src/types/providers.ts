// Provider Types — matches the backend ProviderManifest / ConfigField / FieldType

export type FieldType = 'text' | 'secret' | 'bool' | 'select' | 'number';

export interface ConfigField {
    key: string;
    label: string;
    field_type: FieldType;
    required: boolean;
    default?: unknown;
    options?: [string, string][]; // [value, label] pairs
}

export interface ProviderManifest {
    id: string;
    name: string;
    description: string;
    media_types: string[];
    config_schema: ConfigField[];
    requires_api_key: boolean;
}

/** GET /api/v1/providers response item */
export interface ProviderInfo extends ProviderManifest {
    enabled: boolean;
    priority: number;
    configured: boolean;
}

/** GET /api/v1/providers/:id/config response */
export interface ProviderConfigResponse {
    provider_id: string;
    enabled: boolean;
    priority: number;
    config: Record<string, unknown>;
}

/** POST /api/v1/providers/:id/test response */
export interface TestResult {
    success: boolean;
    message: string;
}

export interface LibraryProviderResponse {
    library_id: number;
    provider_id: string;
    priority: number;
    enabled: boolean;
}

export interface LibraryProviderInput {
    provider_id: string;
    priority: number;
    enabled: boolean;
}
