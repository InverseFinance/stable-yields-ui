export type TxToastEntry = {
  hash: `0x${string}`;
  description: string;
};

type Listener = () => void;

let toasts: TxToastEntry[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach(l => l());
}

export function addTxToast(hash: `0x${string}`, description: string) {
  if (toasts.some(t => t.hash === hash)) return;
  toasts = [...toasts, { hash, description }];
  emit();
}

export function removeTxToast(hash: `0x${string}`) {
  toasts = toasts.filter(t => t.hash !== hash);
  emit();
}

export function getToasts(): TxToastEntry[] {
  return toasts;
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}
