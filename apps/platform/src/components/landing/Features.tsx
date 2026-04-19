const features = [
	{
		icon: "📚",
		title: "Structured Learning",
		description: "Learn, test, and track progress in a continuous cycle.",
	},
	{
		icon: "📊",
		title: "Student Progress",
		description: "Report, Dashboard, Quiz",
	},
	{
		icon: "👨‍🏫",
		title: "Qualified Teachers",
		description: "From All over Indonesia",
	},
	{
		icon: "🕌",
		title: "Informative Classes",
		description: "Math, Conversation, English, Arabic.",
	},
];

export function Features() {
	return (
		<section className="py-16 px-6 bg-gray-50 text-center">
			<h2 className="text-3xl font-bold text-green-700 mb-10">
				Why Choose Ihsanify?
			</h2>
			<div className="grid grid-cols-4 gap-6 bg-white rounded-xl p-6 shadow-sm">
				{features.map((f) => (
					<div key={f.title}>
						<span className="text-4xl">{f.icon}</span>
						<h3 className="text-lg font-semibold mt-3">{f.title}</h3>
						<p className="text-sm text-gray-500 mt-2">{f.description}</p>
					</div>
				))}
			</div>
		</section>
	);
}
