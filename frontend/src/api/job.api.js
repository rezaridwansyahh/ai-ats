import api from './axios';

export const getJobs = () => api.get('/job');
export const getJobById = (id) => api.get(`/job/${id}`);
export const getJobsByStatus = (status) => api.get(`/job/status?status=${status}`);
export const getJobWithCandidates = (id) => api.get(`/job/${id}/candidates`);
export const createJob = (data) => api.post('/job', data);
export const updateJob = (id, data) => api.put(`/job/${id}`, data);
export const updateJobStatus = (id, status) => api.put(`/job/${id}/status`, { status });
export const deleteJob = (id) => api.delete(`/job/${id}`);

export const generateJobAI = async (id, file) => {
  const formData = new FormData();
  formData.append('id', JSON.stringify(id));
  if (file) formData.append('file', file);

  const token = localStorage.getItem('token');
  const res = await fetch('/portal/api/job/generate', {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if(!res.ok) {
    const error = await res.json();
    throw error;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return fullText;
        try { fullText += JSON.parse(data).text; } catch { /* skip malformed */ }
      }
    }
  }

  return fullText;
};
