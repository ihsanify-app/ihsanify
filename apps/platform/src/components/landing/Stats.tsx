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
		<section className="flex justify-center gap-16">
			<div className="px-5 py-5 grid grid-cols-4 bg-green-700 rounded-4xl">
				{stats.map((s) => (
					<div key={s.id}>
						<h2 className="text-3xl text-white font-bold">
							{s.count}+ {s.title}
						</h2>
					</div>
				))}
			</div>
		</section>
	);
}
