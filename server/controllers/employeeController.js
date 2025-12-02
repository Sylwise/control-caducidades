const Employee = require('../models/Employee');

exports.createEmployee = async (req, res) => {
  try {
    const { nombre, fechaEntrada } = req.body;
    
    // Asignar el restaurante del usuario que crea la ficha
    const employee = new Employee({
      nombre,
      fechaEntrada,
      restaurante: req.user.restaurante
    });

    await employee.save();

    const io = req.app.get('io');
    io.to(req.user.restaurante).emit('employeesUpdate', {
      type: 'create',
      action: 'create_employee',
      employeeId: employee._id
    });

    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear empleado', error: error.message });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    // Si se pasa restaurantId (admin), usarlo. Si no, usar el del usuario (si no es admin, esto es obligatorio en el front o aquí)
    // Para mantener consistencia con la seguridad, deberíamos forzar el restaurante del usuario si no es admin.
    // Pero por ahora, mantengamos la lógica simple: filtrar por el restaurante del usuario si no se especifica otro (o forzarlo).
    
    let query = {};
    if (req.user.role !== 'admin') {
        query.restaurante = req.user.restaurante;
    } else if (restaurantId) {
        query.restaurante = restaurantId;
    }
    
    const employees = await Employee.find(query)
      .sort({ nombre: 1 });
      
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener empleados', error: error.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
      // .populate('competencias.$*.certifiedBy', 'name'); // Populate is tricky with Mixed, skipping for now to avoid errors
      
    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener empleado', error: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { nombre, fechaEntrada } = req.body;
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { nombre, fechaEntrada },
      { new: true }
    );
    
    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    const io = req.app.get('io');
    io.to(req.user.restaurante).emit('employeesUpdate', {
      type: 'update',
      action: 'update_employee',
      employeeId: employee._id
    });

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar empleado', error: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    const io = req.app.get('io');
    io.to(req.user.restaurante).emit('employeesUpdate', {
      type: 'delete',
      action: 'delete_employee',
      employeeId: req.params.id
    });

    res.json({ message: 'Empleado eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar empleado', error: error.message });
  }
};

exports.toggleCompetence = async (req, res) => {
  try {
    const { areaId, taskId, completed } = req.body;
    const employeeId = req.params.id;
    const userId = req.user.id;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    let currentCompetencies = employee.competencias || {};
    
    if (!currentCompetencies[areaId]) {
      currentCompetencies[areaId] = {};
    }

    if (completed) {
      currentCompetencies[areaId][taskId] = {
        completed: true,
        certifiedBy: req.user.username,
        date: new Date()
      };
    } else {
      if (currentCompetencies[areaId] && currentCompetencies[areaId][taskId]) {
         delete currentCompetencies[areaId][taskId];
         if (Object.keys(currentCompetencies[areaId]).length === 0) {
           delete currentCompetencies[areaId];
         }
      }
    }

    employee.markModified('competencias');
    await employee.save();

    const io = req.app.get('io');
    io.to(req.user.restaurante).emit('employeesUpdate', {
      type: 'update',
      action: 'competence_change',
      employeeId: employee._id
    });

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar competencia', error: error.message });
  }
};
