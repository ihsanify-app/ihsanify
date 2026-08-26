import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";

type PublicStats = {
	teacherCount: number;
	studentCount: number;
	subjectCount: number;
	totalSessionHours: number;
};

export function Stats() {
	const [stats, setStats] = useState<PublicStats | null>(null);

	useEffect(() => {
		apiFetch("/public/stats").then(({ status, body }) => {
			if (status === 200 && body?.data) setStats(body.data);
		});
	}, []);

	const items = [
		{ id: 1, title: "Pengajar", count: stats?.teacherCount ?? 0 },
		{ id: 2, title: "Pembelajar", count: stats?.studentCount ?? 0 },
		{ id: 3, title: "Pelajaran", count: stats?.subjectCount ?? 0 },
		{ id: 4, title: "Jam Pembelajaran", count: stats?.totalSessionHours ?? 0 },
	];

	return (
		<div className="flex justify-center">
			<div className="w-full max-w-4xl px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 bg-green-700 rounded-3xl shadow-lg shadow-green-700/20">
				{items.map((s) => (
					<div key={s.id} className="text-center">
						<h2 className="font-heading text-3xl text-white font-extrabold">
							{s.count}+
						</h2>
						<p className="text-green-100 text-sm mt-1">{s.title}</p>
					</div>
				))}
			</div>
		</div>
	);
}
