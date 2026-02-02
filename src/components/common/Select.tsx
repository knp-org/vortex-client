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
                <label className="text-sm font-medium text-gray-300 ml-1">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2 bg-black/20 focus:bg-black/30 border border-white/10 rounded-xl text-white flex items-center justify-between transition-all hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
                <div className="flex items-center space-x-2">
                    {selectedOption?.icon && <selectedOption.icon size={18} className="text-cyan-400" />}
                    <span>{selectedOption?.label || value}</span>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 p-1 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-50 animate-fade-in max-h-60 overflow-y-auto">
                    {options.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSelect(option.id)}
                            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${value === option.id
                                    ? 'bg-cyan-500/20 text-cyan-50'
                                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            {option.icon && <option.icon size={16} className={value === option.id ? 'text-cyan-400' : 'text-gray-500'} />}
                            <span>{option.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
