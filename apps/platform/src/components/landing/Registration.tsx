import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { RegistrationFormModal } from "./RegistrationFormModal";
import { Reveal } from "./Reveal";

export function Registration() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	return (
		<section
			id="registration"
			className="scroll-mt-20 bg-white px-4 py-16 sm:px-6"
		>
			<Reveal className="mx-auto max-w-4xl">
				<div className="relative overflow-hidden rounded-[36px] bg-forest px-6 py-12 text-center shadow-lg sm:px-16 sm:py-20">
					<div className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
					<div className="relative">
						<h2 className="font-heading text-3xl font-bold text-white">
							Yuk, Daftar Sekarang!
						</h2>
						<p className="mx-auto mt-2 max-w-md text-base text-green-100">
							Hubungi admin kami melalui WhatsApp untuk konsultasi program dan
							pendaftaran murid baru.
						</p>
						<button
							type="button"
							onClick={() => setIsFormOpen(true)}
							className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-8 py-3.5 text-lg font-semibold text-emerald shadow-lg transition-transform hover:-translate-y-0.5"
						>
							<MessageCircle size={22} />
							Chat Admin via WhatsApp
						</button>
					</div>
				</div>
			</Reveal>
			{isFormOpen && (
				<RegistrationFormModal onClose={() => setIsFormOpen(false)} />
			)}
		</section>
	);
}
