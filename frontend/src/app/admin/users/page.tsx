'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth();

    const fetchData = async () => {
        try {
            const apiBase = window.location.origin.replace(':3000', ':54321');
            const headers = { 'x-user-email': currentUser?.email || '' };
            const [uRes, rRes] = await Promise.all([
                fetch(`${apiBase}/api/admin/users`, { headers }),
                fetch(`${apiBase}/api/admin/roles`, { headers })
            ]);
            setUsers(await uRes.json());
            setRoles(await rRes.json());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) fetchData();
    }, [currentUser]);

    const updateRole = async (userId: number, roleId: number) => {
        try {
            const apiBase = window.location.origin.replace(':3000', ':54321');
            const res = await fetch(`${apiBase}/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': currentUser?.email || ''
                },
                body: JSON.stringify({ roleId }),
            });
            if (res.ok) {
                fetchData();
                alert('User role updated');
            }
        } catch (err) {
            alert('Failed to update role');
        }
    };

    if (loading) return <div className="p-10 text-center font-bold">Loading Users...</div>;

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8 text-secondary">Manage Users & Roles</h1>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 text-sm font-bold text-gray-700">Name</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-700">Email</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-700">Current Role</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-700">Change Role</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y space-y-4">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-black text-xs">
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-bold text-secondary">{u.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 font-medium">{u.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${u.role?.name === 'SUPER_ADMIN' ? 'bg-red-100 text-red-600' :
                                        u.role?.name === 'MANAGER' ? 'bg-blue-100 text-blue-600' :
                                            u.role?.name === 'CUSTOMER' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-600'
                                        }`}>
                                        {u.role?.name}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={u.roleId}
                                            onChange={(e) => updateRole(u.id, parseInt(e.target.value))}
                                            className="border-2 border-gray-100 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-primary transition-all bg-white"
                                            disabled={u.email === currentUser?.email}
                                        >
                                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                        {u.email === currentUser?.email && (
                                            <span className="text-[10px] text-gray-400 font-bold italic">(You)</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
