import competenciesData from '../config/competencies.json';

// Grouping definitions based on requirements
const AREA_GROUPS = {
  COCINA: ['batch_cooker', 'patatas', 'ensamblar', 'iniciar', 'condimentar', 'general_cocina'],
  FRENTE: ['salon', 'bebidas_postres', 'mcauto', 'expeditar', 'general_frente'],
  APERTURA: ['apertura'],
  CIERRE: ['cierre']
};

/**
 * Calculates the progress percentage for each macro-area for a given employee.
 * @param {Object} employee - The employee object containing competencies.
 * @returns {Object} - An object with keys for each macro-area and their progress % (0-100).
 */
export const calculateEmployeeProgress = (employee) => {
  const result = {
    COCINA: 0,
    FRENTE: 0,
    APERTURA: 0,
    CIERRE: 0
  };

  if (!employee || !employee.competencias) {
    return result;
  }

  // Iterate over each macro-area group
  Object.entries(AREA_GROUPS).forEach(([groupName, areaIds]) => {
    let totalTasksInGroup = 0;
    let completedTasksInGroup = 0;

    // Iterate over each specific area ID in the group (e.g., 'batch_cooker')
    areaIds.forEach(areaId => {
      // Find the area definition in the config to get the total possible tasks
      const areaConfig = competenciesData.find(a => a.id === areaId);
      
      if (areaConfig && areaConfig.tasks) {
        // Add to total possible tasks
        totalTasksInGroup += areaConfig.tasks.length;

        // Count completed tasks for this area in the employee's record
        const employeeArea = employee.competencias[areaId];
        if (employeeArea) {
          areaConfig.tasks.forEach(task => {
            if (employeeArea[task.id]?.completed) {
              completedTasksInGroup++;
            }
          });
        }
      }
    });

    // Calculate percentage for the group
    result[groupName] = totalTasksInGroup === 0 
      ? 0 
      : Math.round((completedTasksInGroup / totalTasksInGroup) * 100);
  });

  return result;
};
