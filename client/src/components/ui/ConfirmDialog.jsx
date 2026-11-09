import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', danger = true }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="p-6">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
          <AlertTriangle className={`w-6 h-6 ${danger ? 'text-red-500' : 'text-yellow-500'}`} />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 text-center mb-2">{title}</h3>
        <p className="text-slate-500 text-sm text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button
            className={`flex-1 btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
