import client from './client';

// ============================================================ Auth
export const authApi = {
  registerCitizen: (payload) => client.post('/auth/register', payload),
  loginCitizen: (payload) => client.post('/auth/login/citizen', payload),
  forgotPassword: (payload) => client.post('/auth/forgot-password', payload),
  resetPassword: (payload) => client.post('/auth/reset-password', payload),
  officerLoginStep1: (payload) => client.post('/auth/login/officer/step1', payload),
  officerVerifyOtp: (payload) => client.post('/auth/login/officer/verify-otp', payload),
  changeOfficerPassword: (payload) => client.post('/auth/officer/change-password', payload),
};

// ============================================================ Public catalogs
export const catalogApi = {
  listServices: () => client.get('/services'),
  getService: (id) => client.get(`/services/${id}`),
  createService: (payload) => client.post('/services', payload),
  updateService: (id, payload) => client.put(`/services/${id}`, payload),

  listGrievanceCategories: () => client.get('/grievance-categories'),
  createGrievanceCategory: (payload) => client.post('/grievance-categories', payload),

  listDepartments: () => client.get('/departments'),
  createDepartment: (payload) => client.post('/departments', payload),
};

// ============================================================ Track (public)
export const trackApi = {
  track: (id) => client.get(`/track/${id}`),
};

// ============================================================ Citizen
export const citizenApi = {
  me: () => client.get('/citizens/me'),
  updateMe: (payload) => client.put('/citizens/me', payload),
};

// ============================================================ Applications
export const applicationApi = {
  submit: (payload) => client.post('/applications', payload),
  resubmit: (id, payload) => client.post(`/applications/${id}/resubmit`, payload),
  mine: () => client.get('/applications/mine'),
  get: (id) => client.get(`/applications/${id}`),
  timeline: (id) => client.get(`/applications/${id}/timeline`),
  documents: (id) => client.get(`/applications/${id}/documents`),
  queue: () => client.get('/applications/queue'),
  view: (id) => client.post(`/applications/${id}/view`),
  approve: (id, payload) => client.post(`/applications/${id}/approve`, payload || {}),
  reject: (id, payload) => client.post(`/applications/${id}/reject`, payload),
};

// ============================================================ Certificates
export const certificateApi = {
  byApplication: (applicationId) => client.get(`/certificates/application/${applicationId}`),
  verify: (certificateNumber) => client.get('/certificates/verify', { params: { certificateNumber } }),
};

// ============================================================ Grievances
export const grievanceApi = {
  submit: (payload) => client.post('/grievances', payload),
  mine: () => client.get('/grievances/mine'),
  get: (id) => client.get(`/grievances/${id}`),
  timeline: (id) => client.get(`/grievances/${id}/timeline`),
  aiLog: (id) => client.get(`/grievances/${id}/ai-log`),
  view: (id) => client.post(`/grievances/${id}/view`),

  myFieldTasks: () => client.get('/grievances/field/mine'),
  fieldUpdate: (id, payload) => client.post(`/grievances/${id}/field-update`, payload),

  myDepartmentGrievances: () => client.get('/grievances/department/mine'),
  approveResolution: (id) => client.post(`/grievances/${id}/approve-resolution`),
  escalate: (id, payload) => client.post(`/grievances/${id}/escalate`, payload || {}),

  listAll: (status) => client.get('/grievances', { params: status ? { status } : {} }),
  reassign: (id, payload) => client.post(`/grievances/${id}/reassign`, payload),
};

// ============================================================ Admin
export const adminApi = {
  createOfficer: (payload) => client.post('/admin/officers', payload),
  listOfficers: (role) => client.get('/admin/officers', { params: role ? { role } : {} }),
  getOfficer: (id) => client.get(`/admin/officers/${id}`),
  updateOfficer: (id, payload) => client.put(`/admin/officers/${id}`, payload),
  deactivateOfficer: (id) => client.patch(`/admin/officers/${id}/deactivate`),
  activateOfficer: (id) => client.patch(`/admin/officers/${id}/activate`),
  resetPassword: (id) => client.post(`/admin/officers/${id}/reset-password`),
  auditLogs: () => client.get('/admin/audit-logs'),
};

// ============================================================ Notifications & Analytics
export const notificationApi = {
  mine: () => client.get('/notifications/mine'),
};

export const analyticsApi = {
  public: () => client.get('/analytics/public'),
  full: () => client.get('/analytics/full'),
};
