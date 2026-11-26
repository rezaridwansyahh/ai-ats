import api from './axios';
import { importForm } from './employee-import';

export const previewAttendanceImport  = (file) => api.post('/attendance-import/preview', importForm(file));
export const validateAttendanceImport = (file, mapping, decisions = {}) => api.post('/attendance-import/validate', importForm(file, { mapping, decisions }));
export const commitAttendanceImport   = (file, mapping, decisions = {}) => api.post('/attendance-import/commit', importForm(file, { mapping, decisions }));
export const undoAttendanceImport     = (id) => api.post(`/attendance-import/${id}/undo`);