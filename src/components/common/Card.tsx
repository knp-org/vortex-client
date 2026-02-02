import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    hoverable = false
}) => {
    return (
        <div className={`glass-panel p-6 ${hoverable ? 'hover:bg-white/5 transition-colors cursor-pointer' : ''} ${className}`}>
            {children}
        </div>
    );
};
