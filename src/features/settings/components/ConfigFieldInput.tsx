import React from 'react';
import type { ConfigField } from '@/types/providers';
import { Select } from '@/shared/ui/Select';
import { Toggle } from '@/shared/ui/Toggle';

interface ConfigFieldInputProps {
    field: ConfigField;
    value: unknown;
    onChange: (key: string, value: unknown) => void;
}

/** Renders the right input control for a provider config field by its type. */
export const ConfigFieldInput: React.FC<ConfigFieldInputProps> = ({ field, value, onChange }) => {
    const baseClass = "w-full bg-surface/50 border border-outline rounded-xl px-4 py-2.5 text-primary placeholder-outline-variant focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors shadow-inner font-body";

    switch (field.field_type) {
        case 'secret':
            return (
                <input
                    type="password"
                    className={baseClass}
                    placeholder={field.label}
                    value={(value as string) || ''}
                    onChange={(e) => onChange(field.key, e.target.value)}
                />
            );
        case 'bool':
            return (
                <Toggle
                    label={value ? 'Enabled' : 'Disabled'}
                    checked={!!value}
                    onChange={(checked) => onChange(field.key, checked)}
                />
            );
        case 'select': {
            const selectOptions = field.options?.map(([val, label]) => ({ id: val, label })) || [];
            return (
                <Select
                    options={selectOptions}
                    value={(value as string) || (field.default as string) || ''}
                    onChange={(val) => onChange(field.key, val)}
                />
            );
        }
        case 'number':
            return (
                <input
                    type="number"
                    className={baseClass}
                    placeholder={field.label}
                    value={(value as number) ?? ''}
                    onChange={(e) => onChange(field.key, e.target.value ? Number(e.target.value) : null)}
                />
            );
        default: // 'text'
            return (
                <input
                    type="text"
                    className={baseClass}
                    placeholder={field.label}
                    value={(value as string) || ''}
                    onChange={(e) => onChange(field.key, e.target.value)}
                />
            );
    }
};
