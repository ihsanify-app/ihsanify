import { getAuthToken } from "./mockAuth";

const API_BASE = "http://localhost:8000";

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
