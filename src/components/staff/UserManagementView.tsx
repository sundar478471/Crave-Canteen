import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, UserPermissions, getDefaultPermissionsForRole, ResourcePermission } from '../../types';
import { api } from '../../services/api/apiClient';
import { 
  Users, UserPlus, Search, ShieldCheck, Mail, Phone, 
  Trash2, Edit3, X, Check, Loader2, KeyRound, AlertCircle, RefreshCw, 
  Eye, Calendar, Building2, Briefcase, MapPin, PhoneCall, Award, 
  ShieldAlert, Lock, Sparkles, Filter, CheckCircle2, User as UserIcon
} from 'lucide-react';

interface UserManagementViewProps {
  currentUser?: User | null;
  triggerToastSuccess: (msg: string) => void;
  triggerToastError: (msg: string) => void;
}

const DEPARTMENTS = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Canteen Operations',
  'Kitchen Staff',
  'Administration'
];

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  triggerToastSuccess,
  triggerToastError
}) => {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [userToView, setUserToView] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToResetPass, setUserToResetPass] = useState<User | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState<string>('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState<string>('');
  const [isResettingPass, setIsResettingPass] = useState<boolean>(false);

  // Form State for Add / Edit
  const [activeFormTab, setActiveFormTab] = useState<'personal' | 'org' | 'account' | 'permissions'>('personal');
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [avatar, setAvatar] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [gender, setGender] = useState<string>('Prefer Not to Say');

  const [employeeId, setEmployeeId] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [department, setDepartment] = useState<string>('Computer Science');
  const [designation, setDesignation] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('');
  const [yearClass, setYearClass] = useState<string>('');
  const [kitchenBranch, setKitchenBranch] = useState<string>('Main Campus Canteen - Station 1');
  const [joiningDate, setJoiningDate] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [emergencyContact, setEmergencyContact] = useState<string>('');

  const [role, setRole] = useState<UserRole | ''>('');
  const [accessLevel, setAccessLevel] = useState<string>('Standard');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [permissions, setPermissions] = useState<UserPermissions>(getDefaultPermissionsForRole(UserRole.STUDENT));

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleToggleActivateDeactivate = async (u: User) => {
    const newStatus = (u.status || 'ACTIVE') === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.toggleUserStatus(u.id, newStatus, currentUser);
      triggerToastSuccess(`User "${u.name}" is now ${newStatus}.`);
      await fetchUsers();
    } catch (err: any) {
      triggerToastError(err?.message || 'Failed to update account status.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToResetPass) return;
    if (!resetPasswordVal || resetPasswordVal.length < 6) {
      triggerToastError("Password must be at least 6 characters long.");
      return;
    }
    if (resetPasswordVal !== resetPasswordConfirm) {
      triggerToastError("Passwords do not match.");
      return;
    }
    setIsResettingPass(true);
    try {
      await api.resetUserPassword(userToResetPass.id, resetPasswordVal, currentUser);
      triggerToastSuccess(`Password for "${userToResetPass.name}" updated successfully.`);
      setUserToResetPass(null);
      setResetPasswordVal('');
      setResetPasswordConfirm('');
    } catch (err: any) {
      triggerToastError(err?.message || 'Failed to reset password.');
    } finally {
      setIsResettingPass(false);
    }
  };

  const isExecutingAdmin = useMemo(() => {
    if (!currentUser) return true;
    const r = String(currentUser.role).toUpperCase();
    return ['ADMIN', 'SUPER_ADMIN', 'CANTEEN_MANAGER', 'VENDOR_ADMIN', 'KITCHEN', 'STAFF', 'KITCHEN_STAFF', 'COUNTER_STAFF'].includes(r);
  }, [currentUser]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAllUsers();
      setUsersList(data);
    } catch (err: any) {
      triggerToastError('Failed to fetch user records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Sync role permissions when role changes in form if creating
  const handleRoleChange = (newRoleStr: string) => {
    setRole(newRoleStr as any);
    if (formErrors.role) {
      setFormErrors(prev => ({ ...prev, role: '' }));
    }

    if (!userToEdit && newRoleStr) {
      const mappedRole = (newRoleStr === 'KITCHEN' ? UserRole.STAFF : newRoleStr) as UserRole;
      setPermissions(getDefaultPermissionsForRole(mappedRole));
      
      if (newRoleStr === 'STUDENT') {
        setAccessLevel('Standard');
        setDesignation('Student');
        setDepartment('Computer Science');
      } else if (newRoleStr === 'FACULTY') {
        setAccessLevel('Elevated');
        setDesignation('Faculty Professor');
        setDepartment('Computer Science');
      } else if (newRoleStr === 'KITCHEN') {
        setAccessLevel('Elevated');
        setDesignation('Kitchen Staff');
        setDepartment('Kitchen Staff');
      }
    }
  };

  // Open Form for Adding New User
  const openAddModal = () => {
    setUserToEdit(null);
    setName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setAvatar('');
    setDob('');
    setGender('Prefer Not to Say');
    setEmployeeId('');
    setStudentId('');
    setDepartment('Computer Science');
    setDesignation('');
    setAcademicYear('3rd Year / Sec A');
    setYearClass('3rd Year / Sec A');
    setKitchenBranch('Main Campus Canteen - Station 1');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setAddress('');
    setEmergencyContact('');
    setRole(''); // Default state: Select Role (unselected)
    setAccessLevel('Standard');
    setStatus('ACTIVE');
    setPassword('123456');
    setConfirmPassword('123456');
    setPermissions(getDefaultPermissionsForRole(UserRole.STUDENT));
    setFormErrors({});
    setActiveFormTab('personal');
    setShowAddModal(true);
  };

  // Open Form for Editing User
  const openEditModal = (u: User) => {
    setUserToEdit(u);
    setName(u.name || '');
    setUsername(u.username || (u.email ? u.email.split('@')[0] : u.id));
    setEmail(u.email || '');
    setPhone(u.phoneNumber || '');
    setAvatar(u.avatar || '');
    setDob(u.dob || '');
    setGender(u.gender || 'Prefer Not to Say');
    setEmployeeId(u.employeeId || '');
    setStudentId(u.studentId || u.rollNumber || '');
    setDepartment(u.department || 'Computer Science');
    setDesignation(u.designation || '');
    setYearClass(u.yearClass || (u as any).academicYear || '');
    setKitchenBranch(u.kitchenBranch || u.kitchenId || 'Main Campus Canteen - Station 1');
    setJoiningDate(u.joiningDate || '');
    setAddress(u.address || '');
    setEmergencyContact(u.emergencyContact || '');
    setRole(u.role || '');
    setAccessLevel(u.accessLevel || 'Standard');
    setStatus(u.status || 'ACTIVE');
    setPassword('');
    setConfirmPassword('');
    setPermissions(u.permissions || getDefaultPermissionsForRole(u.role));
    setFormErrors({});
    setActiveFormTab('personal');
    setShowAddModal(true);
  };

  // Filtered list
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        u.name.toLowerCase().includes(q) || 
        (u.username && u.username.toLowerCase().includes(q)) || 
        (u.email && u.email.toLowerCase().includes(q)) || 
        (u.phoneNumber && u.phoneNumber.includes(q)) ||
        (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
        (u.studentId && u.studentId.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        (u.designation && u.designation.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (roleFilter !== 'ALL') {
        const uRole = String(u.role).toUpperCase();
        if (roleFilter === 'STUDENT' && !['STUDENT', 'CUSTOMER'].includes(uRole)) return false;
        if (roleFilter === 'FACULTY' && uRole !== 'FACULTY') return false;
        if (roleFilter === 'KITCHEN' && !['KITCHEN', 'STAFF', 'KITCHEN_STAFF', 'COUNTER_STAFF'].includes(uRole)) return false;
        if (roleFilter === 'ADMIN' && !['ADMIN', 'SUPER_ADMIN', 'CANTEEN_MANAGER', 'VENDOR_ADMIN'].includes(uRole)) return false;
      }

      if (deptFilter !== 'ALL') {
        if (u.department !== deptFilter) return false;
      }

      if (statusFilter !== 'ALL') {
        const uStatus = u.status || 'ACTIVE';
        if (uStatus !== statusFilter) return false;
      }

      return true;
    });
  }, [usersList, searchQuery, roleFilter, deptFilter, statusFilter]);

  // Frontend Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Full Name is required.';
    }

    if (!role) {
      errors.role = 'Please select a role.';
    }

    if (!email.trim() && !phone.trim()) {
      errors.email = 'Either Email or Mobile Number is required.';
      errors.phone = 'Either Email or Mobile Number is required.';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (phone.trim() && !/^\+?\d{7,15}$/.test(phone.trim().replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid mobile number (e.g. +91 9876543210).';
    }

    if (!userToEdit) {
      if (!password) {
        errors.password = 'Password is required for new accounts.';
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters.';
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }
    } else if (password) {
      if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters.';
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }
    }

    setFormErrors(errors);
    if (errors.role || errors.name || errors.email || errors.phone) {
      setActiveFormTab('personal');
    }
    return Object.keys(errors).length === 0;
  };

  // Form Submission (Add or Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      triggerToastError(formErrors.role || 'Please select a role and fill required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const creatorId = currentUser?.id || 'admin';
      const creatorName = currentUser?.name || 'Kitchen Admin';

      const userData: Partial<User & { password?: string }> = {
        name: name.trim(),
        username: username.trim() || (email ? email.split('@')[0] : `usr_${Date.now()}`),
        email: email.trim(),
        phoneNumber: phone.trim(),
        avatar: avatar.trim(),
        dob: dob,
        gender: gender,
        employeeId: employeeId.trim(),
        studentId: studentId.trim(),
        rollNumber: studentId.trim(),
        department: department,
        yearClass: yearClass.trim() || academicYear.trim(),
        kitchenId: kitchenBranch.trim(),
        kitchenBranch: kitchenBranch.trim(),
        designation: designation.trim() || (role === 'KITCHEN' ? 'Kitchen Staff' : role === 'FACULTY' ? 'Faculty Member' : 'Student'),
        joiningDate: joiningDate,
        address: address.trim(),
        emergencyContact: emergencyContact.trim(),
        role: role as UserRole,
        accessLevel: accessLevel,
        status: status,
        permissions: permissions,
        createdBy: creatorId,
        createdByName: creatorName,
      };

      if (password) {
        userData.password = password;
      }

      if (userToEdit) {
        const updated = await api.updateUser(
          userToEdit.id, 
          { ...userData, updatedBy: creatorId, updatedByName: creatorName }, 
          currentUser
        );
        triggerToastSuccess(`User "${updated.name}" updated successfully!`);
        if (userToView && userToView.id === updated.id) {
          setUserToView(updated);
        }
      } else {
        const created = await api.registerUser(userData as User, currentUser);
        triggerToastSuccess(`User "${created.name}" created successfully!`);
      }

      setShowAddModal(false);
      setUserToEdit(null);
      await fetchUsers(); // Refresh user table immediately
    } catch (err: any) {
      const msg = err.message || 'Operation failed.';
      setFormErrors(prev => ({ ...prev, submit: msg }));
      triggerToastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await api.deleteUser(userToDelete.id);
      triggerToastSuccess(`Account "${userToDelete.name}" deleted successfully.`);
      if (userToView && userToView.id === userToDelete.id) {
        setUserToView(null);
      }
      setUserToDelete(null);
      await fetchUsers();
    } catch (err: any) {
      triggerToastError('Failed to delete user account.');
    }
  };

  const togglePermissionCheckbox = (moduleKey: keyof UserPermissions, actionKey: keyof ResourcePermission) => {
    if (!isExecutingAdmin) return;
    setPermissions(prev => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [actionKey]: !prev[moduleKey][actionKey]
      }
    }));
  };

  const getRoleBadge = (userRole?: string) => {
    const roleStr = String(userRole || '').toUpperCase();
    if (roleStr === 'STUDENT') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          STUDENT
        </span>
      );
    }
    if (roleStr === 'FACULTY') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          FACULTY
        </span>
      );
    }
    if (['KITCHEN', 'STAFF', 'KITCHEN_STAFF', 'COUNTER_STAFF'].includes(roleStr)) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          KITCHEN
        </span>
      );
    }
    if (['ADMIN', 'SUPER_ADMIN', 'CANTEEN_MANAGER', 'VENDOR_ADMIN'].includes(roleStr)) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          ADMIN
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
        {roleStr}
      </span>
    );
  };

  const getStatusBadge = (userStatus?: string) => {
    const st = userStatus || 'ACTIVE';
    switch (st) {
      case 'SUSPENDED':
      case 'INACTIVE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
            {st}
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            Pending
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            Active
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0f172a] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            <span>User Administration & Role Management</span>
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Complete management of Students, Faculty, and Kitchen Staff accounts
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchUsers}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Refresh Users Database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs flex items-center space-x-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH & MULTI-FILTER CONTROL BAR */}
      <div className="bg-white dark:bg-[#0f172a] p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, ID, dept..."
              className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">STUDENT</option>
              <option value="FACULTY">FACULTY</option>
              <option value="KITCHEN">KITCHEN</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
            >
              <option value="ALL">All Departments</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Account Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING">Pending Approval</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {(roleFilter !== 'ALL' || deptFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">
              Showing <strong>{filteredUsers.length}</strong> of {usersList.length} users
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('ALL');
                setDeptFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-orange-600 hover:text-orange-700 font-bold text-xs"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* 3. USER MANAGEMENT MAIN TABLE */}
      {loading ? (
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Loading User Database...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">No Users Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            No user records match your selected criteria. Click "Add New User" to create an account.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-200/80 dark:border-slate-800">
                  <th className="p-4">User Details</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Org / Profile</th>
                  <th className="p-4">Role & Status</th>
                  <th className="p-4">Created By</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredUsers.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors">
                    
                    {/* User Identity Column */}
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs overflow-hidden">
                          {userItem.avatar ? (
                            <img src={userItem.avatar} alt={userItem.name} className="w-full h-full object-cover" />
                          ) : (
                            userItem.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{userItem.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            @{userItem.username || (userItem.email ? userItem.email.split('@')[0] : userItem.id)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{userItem.email || 'N/A'}</span>
                        </div>
                        {userItem.phoneNumber && (
                          <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{userItem.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Organization / ID */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {userItem.department || 'General'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ID: {userItem.employeeId || userItem.studentId || userItem.rollNumber || 'Not set'}
                        </div>
                      </div>
                    </td>

                    {/* Role & Status */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div>{getRoleBadge(userItem.role)}</div>
                        <div>{getStatusBadge(userItem.status)}</div>
                      </div>
                    </td>

                    {/* Created By Column */}
                    <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {userItem.createdByName || userItem.createdBy || 'System Admin'}
                      </div>
                    </td>

                    {/* Created Date Column */}
                    <td className="p-4">
                      <div className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {userItem.createdAt 
                          ? (typeof userItem.createdAt === 'number' 
                              ? new Date(userItem.createdAt).toLocaleDateString() 
                              : new Date(userItem.createdAt).toLocaleDateString())
                          : '—'}
                      </div>
                    </td>

                    {/* Actions Column (View, Edit, Activate/Deactivate, Reset Password, Delete) */}
                    <td className="p-4 text-right space-x-1">
                      {/* EYE VIEW BUTTON */}
                      <button
                        onClick={() => setUserToView(userItem)}
                        className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors inline-flex items-center justify-center cursor-pointer"
                        title="View Full Profile Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* PENCIL EDIT BUTTON */}
                      <button
                        onClick={() => openEditModal(userItem)}
                        className="p-2 rounded-xl text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors inline-flex items-center justify-center cursor-pointer"
                        title="Edit User Profile"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* ACTIVATE / DEACTIVATE BUTTON */}
                      <button
                        onClick={() => handleToggleActivateDeactivate(userItem)}
                        className={`p-2 rounded-xl transition-colors inline-flex items-center justify-center cursor-pointer ${
                          (userItem.status || 'ACTIVE') === 'ACTIVE'
                            ? 'text-emerald-600 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                        title={(userItem.status || 'ACTIVE') === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>

                      {/* RESET PASSWORD BUTTON */}
                      <button
                        onClick={() => {
                          setUserToResetPass(userItem);
                          setResetPasswordVal('');
                          setResetPasswordConfirm('');
                        }}
                        className="p-2 rounded-xl text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors inline-flex items-center justify-center cursor-pointer"
                        title="Reset User Password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      {/* TRASH DELETE BUTTON */}
                      <button
                        onClick={() => setUserToDelete(userItem)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors inline-flex items-center justify-center cursor-pointer"
                        title="Delete User Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. EYE ICON — FULL USER DETAILS MODAL */}
      {userToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header Banner */}
            <div className="p-6 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl border border-white/30 overflow-hidden shadow-lg">
                  {userToView.avatar ? (
                    <img src={userToView.avatar} alt={userToView.name} className="w-full h-full object-cover" />
                  ) : (
                    userToView.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black">{userToView.name}</h3>
                  <p className="text-xs font-bold text-orange-100 font-mono">@{userToView.username || (userToView.email ? userToView.email.split('@')[0] : userToView.id)}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {getRoleBadge(userToView.role)}
                    {getStatusBadge(userToView.status)}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const u = userToView;
                    setUserToView(null);
                    openEditModal(u);
                  }}
                  className="px-4 py-2 rounded-xl bg-white text-orange-600 hover:bg-orange-50 font-extrabold text-xs shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit User</span>
                </button>
                <button
                  onClick={() => setUserToView(null)}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Section 1: Personal Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <UserIcon className="w-4 h-4" />
                  <span>Personal Information</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Full Name</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{userToView.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Username</span>
                    <span className="font-extrabold text-slate-900 dark:text-white font-mono">@{userToView.username || 'Not set'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Email Address</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{userToView.email || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Mobile Phone</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{userToView.phoneNumber || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Date of Birth</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{userToView.dob || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Gender</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{userToView.gender || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Identification & Organization */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Building2 className="w-4 h-4" />
                  <span>Organization & Identification</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Employee / Student ID</span>
                    <span className="font-extrabold text-slate-900 dark:text-white font-mono">{userToView.employeeId || userToView.studentId || userToView.rollNumber || 'Not assigned'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Department</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{userToView.department || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Designation</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{userToView.designation || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Joining Date</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{userToView.joiningDate || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Emergency Contact</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{userToView.emergencyContact || 'Not provided'}</span>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <span className="text-slate-400 font-semibold block text-[10px]">Address</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{userToView.address || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Account & Authorization */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Account & Financial Status</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Account Role</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{userToView.role}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Access Level</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{userToView.accessLevel || 'Standard'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Wallet Balance</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{(userToView.walletBalance ?? 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Reward Points</span>
                    <span className="font-extrabold text-amber-600 dark:text-amber-400">{userToView.rewardPoints ?? 0} pts</span>
                  </div>
                </div>
              </div>

              {/* Section 4: Audit Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Calendar className="w-4 h-4" />
                  <span>Audit Trail & Metadata</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl text-[11px]">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Created By</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {userToView.createdByName || userToView.createdBy || 'System Admin'}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {userToView.createdAt ? new Date(userToView.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Last Updated By</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {userToView.updatedByName || userToView.updatedBy || 'System Admin'}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {userToView.updatedAt ? new Date(userToView.updatedAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 5. ADD / EDIT COMPLETE USER PROFILE FORM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            
            {/* Modal Top Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {userToEdit ? `Edit User Profile — ${userToEdit.name}` : 'Add New User Account'}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Complete user administration form — stays within Kitchen User Management
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SINGLE ROLE DROPDOWN */}
            <div className="px-6 pt-4 shrink-0">
              <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent p-4 rounded-2xl border border-orange-500/20">
                <label htmlFor="user-role-select" className="block text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>ROLE *</span>
                </label>
                <div className="relative">
                  <select
                    id="user-role-select"
                    disabled={isSubmitting}
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className={`w-full px-4 py-3 text-xs font-extrabold rounded-xl bg-white dark:bg-slate-900 border ${formErrors.role ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'} text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all shadow-xs cursor-pointer disabled:opacity-60 appearance-none pr-10`}
                  >
                    <option value="" disabled>Select Role ▼</option>
                    <option value="STUDENT">STUDENT</option>
                    <option value="FACULTY">FACULTY</option>
                    <option value="KITCHEN">KITCHEN</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-orange-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                    </svg>
                  </div>
                </div>
                {formErrors.role ? (
                  <p className="text-[11px] text-rose-500 mt-1.5 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{formErrors.role}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                    Select the user's role: STUDENT, FACULTY, or KITCHEN.
                  </p>
                )}
              </div>
            </div>

            {/* Form Section Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-5 pt-2 shrink-0 overflow-x-auto no-scrollbar">
              {[
                { id: 'personal', label: '1. Personal Details', icon: UserIcon },
                { id: 'org', label: '2. Role-Based Info', icon: Building2 },
                { id: 'account', label: '3. Security & Status', icon: ShieldCheck },
                { id: 'permissions', label: '4. Permissions Matrix', icon: Lock }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeFormTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFormTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                      isActive 
                        ? 'border-orange-600 text-orange-600 dark:text-orange-400' 
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Error Feedback Header Banner */}
            {formErrors.submit && (
              <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formErrors.submit}</span>
              </div>
            )}

            {/* Main Form Body */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* TAB 1: PERSONAL INFORMATION */}
              {activeFormTab === 'personal' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Full Name */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border ${formErrors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} text-slate-900 dark:text-white focus:border-orange-500 outline-none`}
                      />
                      {formErrors.name && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{formErrors.name}</p>}
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Username (Unique)
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. rahul_sharma"
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none font-mono"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="rahul@campus.edu"
                        className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border ${formErrors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} text-slate-900 dark:text-white focus:border-orange-500 outline-none`}
                      />
                      {formErrors.email && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{formErrors.email}</p>}
                    </div>

                    {/* Mobile Phone */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Mobile Phone Number
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border ${formErrors.phone ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} text-slate-900 dark:text-white focus:border-orange-500 outline-none`}
                      />
                      {formErrors.phone && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{formErrors.phone}</p>}
                    </div>

                    {/* Profile Photo URL */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Profile Photo URL
                      </label>
                      <input
                        type="text"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                    {/* DOB */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer Not to Say">Prefer Not to Say</option>
                      </select>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: ROLE-BASED DYNAMIC ORGANIZATION & IDENTIFICATION */}
              {activeFormTab === 'org' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Dynamic Role Banner */}
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Selected Role: <strong className="text-orange-600">{role || 'None Selected'}</strong></span>
                    {role && <span className="text-[10px] text-slate-400 font-mono">Showing {role} specific form fields</span>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* ROLE SPECIFIC FIELD 1: ID NUMBER */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        {role === 'STUDENT' ? 'Student ID / Roll Number *' : role === 'FACULTY' ? 'Faculty Employee ID *' : 'Kitchen Staff Employee ID *'}
                      </label>
                      <input
                        type="text"
                        value={role === 'STUDENT' ? studentId : employeeId}
                        onChange={(e) => {
                          setStudentId(e.target.value);
                          setEmployeeId(e.target.value);
                        }}
                        placeholder={role === 'STUDENT' ? 'e.g. STU-2026-101' : role === 'FACULTY' ? 'e.g. FAC-9902' : 'e.g. KIT-405'}
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none font-mono"
                      />
                    </div>

                    {/* ROLE SPECIFIC FIELD 2: DEPARTMENT OR KITCHEN/BRANCH */}
                    {role === 'KITCHEN' ? (
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                          Kitchen / Branch Location *
                        </label>
                        <input
                          type="text"
                          value={kitchenBranch}
                          onChange={(e) => setKitchenBranch(e.target.value)}
                          placeholder="e.g. Main Campus Canteen - Station 1"
                          className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                          Academic Department *
                        </label>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                        >
                          {DEPARTMENTS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* ROLE SPECIFIC FIELD 3: YEAR/CLASS OR DESIGNATION */}
                    {role === 'STUDENT' ? (
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                          Year / Class Section *
                        </label>
                        <input
                          type="text"
                          value={yearClass}
                          onChange={(e) => {
                            setYearClass(e.target.value);
                            setAcademicYear(e.target.value);
                          }}
                          placeholder="e.g. 3rd Year / Sec A"
                          className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                          {role === 'FACULTY' ? 'Faculty Designation' : 'Kitchen Role / Station Designation'}
                        </label>
                        <input
                          type="text"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          placeholder={role === 'FACULTY' ? 'e.g. Senior Professor / HOD' : 'e.g. Head Chef / Counter Executive'}
                          className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                        />
                      </div>
                    )}

                    {/* Joining Date */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Joining Date
                      </label>
                      <input
                        type="date"
                        value={joiningDate}
                        onChange={(e) => setJoiningDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                    {/* Emergency Contact */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Emergency Contact Info
                      </label>
                      <input
                        type="text"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="+91 9800000000 (Parent/Guardian)"
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                    {/* Address */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Full Address
                      </label>
                      <textarea
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Hostel Block A, Campus Residence / City Address..."
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: ACCOUNT & STATUS */}
              {activeFormTab === 'account' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Active Selected Role Summary Badge */}
                    <div className="sm:col-span-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Assigned Role (Set at Top)</span>
                      <span className="text-xs font-black uppercase px-3 py-1 rounded-lg bg-orange-500/10 text-orange-600 border border-orange-500/20">
                        {role || 'None Selected'}
                      </span>
                    </div>

                    {/* Access Level */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Profile Access Level *
                      </label>
                      <select
                        disabled={!isExecutingAdmin}
                        value={accessLevel}
                        onChange={(e) => setAccessLevel(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none disabled:opacity-60"
                      >
                        <option value="Standard">Standard User</option>
                        <option value="Elevated">Elevated Access</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Full Admin">Full Admin</option>
                      </select>
                    </div>

                    {/* Account Status */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Account Status *
                      </label>
                      <select
                        disabled={!isExecutingAdmin}
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none disabled:opacity-60"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="PENDING">Pending Approval</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        {userToEdit ? 'New Password (Leave blank to keep existing)' : 'Password *'}
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={userToEdit ? 'Leave blank to preserve password' : 'Min. 6 characters'}
                        className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border ${formErrors.password ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} text-slate-900 dark:text-white focus:border-orange-500 outline-none`}
                      />
                      {formErrors.password && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{formErrors.password}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border ${formErrors.confirmPassword ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} text-slate-900 dark:text-white focus:border-orange-500 outline-none`}
                      />
                      {formErrors.confirmPassword && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{formErrors.confirmPassword}</p>}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 4: PERMISSIONS MATRIX */}
              {activeFormTab === 'permissions' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Role-Based Security Permissions</h4>
                      <p className="text-[10px] text-slate-500">Fine-tune individual action permissions for this account profile</p>
                    </div>
                    {isExecutingAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          if (role) {
                            const mappedRole = (role === 'KITCHEN' ? UserRole.STAFF : role) as UserRole;
                            setPermissions(getDefaultPermissionsForRole(mappedRole));
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] hover:bg-slate-200 cursor-pointer"
                      >
                        Reset Role Defaults
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[9px]">
                          <th className="py-2.5">System Module</th>
                          <th className="py-2.5 text-center">View</th>
                          <th className="py-2.5 text-center">Create</th>
                          <th className="py-2.5 text-center">Edit</th>
                          <th className="py-2.5 text-center">Delete</th>
                          <th className="py-2.5 text-center">Export</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-semibold">
                        {Object.entries(permissions).map(([modKey, permObj]: [string, any]) => (
                          <tr key={modKey} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30">
                            <td className="py-2.5 capitalize font-bold text-slate-800 dark:text-slate-200">
                              {modKey.replace(/([A-Z])/g, ' $1')}
                            </td>
                            {(['view', 'create', 'edit', 'delete', 'export'] as (keyof ResourcePermission)[]).map(actKey => (
                              <td key={actKey} className="py-2.5 text-center">
                                <input
                                  type="checkbox"
                                  disabled={!isExecutingAdmin}
                                  checked={!!permObj[actKey]}
                                  onChange={() => togglePermissionCheckbox(modKey as keyof UserPermissions, actKey)}
                                  className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer disabled:opacity-50"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </form>

            {/* Modal Bottom Action Controls */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center space-x-2">
                {activeFormTab !== 'personal' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeFormTab === 'permissions') setActiveFormTab('account');
                      else if (activeFormTab === 'account') setActiveFormTab('org');
                      else if (activeFormTab === 'org') setActiveFormTab('personal');
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Previous Step
                  </button>
                )}
                {activeFormTab !== 'permissions' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeFormTab === 'personal') setActiveFormTab('org');
                      else if (activeFormTab === 'org') setActiveFormTab('account');
                      else if (activeFormTab === 'account') setActiveFormTab('permissions');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 cursor-pointer"
                  >
                    Next Step
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFormSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{userToEdit ? 'Save Changes' : 'Create User'}</span>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 6. CONFIRM DELETE ACCOUNT MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Delete User Account?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to remove <strong>"{userToDelete.name}"</strong>? This will remove access and cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-500/20 cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. RESET PASSWORD MODAL FOR ADMIN */}
      {userToResetPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Reset User Password</h3>
                  <p className="text-xs font-semibold text-slate-500">Account: <strong>{userToResetPass.name}</strong></p>
                </div>
              </div>
              <button
                onClick={() => setUserToResetPass(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={resetPasswordConfirm}
                  onChange={(e) => setResetPasswordConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToResetPass(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResettingPass}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-md shadow-purple-500/20 cursor-pointer disabled:opacity-50 flex items-center space-x-2"
                >
                  {isResettingPass ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
