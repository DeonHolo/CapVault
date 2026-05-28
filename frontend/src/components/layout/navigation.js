import {
  Archive,
  Bell,
  CalendarBlank,
  ChartBar,
  ClipboardText,
  Database,
  FileArrowUp,
  Folders,
  Gauge,
  GraduationCap,
  Rows,
  UsersThree
} from '@phosphor-icons/react';

export const navItems = [
  { to: '/', label: 'Dashboard', icon: Gauge },
  { to: '/class-records', label: 'Class Records', icon: Database, roles: ['ADMIN'] },
  { to: '/groups', label: 'Groups', icon: UsersThree },
  { to: '/tracker', label: 'Tracker', icon: Rows },
  { to: '/submissions', label: 'Submissions', icon: FileArrowUp },
  { to: '/review', label: 'Review', icon: ClipboardText, roles: ['ADVISER', 'ADMIN'] },
  { to: '/archive', label: 'Archive', icon: Archive },
  { to: '/reports', label: 'Reports', icon: ChartBar, roles: ['ADMIN', 'ADVISER'] },
  { to: '/calendar', label: 'Calendar', icon: CalendarBlank },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/users', label: 'Users', icon: Folders, roles: ['ADMIN'] }
];

export const BrandIcon = GraduationCap;
