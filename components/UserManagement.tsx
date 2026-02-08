import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Mail, Lock, Trash2, RefreshCw, AlertCircle, CheckCircle, Loader2, Search } from 'lucide-react';
import { Button } from './Button';
import { dbService } from '../services/database';
import { User, Role } from '../types';
import { CreateUserModal } from './CreateUserModal';
import { useApp } from '../src/contexts/AppContext';

export const UserManagement: React.FC = () => {
    const { users: { users: userList, loading, error, fetchUsers, updateUserRole, deleteUser } } = useApp();
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [usersMessage, setUsersMessage] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState<{ uid: string, name: string } | null>(null);

    useEffect(() => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            setFilteredUsers(
                userList.filter((u: User) =>
                    u.name?.toLowerCase().includes(query) ||
                    u.email?.toLowerCase().includes(query) ||
                    u.role?.toLowerCase().includes(query)
                )
            );
        } else {
            setFilteredUsers(userList);
        }
    }, [searchQuery, userList]);

    const handleChangeRole = async (uid: string, role: Role) => {
        await updateUserRole(uid, role);
        setUsersMessage(`Role updated to ${role} successfully.`);
        setTimeout(() => setUsersMessage(''), 3000);
    };

    const handleUserCreated = async () => {
        setUsersMessage('User created successfully!');
        await fetchUsers();
        setTimeout(() => setUsersMessage(''), 3000);
    };

    const handleResetPassword = async (email: string) => {
        try {
            await dbService.requestPasswordReset(email);
            setUsersMessage(`Password reset email sent to ${email}`);
        } catch (e: any) {
            setUsersMessage(e?.message || 'Failed to send reset email.');
        }
        setTimeout(() => setUsersMessage(''), 3000);
    };

    const handleRemoveUser = (uid: string, userName: string) => {
        setDeleteConfirm({ uid, name: userName });
    };

    const handleConfirmDeleteUser = async () => {
        if (!deleteConfirm) return;
        await deleteUser(deleteConfirm.uid);
        setUsersMessage(`User ${deleteConfirm.name} removed successfully.`);
        setDeleteConfirm(null);
        setTimeout(() => setUsersMessage(''), 3000);
    };

    const getRoleStats = () => {
        return {
            total: userList.length,
            admins: userList.filter((u: User) => u.role === 'admin').length,
            editors: userList.filter((u: User) => u.role === 'editor').length,
            users: userList.filter((u: User) => u.role === 'user').length,
        };
    };

    const stats = getRoleStats();

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onUserCreated={handleUserCreated}
            />
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage user accounts, roles, and permissions</p>
                </div>
                <Button onClick={fetchUsers} disabled={loading} className="gap-2" variant="outline">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Refresh
                </Button>
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 ml-3">
                    <UserPlus size={16} />
                    Create User
                </Button>
            </div>

            {/* Stats Cards */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Total Users</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                            </div>
                            <Users className="text-slate-400" size={32} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-purple-200 dark:border-purple-800 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-600 dark:text-purple-400">Admins</p>
                                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.admins}</p>
                            </div>
                            <Shield className="text-purple-500" size={32} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 dark:text-blue-400">Editors</p>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.editors}</p>
                            </div>
                            <Users className="text-blue-500" size={32} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Regular Users</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.users}</p>
                            </div>
                            <Users className="text-slate-400" size={32} />
                        </div>
                    </div>
                </div>
            )}

            {/* Status Message */}
            {(loading || error || usersMessage) && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${error ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300' :
                    loading ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300' :
                        'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
                    }`}>
                    {error ? <AlertCircle size={20} /> : loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                    <div>
                        <p className="font-bold text-sm">{loading ? 'Loading...' : error ? 'Error' : 'Success'}</p>
                        <p className="text-sm">{error || usersMessage || 'Operation in progress...'}</p>
                    </div>
                </div>
            )}



            {/* User List */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Users size={18} className="text-amber-500" />
                        All Users ({filteredUsers.length})
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            placeholder="Search users..."
                            className="pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white w-64 focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                </div>

                {filteredUsers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3">Wishlist Items</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredUsers.map((u: User) => (
                                    <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{u.name || 'N/A'}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} className="text-slate-400" />
                                                {u.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={u.role}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChangeRole(u.uid, e.target.value as Role)}
                                                className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-amber-500"
                                            >
                                                <option value="user">User</option>
                                                <option value="editor">Editor</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                            {u.wishlist?.length || 0} items
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleResetPassword(u.email)}
                                                    className="gap-1 text-xs"
                                                >
                                                    <Lock size={14} />
                                                    Reset Password
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleRemoveUser(u.uid, u.name || u.email)}
                                                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1 text-xs"
                                                >
                                                    <Trash2 size={14} />
                                                    Remove
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-500">
                        {userList.length === 0 ? (
                            <div className="flex flex-col items-center gap-4">
                                <Users size={48} className="text-slate-200 dark:text-slate-800" />
                                <p>No users found. Click "Refresh" to load users from the database.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <Search size={48} className="text-slate-200 dark:text-slate-800" />
                                <p>No users match your search query "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Custom Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <AlertCircle size={24} />
                            <h3 className="text-xl font-bold">Delete User?</h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-8">
                            Are you sure you want to remove <strong>{deleteConfirm.name}</strong>? This action will permanently delete their account and data.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                            <Button onClick={handleConfirmDeleteUser} className="bg-red-600 hover:bg-red-700 text-white border-none">Remove User</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
