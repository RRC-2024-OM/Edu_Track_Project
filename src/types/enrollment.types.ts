
export interface EnrollmentData {
  courseId: string;
  studentId: string;
}

export interface UserWithRole {
  uid: string;
  email: string;
  role: string;
  institutionId?: string;
  childId?: string;
}
