"use client";

import { useState, useCallback } from "react";
import Toast, { ToastType } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";

interface ToastState {
  message: string;
  type: ToastType;
  id: number;
}

interface ConfirmState {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  onConfirm: () => void;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [toastCounter, setToastCounter] = useState(0);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { message, type, id }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      options?: {
        confirmText?: string;
        cancelText?: string;
        confirmButtonClass?: string;
      }
    ) => {
      setConfirmState({
        title,
        message,
        onConfirm,
        ...options,
      });
    },
    []
  );

  const hideConfirm = useCallback(() => {
    setConfirmState(null);
  }, []);

  const ToastContainer = useCallback(
    () => (
      <>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
        {confirmState && (
          <ConfirmModal
            title={confirmState.title}
            message={confirmState.message}
            confirmText={confirmState.confirmText}
            cancelText={confirmState.cancelText}
            confirmButtonClass={confirmState.confirmButtonClass}
            onConfirm={confirmState.onConfirm}
            onCancel={hideConfirm}
          />
        )}
      </>
    ),
    [toasts, confirmState, removeToast, hideConfirm]
  );

  return {
    showToast,
    showConfirm,
    ToastContainer,
  };
}
