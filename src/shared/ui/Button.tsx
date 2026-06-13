import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    icon?: LucideIcon;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    icon: Icon,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-primary hover:bg-gray-200 text-on-primary shadow-[0_0_20px_rgba(255,255,255,0.2)] focus:ring-white/50 font-heading rounded-xl",
        secondary: "bg-surface backdrop-blur-surface hover:bg-white/10 text-primary border border-outline shadow-inner focus:ring-white/20 font-heading rounded-xl",
        danger: "bg-red-500/80 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 focus:ring-red-500 rounded-xl"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {Icon && <Icon size={size === 'sm' ? 16 : 20} className={children ? "mr-2" : ""} />}
            {children}
        </button>
    );
};
