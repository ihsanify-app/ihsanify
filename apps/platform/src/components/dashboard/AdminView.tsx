import { useState } from "react";

const mockDataProgress = [
	{
		studentId: "1",
		studentName: "Maryam",
		groupId: "tahsin-01",
		groupName: "Tahsin Dasar",
		teacherId: "t-01",
		teacherName: "Ustadzah Lisna",
		month: 5,
		year: 2026,
		assignment: { title: "Quiz Tahsin - April", score: 85, submitted: true },
		report: { published: true },
	},
	{
		studentId: "1",
		studentName: "Maryam",
		groupId: "tahfizh-01",
		groupName: "Tahfizh Dasar",
		teacherId: "t-02",
		teacherName: "Ustadzah Siska",
		month: 5,
		year: 2026,
		assignment: { title: "Quiz Tahfizh - April", score: 90, submitted: true },
		report: { published: true },
	},
	{
		studentId: "2",
		studentName: "Ibrahim",
		groupId: "inggris-01",
		groupName: "Bahasa Inggris Dasar",
		teacherId: "t-04",
		teacherName: "Mr. Mulki",
		month: 5,
		year: 2026,
		assignment: {
			title: "Quiz Bahasa Inggris - April",
			score: 70,
			submitted: true,
		},
		report: { published: true },
	},
	{
		studentId: "3",
		studentName: "Ahmad",
		groupId: "arab-01",
		groupName: "Bahasa Arab Dasar",
		teacherId: "t-03",
		teacherName: "Ustadzah Afifah",
		month: 5,
		year: 2026,
		assignment: {
			title: "Quiz Bahasa Arab - April",
			score: 85,
			submitted: false,
		},
		report: { published: false },
	},
];

const _mockGroupTahsin1 = {
	groupId: "TH01",
	groupName: "Tahsin Dasar 01",
	month: 5,
	year: 2026,
	sessions: [
		{
			sessionId: 1,
			date: "2026-05-05",
			attendance: [
				{ studentId: 1, studentName: "Maryam", isPresent: true },
				{ studentId: 2, studentName: "Ibrahim", isPresent: true },
			],
		},
		{
			sessionId: 2,
			date: "2026-05-12",
			attendance: [
				{ studentId: 1, studentName: "Maryam", isPresent: true },
				{ studentId: 2, studentName: "Ibrahim", isPresent: true },
			],
		},
		{
			sessionId: 2,
			date: "2026-05-19",
			attendance: [
				{ studentId: 1, studentName: "Maryam", isPresent: true },
				{ studentId: 2, studentName: "Ibrahim", isPresent: true },
			],
		},
		{
			sessionId: 2,
			date: "2026-05-26",
			attendance: [
				{ studentId: 1, studentName: "Maryam", isPresent: true },
				{ studentId: 2, studentName: "Ibrahim", isPresent: false },
			],
		},
	],
};

const _mockGroupEnglish1 = {
	groupId: 2,
	groupName: "Bahasa Inggris 01",
	month: 5,
	year: 2026,
	sessions: [
		{
			sessionId: 1,
			date: "2026-05-08",
			attendance: [{ studentId: 3, studentName: "Ahmad", isPresent: true }],
		},
		{
			sessionId: 2,
			date: "2026-05-15",
			attendance: [{ studentId: 3, studentName: "Ahmad", isPresent: true }],
		},
		{
			sessionId: 3,
			date: "2026-05-22",
			attendance: [{ studentId: 3, studentName: "Ahmad", isPresent: true }],
		},
		{
			sessionId: 4,
			date: "2026-05-29",
			attendance: [{ studentId: 3, studentName: "Ahmad", isPresent: true }],
		},
	],
};

export function AdminView() {
	const [activeTab, setActiveTab] = useState<"progress" | "attendance">(
		"progress",
	);
	const now = new Date();
	const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
	const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
	const [year, month] = selectedMonth.split("-").map(Number);
	const filteredData = mockDataProgress.filter(
		(d) => d.month === month && d.year === year,
	);
	return (
		<section className="m-10">
			<div>
				<div className="flex justify-between">
					<div className="flex gap-5">
						<button
							type="button"
							className={
								activeTab === "progress"
									? "bg-green-800 text-white cursor-pointer rounded-lg p-2"
									: "bg-white border border-green-800 cursor-pointer rounded-lg p-2"
							}
							onClick={() => setActiveTab("progress")}
						>
							Student's Progress
						</button>
						<button
							type="button"
							className={
								activeTab === "attendance"
									? "bg-green-800 text-white cursor-pointer rounded-lg p-2"
									: "bg-white border border-green-800 cursor-pointer rounded-lg p-2"
							}
							onClick={() => setActiveTab("attendance")}
						>
							Student's Attendance
						</button>
					</div>
					<input
						className="border border-green-800 rounded-lg px-3 py-2 cursor-pointer"
						type="month"
						value={selectedMonth}
						onChange={(e) => setSelectedMonth(e.target.value)}
					/>
				</div>
				{activeTab === "progress" && (
					<div className="mt-3 border border-green-800 min-h-screen rounded-lg p-2">
						<table className="w-full">
							<thead className="bg-green-800 text-white uppercase">
								<tr>
									<th className="px-4 py-3 text-left">Student</th>
									<th className="px-4 py-3 text-left">Teacher</th>
									<th className="px-4 py-3 text-left">Assignment</th>
									<th className="px-4 py-3 text-left">Report</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-300">
								{filteredData.map((d) => (
									<tr
										key={`${d.studentId}-${d.groupId}`}
										className="hover:bg-green-100"
									>
										<td className="px-4 py-3">{d.studentName}</td>
										<td className="px-4 py-3">{d.teacherName}</td>
										<td className="px-4 py-3">
											{d.assignment.submitted === true ? (
												<span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full ">
													Submitted ({d.assignment.score}/100)
												</span>
											) : (
												<span className="bg-red-100 text-red-700 px-3 py-1 text-xs rounded-full">
													Not Submitted
												</span>
											)}
										</td>
										<td className="px-4 py-3">
											{d.report.published === true ? (
												<span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
													Published
												</span>
											) : (
												<span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full">
													Unpublished
												</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
				{activeTab === "attendance" && (
					<div className="mt-3 border border-green-800 min-h-screen rounded-lg p-2">
						Attendance Content
					</div>
				)}
			</div>
		</section>
	);
}
