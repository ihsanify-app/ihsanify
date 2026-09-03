type AuthUser = {
	id: string;
	teacherId: string | null;
	studentId: string | null;
	role: "admin" | "teacher" | "student";
	name: string;
};

const STORAGE_KEY = "ihsanify_auth";

export function getStoredAuth(): { user: AuthUser; token: string } | null {
	if (typeof window === "undefined") return null;
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export function setStoredAuth(user: AuthUser, token: string) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
}

export function clearStoredAuth() {
	localStorage.removeItem(STORAGE_KEY);
}

export function getAuthToken(): string | null {
	return getStoredAuth()?.token ?? null;
}

// Falls back to a hardcoded admin identity when nobody is logged in, so
// role-gated UI (nav items, tabs) keeps working unchanged. Real API calls
// (groups, users) still get gated server-side by the JWT, regardless of
// what this fallback claims.
export const authUser: AuthUser = getStoredAuth()?.user ?? {
	id: "",
	teacherId: null,
	studentId: null,
	role: "admin",
	name: "Ahmad",
};
