import { Navigate } from 'react-router-dom';

export function RequireSuperAdmin({ children }) {
  let isSuperAdmin = false;
  try {
    const userData = JSON.parse(localStorage.getItem('userData') || 'null');
    isSuperAdmin = !!userData?.isSuperAdmin;
  } catch {
    isSuperAdmin = false;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}