import apiClient from './client';

// GET /api/admin/students — list all students
export async function getAllStudents() {
  const response = await apiClient.get('/api/admin/students');
  return response.data;
}

// GET /api/admin/students-list — list all uploaded students in the master list
export async function getUploadedStudentsList() {
  const response = await apiClient.get('/api/admin/students-list');
  return response.data;
}

// GET /api/admin/students/{student_id} — get single student details
export async function getStudentById(studentId: string) {
  const response = await apiClient.get(`/api/admin/students/${studentId}`);
  return response.data;
}

// GET /api/admin/staff — list all staff members
export async function getStaffList() {
  const response = await apiClient.get('/api/admin/staff');
  return response.data;
}

// GET /api/admin/staff/{staff_id} — get single staff member detail
export async function getStaffDetail(staffId: string) {
  const response = await apiClient.get(`/api/admin/staff/${staffId}`);
  return response.data;
}

// PATCH /api/admin/staff/{staff_id}/approve — approve a staff member
export async function approveStaff(staffId: string) {
  const response = await apiClient.patch(`/api/admin/staff/${staffId}/approve`);
  return response.data;
}

// PATCH /api/admin/staff/{staff_id}/suspend — suspend a staff member
export async function suspendStaff(staffId: string) {
  const response = await apiClient.patch(`/api/admin/staff/${staffId}/suspend`);
  return response.data;
}

// PATCH /api/admin/staff/{staff_id}/unsuspend — unsuspend a staff member
export async function unsuspendStaff(staffId: string) {
  const response = await apiClient.patch(`/api/admin/staff/${staffId}/unsuspend`);
  return response.data;
}

// DELETE /api/admin/staff/{staff_id} — delete a staff member
export async function deleteStaff(staffId: string) {
  const response = await apiClient.delete(`/api/admin/staff/${staffId}`);
  return response.data;
}

// PATCH /api/admin/clearance/toggle — toggle clearance portal status
// Sends JSON body: { "clearance_active": true | false }
export async function toggleClearance(clearanceActive: boolean) {
  const response = await apiClient.patch('/api/admin/clearance/toggle', {
    clearance_active: clearanceActive,
  });
  return response.data;
}

// GET /api/admin/clearance/status — get current clearance open/closed status
export async function getClearanceStatus() {
  const response = await apiClient.get('/api/admin/clearance/status');
  return response.data;
}

// POST /api/admin/upload-students — bulk upload students via Excel/CSV file
export async function uploadStudentsFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/api/admin/upload-students', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

// GET /api/admin/export-completed — download Excel of completed clearances
export async function exportCompletedClearances() {
  const response = await apiClient.get('/api/admin/export-completed', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'completed_clearances.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
