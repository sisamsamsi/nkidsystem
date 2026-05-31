import api from '../lib/axios';

export const qcService = {
  // Submit QC report
  submitReport: async ({ taskId, passedQuantity, rejectQuantity, rejectReason, notes }) => {
    const response = await api.post('/station/qc-reports', {
      production_task_id: taskId,
      passed_quantity: passedQuantity,
      reject_quantity: rejectQuantity,
      reject_reason: rejectReason,
      notes
    });
    return response.data;
  },

  // Get QC reports for a task
  getReports: async (taskId = null) => {
    const params = taskId ? { production_task_id: taskId } : {};
    const response = await api.get('/station/qc-reports', { params });
    return response.data;
  }
};

export default qcService;
