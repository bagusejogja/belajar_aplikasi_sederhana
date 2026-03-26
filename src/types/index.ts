export type Role = 'ADMIN' | 'MANAGER' | 'STAFF' | 'GUEST';

export interface Unit {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  unitId: string;
}

export interface MenuItem {
  title: string;
  path: string;
  icon: string;
  roles: Role[];
}
