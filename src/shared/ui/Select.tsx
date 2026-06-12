import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
    id: string;
    label: string;
    icon?: React.ElementType;
}

interface SelectProps {
    label?: string;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    className?: string;
}

export const Select: React.FC<SelectProps> = ({
    label,
    value,
    options,
    onChange,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.id === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (optionId: string) => {
        onChange(optionId);
        setIsOpen(false);
    };

    return (
        <div className={`relative flex flex-col space-y-1 ${className}`} ref={containerRef}>
            {label && (
                <label className="text-sm font-label font-medium text-outline-variant ml-1">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2 bg-surface/50 border border-outline rounded-xl text-primary flex items-center justify-between transition-all hover:bg-surface/80 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner font-body"
            >
                <div className="flex items-center space-x-2 min-w-0">
                    {selectedOption?.icon && <selectedOption.icon size={18} className="text-primary shrink-0" />}
                    <span className="truncate">{selectedOption?.label || value}</span>
                </div>
                <ChevronDown size={16} className={`text-outline-variant shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 p-1 bg-black/90 border border-outline rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.05)] z-50 animate-fade-in max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-surface">
                    {options.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSelect(option.id)}
                            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors font-body ${value === option.id
                                    ? 'bg-primary/20 text-primary'
                                    : 'text-outline-variant hover:bg-white/5 hover:text-primary'
                                }`}
                        >
                            {option.icon && <option.icon size={16} className={value === option.id ? 'text-primary shrink-0' : 'text-outline-variant shrink-0'} />}
                            <span className="truncate">{option.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
