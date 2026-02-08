import { useState, useEffect, useCallback } from 'react';
import { User, Role } from '../../types';
import { dbService } from '../../services/database';

export const useUsers = (currentUserRole?: Role) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        // Only admins should fetch users
        if (currentUserRole !== 'admin') {
            setUsers([]);
            return;
        }

        setLoading(true);
        try {
            const data = await dbService.getAllUsers();
            setUsers(data);
            setError(null);
        } catch (err: any) {
            console.error("Error fetching users:", err);
            setError(err.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    }, [currentUserRole]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const updateUserRole = async (uid: string, newRole: Role) => {
        try {
            // Optimistic update
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
            await dbService.updateUserRole(uid, newRole);
        } catch (err: any) {
            console.error("Error updating user role:", err);
            setError(err.message || 'Failed to update role');
            fetchUsers(); // Revert on error
        }
    };

    const deleteUser = async (uid: string) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            // Optimistic update
            setUsers(prev => prev.filter(u => u.uid !== uid));
            await dbService.deleteUser(uid);
        } catch (err: any) {
            console.error("Error deleting user:", err);
            setError(err.message || 'Failed to delete user');
            fetchUsers(); // Revert
        }
    };

    return {
        users,
        loading,
        error,
        fetchUsers,
        updateUserRole,
        deleteUser
    };
};
