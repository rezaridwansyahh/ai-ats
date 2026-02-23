import Role from '../model/RoleModel.js';
import User from '../model/UserModel.js';
import Permission from '../model/PermissionModel.js';

class RoleController {
	static async getAll(req, res) {
		try {
			const roles = await Role.getAll();

			res.status(200).json({ 
				message: "List all Roles",
				roles 
			});
		} catch (err) {
			res.status(500).json({ message: err.message });
		}
	}

	static async getById(req, res) {
		const { id } = req.params;

		try {
			const role = await Role.getById(id);

			if (!role) {
				return res.status(404).json({ message: 'Role not found' });
			}
			
			res.status(200).json({
				message: "List Role By Id",
				role
			});
		} catch (err) {
			res.status(500).json({ message: err.message });
		}
	}

	static async getByUserId(req, res) {
		const { user_id } = req.params;

		try {
			const user = await User.getById(user_id);

			if(!user) {
				return res.status(404).json({ message: "No User Found" });
			}

			const roles = await Role.getByUserId(user_id);

			res.status(200).json({
				message: "List of Roles this User have",
				user,
				roles
			})
		} catch(err) {
			res.status(500).json({ message: err.message });
		}
	}

	static async getByPermissionId(req, res) {
		const { permission_id } = req.params;

		try {
			const permission = await Permission.getById(permission_id);

			if(!permission) {
				return res.status(404).json({ message: "No Permission found" });
			}

			const roles = await Role.getByPermissionId(permission_id);

			res.status(200).json({
				message: "List of Roles have this permission",
				permission,
				roles
			})
		} catch(err) {
			res.status(500).json({ message: err.message });
		}
	}

	static async create(req, res) {
		const { name, additional } = req.body;
		try {
			if (!name) {
				return res.status(400).json({ message: 'Role name is required' });
			}

			const newRole = await Role.create(name, additional || null);

			res.status(201).json({
				message: "Role created",
				newRole
			});
		} catch (err) {
			res.status(500).json({ message: err.message });
		}
	}

	static async setPermissions(req, res) {
		const { id } = req.params;
		const { permission_ids } = req.body;

		try {
			const role = await Role.getById(id);
			if (!role) return res.status(404).json({ message: 'Role not found' });

			await Role.setRolePermissions(id, Array.isArray(permission_ids) ? permission_ids : []);

			res.status(200).json({ message: 'Role permissions updated' });
		} catch (err) {
			res.status(500).json({ message: err.message });
		}
	}

	static async delete(req, res) {
		const { id } = req.params;
		try {
			const role = await Role.getById(id);

			if (!role) {
				return res.status(404).json({ message: 'Role not found' });
			}

			await Role.delete(id);

			res.status(200).json({ 
				message: 'Role deleted',
				role
			});
		} catch (err) {
			res.status(500).json({ message: err.message })
		}
	}

	static async update(req, res) {
		const { id } = req.params;
		const { name, additional } = req.body;

		const fields = {};

		if (name) fields.name = name;
		if (additional) fields.additional = additional;

		try {
			const role = await Role.getById(id);

			if (!role) {
				return res.status(404).json({ message: 'Role not found' });
			}

			const updatedRole = await Role.update(id, fields);

			res.status(200).json({ 
				message: 'Role updated',
				updatedRole
			});
		} catch(err) {
			res.status(500).json({ message: err.message });
		}
	} 
}

export default RoleController;