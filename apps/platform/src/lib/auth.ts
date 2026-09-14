type AuthUser = {
	id: string;
	teacherId: string | null;
	studentId: string | null;
	role: "admin" | "teacher" | "student";
	name: string;
};

const STORAGE_KEY = "ihsanify_auth";

// "Remember me" is a choice of *where* the session lives, not a separate
// flag to track — localStorage survives closing the browser, sessionStorage
// doesn't. Reading checks both (whichever the login actually used); writing
// clears the other one so a later login with the opposite choice can't
// leave a stale copy sitting in the unused storage.
export function getStoredAuth(): { user: AuthUser; token: string } | null {
	if (typeof window === "undefined") return null;
	const raw =
		localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export function setStoredAuth(
	user: AuthUser,
	token: string,
	rememberMe: boolean,
) {
	const value = JSON.stringify({ user, token });
	if (rememberMe) {
		localStorage.setItem(STORAGE_KEY, value);
		sessionStorage.removeItem(STORAGE_KEY);
	} else {
		sessionStorage.setItem(STORAGE_KEY, value);
		localStorage.removeItem(STORAGE_KEY);
	}
}

export function clearStoredAuth() {
	localStorage.removeItem(STORAGE_KEY);
	sessionStorage.removeItem(STORAGE_KEY);
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
