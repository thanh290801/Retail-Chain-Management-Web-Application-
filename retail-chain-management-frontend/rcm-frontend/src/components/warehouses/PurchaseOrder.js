import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const PurchaseOrder = () => {
    const navigate = useNavigate();
    const [orderDraft, setOrderDraft] = useState({ resolved: [], unresolved: [] });
    const [branchId, setBranchId] = useState(null);
    const [supplierMap, setSupplierMap] = useState({});
    const [warehouseId, setWarehouseId] = useState(null);

    const formatCurrency = (value) => (value ?? 0).toLocaleString("vi-VN");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const branch = decoded.BranchID || 0;
                setBranchId(branch);

                // Nếu là chủ → lấy warehouseId từ localStorage
                if (branch === 0) {
                    const storedWarehouseId = parseInt(localStorage.getItem("selectedWarehouseId"));
                    if (storedWarehouseId) {
                        setWarehouseId(storedWarehouseId);
                    }
                } else {
                    setWarehouseId(branch); // nhân viên thì warehouseId chính là branchId
                }
            } catch (err) {
                console.error("Lỗi khi decode token:", err);
            }
        }
    }, []);

    useEffect(() => {
        fetch("https://localhost:5000/api/suppliers/get-all")
            .then((res) => res.json())
            .then((data) => {
                const map = {};
                data.forEach((s) => {
                    map[s.suppliersId] = s.name;
                });
                setSupplierMap(map);
            })
            .catch((err) => console.error("Lỗi fetch suppliers:", err));
    }, []);

    useEffect(() => {
        const storedOrder = localStorage.getItem("orderDraft");
        if (!storedOrder || warehouseId === null) return;

        const parsed = JSON.parse(storedOrder);
        const unresolved = parsed.unresolved || [];

        fetch(`https://localhost:5000/api/products/low-stock?warehouseId=${warehouseId}`)
            .then((res) => res.json())
            .then((data) => {
                const priceMap = {};
                const nameMap = {};
                const unitMap = {};

                data.forEach((p) => {
                    priceMap[p.productsId] = p.purchasePrice;
                    nameMap[p.productsId] = p.name;
                    unitMap[p.productsId] = p.unit;
                });

                const unresolvedWithMeta = unresolved.map((item) => ({
                    ...item,
                    selectedSupplier: item.supplierOptions?.[0] || null,
                    quantity: item.quantity ?? 1,
                    price: priceMap[item.productId] ?? item.price ?? 0,
                    productName: nameMap[item.productId] ?? item.productName ?? "",
                    unit: unitMap[item.productId] ?? item.unit ?? "",
                }));

                const resolvedWithMeta = (parsed.resolved || []).map((item) => ({
                    ...item,
                    price: priceMap[item.productId] ?? item.price ?? 0,
                    productName: nameMap[item.productId] ?? item.productName ?? "",
                    unit: unitMap[item.productId] ?? item.unit ?? "",
                }));

                setOrderDraft({
                    resolved: resolvedWithMeta,
                    unresolved: unresolvedWithMeta,
                });
            })
            .catch((err) => console.error("Lỗi fetch purchase price:", err));
    }, [warehouseId]);

    const handleUpdateUnresolved = (index, field, value) => {
        const updated = [...orderDraft.unresolved];
        updated[index][field] = value;
        setOrderDraft({ ...orderDraft, unresolved: updated });
    };

    const handleUpdateResolvedQty = (index, value) => {
        const updated = [...orderDraft.resolved];
        updated[index].quantity = isNaN(value) ? 0 : value;
        setOrderDraft({ ...orderDraft, resolved: updated });
    };

    const handleAddToResolved = () => {
        const newResolved = orderDraft.unresolved
            .filter((p) => p.selectedSupplier)
            .map((p) => ({
                productId: p.productId,
                quantity: parseInt(p.quantity) || 0,
                supplierId: parseInt(p.selectedSupplier),
                price: parseFloat(p.price) || 0,
                productName: p.productName,
                unit: p.unit,
            }));

        setOrderDraft({
            resolved: [...orderDraft.resolved, ...newResolved],
            unresolved: [],
        });
    };

    const handleConfirmOrder = async () => {
        if (orderDraft.resolved.length === 0) {
            alert("Không có sản phẩm nào để tạo đơn hàng.");
            return;
        }

        const groupedOrders = {};
        orderDraft.resolved.forEach((item) => {
            if (!groupedOrders[item.supplierId]) groupedOrders[item.supplierId] = [];
            groupedOrders[item.supplierId].push(item);
        });

        let hasError = false;
        let errorMessages = [];

        for (const supplierId in groupedOrders) {
            const rawItems = groupedOrders[supplierId];
            const items = [];

            rawItems.forEach((item) => {
                const errors = [];
                if (!item.productId) errors.push("Thiếu mã sản phẩm");
                if (!item.productName) errors.push("Thiếu tên sản phẩm");
                if (typeof item.quantity !== "number" || isNaN(item.quantity) || item.quantity <= 0)
                    errors.push("Số lượng không hợp lệ");
                if (typeof item.price !== "number" || isNaN(item.price))
                    errors.push("Giá nhập không hợp lệ");

                if (errors.length > 0) {
                    hasError = true;
                    errorMessages.push(
                        `NCC ${supplierMap[supplierId] || supplierId} - SP ${item.productName || item.productId}: ${errors.join(", ")}`
                    );
                } else {
                    items.push(item);
                }
            });

            if (!items.length) continue;

            try {
                const payload = {
                    supplierId: parseInt(supplierId),
                    warehouseId: warehouseId,
                    notes: "",
                    items: items.map((i) => ({
                        productId: i.productId,
                        quantity: i.quantity,
                        price: i.price,
                    })),
                };

                const res = await fetch("https://localhost:5000/api/orders/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    hasError = true;
                    errorMessages.push(`NCC ${supplierMap[supplierId] || supplierId}: ${errorText}`);
                }
            } catch (err) {
                hasError = true;
                errorMessages.push(`NCC ${supplierMap[supplierId] || supplierId}: ${err.message}`);
            }
        }

        if (hasError) {
            alert("❌ Lỗi tạo đơn hàng:\n" + errorMessages.join("\n"));
        } else {
            alert("✅ Đơn hàng đã được tạo!");
            localStorage.removeItem("orderDraft");
            localStorage.removeItem("selectedWarehouseId");
            navigate("/orders");
        }
    };

    const calculateTotalBySupplier = (supplierId) => {
        return orderDraft.resolved
            .filter((item) => item.supplierId === parseInt(supplierId))
            .reduce((total, item) => total + (item.quantity || 0) * (item.price || 0), 0);
    };

    const uniqueSuppliers = [...new Set(orderDraft.resolved.map((item) => item.supplierId))];

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">📦 Tạo đơn đặt hàng</h2>

            {orderDraft.unresolved.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">🔴 Chọn nhà cung cấp và chỉnh sửa</h3>
                    <table className="w-full bg-white shadow-md rounded mb-4">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2">Mã SP</th>
                                <th className="p-2">Tên SP</th>
                                <th className="p-2">Đơn vị</th>
                                <th className="p-2">Số lượng</th>
                                <th className="p-2">Giá nhập</th>
                                <th className="p-2">Nhà cung cấp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orderDraft.unresolved.map((item, index) => (
                                <tr key={index}>
                                    <td className="p-2">{item.productId}</td>
                                    <td className="p-2">{item.productName}</td>
                                    <td className="p-2">{item.unit}</td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            className="w-20 border rounded p-1"
                                            onChange={(e) =>
                                                handleUpdateUnresolved(index, "quantity", parseInt(e.target.value) || 0)
                                            }
                                        />
                                    </td>
                                    <td className="p-2 text-right">{formatCurrency(item.price)}</td>
                                    <td className="p-2">
                                        <select
                                            className="p-1 border rounded"
                                            value={item.selectedSupplier || ""}
                                            onChange={(e) =>
                                                handleUpdateUnresolved(index, "selectedSupplier", e.target.value)
                                            }
                                        >
                                            <option value="">-- Chọn --</option>
                                            {item.supplierOptions?.map((supplierId) => (
                                                <option key={supplierId} value={supplierId}>
                                                    {supplierMap[supplierId] || `NCC ${supplierId}`}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button
                        className="bg-green-500 text-white px-4 py-2 rounded mb-6"
                        onClick={handleAddToResolved}
                    >
                        ➕ Thêm vào danh sách đơn hàng
                    </button>
                </div>
            )}

            {uniqueSuppliers.length > 0 && uniqueSuppliers.map((supplierId) => (
                <div key={supplierId} className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">🟢 Đơn hàng - {supplierMap[supplierId] || `NCC ${supplierId}`}</h3>
                    <table className="w-full bg-white shadow-md rounded">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2">Mã SP</th>
                                <th className="p-2">Tên SP</th>
                                <th className="p-2">Đơn vị</th>
                                <th className="p-2">Số lượng</th>
                                <th className="p-2">Giá nhập</th>
                                <th className="p-2">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orderDraft.resolved.map((item, index) =>
                                item.supplierId === supplierId ? (
                                    <tr key={index}>
                                        <td className="p-2">{item.productId}</td>
                                        <td className="p-2">{item.productName}</td>
                                        <td className="p-2">{item.unit}</td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                className="w-20 border rounded p-1"
                                                onChange={(e) =>
                                                    handleUpdateResolvedQty(index, parseInt(e.target.value) || 0)
                                                }
                                            />
                                        </td>
                                        <td className="p-2 text-right">{formatCurrency(item.price)}</td>
                                        <td className="p-2 text-right font-semibold">
                                            {formatCurrency((item.quantity || 0) * (item.price || 0))}
                                        </td>
                                    </tr>
                                ) : null
                            )}
                            <tr className="bg-gray-100 font-semibold">
                                <td colSpan="5" className="text-right p-2">Tổng</td>
                                <td className="p-2 text-right">
                                    {formatCurrency(calculateTotalBySupplier(supplierId))}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ))}

            <div className="mt-6 flex justify-end space-x-2">
                <button
                    className="bg-gray-500 text-white px-4 py-2 rounded"
                    onClick={() => navigate("/low-stock")}
                >
                    Quay lại
                </button>
                <button
                    className={`px-4 py-2 rounded ${
                        orderDraft.resolved.length === 0
                            ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                            : "bg-blue-500 text-white"
                    }`}
                    onClick={handleConfirmOrder}
                    disabled={orderDraft.resolved.length === 0}
                >
                    Xác nhận đơn hàng
                </button>
            </div>
        </div>
    );
};

export default PurchaseOrder;
