import { db } from '../../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User, UserRole } from '../../../../shared/types/index.js';

export class AuthService {
  static async getUserProfile(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }
      return null;
    } catch (e) {
      console.error('Error fetching user profile:', e);
      return null;
    }
  }

  static async createUserProfile(user: User): Promise<void> {
    await setDoc(doc(db, 'users', user.id), {
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      role: user.role || UserRole.STUDENT,
      rewardPoints: user.rewardPoints || 0,
      favorites: user.favorites || [],
      createdAt: Date.now()
    }, { merge: true });
  }
}
