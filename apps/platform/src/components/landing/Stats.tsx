const stats = [
	{
		id: 1,
		title: "Teachers",
		count: 8,
	},
	{
		id: 2,
		title: "Students",
		count: 30,
	},
	{
		id: 3,
		title: "Subjects",
		count: 5,
	},
	{
		id: 4,
		title: "Hours of sessions",
		count: 350,
	},
];

export function Stats() {
	return (
		<section className="flex justify-center px-6 py-16">
			<div className="w-full max-w-4xl px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 bg-green-700 rounded-3xl shadow-lg shadow-green-700/20">
				{stats.map((s) => (
					<div key={s.id} className="text-center">
						<h2 className="font-heading text-3xl text-white font-extrabold">
							{s.count}+
						</h2>
						<p className="text-green-100 text-sm mt-1">{s.title}</p>
					</div>
				))}
			</div>
		</section>
	);
}
