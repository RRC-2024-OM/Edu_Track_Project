export interface UserWithRole {
    uid: string;
    email: string;
    role: 'SuperAdmin' | 'InstitutionAdmin' | 'Teacher' | 'Student' | 'Parent';
    institutionId?: string;
    childId?: string; // For parent role only
  }
  