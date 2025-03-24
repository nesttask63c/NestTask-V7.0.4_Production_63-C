import { useState } from 'react';
import { Trash2, AlertTriangle, Search } from 'lucide-react';
import { User } from '../../types/auth';

interface UserListProps {
  users: User[];
  onDeleteUser: (userId: string) => Promise<void>;
}

export function UserList({ users, onDeleteUser }: UserListProps) {
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setShowConfirmation(true);
    setError(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    
    try {
      setDeletingUserId(selectedUser.id);
      setError(null);
      await onDeleteUser(selectedUser.id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
      setShowConfirmation(false);
      setSelectedUser(null);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-lg">
        {/* Search Bar */}
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-all duration-200"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Desktop view */}
        <div className="hidden md:block">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-750">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteClick(user)}
                      disabled={deletingUserId === user.id || user.role === 'admin'}
                      className={`text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors ${
                        deletingUserId === user.id ? 'opacity-50 cursor-not-allowed' : ''
                      } ${user.role === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile view */}
        <div className="block md:hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-4 space-y-2 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.email}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteClick(user)}
                    disabled={deletingUserId === user.id || user.role === 'admin'}
                    className={`text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-sm ${
                      deletingUserId === user.id ? 'opacity-50 cursor-not-allowed' : ''
                    } ${user.role === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' 
                      : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  }`}>
                    {user.role}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* No Results Message */}
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No users found matching your search.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedUser && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-40" 
            onClick={() => setShowConfirmation(false)} 
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl z-50 w-full max-w-md border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Confirm User Deletion</h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete the user <span className="font-medium text-gray-900 dark:text-white">{selectedUser.email}</span>? 
              This action cannot be undone.
            </p>

            {error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingUserId === selectedUser.id}
                className={`px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${
                  deletingUserId === selectedUser.id ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {deletingUserId === selectedUser.id ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}