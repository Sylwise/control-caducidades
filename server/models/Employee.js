const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  fechaEntrada: {
    type: Date,
    required: true
  },
  restaurante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  // Structure: { [areaId]: { [taskId]: { completed: Boolean, certifiedBy: UserId, date: Date } } }
  competencias: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Employee', employeeSchema);
