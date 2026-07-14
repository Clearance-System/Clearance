import apiClient from './client';

// POST /api/student/profile/update — multipart form data
// Required: signature (file)
export async function uploadStudentSignature(signatureFile: File) {
  const formData = new FormData();
  formData.append('signature', signatureFile);
  const response = await apiClient.post('/api/student/profile/update', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

// POST /api/student/documents/upload — multipart form data
// Required: document_type (string), file (file)
export async function uploadDocument(docType: string, file: File) {
  const formData = new FormData();
  formData.append('document_type', docType);
  formData.append('file', file);
  const response = await apiClient.post('/api/student/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

// GET /api/student/documents — list student's uploaded documents
export async function getMyDocuments() {
  const response = await apiClient.get('/api/student/documents');
  return response.data;
}

// POST /api/student/clearance/submit — submit clearance request
export async function submitClearanceRequest() {
  const response = await apiClient.post('/api/student/clearance/submit');
  return response.data;
}

// GET /api/student/clearance/status — get clearance progress/status
export async function getClearanceStatus() {
  const response = await apiClient.get('/api/student/clearance/status');
  return response.data;
}

// GET /api/student/clearance/slip — download clearance slip PDF (blob)
export async function downloadClearanceSlip() {
  const response = await apiClient.get('/api/student/clearance/slip', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'clearance_slip.pdf');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
