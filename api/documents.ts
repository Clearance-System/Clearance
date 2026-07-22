import apiClient from './client';

// Documents API (shared for all roles)
export async function getDocumentContent(documentId: string) {
  const response = await apiClient.get(`/api/documents/documents/${documentId}/content`);
  return response.data;
}
