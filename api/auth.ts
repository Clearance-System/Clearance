import apiClient from './client';

// POST /token — OAuth2 password flow (x-www-form-urlencoded)
export async function loginUser(credentials: { username: string; password: string }) {
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);
  const response = await apiClient.post('/token', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data; // { access_token, token_type }
}

// GET /users/me — fetch current logged-in user info
export async function getMe() {
  const response = await apiClient.get('/users/me');
  return response.data;
}

// POST /register/student — JSON body
// Required: name, matric_number, faculty, department, password, confirm_password
export async function registerStudent(studentData: {
  name: string;
  matric_number: string;
  faculty: string;
  department: string;
  password: string;
  confirm_password: string;
}) {
  const response = await apiClient.post('/register/student', studentData);
  return response.data;
}

// POST /register/staff — JSON body
// Required: title, first_name, last_name, email, password, confirm_password
export async function registerStaff(staffData: {
  title: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
}) {
  const response = await apiClient.post('/register/staff', staffData);
  return response.data;
}
