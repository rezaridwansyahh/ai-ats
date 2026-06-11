import apiClient from './axios';

const budgetApi = {
  // Get current month budget status
  getBudget: async () => {
    const response = await apiClient.get('/company-usage/budget');
    return response.data;
  },

  // Update current month budget (admin only)
  updateBudget: async (budget_usd) => {
    const response = await apiClient.put('/company-usage/budget', { budget_usd });
    return response.data;
  },

  // Get usage summary
  getUsageSummary: async (since = null) => {
    const params = since ? { since } : {};
    const response = await apiClient.get('/company-usage/summary', { params });
    return response.data;
  },

  // Get usage list
  getUsageList: async (limit = 100, since = null) => {
    const params = { limit };
    if (since) params.since = since;
    const response = await apiClient.get('/company-usage', { params });
    return response.data;
  }
};

export default budgetApi;
