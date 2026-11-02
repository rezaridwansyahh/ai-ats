import { useEffect, useState } from "react";
import { getCompanyForm } from "../api/form.api";

export function useCompanyForm() {
	const [data, setData] = useState(null);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getCompanyForm()
			.then(setData)
			.catch(setError)
			.finally(() => setLoading(false));
	}, []);

	return { data, error, loading }
}