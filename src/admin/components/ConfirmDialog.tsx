import { useState, type ReactNode } from 'react';

import { Modal } from '@/admin/components/Modal';
import { Spinner } from '@/admin/components/ui';
import { Button } from '@/components/ui/button';

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  children?: ReactNode;
}) => {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={title}
      description={description}
      className='sm:max-w-md'
      footer={
        <>
          <Button variant='ghost' onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy && <Spinner className='size-4 border-white/40 border-t-white' />}
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
};
