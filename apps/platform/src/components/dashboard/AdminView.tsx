import { CheckCircle2, Pencil, Plus, XCircle } from "lucide-react";
import { useState } from "react";
import { mockAttendanceData, mockDataProgress } from "../../lib/mockData";

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
					<div className="flex gap-3">
						<button
							type="button"
							className={
								activeTab === "progress"
									? "bg-green-700 text-white cursor-pointer rounded-xl px-4 py-2 font-medium"
									: "bg-white border border-green-200 text-stone-600 cursor-pointer rounded-xl px-4 py-2 font-medium hover:bg-green-50"
							}
							onClick={() => setActiveTab("progress")}
						>
							Student's Progress
						</button>
						<button
							type="button"
							className={
								activeTab === "attendance"
									? "bg-green-700 text-white cursor-pointer rounded-xl px-4 py-2 font-medium"
									: "bg-white border border-green-200 text-stone-600 cursor-pointer rounded-xl px-4 py-2 font-medium hover:bg-green-50"
							}
							onClick={() => setActiveTab("attendance")}
						>
							Student's Attendance
						</button>
					</div>
					<input
						className="border border-stone-300 rounded-xl px-3 py-2 cursor-pointer text-stone-600"
						type="month"
						value={selectedMonth}
						onChange={(e) => setSelectedMonth(e.target.value)}
					/>
				</div>
				{activeTab === "progress" && (
					<div className="mt-4 border border-green-100 min-h-screen rounded-2xl overflow-hidden bg-white shadow-sm">
						<table className="w-full">
							<thead className="bg-green-700 text-white uppercase text-xs tracking-wide">
								<tr>
									<th className="px-4 py-3 text-left">Student</th>
									<th className="px-4 py-3 text-left">Teacher</th>
									<th className="px-4 py-3 text-left">Assignment</th>
									<th className="px-4 py-3 text-left">Report</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-stone-100">
								{filteredData.map((d) => (
									<tr
										key={`${d.studentId}-${d.groupId}`}
										className="hover:bg-green-50"
									>
										<td className="px-4 py-3">{d.studentName}</td>
										<td className="px-4 py-3">{d.teacherName}</td>
										<td className="px-4 py-3">
											{d.assignment === null ? (
												<div className="flex items-center gap-2">
													<span className="text-stone-400 text-xs italic">
														No Assignment Yet
													</span>
													<button
														type="button"
														className="cursor-pointer hover:bg-green-100 text-green-700 rounded-full p-1"
													>
														<Plus size={20} />
													</button>
												</div>
											) : d.assignment.status === "submitted" ? (
												<div className="flex items-center gap-2">
													<button
														type="button"
														className="cursor-pointer bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full"
													>
														Submitted ({d.assignment.score}/100)
													</button>
													<button
														type="button"
														className="cursor-pointer hover:bg-green-100 text-green-700 rounded-full p-1"
													>
														<Pencil size={18} />
													</button>
												</div>
											) : (
												<div className="flex items-center gap-2">
													<button
														type="button"
														className="cursor-pointer bg-amber-100 text-amber-700 px-3 py-1 text-xs font-semibold rounded-full"
													>
														Created
													</button>
													<button
														type="button"
														className="cursor-pointer hover:bg-green-100 text-green-700 rounded-full p-1"
													>
														<Pencil size={18} />
													</button>
												</div>
											)}
										</td>
										<td className="px-4 py-3">
											{d.report === null ? (
												<div className="flex items-center gap-2">
													<span className="text-stone-400 text-xs italic">
														No Report Yet
													</span>
													<button
														type="button"
														className="cursor-pointer hover:bg-green-100 text-green-700 rounded-full p-1"
													>
														<Plus size={20} />
													</button>
												</div>
											) : d.report.status === "published" ? (
												<div className="flex items-center gap-2">
													<button
														type="button"
														className="cursor-pointer bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full"
													>
														Published
													</button>
													<button
														type="button"
														className="cursor-pointer hover:bg-green-100 text-green-700 rounded-full p-1"
													>
														<Pencil size={18} />
													</button>
												</div>
											) : (
												<div className="flex items-center gap-2">
													<button
														type="button"
														className="cursor-pointer bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full"
													>
														Created
													</button>
													<button
														type="button"
														className="cursor-pointer hover:bg-green-100 text-green-700 rounded-full p-1"
													>
														<Pencil size={18} />
													</button>
												</div>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
				{activeTab === "attendance" && (
					<div className="mt-4 border border-green-100 min-h-screen rounded-2xl p-4 bg-white shadow-sm">
						{mockAttendanceData.map((d) => (
							<div key={d.groupId} className="flex flex-col">
								<h3 className="font-heading text-xl font-bold text-green-800 mt-5 mb-3">
									{d.groupName}
								</h3>
								<table className="w-full mb-10">
									<thead className="bg-green-700 text-white uppercase text-xs tracking-wide">
										<tr>
											<th className="px-4 py-3 text-left">Student</th>
											<th className="px-4 py-3 text-left">Teacher</th>
											{d.sessions.map((s) => (
												<th className="px-4 py-3 text-left" key={s.sessionId}>
													{s.date}
												</th>
											))}
											<th className="px-4 py-3 text-left">Total Attendance</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-stone-100">
										{d.sessions[0].attendance.map((a) => (
											<tr key={a.studentId} className="hover:bg-green-50">
												<td className="px-4 py-3">{a.studentName}</td>
												<td className="px-4 py-3">
													{d.sessions[0].teacherName}
												</td>
												{d.sessions.map((session) => {
													const record = session.attendance.find(
														(att) => att.studentId === a.studentId,
													);
													return (
														<td key={session.sessionId} className="px-4 py-3">
															{record.isPresent ? (
																<CheckCircle2
																	size={18}
																	className="text-green-600"
																/>
															) : (
																<XCircle size={18} className="text-stone-300" />
															)}
														</td>
													);
												})}
												{(() => {
													const totalPresence = d.sessions.filter((session) =>
														session.attendance.find(
															(att) =>
																att.studentId === a.studentId &&
																att.isPresent === true,
														),
													).length;
													return <td className="px-4 py-3">{totalPresence}</td>;
												})()}
											</tr>
										))}
									</tbody>
								</table>
							</div>
						))}
					</div>
				)}
			</div>
		</section>
	);
}
