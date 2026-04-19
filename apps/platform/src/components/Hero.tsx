export function Hero({ schoolName }: { schoolName: string }) {
	return (
		<section className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-6">
			<h1 className="text-sm text-green-700 mb-4">Welcome to {schoolName}</h1>
			<p className="text-sm text-gray-400 mb-6">powered by Ihsanify</p>
			<p className="text-lg text-gray-600 mb-8">
				<button type="button" className="bg-green-600 text-white px-8 py-3">
					Get Started
				</button>
			</p>
		</section>
	);
}
