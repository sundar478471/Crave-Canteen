import { UserRole } from './auth.js';

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  avatar?: string;
  rewardPoints?: number;
  walletBalance?: number;
  favorites?: string[];

  // Personal Info
  dob?: string;
  gender?: string;

  // Organization Info
  employeeId?: string;
  studentId?: string;
  rollNumber?: string;
  department?: string;
  designation?: string;
  joiningDate?: string;
  address?: string;
  emergencyContact?: string;
  yearClass?: string;
  kitchenId?: string;
  kitchenBranch?: string;
  passwordHash?: string;

  // Account & Authorization
  accessLevel?: string;
  status?: string;
  permissions?: any;

  // Audit Information
  createdBy?: string;
  createdByName?: string;
  createdAt?: number;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt?: number;
  lastLoginAt?: number;
}
