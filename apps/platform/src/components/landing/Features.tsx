import { BookOpen, GraduationCap, Sparkles, TrendingUp } from "lucide-react";

const features = [
	{
		icon: BookOpen,
		title: "Structured Learning",
		description: "Learn, test, and track progress in a continuous cycle.",
	},
	{
		icon: TrendingUp,
		title: "Student Progress",
		description: "Report, Dashboard, Quiz",
	},
	{
		icon: GraduationCap,
		title: "Qualified Teachers",
		description: "From All over Indonesia",
	},
	{
		icon: Sparkles,
		title: "Informative Classes",
		description: "Math, Conversation, English, Arabic.",
	},
];

export function Features() {
	return (
		<section className="py-16 px-6 bg-green-50 text-center">
			<h2 className="font-heading text-3xl font-bold text-green-800 mb-10">
				Why Choose Ihsanify?
			</h2>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
				{features.map((f) => (
					<div
						key={f.title}
						className="bg-white rounded-2xl p-6 shadow-sm border border-green-100 hover:shadow-md hover:-translate-y-1 transition-all"
					>
						<div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
							<f.icon className="text-green-700" size={26} />
						</div>
						<h3 className="text-lg font-semibold text-stone-800">{f.title}</h3>
						<p className="text-sm text-stone-500 mt-2">{f.description}</p>
					</div>
				))}
			</div>
		</section>
	);
}
