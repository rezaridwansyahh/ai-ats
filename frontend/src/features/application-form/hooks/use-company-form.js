import { useCallback, useEffect, useState } from "react";
import { getCompanyForm, updateCompanyForm } from "../api/form.api";

export function useCompanyForm() {
	const [data, setData] = useState(null);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState(null);

	useEffect(() => {
		getCompanyForm()
			.then(setData)
			.catch(setError)
			.finally(() => setLoading(false));
	}, []);

	const save = useCallback(async (schema) => {
		setSaving(true);
		setSaveError(null);
		try {
			const updated = await updateCompanyForm(schema);
			setData(updated);
			return updated;
		} catch (err) {
			setSaveError(err);
			throw err;
		} finally {
			setSaving(false);
		}
	}, []);

	return { data, error, loading, saving, saveError, save };
}
