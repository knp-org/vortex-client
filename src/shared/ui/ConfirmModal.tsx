import React from 'react';
import { GlassModal, GlassButton, GlassText } from '@knp-org/liquid-glass-ui';

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

/** A confirm dialog composed from the liquid-glass-ui primitives. */
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
    return (
        <GlassModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            className="max-w-md"
            footer={
                <div className="flex justify-end gap-3">
                    <GlassButton onClick={onClose} disabled={isLoading}>
                        {cancelText}
                    </GlassButton>
                    <GlassButton variant={variant} onClick={onConfirm} disabled={isLoading}>
                        {isLoading ? 'Processing...' : confirmText}
                    </GlassButton>
                </div>
            }
        >
            <GlassText variant="muted">{message}</GlassText>
        </GlassModal>
    );
};
