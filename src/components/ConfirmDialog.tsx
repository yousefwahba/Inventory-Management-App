import React from 'react';
import { Dialog, Portal, Button, Paragraph } from 'react-native-paper';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = '#f44336',
  loading = false,
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={loading ? undefined : onCancel}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Paragraph>{message}</Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          <Button 
            onPress={onCancel} 
            mode="outlined"
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button 
            onPress={onConfirm} 
            mode="contained" 
            buttonColor={confirmColor}
            style={{ marginLeft: 8 }}
            loading={loading}
            disabled={loading}
          >
            {confirmText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};