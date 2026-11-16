import { useState, useEffect, useCallback } from "react";
import { getJobAccountsByUserId, updateJobAccount, createJobAccount, deleteJobAccount } from "../api/account.api";

export function useJobAccount() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null)

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getJobAccountsByUserId();
      setAccounts(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Each of these re-throws on failure so the calling form dialog's own
  // try/catch can show the real error instead of silently closing.
  const createAccount = async (ctx) => {
    const result = await createJobAccount(ctx);
    await fetchAccount();
    return result;
  }

  const updateAccount = async (id, ctx) => {
    const result = await updateJobAccount(id, ctx);
    await fetchAccount();
    return result;
  }

  const deleteAccount = async (id) => {
    const result = await deleteJobAccount(id);
    await fetchAccount();
    return result;
  }

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount])

  return { accounts, loading, error, fetchAccount, createAccount, updateAccount, deleteAccount }
}
