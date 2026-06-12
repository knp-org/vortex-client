import React from 'react';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, description, className = '' }) => {
    return (
        <div className={`flex items-center justify-between ${className}`}>
            {(label || description) && (
                <div className="flex flex-col pr-4">
                    {label && <label className="text-sm font-label text-primary">{label}</label>}
                    {description && <span className="text-xs text-outline-variant font-body">{description}</span>}
                </div>
            )}
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-black shadow-inner"></div>
            </label>
        </div>
    );
};
