import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2, Filter, Layers } from "lucide-react";
import api from "../../../lib/axios";

const SubProcessList = () => {
    const [subProcesses, setSubProcesses] = useState([]);
    const [processTemplates, setProcessTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [filterParent, setFilterParent] = useState("");
    const [formData, setFormData] = useState({
        parent_process_template_id: "",
        name: "",
        description: "",
        is_active: true,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [subRes, templatesRes] = await Promise.all([
                api.get("/sub-processes"),
                api.get("/process-templates"),
            ]);
            setSubProcesses(subRes.data.data || []);
            // Only show SEWING (id:3) and FINISHING (id:4) as parent options
            const filtered = (
                templatesRes.data.data ||
                templatesRes.data ||
                []
            ).filter((t) =>
                ["SEWING", "FINISHING"].includes(t.name.toUpperCase())
            );
            setProcessTemplates(filtered);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await api.put(`/sub-processes/${editingItem.id}`, formData);
            } else {
                await api.post("/sub-processes", formData);
            }
            fetchData();
            closeModal();
        } catch (err) {
            console.error("Error saving:", err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Hapus sub-proses ini?")) return;
        try {
            await api.delete(`/sub-processes/${id}`);
            fetchData();
        } catch (err) {
            console.error("Error deleting:", err);
        }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                parent_process_template_id: item.parent_process_template_id,
                name: item.name,
                description: item.description || "",
                is_active: item.is_active,
            });
        } else {
            setEditingItem(null);
            setFormData({
                parent_process_template_id: processTemplates[0]?.id || "",
                name: "",
                description: "",
                is_active: true,
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
    };

    const filteredList = filterParent
        ? subProcesses.filter(
              (sp) => sp.parent_process_template_id == filterParent
          )
        : subProcesses;

    const getParentName = (id) => {
        const template = processTemplates.find((t) => t.id === id);
        return template?.name || "Unknown";
    };

    const getParentColor = (name) => {
        const upper = name?.toUpperCase();
        if (upper === "SEWING") return "bg-teal-100 text-teal-700";
        if (upper === "FINISHING") return "bg-purple-100 text-purple-700";
        return "bg-slate-100 text-slate-700";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Sub-Proses
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Kelola sub-proses untuk Sewing dan Finishing
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    <Plus size={20} />
                    Tambah Sub-Proses
                </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-slate-600">
                    <Filter size={18} />
                    <span className="text-sm font-medium">Filter:</span>
                </div>
                <select
                    value={filterParent}
                    onChange={(e) => setFilterParent(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">Semua Proses</option>
                    {processTemplates.map((pt) => (
                        <option key={pt.id} value={pt.id}>
                            {pt.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Nama Sub-Proses
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Parent Proses
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Deskripsi
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredList.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="5"
                                    className="px-6 py-12 text-center text-slate-500"
                                >
                                    <Layers
                                        size={48}
                                        className="mx-auto mb-3 opacity-30"
                                    />
                                    <p>Belum ada sub-proses</p>
                                </td>
                            </tr>
                        ) : (
                            filteredList.map((sp) => (
                                <tr
                                    key={sp.id}
                                    className="hover:bg-slate-50 transition-colors"
                                >
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {sp.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 py-1 rounded-md text-xs font-bold ${getParentColor(
                                                sp.parent_process_template?.name
                                            )}`}
                                        >
                                            {sp.parent_process_template?.name ||
                                                getParentName(
                                                    sp.parent_process_template_id
                                                )}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        {sp.description || "-"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 py-1 rounded-md text-xs font-bold ${
                                                sp.is_active
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                        >
                                            {sp.is_active
                                                ? "Aktif"
                                                : "Nonaktif"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => openModal(sp)}
                                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(sp.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">
                            {editingItem
                                ? "Edit Sub-Proses"
                                : "Tambah Sub-Proses"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Parent Proses
                                </label>
                                <select
                                    value={formData.parent_process_template_id}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            parent_process_template_id:
                                                e.target.value,
                                        })
                                    }
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Pilih Proses</option>
                                    {processTemplates.map((pt) => (
                                        <option key={pt.id} value={pt.id}>
                                            {pt.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nama Sub-Proses
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            name: e.target.value,
                                        })
                                    }
                                    required
                                    placeholder="Contoh: Jahit Kerah"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Deskripsi (Opsional)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description: e.target.value,
                                        })
                                    }
                                    rows="2"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            is_active: e.target.checked,
                                        })
                                    }
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                />
                                <label
                                    htmlFor="is_active"
                                    className="text-sm text-slate-700"
                                >
                                    Aktif
                                </label>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubProcessList;
