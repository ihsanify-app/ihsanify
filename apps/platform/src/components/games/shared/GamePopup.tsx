import { X } from "lucide-react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

// Same dialog/backdrop/Escape convention as RegistrationFormModal.tsx and
// the landing page's other modals: role="dialog" + aria-modal, Escape on
// both layers, backdrop click closes, inner click is stopped.
//
// Portaled to document.body rather than rendered in place: the launch
// buttons in Hero.tsx sit inside a `Reveal` wrapper whose entrance
// animation ends on `transform: translateY(0)` (animation-fill-mode:
// both keeps the final keyframe's computed style forever) — and *any*
// non-"none" transform on an ancestor, even a zero one, creates a new
// containing block for `position: fixed` descendants. Without the
// portal, this backdrop's "fixed inset-0" was positioning itself
// relative to that small button column instead of the real viewport.
export function GamePopup({
	title,
	onClose,
	children,
}: {
	title: string;
	onClose: () => void;
	children: ReactNode;
}) {
	return createPortal(
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			onKeyDown={(e) => e.key === "Escape" && onClose()}
			className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4"
			onClick={onClose}
		>
			<div
				role="dialog"
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				// pt-12 (not p-5's plain top padding) reserves room for the
				// close button below, which is `absolute right-4 top-4` with
				// its own h-8 (32px) height — without this, content starting
				// flush at the top-right corner (e.g. a counter row) renders
				// underneath/behind it instead of clearing it.
				className="animate-game-pop relative flex max-h-[90vh] w-full max-w-sm flex-col overflow-y-auto rounded-game-card border-2 border-game-ink bg-game-soft px-5 pb-5 pt-12 shadow-game-lg"
				style={{ fontFamily: "var(--font-game-body)" }}
				onClick={(e) => e.stopPropagation()}
			>
				<button
					type="button"
					onClick={onClose}
					aria-label="Tutup"
					className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-game-ink bg-game-paper text-game-ink shadow-game-sm transition-transform duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
				>
					<X size={16} />
				</button>
				{children}
			</div>
		</div>,
		document.body,
	);
}
