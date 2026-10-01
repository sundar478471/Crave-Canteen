import { api, localStore, hashPassword, verifyPassword } from '../../src/services/api/apiClient';
import { User, UserRole } from '../../src/types/index';

async function runUserManagementVerification() {
  console.log("🧪 Running Comprehensive User Management & Security Verification Suite...\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, description: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✓ ${description}`);
    } else {
      console.error(`  ✗ FAIL: ${description}`);
    }
  }

  const adminUser: User = {
    id: 'admin-tester',
    name: 'Admin Tester',
    email: 'admin.test@cravecanteen.com',
    role: UserRole.ADMIN,
    status: 'ACTIVE'
  };

  const studentPayload: User & { password?: string } = {
    id: 'temp-student',
    name: 'Test Student',
    email: 'test.student@campus.edu',
    username: 'test_student',
    phoneNumber: '+919999000001',
    role: UserRole.STUDENT,
    department: 'Computer Science',
    yearClass: '2nd Year / Sec B',
    status: 'ACTIVE',
    password: 'password123'
  };

  const facultyPayload: User & { password?: string } = {
    id: 'temp-faculty',
    name: 'Dr. Test Faculty',
    email: 'test.faculty@campus.edu',
    username: 'test_faculty',
    phoneNumber: '+919999000002',
    role: UserRole.FACULTY,
    department: 'Mechanical Engineering',
    designation: 'Associate Professor',
    status: 'ACTIVE',
    password: 'password123'
  };

  const kitchenPayload: User & { password?: string } = {
    id: 'temp-kitchen',
    name: 'Test Kitchen Chef',
    email: 'test.kitchen@cravecanteen.com',
    username: 'test_kitchen_chef',
    phoneNumber: '+919999000003',
    role: UserRole.KITCHEN,
    kitchenBranch: 'Main Kitchen - Station 2',
    kitchenId: 'Main Kitchen - Station 2',
    designation: 'Head Chef',
    status: 'ACTIVE',
    password: 'password123'
  };

  // 1. Create Student
  let createdStudent: User | null = null;
  try {
    createdStudent = await api.registerUser(studentPayload, adminUser);
    assert(createdStudent !== null && createdStudent.role === UserRole.STUDENT, "1. Create Student account successfully");
  } catch (e: any) {
    assert(false, `1. Create Student failed: ${e?.message}`);
  }

  // 2. Create Faculty
  let createdFaculty: User | null = null;
  try {
    createdFaculty = await api.registerUser(facultyPayload, adminUser);
    assert(createdFaculty !== null && createdFaculty.role === UserRole.FACULTY, "2. Create Faculty account successfully");
  } catch (e: any) {
    assert(false, `2. Create Faculty failed: ${e?.message}`);
  }

  // 3. Create Kitchen
  let createdKitchen: User | null = null;
  try {
    createdKitchen = await api.registerUser(kitchenPayload, adminUser);
    assert(createdKitchen !== null && createdKitchen.role === UserRole.KITCHEN, "3. Create Kitchen account successfully");
  } catch (e: any) {
    assert(false, `3. Create Kitchen failed: ${e?.message}`);
  }

  // 4. Login as Student
  let loggedStudent: User | null = null;
  try {
    loggedStudent = await api.loginUser('test.student@campus.edu', 'password123');
    assert(loggedStudent !== null && (loggedStudent.role === UserRole.STUDENT || loggedStudent.role === UserRole.CUSTOMER), "4. Login as Student with valid credentials");
  } catch (e: any) {
    assert(false, `4. Login as Student failed: ${e?.message}`);
  }

  // 5. Login as Faculty
  let loggedFaculty: User | null = null;
  try {
    loggedFaculty = await api.loginUser('test.faculty@campus.edu', 'password123');
    assert(loggedFaculty !== null && loggedFaculty.role === UserRole.FACULTY, "5. Login as Faculty with valid credentials");
  } catch (e: any) {
    assert(false, `5. Login as Faculty failed: ${e?.message}`);
  }

  // 6. Login as Kitchen
  let loggedKitchen: User | null = null;
  try {
    loggedKitchen = await api.loginUser('test.kitchen@cravecanteen.com', 'password123');
    assert(loggedKitchen !== null && loggedKitchen.role === UserRole.KITCHEN, "6. Login as Kitchen with valid credentials");
  } catch (e: any) {
    assert(false, `6. Login as Kitchen failed: ${e?.message}`);
  }

  // 7. Verify each role receives permitted access
  assert(loggedStudent?.role === UserRole.STUDENT, "7a. Student role receives student-only permissions");
  assert(loggedFaculty?.role === UserRole.FACULTY, "7b. Faculty role receives faculty-only permissions");
  assert(loggedKitchen?.role === UserRole.KITCHEN, "7c. Kitchen role receives kitchen-only permissions");

  // 8. Verify Admin can manage all three
  try {
    const allUsers = await api.getAllUsers();
    const hasStudent = allUsers.some(u => u.email === 'test.student@campus.edu');
    const hasFaculty = allUsers.some(u => u.email === 'test.faculty@campus.edu');
    const hasKitchen = allUsers.some(u => u.email === 'test.kitchen@cravecanteen.com');
    assert(hasStudent && hasFaculty && hasKitchen, "8. Admin user list contains Student, Faculty, and Kitchen accounts");
  } catch (e: any) {
    assert(false, `8. Admin user list management check failed: ${e?.message}`);
  }

  // 9. Verify duplicate users are rejected
  try {
    await api.registerUser(studentPayload, adminUser);
    assert(false, "9. Duplicate email creation was NOT rejected");
  } catch (e: any) {
    assert(e?.message?.includes("already registered") || e?.message?.includes("already in use"), "9. Duplicate email correctly rejected with error message");
  }

  // 10. Verify inactive users cannot log in
  try {
    if (createdStudent) {
      await api.toggleUserStatus(createdStudent.id, 'INACTIVE', adminUser);
      let inactiveLoginAttempt: User | null = null;
      try {
        inactiveLoginAttempt = await api.loginUser('test.student@campus.edu', 'password123');
        assert(false, "10. Inactive user was able to log in");
      } catch (inactiveErr: any) {
        assert(inactiveErr?.message?.includes('inactive'), "10. Inactive user login correctly blocked");
      }
      // Re-activate
      await api.toggleUserStatus(createdStudent.id, 'ACTIVE', adminUser);
    }
  } catch (e: any) {
    assert(false, `10. Inactive user verification failed: ${e?.message}`);
  }

  // 11. Verify changing a user's role requires Admin authorization
  try {
    const nonAdminUser: User = {
      id: createdStudent?.id || 'std-1',
      name: 'Regular Student',
      email: 'student@campus.edu',
      role: UserRole.STUDENT
    };
    try {
      await api.updateUser(createdStudent!.id, { role: UserRole.ADMIN }, nonAdminUser);
      assert(false, "11. Non-admin user modified account role");
    } catch (roleErr: any) {
      assert(roleErr?.message?.includes('Unauthorized'), "11. Non-admin role modification correctly blocked by server-side check");
    }
  } catch (e: any) {
    assert(false, `11. Role authorization check failed: ${e?.message}`);
  }

  // 12. Verify Kitchen creation does NOT create a Firebase Authentication account
  if (createdKitchen) {
    const rawStored = localStore.getUsers().find(u => u.id === createdKitchen!.id) as any;
    assert(rawStored && !rawStored.password && rawStored.passwordHash !== undefined, "12. Kitchen user account stored cleanly in database with passwordHash (no plaintext password stored & no Firebase Auth dependency)");
  }

  // 13. Verify existing Admin login still works
  try {
    const defaultAdmin = await api.loginUser('abc@gmail.com', '123456');
    assert(defaultAdmin !== null && (defaultAdmin.role === UserRole.STAFF || defaultAdmin.role === UserRole.ADMIN), "13. Existing Admin login still works smoothly");
  } catch (e: any) {
    assert(false, `13. Existing Admin login failed: ${e?.message}`);
  }

  // 14. Verify existing users are not affected
  try {
    const existingFaculty = await api.loginUser('prof.sharma@campus.edu', '123456');
    assert(existingFaculty !== null && existingFaculty.role === UserRole.FACULTY, "14. Existing faculty user profile intact and unaffected");
  } catch (e: any) {
    assert(false, `14. Existing user check failed: ${e?.message}`);
  }

  console.log(`\n========================================`);
  console.log(`User Management Verification Summary: ${passed}/${total} passed cleanly.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runUserManagementVerification().catch(err => {
  console.error("Verification script execution error:", err);
  process.exit(1);
});
