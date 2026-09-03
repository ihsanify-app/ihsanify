import { getAuthToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function apiFetch(path: string, options: RequestInit = {}) {
	const token = getAuthToken();
	const res = await fetch(`${API_BASE}${path}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options.headers,
		},
	});
	const body = await res.json().catch(() => null);
	return { status: res.status, ok: res.ok, body };
}

export async function downloadFile(path: string, filename: string) {
	const token = getAuthToken();
	const res = await fetch(`${API_BASE}${path}`, {
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	});
	if (!res.ok) {
		const body = await res.json().catch(() => null);
		return { ok: false, message: body?.message ?? "Download failed." };
	}
	const blob = await res.blob();
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
	return { ok: true };
}
