import { CheckCircle2, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";

type ToastVariant = "success" | "error";
type ToastItem = { id: number; message: string; variant: ToastVariant };

type ToastContextValue = {
	success: (message: string) => void;
	error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 3500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);

	const show = useCallback((message: string, variant: ToastVariant) => {
		const id = Date.now() + Math.random();
		setToasts((prev) => [...prev, { id, message, variant }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, AUTO_DISMISS_MS);
	}, []);

	const value: ToastContextValue = {
		success: (message) => show(message, "success"),
		error: (message) => show(message, "error"),
	};

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div
				aria-live="polite"
				className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 sm:bottom-6 sm:right-6"
			>
				{toasts.map((t) => (
					<div
						key={t.id}
						className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg animate-fade-slide-up ${
							t.variant === "success" ? "bg-green-600" : "bg-rose-600"
						}`}
					>
						{t.variant === "success" ? (
							<CheckCircle2 size={18} />
						) : (
							<XCircle size={18} />
						)}
						{t.message}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error("useToast must be used within a ToastProvider");
	return ctx;
}
