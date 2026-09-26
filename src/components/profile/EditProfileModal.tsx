import React, { useState } from 'react';
import { User } from '../../types';
import { X, User as UserIcon, Mail, Phone, Building, Hash, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api/apiClient';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUpdated: (user: User) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdated
}) => {
  const isFaculty = currentUser?.role === 'FACULTY';

  const [name, setName] = useState(currentUser?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [department, setDepartment] = useState(currentUser?.department || (isFaculty ? 'Computer Science & Engineering' : 'Electronics and Communication'));
  const [rollNumber, setRollNumber] = useState(currentUser?.rollNumber || '24EC123');
  const [employeeId, setEmployeeId] = useState(currentUser?.employeeId || 'KGF123');
  const [designation, setDesignation] = useState(currentUser?.designation || 'Assistant Professor');
  const [hostelBlock, setHostelBlock] = useState(currentUser?.hostelBlock || 'Block A - Room 201');

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    setIsProcessing(true);

    try {
      const updates: Partial<User> = {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        department: department.trim(),
        ...(isFaculty ? { employeeId: employeeId.trim(), designation: designation.trim() } : { rollNumber: rollNumber.trim(), hostelBlock: hostelBlock.trim() })
      };

      const updatedUser = await api.updateUser(currentUser.id, updates);
      onUpdated(updatedUser);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update profile.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative space-y-5">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Edit Profile
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Update your account details below
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Email (Read Only)
            </label>
            <input
              type="email"
              disabled
              value={currentUser.email}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          {isFaculty ? (
            <>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Employee / Faculty ID
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Register / Roll Number
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Hostel / Block / Room
                </label>
                <input
                  type="text"
                  value={hostelBlock}
                  onChange={(e) => setHostelBlock(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer mt-4"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile Changes"}
          </button>

        </form>

      </div>
    </div>
  );
};
