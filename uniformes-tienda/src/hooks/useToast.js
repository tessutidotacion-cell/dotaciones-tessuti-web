import { useCallback, useState } from "react";

export function useToast() {
  const [toastState, setToastState] = useState(null);

  const toast = useCallback((msg, type = "default") => {
    setToastState({ msg, type, key: Date.now() });
  }, []);

  const clearToast = useCallback(() => setToastState(null), []);

  return { toastState, toast, clearToast };
}