import roleService from './role.service.js';

class RoleController {
	async getAll(req, res) {
		try {
			const roles = await roleService.getAll();
			res.status(200).json({ message: "List all Roles", roles });
		} catch (err) {
			res.status(err.status || 500).json({ message: err.message });
		}
	}

	async getById(req, res) {
		try {
			const role = await roleService.getById(req.params.id);
			res.status(200).json({ message: "List Role By Id", role });
		} catch (err) {
			res.status(err.status || 500).json({ message: err.message });
		}
	}

	async getByUserId(req, res) {
		try {
			const { user, roles } = await roleService.getByUserId(req.params.user_id);
			res.status(200).json({ message: "List of Roles this User have", user, roles });
		} catch (err) {
			res.status(err.status || 500).json({ message: err.message });
		}
	}

	async getByPermissionId(req, res) {
		try {
			const { roles } = await roleService.getByPermissionId(req.params.permission_id);
			res.status(200).json({ message: "List of Roles have this permission", roles });
		} catch (err) {
			res.status(err.status || 500).json({ message: err.message });
		}
	}

	async create(req, res) {
		try {
			const { name, additional } = req.body;
			const newRole = await roleService.create(name, additional);
			res.status(201).json({ message: "Role created", newRole });
		} catch (err) {
			res.status(err.status || 500).json({ message: err.message });
		}
	}

	async setPermissions(req, res) {
		try {
			await roleService.setPermissions(req.params.id, req.body.permission_ids);
			res.status(200).json({ message: 'Role permissions updated' });
		} catch (err) {
			res.status(err.status || 500).json({ message: err.message });
		}
	}

	async update(req, res) {
		try {
			const { name, additional } = req.body;
			const fields = {};
			if (name) fields.name = name;
			if (additional) fields.additional = additional;

			const updatedRole = await roleService.update(req.params.id, fields);
			res.status(200).json({ message: 'Role updated', updatedRole });
		} catch (err) {
			res.status(err.status || 500).json({ message: err.message });
		}
	}

	async delete(req, res) {
		try {
			const role = await roleService.delete(req.params.id);
			res.status(200).json({ message: 'Role deleted', role });
		} catch (err) {
			res.status(err.status || 500).json({ message: err.message });
		}
	}
}

export default new RoleController();
