import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronUp, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AreaCard = ({ area, competencies, onToggle, Icon }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate progress
  const totalTasks = area.tasks.length;
  const completedTasks = area.tasks.filter(task => 
    competencies && competencies[task.id] && competencies[task.id].completed
  ).length;
  
  const progressPercentage = Math.round((completedTasks / totalTasks) * 100);
  
  // Determine badge color based on progress
  const getBadgeColor = () => {
    if (progressPercentage === 100) return 'bg-[#1d5030]/10 text-[#1d5030] border-[#1d5030]/20';
    if (progressPercentage > 0) return 'bg-[#c17817]/10 text-[#c17817] border-[#c17817]/20';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Header - Always visible */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 flex items-center justify-between cursor-pointer bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${progressPercentage === 100 ? 'bg-[#1d5030]/10 text-[#1d5030]' : progressPercentage > 0 ? 'bg-[#c17817]/10 text-[#c17817]' : 'bg-gray-100 text-gray-600'}`}>
            {Icon && <Icon size={24} />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{area.label}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getBadgeColor()}`}>
                {completedTasks}/{totalTasks}
              </span>
              {progressPercentage === 100 && (
                <span className="text-xs text-[#1d5030] flex items-center gap-1">
                  <Check size={12} /> Completado
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-gray-400">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Body - Collapsible */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100"
          >
            <div className="p-4 bg-gray-50/50">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {area.tasks.map((task, index) => {
                  const isCompleted = competencies && competencies[task.id] && competencies[task.id].completed;
                  const competenceData = competencies ? competencies[task.id] : null;

                  return (
                    <div 
                      key={task.id} 
                      className={`flex items-start justify-between group p-4 hover:bg-gray-50 transition-colors ${
                        index !== area.tasks.length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-700'}`}>
                            {task.text}
                          </span>
                          {task.description && (
                            <div className="relative group/tooltip">
                              <Info size={14} className="text-gray-400 cursor-help" />
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                                {task.description}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <AnimatePresence initial={false}>
                          {isCompleted && competenceData && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Check size={12} />
                                <span>
                                  Validado por {competenceData.certifiedBy || 'Sistema'} el {competenceData.date ? new Date(competenceData.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={!!isCompleted}
                          onChange={() => onToggle(area.id, task.id, !isCompleted)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1d5030]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1d5030]"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

AreaCard.propTypes = {
  area: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    tasks: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      description: PropTypes.string
    })).isRequired
  }).isRequired,
  competencies: PropTypes.object,
  onToggle: PropTypes.func.isRequired,
  Icon: PropTypes.elementType
};

export default AreaCard;
