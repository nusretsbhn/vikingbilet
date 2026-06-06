import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>İptal</Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>Sil</Button>
        </>
      }
    >
      <p className="text-secondary">{message}</p>
    </Modal>
  );
}
