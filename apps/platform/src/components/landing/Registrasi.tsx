import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { RegistrasiFormModal } from "./RegistrasiFormModal";
import { Reveal } from "./Reveal";

export function Registrasi() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	return (
		<section
			id="registrasi"
			className="scroll-mt-20 bg-green-700 px-4 py-16 text-center sm:px-6"
		>
			<Reveal>
				<h2 className="font-heading text-3xl font-bold text-white">
					Yuk, Daftar Sekarang!
				</h2>
				<p className="mx-auto mt-2 max-w-md text-green-100">
					Hubungi admin kami melalui WhatsApp untuk konsultasi program dan
					pendaftaran murid baru.
				</p>
				<button
					type="button"
					onClick={() => setIsFormOpen(true)}
					className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-8 py-3.5 text-lg font-semibold text-green-700 shadow-lg transition-transform hover:-translate-y-0.5"
				>
					<MessageCircle size={22} />
					Chat Admin via WhatsApp
				</button>
			</Reveal>
			{isFormOpen && (
				<RegistrasiFormModal onClose={() => setIsFormOpen(false)} />
			)}
		</section>
	);
}
