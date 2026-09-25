import Role from '../../modules/role/role.model.js';

export async function attachRoleFlags(req, res, next) {
  try {
    const roles = await Role.getByUserId(req.user.id);
    req.user.isSuperAdmin = roles.some(r => r.is_system === true);
    next();
  } catch (err) {
    res.status(500).json({ message: 'Failed to resolve user roles' });
  }
}

export function requireSuperAdmin(req, res, next) {
  if (!req.user?.isSuperAdmin) {
    return res.status(403).json({ message: 'Super Admin access required' });
  }
  next();
}

export default attachRoleFlags;