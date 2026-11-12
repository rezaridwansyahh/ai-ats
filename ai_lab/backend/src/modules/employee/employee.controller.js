import employeeService from './employee.service.js';

class EmployeeController {
  async getAll(req, res) {
    try {
      const employees = await employeeService.getAll();
      res.status(200).json({ message: 'List all Employees', employees });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const employee = await employeeService.getById(req.params.id);
      res.status(200).json({ message: 'Employee details', employee });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const employee = await employeeService.create(req.body);
      res.status(201).json({ message: 'Employee created successfully', employee });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const employee = await employeeService.update(req.params.id, req.body);
      res.status(200).json({ message: 'Employee updated successfully', employee });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const employee = await employeeService.delete(req.params.id);
      res.status(200).json({ message: 'Employee deleted successfully', employee });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new EmployeeController();