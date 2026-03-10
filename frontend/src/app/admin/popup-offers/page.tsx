'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE } from '@/lib/api';

interface PopupOffer {
    id: number;
    title: string;
    description: string;
    image?: string;
    link?: string;
    isActive: boolean;
    createdAt: string;
}

export default function PopupOffersPage() {
    const { user } = useAuth();
    const [popups, setPopups] = useState<PopupOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image: '',
        link: '',
        isActive: true
    });

    useEffect(() => {
        fetchPopups();
    }, []);

    const fetchPopups = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/promotions/popup`, {
                headers: { 'x-user-email': user?.email || '' }
            });
            const data = await res.json();
            setPopups(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch popups:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const url = editingId 
                ? `${API_BASE}/api/promotions/popup/${editingId}`
                : `${API_BASE}/api/promotions/popup`;
            const method = editingId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user?.email || ''
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: editingId ? 'Popup updated!' : 'Popup created!' });
                setShowForm(false);
                setEditingId(null);
                resetForm();
                fetchPopups();
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to save popup' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save popup' });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (popup: PopupOffer) => {
        setFormData({
            title: popup.title,
            description: popup.description,
            image: popup.image || '',
            link: popup.link || '',
            isActive: popup.isActive
        });
        setEditingId(popup.id);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this popup?')) return;

        try {
            const res = await fetch(`${API_BASE}/api/promotions/popup/${id}`, {
                method: 'DELETE',
                headers: { 'x-user-email': user?.email || '' }
            });

            if (res.ok) {
                setPopups(popups.filter(p => p.id !== id));
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete popup');
            }
        } catch (err) {
            alert('Failed to delete popup');
        }
    };

    const toggleActive = async (popup: PopupOffer) => {
        try {
            const res = await fetch(`${API_BASE}/api/promotions/popup/${popup.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user?.email || ''
                },
                body: JSON.stringify({ isActive: !popup.isActive })
            });

            if (res.ok) {
                setPopups(popups.map(p => 
                    p.id === popup.id ? { ...p, isActive: !p.isActive } : p
                ));
            }
        } catch (err) {
            console.error('Failed to toggle popup status:', err);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            image: '',
            link: '',
            isActive: true
        });
    };

    if (loading) return <div className="p-10 text-center text-secondary font-bold">Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-secondary">Popup Offers</h1>
                <button
                    onClick={() => { resetForm(); setEditingId(null); setShowForm(true); }}
                    className="bg-primary text-black px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/40 hover:bg-orange-600 transition-all"
                >
                    + Add New Popup
                </button>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {showForm && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <h2 className="text-xl font-bold mb-6">{editingId ? 'Edit Popup' : 'Create New Popup'}</h2>
                    <form onSubmit={handleSubmit} className="grid gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                rows={3}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Image URL (optional)</label>
                            <input
                                type="text"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Link URL (optional)</label>
                            <input
                                type="text"
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-5 h-5"
                            />
                            <label htmlFor="isActive" className="text-sm font-bold text-gray-700">Active</label>
                        </div>
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-primary text-black px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : editingId ? 'Update Popup' : 'Create Popup'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }}
                                className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 text-sm font-bold text-gray-700">Title</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-700">Status</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-700">Created</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {popups.map((popup) => (
                            <tr key={popup.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-secondary">{popup.title}</div>
                                    <div className="text-xs text-gray-400 truncate max-w-xs">{popup.description}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => toggleActive(popup)}
                                        className={`px-3 py-1 rounded-lg text-[10px] font-bold ${popup.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                                    >
                                        {popup.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(popup.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => handleEdit(popup)}
                                            className="bg-blue-600 text-black px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all border-2 border-white/10"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(popup.id)}
                                            className="bg-red-500 text-black px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all border-2 border-white/10"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {popups.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No popup offers yet. Click "Add New Popup" to create one.
                    </div>
                )}
            </div>
        </div>
    );
}
