import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import ModalContainer from "../ModalContainer";
import useHardwareBackButton from "../../hooks/useHardwareBackButton";

const TaskReasonModal = ({ action, onClose, onSubmit, isOnline }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { setReason(""); setError(""); setSaving(false); }, [action]);
  useHardwareBackButton(!!action, onClose, 30, "task-reason");
  const label = action === "cancel" ? "Cancelar tarea" : "Reabrir tarea";
  const submit = async () => {
    if (!isOnline || saving) return;
    if (!reason.trim()) { setError("El motivo es obligatorio"); return; }
    setSaving(true);
    try { await onSubmit(reason.trim()); onClose(); }
    catch (err) { setError(err.message || "No se pudo cambiar el estado"); }
    finally { setSaving(false); }
  };
  return (
    <ModalContainer isOpen={!!action} onClose={onClose} title={label}>
      <div className="p-5 space-y-4">
        <label htmlFor="task-reason" className="block text-sm font-medium text-gray-700">Motivo breve</label>
        <textarea id="task-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300}
          disabled={!isOnline || saving} rows={3} className="w-full border border-gray-200 rounded-lg p-3 text-sm" />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 border rounded-lg">Volver</button>
          <button onClick={submit} disabled={!isOnline || saving} className="px-4 py-2 bg-[#1d5030] text-white rounded-lg disabled:opacity-50">
            {saving ? "Guardando…" : label}
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};
TaskReasonModal.propTypes = {
  action: PropTypes.oneOf(["cancel", "reopen"]), onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired, isOnline: PropTypes.bool.isRequired,
};
export default TaskReasonModal;
