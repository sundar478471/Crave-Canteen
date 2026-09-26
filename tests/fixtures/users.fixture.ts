import { User, UserRole } from '../../shared/types';

export const mockStudentUser: User = {
  id: 'usr-student-1',
  name: 'Demo Student',
  email: 'student@campus.edu',
  phoneNumber: '+919876543210',
  role: UserRole.STUDENT,
  rewardPoints: 100,
  favorites: []
};

export const mockStaffUser: User = {
  id: 'usr-staff-1',
  name: 'Head Chef',
  email: 'sundar48807@gmail.com',
  phoneNumber: '+919876543211',
  role: UserRole.STAFF,
  rewardPoints: 500,
  favorites: []
};
