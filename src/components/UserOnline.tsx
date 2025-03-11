import React from 'react';
import { FaSignOutAlt } from 'react-icons/fa';

export interface User {
    id: string;
    token: string;
    username: string;
    name: string;
    role: string;
    last_login: string;
    last_update: string;
}

interface UserOnlineProps {
    onlineUsers: User[];
    handleLogoutUser: (token_id: string) => void;
    getRoleName: (role: string) => string;
}

const UserOnline: React.FC<UserOnlineProps> = ({ onlineUsers, handleLogoutUser, getRoleName }) => (
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
                    {onlineUsers.length > 0 ? (
                        onlineUsers.map((user) => (
                        <tr key={user.token} className="hover:bg-gray-50">
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

export default UserOnline;