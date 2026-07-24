const teachers = [
	{
		id: 1,
		name: "Ustadzah Siska",
		subjectIds: ["Tahsin", "Tahfizh"],
		icon: "👱🏻‍♀️",
	},
	{ id: 2, name: "Miss Poetry", subjectIds: ["Bahasa Inggris"], icon: "🙋🏻‍♀️" },
	{
		id: 3,
		name: "Mister Mulki",
		subjectIds: ["Bahasa Inggris"],
		icon: "🧔",
	},
	{
		id: 4,
		name: "Ustadzah Lisna",
		subjectIds: ["Tahsin", "Tahfizh"],
		icon: "🙎🏻‍♀️",
	},
];

export function Teachers() {
	return (
		<section className="bg-white py-16 px-6 text-center">
			<h2 className="font-heading text-3xl font-bold text-green-800 mb-10">
				Our Teachers
			</h2>
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
				{teachers.map((t) => (
					<div
						key={t.id}
						className="bg-green-50 rounded-2xl p-6 border border-green-100"
					>
						<div className="mx-auto mb-3 w-20 h-20 rounded-full bg-white flex items-center justify-center text-4xl shadow-sm">
							{t.icon}
						</div>
						<h4 className="text-lg font-semibold text-stone-800">{t.name}</h4>
						<p className="text-sm text-stone-500 mt-1">
							{t.subjectIds.join(", ")}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}
