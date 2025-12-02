const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { verifyToken, isSupervisor } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

router.post('/', isSupervisor, employeeController.createEmployee);
router.get('/', employeeController.getEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', isSupervisor, employeeController.deleteEmployee);
router.put('/:id/competence', employeeController.toggleCompetence);

module.exports = router;
