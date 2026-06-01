import React, { useState, useEffect } from "react";
import {
    Search,
    Plus,
    Calendar,
    Clock,
    Trash2,
    Edit,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Filter,
    Image,
    Printer,
    AlertCircle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { orderService } from "../../../services/orderService";
import { getColorBlockInlineStyle } from "../../../lib/colorblock";

const OrderList = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchVal, setSearchVal] = useState(searchParams.get("search") || "");
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortField, setSortField] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("desc");
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });

    useEffect(() => {
        const queryParam = searchParams.get("search") || "";
        if (queryParam !== searchVal) {
            setSearchVal(queryParam);
            setSearchQuery(queryParam);
        }
    }, [searchParams]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchQuery(searchVal);
            setSearchParams(prev => {
                if (searchVal) {
                    prev.set("search", searchVal);
                } else {
                    prev.delete("search");
                }
                return prev;
            });
        }, 300);
        return () => clearTimeout(handler);
    }, [searchVal]);

    useEffect(() => {
        fetchOrders(1);
    }, [searchQuery, statusFilter, sortField, sortOrder]);

    const fetchOrders = async (page = 1) => {
        setLoading(true);
        setError("");
        try {
            const params = {
                page,
                per_page: 20,
                search: searchQuery,
                status: statusFilter !== "all" ? statusFilter : undefined,
                sort_field: sortField,
                sort_order: sortOrder,
            };
            const response = await orderService.getAll(params);
            const responseData = response.data || {};

            const finalOrders = responseData.data || [];
            setOrders(Array.isArray(finalOrders) ? finalOrders : []);
            setPagination({
                current_page: responseData.current_page || 1,
                last_page: responseData.last_page || 1,
                total: responseData.total || 0,
            });
        } catch (err) {
            console.error("Failed to fetch orders", err);
            setError("Failed to load orders. Please try again.");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOrder = async (id) => {
        if (!window.confirm("Are you sure you want to delete this order?"))
            return;
        try {
            await orderService.delete(id);
            fetchOrders(pagination.current_page);
        } catch (err) {
            alert("Failed to delete order");
        }
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const SortIcon = ({ field }) => (
        <ArrowUpDown
            size={12}
            className={cn(
                "transition-all duration-300 ml-1.5",
                sortField === field
                    ? "opacity-100 text-primary"
                    : "opacity-0 group-hover:opacity-50"
            )}
        />
    );

    function cn(...inputs) {
        return inputs.filter(Boolean).join(" ");
    }

    const getStatusStyle = (status) => {
        switch (status) {
            case "pending":
                return "bg-amber-50 text-amber-600 border border-amber-100";
            case "processing":
                return "bg-indigo-50 text-indigo-600 border border-indigo-100";
            case "cutting":
                return "bg-sky-50 text-sky-600 border border-sky-100";
            case "sewing":
                return "bg-blue-50 text-blue-600 border border-blue-100";
            case "sablon":
                return "bg-violet-50 text-violet-600 border border-violet-100";
            case "finishing":
                return "bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100";
            case "packing":
                return "bg-rose-50 text-rose-600 border border-rose-100";
            case "completed":
                return "bg-emerald-50 text-emerald-600 border border-emerald-100";
            case "cancelled":
                return "bg-slate-100 text-slate-500 border border-slate-200";
            default:
                return "bg-gray-50 text-gray-600";
        }
    };

    const getUrgencyStyle = (priority) => {
        switch (priority) {
            case "urgent":
                return "bg-rose-500/10 text-rose-600 border border-rose-500/20";
            case "high":
                return "bg-orange-500/10 text-orange-600 border border-orange-500/20";
            case "normal":
                return "bg-primary/10 text-primary border border-primary/20";
            case "low":
                return "bg-slate-500/10 text-slate-500 border border-slate-500/20";
            default:
                return "bg-slate-50 text-slate-500";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-light text-slate-800 tracking-tight">
                        Orders
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 font-light">
                        Manage production orders
                    </p>
                </div>
                <button
                    onClick={() => navigate("/admin/orders/new")}
                    className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-colors shadow-sm text-sm"
                >
                    <Plus size={18} />
                    New Order
                </button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.05)] overflow-hidden flex flex-col">
                {/* Filters */}
                <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:max-w-md group">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl text-sm font-medium text-slate-600 transition-colors border border-transparent hover:border-slate-100">
                            <Filter size={16} className="text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-transparent border-none text-slate-600 focus:ring-0 text-sm font-medium cursor-pointer p-0 outline-none pr-8"
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="m-5 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-xs font-semibold">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/50">
                                <th className="py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[60px]">
                                    Img
                                </th>
                                <th
                                    onClick={() => handleSort("po_number")}
                                    className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer group hover:text-primary transition-colors"
                                >
                                    <div className="flex items-center">
                                        PO Number
                                        <SortIcon field="po_number" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort("customer")}
                                    className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer group hover:text-primary transition-colors"
                                >
                                    <div className="flex items-center">
                                        Customer
                                        <SortIcon field="customer" />
                                    </div>
                                </th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Variant Items
                                </th>
                                <th
                                    onClick={() => handleSort("date")}
                                    className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer group hover:text-primary transition-colors"
                                >
                                    <div className="flex items-center">
                                        Dates
                                        <SortIcon field="date" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort("progress")}
                                    className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer group hover:text-primary transition-colors"
                                >
                                    <div className="flex items-center">
                                        Progress
                                        <SortIcon field="progress" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort("priority")}
                                    className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer group hover:text-primary transition-colors"
                                >
                                    <div className="flex items-center">
                                        Priority
                                        <SortIcon field="priority" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort("status")}
                                    className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right cursor-pointer group hover:text-primary transition-colors"
                                >
                                    <div className="flex items-center justify-end">
                                        Status
                                        <SortIcon field="status" />
                                    </div>
                                </th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {orders.length > 0 ? (
                                orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="group hover:bg-slate-50/80 transition-colors"
                                    >
                                        {/* Product Image Thumbnail */}
                                        <td className="py-3 px-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                                {order.items?.[0]?.variant
                                                    ?.image_url ? (
                                                    <img
                                                        src={
                                                            order.items[0]
                                                                .variant
                                                                .image_url
                                                        }
                                                        alt="Product"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Image
                                                        size={18}
                                                        className="text-slate-300"
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-semibold text-slate-700 group-hover:text-primary transition-colors">
                                                {order.po_number || "-"}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm font-medium text-slate-700">
                                                {order.customer?.name}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {order.customer?.code}
                                            </div>
                                        </td>
                                        {/* Variant Items */}
                                        <td className="py-4 px-6">
                                            {order.items && order.items.length > 0 ? (
                                                <div className="space-y-1">
                                                    <div className="text-sm font-semibold text-slate-700">
                                                        {order.items[0]?.variant?.name || 'N/A'}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        <span 
                                                            className="px-1.5 py-0.5 text-[10px] font-bold rounded"
                                                            style={getColorBlockInlineStyle(order.items[0]?.color)}
                                                        >
                                                            {order.items[0]?.color || '-'}
                                                        </span>
                                                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">
                                                            {order.items[0]?.size || '-'}
                                                        </span>
                                                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded">
                                                            {order.items[0]?.quantity || 0} pcs
                                                        </span>
                                                    </div>
                                                    {order.items.length > 1 && (
                                                        <div className="text-[10px] text-slate-400 font-medium">
                                                            +{order.items.length - 1} more items
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-300 italic">No items</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <Calendar
                                                        size={12}
                                                        className="text-slate-400"
                                                    />
                                                    {order.date
                                                        ? new Date(
                                                              order.date
                                                          ).toLocaleDateString(
                                                              "id-ID",
                                                              {
                                                                  day: "numeric",
                                                                  month: "short",
                                                              }
                                                          )
                                                        : "-"}
                                                </div>
                                                {order.deadline_date && (
                                                    <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium">
                                                        <Clock size={12} />
                                                        {new Date(
                                                            order.deadline_date
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                            {
                                                                day: "numeric",
                                                                month: "short",
                                                            }
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="w-full max-w-[120px]">
                                                <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                                                    <span>
                                                        {order.overall_progress || 0}
                                                        %
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${order.overall_progress || 0}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span
                                                className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${getUrgencyStyle(
                                                    order.priority
                                                )}`}
                                            >
                                                {order.priority}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span
                                                className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide ${getStatusStyle(
                                                    order.status
                                                )}`}
                                            >
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            `/admin/orders/${order.id}`
                                                        )
                                                    }
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit Order"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            `/print/work-order/${order.id}`
                                                        )
                                                    }
                                                    className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Print Surat Jalan"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteOrder(
                                                            order.id
                                                        )
                                                    }
                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Delete Order"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="9"
                                        className="py-12 text-center text-slate-400"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Search
                                                size={32}
                                                className="text-slate-200"
                                            />
                                            <p className="text-sm">
                                                No orders found
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
                    <span>
                        Showing {orders.length} of {pagination.total} entries
                    </span>
                    <div className="flex gap-1 items-center bg-slate-50 p-1 rounded-lg">
                        <button
                            disabled={pagination.current_page === 1}
                            onClick={() =>
                                fetchOrders(pagination.current_page - 1)
                            }
                            className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all font-bold"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="px-3 py-1 bg-white rounded-md shadow-sm font-black text-primary border border-slate-100">
                            {pagination.current_page}
                        </div>
                        <button
                            disabled={
                                pagination.current_page === pagination.last_page
                            }
                            onClick={() =>
                                fetchOrders(pagination.current_page + 1)
                            }
                            className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all font-bold"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderList;
