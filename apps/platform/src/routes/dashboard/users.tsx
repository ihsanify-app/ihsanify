import { createFileRoute } from "@tanstack/react-router";
import {
	Ban,
	CheckCircle,
	Pencil,
	User,
	UserCheck,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { mockUsers } from "../../lib/mockData";

export const Route = createFileRoute("/dashboard/users")({
	component: RouteComponent,
});

function RouteComponent() {
	const [users, setUsers] = useState(mockUsers);

	return (
		<section className="m-10">
			<div>
				{/* <div className="flex justify-between">
					<input
						className="border border-green-800 rounded-lg px-3 py-2 cursor-pointer"
						type="month"
						value={selectedMonth}
						onChange={(e) => setSelectedMonth(e.target.value)}
					/>
				</div> */}
				<div className="mt-3 border border-green-800 min-h-screen rounded-lg p-2">
					<table className="w-full">
						<thead className="bg-green-800 text-white uppercase">
							<tr>
								<th className="px-4 py-3 text-left">User ID</th>
								<th className="px-4 py-3 text-left">Name</th>
								<th className="px-4 py-3 text-left">Role</th>
								<th className="px-4 py-3 text-left">Teacher ID</th>
								<th className="px-4 py-3 text-left">Student ID</th>
								<th className="px-4 py-3 text-left">Subject</th>
								<th className="px-4 py-3 text-left">Active</th>
								<th className="px-4 py-3 text-left">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-300">
							{users.map((u) => (
								<tr
									key={u.userId}
									className={u.isActive ? "hover:bg-green-100" : "bg-red-100"}
								>
									<td className="px-4 py-3">{u.userId}</td>
									<td className="px-4 py-3">{u.name}</td>
									<td className="px-4 py-3">{u.role}</td>
									<td className="px-4 py-3">
										{u.teacherId ? (
											<div className="flex flex-row gap-3">
												<User size={16} className="text-blue-600" />
												<span>{u.teacherId}</span>
											</div>
										) : (
											<div className="flex flex-row gap-3">
												<span>-</span>
											</div>
										)}
									</td>
									<td className="px-4 py-3">
										{u.studentId ? (
											<div className="flex flex-row gap-3">
												<UserCheck size={16} className="text-green-600" />
												<span>{u.studentId}</span>
											</div>
										) : (
											<div className="flex flex-row gap-3">
												<span>-</span>
											</div>
										)}
									</td>
									<td className="px-4 py-3">
										<div className="grid grid-rows gap-1">
											{u.subjectIds
												? u.subjectIds.map((s) => (
														<div
															key={s.subjectId}
															className={
																s.subjectName === "Calistung"
																	? "bg-purple-800 text-white w-fit p-1 rounded-md"
																	: s.subjectName === "Tahsin"
																		? "bg-blue-800 text-white rounded-md w-fit p-1"
																		: s.subjectName === "Tahfizh"
																			? "bg-green-800 text-white w-fit p-1 rounded-md"
																			: s.subjectName === "Bahasa Arab"
																				? "bg-red-800 text-white w-fit p-1 rounded-md"
																				: s.subjectName === "Bahasa Inggris"
																					? "bg-yellow-600 text-white w-fit p-1 rounded-md"
																					: "bg-gray-400 text-white w-fit p-1 rounded-md"
															}
														>
															{s.subjectName}
														</div>
													))
												: "-"}
										</div>
									</td>
									<td className="px-4 py-3 flex flex-row items-center gap-2">
										{u.isActive ? (
											<CheckCircle size={16} className="text-green-600" />
										) : (
											<XCircle size={16} className="text-red-600" />
										)}
										<button
											type="button"
											className={`cursor-pointer rounded-lg border-gray-400 shadow-2xl p-1 hover:text-white ${u.isActive ? "hover:bg-green-800" : "hover:bg-red-800"}`}
											onClick={() =>
												setUsers((prev) =>
													prev.map((user) =>
														user.userId === u.userId
															? { ...user, isActive: !u.isActive }
															: user,
													),
												)
											}
										>
											{u.isActive ? (
												<span>Deactivate</span>
											) : (
												<span>Activate</span>
											)}
										</button>
									</td>
									<td className="px-4 py-3">
										<div className="flex flex-row gap-3">
											<Pencil
												size={16}
												className="text-green-600 hover:cursor-pointer"
											/>
											<span>Edit</span>
										</div>
										<div className="flex flex-row gap-3">
											<Ban
												size={16}
												className="text-red-600 hover:cursor-pointer"
											/>
											<span>Delete</span>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	);
}
