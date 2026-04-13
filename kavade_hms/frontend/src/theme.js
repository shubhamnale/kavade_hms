export const theme = {
  primary:     '#1565C0',
  accent:      '#2196F3',
  accentLight: '#64B5F6',
  success:     '#43A047',
  warning:     '#FBC02D',
  danger:      '#E53935',
  bg:          '#F5F7FA',
  card:        '#FFFFFF',
  text:        '#212121',
  muted:       '#757575',
  border:      '#E0E0E0',
}

export const STATUS_COLORS = {
  'Registered':       { bg: '#FFEBEE', border: '#EF9A9A', dot: '#E53935', label: 'Waiting'           },
  'Doctor Pending':   { bg: '#E3F2FD', border: '#64B5F6', dot: '#2196F3', label: 'With Doctor'       },
  'Doctor Completed': { bg: '#FFFDE7', border: '#FFE082', dot: '#FBC02D', label: 'Doctor Completed'  },
  'Billed':           { bg: '#E8F5E9', border: '#A5D6A7', dot: '#43A047', label: 'Billed'            },
}

export const ROLE_COLORS = {
  admin:     '#E53935',
  reception: '#43A047',
  doctor:    '#2196F3',
  billing:   '#FBC02D',
}

export const NAV_CONFIG = {
  admin: [
    { section: 'Overview',   items: [{ id: 'dash',     icon: '⊞', label: 'Dashboard'  }] },
    { section: 'Management', items: [{ id: 'patients', icon: '👥', label: 'Patients'   },
                                     { id: 'doctors',  icon: '🩺', label: 'Doctors'    },
                                     { id: 'users',    icon: '👤', label: 'Users'      }] },
    { section: 'Reports',    items: [{ id: 'reports',      icon: '📊', label: 'Reports'             },
                                     { id: 'dailyreport',  icon: '🗒️', label: 'Daily Patient Report' },
                                     { id: 'timing',       icon: '⏱', label: 'Timing Log'           }] },
    { section: 'Account',    items: [{ id: 'profile',  icon: '👤', label: 'My Profile' }] },
  ],
  reception: [
    { section: 'Workflow', items: [{ id: 'dash',     icon: '⊞', label: 'Dashboard' },
                                   { id: 'patients', icon: '👥', label: 'Patients'  }] },
    { section: 'Account',  items: [{ id: 'profile',  icon: '👤', label: 'My Profile'}] },
  ],
  doctor: [
    { section: 'Workflow', items: [{ id: 'dash',     icon: '⊞', label: 'Dashboard'   },
                                   { id: 'patients', icon: '👥', label: 'My Patients' }] },
    { section: 'Account',  items: [{ id: 'profile',  icon: '👤', label: 'My Profile' }] },
  ],
  billing: [
    { section: 'Workflow', items: [{ id: 'dash',     icon: '⊞', label: 'Dashboard' },
                                   { id: 'patients', icon: '💳', label: 'Cases'     }] },
    { section: 'Account',  items: [{ id: 'profile',  icon: '👤', label: 'My Profile'}] },
  ],
}
