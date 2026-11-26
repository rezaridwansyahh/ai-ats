import api from './axios';

export const importForm = (file, extra = {}) => {
  const form = new FormData();
  form.append('file', file);
  for (const [k, v] of Object.entries(extra)) form.append(k, JSON.stringify(v));
  return form;
};

export const previewEmployeeImport  = (file) => api.post('/employee-import/preview', importForm(file));
export const validateEmployeeImport = (file, mapping, decisions = {}) => api.post('/employee-import/validate', importForm(file, { mapping, decisions }));
export const commitEmployeeImport   = (file, mapping, decisions = {}) => api.post('/employee-import/commit', importForm(file, { mapping, decisions }));