import { useState } from 'react';
import { updateCompany } from '../api/company.api.js'
import { useCompany } from '../context/CompanyProvider.jsx'

export function useUpdateCompany() {
  const { setCompany } = useCompany();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const save = async (values) => {
    setSaving(true);
    setError(null);

    updateCompany(values)
      .then(setCompany)
      .catch(error)
      .finally(setSaving(false))
  }

  return { save, saving, error }
}