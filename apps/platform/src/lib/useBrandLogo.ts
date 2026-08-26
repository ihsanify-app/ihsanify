import { useEffect, useState } from "react";
import { apiFetch } from "./apiClient";

// The real MIN logo, configured once in Settings → Report and reused
// wherever the app previously used a placeholder leaf emoji.
export function useBrandLogo() {
	const [logoUrl, setLogoUrl] = useState<string | null>(null);

	useEffect(() => {
		apiFetch("/public/branding").then(({ status, body }) => {
			if (status === 200 && body?.data?.logoUrl) {
				setLogoUrl(body.data.logoUrl);
			}
		});
	}, []);

	return logoUrl;
}
