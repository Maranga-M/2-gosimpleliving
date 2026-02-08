import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Save, AlertCircle } from 'lucide-react';
import { AffiliateNetwork } from '../types';
import { Button } from './Button';
import toast from 'react-hot-toast';

interface AffiliateNetworkManagerProps {
    networks: AffiliateNetwork[];
    onChange: (networks: AffiliateNetwork[]) => void;
}

export const AffiliateNetworkManager: React.FC<AffiliateNetworkManagerProps> = ({ networks, onChange }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNetwork, setEditingNetwork] = useState<AffiliateNetwork | null>(null);
    const [formData, setFormData] = useState<Partial<AffiliateNetwork>>({
        name: '',
        enabled: true,
        publisherId: '',
        websiteId: '',
        linkTemplate: '',
        subId: ''
    });

    const handleAdd = () => {
        setEditingNetwork(null);
        setFormData({
            name: '',
            enabled: true,
            publisherId: '',
            websiteId: '',
            linkTemplate: '',
            subId: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (network: AffiliateNetwork) => {
        setEditingNetwork(network);
        setFormData(network);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formData.name?.trim()) {
            toast.error('Network name is required');
            return;
        }

        const newNetwork: AffiliateNetwork = {
            id: editingNetwork?.id || `network-${Date.now()}`,
            name: formData.name,
            enabled: formData.enabled ?? true,
            publisherId: formData.publisherId,
            websiteId: formData.websiteId,
            apiKey: formData.apiKey,
            linkTemplate: formData.linkTemplate,
            subId: formData.subId,
            customParams: formData.customParams,
            createdAt: editingNetwork?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (editingNetwork) {
            // Update existing
            onChange(networks.map(n => n.id === editingNetwork.id ? newNetwork : n));
            toast.success('Network updated successfully');
        } else {
            // Add new
            onChange([...networks, newNetwork]);
            toast.success('Network added successfully');
        }

        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this affiliate network?')) {
            onChange(networks.filter(n => n.id !== id));
            toast.success('Network deleted');
        }
    };

    const handleToggle = (id: string) => {
        onChange(networks.map(n =>
            n.id === id ? { ...n, enabled: !n.enabled } : n
        ));
    };

    return (
        <div className="space-y-4">
            {/* Network List */}
            <div className="space-y-3">
                {networks.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <AlertCircle size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            No affiliate networks configured yet
                        </p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                            Click "Add Network" to get started
                        </p>
                    </div>
                ) : (
                    networks.map(network => (
                        <div
                            key={network.id}
                            className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={network.enabled}
                                        onChange={() => handleToggle(network.id)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-600"></div>
                                </label>

                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900 dark:text-white">
                                        {network.name}
                                    </h4>
                                    <div className="flex gap-4 mt-1">
                                        {network.publisherId && (
                                            <span className="text-xs text-slate-500">
                                                Publisher ID: {network.publisherId}
                                            </span>
                                        )}
                                        {network.websiteId && (
                                            <span className="text-xs text-slate-500">
                                                Website ID: {network.websiteId}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded ${network.enabled
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                        }`}>
                                        {network.enabled ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={() => handleEdit(network)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(network.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Button */}
            <Button onClick={handleAdd} variant="outline" className="w-full gap-2">
                <Plus size={18} />
                Add Affiliate Network
            </Button>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {editingNetwork ? 'Edit' : 'Add'} Affiliate Network
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Network Name */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Network Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., ShareASale, Impact, Rakuten"
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                                />
                            </div>

                            {/* Publisher ID */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Publisher ID
                                </label>
                                <input
                                    type="text"
                                    value={formData.publisherId || ''}
                                    onChange={(e) => setFormData({ ...formData, publisherId: e.target.value })}
                                    placeholder="Your publisher/affiliate ID"
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                                />
                            </div>

                            {/* Website ID */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Website ID <span className="text-xs font-normal text-slate-500">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.websiteId || ''}
                                    onChange={(e) => setFormData({ ...formData, websiteId: e.target.value })}
                                    placeholder="Website or property ID"
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                                />
                            </div>

                            {/* Link Template */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Link Template
                                </label>
                                <textarea
                                    value={formData.linkTemplate || ''}
                                    onChange={(e) => setFormData({ ...formData, linkTemplate: e.target.value })}
                                    placeholder="https://example.com/track?url={productUrl}&id={publisherId}"
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white font-mono h-24"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Use {'{productUrl}'}, {'{publisherId}'}, {'{websiteId}'} as placeholders
                                </p>
                            </div>

                            {/* Sub ID */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Sub ID <span className="text-xs font-normal text-slate-500">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.subId || ''}
                                    onChange={(e) => setFormData({ ...formData, subId: e.target.value })}
                                    placeholder="Tracking sub-ID"
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                                />
                            </div>

                            {/* Enabled Toggle */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <div>
                                    <p className="font-semibold text-sm text-slate-800 dark:text-white">Enable Network</p>
                                    <p className="text-xs text-slate-500">Activate this network for affiliate links</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.enabled ?? true}
                                        onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-600"></div>
                                </label>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6 flex gap-3 justify-end">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} className="gap-2">
                                <Save size={18} />
                                {editingNetwork ? 'Update' : 'Add'} Network
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
