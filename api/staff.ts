import apiClient from './client';

// GET /api/staff/profile — fetch the logged-in staff member's own profile
export async function getStaffProfile() {
  const response = await apiClient.get('/api/staff/profile');
  return response.data;
}

// POST /api/staff/profile/update — multipart form data
// Required: staff_id, post_held, signature (file); optional: faculty
export async function updateStaffProfile(data: {
  staff_id: string;
  post_held: string;
  faculty?: string;
  signature: File;
}) {
  const formData = new FormData();
  formData.append('staff_id', data.staff_id);
  formData.append('post_held', data.post_held);
  if (data.faculty) formData.append('faculty', data.faculty);
  formData.append('signature', data.signature);
  const response = await apiClient.post('/api/staff/profile/update', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

// GET /api/staff/documents — list student documents assigned to this staff's department
export async function getStaffDocuments() {
  const response = await apiClient.get('/api/staff/documents');
  return response.data;
}

// PATCH /api/staff/documents/{document_id}/approve — approve a document
export async function approveDocument(documentId: string) {
  const response = await apiClient.patch(`/api/staff/documents/${documentId}/approve`);
  return response.data;
}

// PATCH /api/staff/documents/{document_id}/reject — reject with a remark
// Required: remark (string, form-data)
export async function rejectDocument(documentId: string, remark: string) {
  const formData = new FormData();
  formData.append('remark', remark);
  const response = await apiClient.patch(`/api/staff/documents/${documentId}/reject`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
