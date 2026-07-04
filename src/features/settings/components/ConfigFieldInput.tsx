import React from 'react';
import { GlassInput, GlassSelect, GlassToggle } from '@knp-org/liquid-glass-ui';
import type { ConfigField } from '@/types/providers';

interface ConfigFieldInputProps {
    field: ConfigField;
    value: unknown;
    onChange: (key: string, value: unknown) => void;
}

/** Renders the right input control for a provider config field by its type. */
export const ConfigFieldInput: React.FC<ConfigFieldInputProps> = ({ field, value, onChange }) => {
    switch (field.field_type) {
        case 'secret':
            return (
                <GlassInput
                    type="password"
                    placeholder={field.label}
                    value={(value as string) || ''}
                    onChange={(e) => onChange(field.key, e.target.value)}
                />
            );
        case 'bool':
            return (
                <GlassToggle
                    label={value ? 'Enabled' : 'Disabled'}
                    checked={!!value}
                    onChange={(e) => onChange(field.key, e.target.checked)}
                />
            );
        case 'select': {
            const options = field.options?.map(([val, label]) => ({ value: val, label })) || [];
            return (
                <GlassSelect
                    options={options}
                    value={(value as string) || (field.default as string) || ''}
                    onChange={(val) => onChange(field.key, val)}
                />
            );
        }
        case 'number':
            return (
                <GlassInput
                    type="number"
                    placeholder={field.label}
                    value={(value as number) ?? ''}
                    onChange={(e) => onChange(field.key, e.target.value ? Number(e.target.value) : null)}
                />
            );
        default: // 'text'
            return (
                <GlassInput
                    type="text"
                    placeholder={field.label}
                    value={(value as string) || ''}
                    onChange={(e) => onChange(field.key, e.target.value)}
                />
            );
    }
};
