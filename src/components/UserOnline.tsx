import React, { useState, useEffect } from 'react';
import { FaSignOutAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { API_User_Online_Admin, API_User_Logout_Admin } from '../api/api';

export interface User {
    id: string;
    token: string;
    username: string;
    name: string;
    role: string;
    last_login: string;
    last_update: string;
}

const UserOnline: React.FC = () => {
    const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    // Get current user's username for highlighting
    const currentUsername = localStorage.getItem('username');

    const fetchOnlineUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Authentication token not found');
                return;
            }

            const response = await fetch(API_User_Online_Admin(), {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch online users');
            }

            const result = await response.json();
            console.log('Online users response:', result); // Debug log

            if (result.success && Array.isArray(result.data)) {
                // Transform the data to match User interface if needed
                const transformedUsers: User[] = result.data.map((user: any) => ({
                    id: user.id,
                    token: user.id, // Use ID as token if token isn't provided
                    username: user.username,
                    name: user.name,
                    role: user.role,
                    last_login: user.last_login,
                    last_update: user.last_update || '-',
                }));
                
                setOnlineUsers(transformedUsers);
            } else {
                console.warn('No online users data found or invalid format');
                setOnlineUsers([]);
            }
        } catch (error) {
            console.error('Error fetching online users:', error);
            toast.error('Failed to fetch online users');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoutUser = async (token_id: string) => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Authentication token not found');
                return;
            }

            const response = await fetch(`${API_User_Logout_Admin()}/${token_id}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to logout user');
            }

            const result = await response.json();
            
            if (result.success) {
                toast.success('User logged out successfully');
                fetchOnlineUsers(); // Refresh the user list
            } else {
                toast.error(result.message || 'Failed to logout user');
            }
        } catch (error) {
            console.error('Error logging out user:', error);
            toast.error('Failed to logout user');
        }
    };

    const getRoleName = (role: string): string => {
        switch (role.toLowerCase()) {
            case 'super_admin':
                return 'Super Admin';
            case 'admin':
                return 'Admin';
            case 'finance':
                return 'Finance';
            case 'supplier':
                return 'Supplier';
            default:
                return role;
        }
    };

    useEffect(() => {
        fetchOnlineUsers();
        
        // Set up interval to refresh the list every minute
        const interval = setInterval(fetchOnlineUsers, 60000);
        
        // Clear interval on unmount
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black mb-6 text-left">User Online</h2>
            <div className="relative overflow-hidden shadow-md rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600 border uppercase tracking-wider text-center">Username</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600 border uppercase tracking-wider text-center">Name</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600 border uppercase tracking-wider text-center">User Role</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600 border uppercase tracking-wider text-center">Logged In At</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600 border uppercase tracking-wider text-center">Updated At</th>
                            <th className="px-6 py-4 text-center">
                                <span className="sr-only">Action</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                    Loading users...
                                </td>
                            </tr>
                        ) : onlineUsers.length > 0 ? (
                            onlineUsers.map((user) => (
                                <tr 
                                    key={user.token} 
                                    className={`hover:bg-gray-50 ${
                                        user.username === currentUsername ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-800 text-center">{user.username}</td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-800 text-center">{user.name}</td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-800 text-center">{getRoleName(user.role)}</td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-800 text-center">{user.last_login}</td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-800 text-center">{user.last_update}</td>
                                    <td className="px-6 py-3 whitespace-nowrap text-center">
                                        <button
                                            onClick={() => handleLogoutUser(user.id)}
                                            className="text-red-600 hover:text-red-700 inline-flex items-center justify-center"
                                            title="Logout User"
                                        >
                                            <FaSignOutAlt size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                    No online users
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserOnline;