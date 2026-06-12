import React from 'react';
import { createPortal } from 'react-dom';
import { Card } from './Card';
import { Button } from './Button';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
    variant?: 'danger' | 'primary';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isLoading = false,
    onConfirm,
    onClose,
    variant = 'danger'
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md p-4">
                <Card className="bg-surface/80 border-outline backdrop-blur-surface shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    <h2 className="text-xl font-bold text-primary font-heading mb-2">{title}</h2>
                    <p className="text-outline-variant font-body mb-6">{message}</p>

                    <div className="flex justify-end space-x-3">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            {cancelText}
                        </Button>
                        <Button
                            variant={variant}
                            onClick={onConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing...' : confirmText}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>,
        document.body
    );
};
