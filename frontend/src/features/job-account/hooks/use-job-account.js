import { useState, useEffect } from "react";
import { getJobAccountsByUserId, updateJobAccount, createJobAccount, deleteJobAccount } from "../api/job-account.api";

export function useJobAccount() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null)

  const fetchAccount = async () => {
    setLoading(true);
    setError(null);

    getJobAccountsByUserId()
      .then(setAccounts)
      .catch(setError)
      .finally(() => setLoading(false));
  };

  const createAccount = async (ctx) => {
    setLoading(true);
    setError(null);

    createJobAccount(ctx)
      .catch(setError)
      .finally(() => setLoading(false))
  }

  const updateAccount = async (ctx) => {

  }

  const deleteAccount = async (ctx) => {

  }

  useEffect(() => {
    fetchAccount();
  }, [])

  return { accounts, loading, error, fetchAccount, createAccount, updateAccount, deleteAccount }
}