import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch, downloadFile } from "../../../lib/apiClient";

export const Route = createFileRoute("/_app/payroll_/$payslipId")({
	component: RouteComponent,
});

const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

function formatIDR(n: number) {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(n);
}

type PayslipLine = {
	groupId: string;
	groupName: string;
	studentId: string;
	studentName: string;
	sessionsAttended: number;
	sessionsTotal: number;
	price: number;
	groupType: string;
	teacherRate: number;
};

type PayslipDetail = {
	payslipId: string;
	teacherId: string;
	teacherName: string;
	month: number;
	year: number;
	lines: PayslipLine[];
};

function RouteComponent() {
	const { payslipId } = useParams({ from: "/_app/payroll_/$payslipId" });
	const [loadState, setLoadState] = useState<"loading" | "ready" | "denied">(
		"loading",
	);
	const [payslip, setPayslip] = useState<PayslipDetail | null>(null);
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		apiFetch(`/payroll/payslips/${payslipId}`).then(({ status, body }) => {
			if (status === 401 || status === 403 || status === 404) {
				setLoadState("denied");
				setErrorMessage(body?.message ?? "Unable to load this payslip.");
				return;
			}
			setPayslip(body?.data ?? null);
			setLoadState("ready");
		});
	}, [payslipId]);

	if (loadState === "denied") {
		return (
			<section className="max-sm:p-3 sm:p-6 text-center text-stone-500">
				<p className="mb-3">{errorMessage}</p>
				<Link to="/payroll" className="text-green-700 font-semibold underline">
					Back to Payroll
				</Link>
			</section>
		);
	}

	if (loadState === "loading" || !payslip) {
		return (
			<section className="max-sm:p-3 sm:p-6">
				<p className="text-stone-400">Loading…</p>
			</section>
		);
	}

	const totalProfit = payslip.lines.reduce((sum, l) => sum + l.price, 0);
	const totalCost = payslip.lines.reduce((sum, l) => sum + l.teacherRate, 0);

	async function handleDownload() {
		if (!payslip) return;
		const result = await downloadFile(
			`/payroll/payslips/${payslip.payslipId}/pdf`,
			`payslip-${payslip.year}-${String(payslip.month).padStart(2, "0")}-${payslip.teacherName}.pdf`,
		);
		if (!result.ok) {
			setErrorMessage(result.message ?? "Could not download payslip PDF.");
		}
	}

	return (
		<section className="max-sm:p-3 sm:p-6">
			<div className="flex items-center justify-between mb-4">
				<Link
					to="/payroll"
					className="inline-flex items-center gap-2 text-stone-500 hover:text-green-700"
				>
					<ArrowLeft size={16} />
					Back to Payroll
				</Link>
				<button
					type="button"
					onClick={handleDownload}
					className="flex font-semibold items-center gap-2 cursor-pointer text-white bg-green-600 hover:bg-green-700 transition-colors rounded-xl px-4 py-2"
				>
					<Download size={16} />
					Download PDF
				</button>
			</div>

			{errorMessage && (
				<p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">
					{errorMessage}
				</p>
			)}

			<h1 className="font-heading text-2xl font-bold text-green-800 mb-1">
				{payslip.teacherName}
			</h1>
			<p className="text-stone-500 mb-4">
				{MONTHS[payslip.month - 1]} {payslip.year}
			</p>

			<div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
				<div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
					<p className="text-xs uppercase tracking-wide text-stone-500">
						Total Profit
					</p>
					<p className="mt-1 font-heading text-xl font-bold text-green-800">
						{formatIDR(totalProfit)}
					</p>
				</div>
				<div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
					<p className="text-xs uppercase tracking-wide text-stone-500">
						Total Cost
					</p>
					<p className="mt-1 font-heading text-xl font-bold text-stone-800">
						{formatIDR(totalCost)}
					</p>
				</div>
			</div>

			<div className="overflow-x-auto">
				<div className="border border-green-100 rounded-2xl overflow-hidden bg-white shadow-sm">
					<table className="w-full">
						<thead className="bg-green-700 text-white uppercase text-xs tracking-wide">
							<tr>
								<th className="px-4 py-3 text-left">Group</th>
								<th className="px-4 py-3 text-left">Student</th>
								<th className="px-4 py-3 text-left">Sessions</th>
								<th className="px-4 py-3 text-left">Price</th>
								<th className="px-4 py-3 text-left">Type</th>
								<th className="px-4 py-3 text-left">Rate</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-stone-100">
							{payslip.lines.map((line) => (
								<tr
									key={`${line.groupId}-${line.studentId}`}
									className="hover:bg-green-50"
								>
									<td className="px-4 py-3">{line.groupName}</td>
									<td className="px-4 py-3">{line.studentName}</td>
									<td className="px-4 py-3">
										{line.sessionsAttended}/{line.sessionsTotal}
									</td>
									<td className="px-4 py-3">{formatIDR(line.price)}</td>
									<td className="px-4 py-3 capitalize">
										{line.groupType.replace("_", "-")}
									</td>
									<td className="px-4 py-3">{formatIDR(line.teacherRate)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	);
}
