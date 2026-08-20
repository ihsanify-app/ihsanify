import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { SettingsTabs } from "../../../components/dashboard/SettingsTabs";
import { apiFetch } from "../../../lib/apiClient";

export const Route = createFileRoute("/_app/settings_/invoice")({
	component: RouteComponent,
});

type InvoiceSettings = {
	bankName: string | null;
	bankAccount: string | null;
	receiverName: string | null;
};

function RouteComponent() {
	const [loadState, setLoadState] = useState<
		"loading" | "ready" | "unauthorized"
	>("loading");
	const [settings, setSettings] = useState<InvoiceSettings | null>(null);
	const [errorMessage, setErrorMessage] = useState("");
	const [savedMessage, setSavedMessage] = useState("");

	const load = useCallback(async () => {
		const { status, body } = await apiFetch("/invoice-settings");
		if (status === 401 || status === 403) {
			setLoadState("unauthorized");
			return;
		}
		setSettings(body?.data ?? null);
		setLoadState("ready");
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	function updateField<K extends keyof InvoiceSettings>(
		key: K,
		value: InvoiceSettings[K],
	) {
		setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
		setSavedMessage("");
	}

	async function handleSave() {
		if (!settings) return;
		const { body } = await apiFetch("/invoice-settings", {
			method: "PATCH",
			body: JSON.stringify(settings),
		});
		if (body?.success) {
			setSettings(body.data);
			setSavedMessage("Saved.");
			setErrorMessage("");
		} else {
			setErrorMessage(body?.message ?? "Could not save invoice settings.");
		}
	}

	if (loadState === "unauthorized") {
		return (
			<section className="m-10 text-center text-stone-500">
				<p className="mb-3">
					You need to be logged in as an admin to view this page.
				</p>
				<Link to="/login" className="text-green-700 font-semibold underline">
					Go to login
				</Link>
			</section>
		);
	}

	return (
		<section className="m-10">
			<h1 className="font-heading text-2xl font-bold text-green-800 mb-1">
				Settings
			</h1>
			<SettingsTabs active="invoice" />

			<p className="text-stone-500 text-sm mb-6">
				Bank details shown on every invoice PDF, so students know where to
				transfer payment.
			</p>

			{errorMessage && (
				<p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">
					{errorMessage}
				</p>
			)}

			{loadState === "loading" || !settings ? (
				<p className="text-stone-400">Loading…</p>
			) : (
				<div className="border border-green-100 rounded-2xl bg-white shadow-sm max-w-xl p-6 flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-4">
						<label className="text-xs font-medium text-stone-500">
							Bank Name
							<input
								className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
								placeholder="e.g. BSI"
								value={settings.bankName ?? ""}
								onChange={(e) =>
									updateField("bankName", e.target.value || null)
								}
							/>
						</label>
						<label className="text-xs font-medium text-stone-500">
							Bank Account
							<input
								className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
								placeholder="e.g. 7153566709"
								value={settings.bankAccount ?? ""}
								onChange={(e) =>
									updateField("bankAccount", e.target.value || null)
								}
							/>
						</label>
					</div>

					<label className="text-xs font-medium text-stone-500">
						Receiver Name
						<input
							className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
							placeholder="e.g. Ihsanify Foundation"
							value={settings.receiverName ?? ""}
							onChange={(e) =>
								updateField("receiverName", e.target.value || null)
							}
						/>
					</label>

					<div className="flex items-center gap-3 mt-2">
						<button
							type="button"
							onClick={handleSave}
							className="cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors font-semibold text-sm w-fit"
						>
							Save Changes
						</button>
						{savedMessage && (
							<span className="text-sm text-green-700">{savedMessage}</span>
						)}
					</div>
				</div>
			)}
		</section>
	);
}
