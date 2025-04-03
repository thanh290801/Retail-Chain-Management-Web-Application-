import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../headerComponent/header";

const AddWarehouseComponent = () => {
    const [warehouse, setWarehouse] = useState({
        name: "",
        address: "",
        capacity: ""
    });
    const [nameExists, setNameExists] = useState(false);
    const navigate = useNavigate();

    const handleChange = async (e) => {
        const { name, value } = e.target;
        setWarehouse(prev => ({ ...prev, [name]: value }));

        if (name === "name") {
            const trimmed = value.trim();
            if (trimmed) {
                try {
                    const res = await fetch(`https://localhost:5000/api/warehouse/check-name?name=${trimmed}`);
                    const data = await res.json();
                    setNameExists(data.exists);
                } catch (err) {
                    console.error("Lỗi khi kiểm tra tên kho:", err);
                }
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (nameExists) {
            alert("❌ Tên kho đã tồn tại, vui lòng chọn tên khác.");
            return;
        }

        try {
            const res = await fetch("https://localhost:5000/api/warehouse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...warehouse,
                    capacity: parseInt(warehouse.capacity)
                })
            });

            if (res.ok) {
                alert("✅ Kho hàng đã được tạo!");
                navigate("/warehouselistdetail");
            } else {
                const err = await res.json();
                alert("❌ " + err.message || "Tạo kho thất bại.");
            }
        } catch (error) {
            console.error("Lỗi gửi yêu cầu:", error);
            alert("Không thể kết nối đến server.");
        }
    };

    return (
        <div>
            <Header />
            <div className="p-6 max-w-xl mx-auto bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">➕ Thêm Kho Hàng</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block font-medium">Tên kho:</label>
                        <input
                            type="text"
                            name="name"
                            value={warehouse.name}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                            required
                        />
                        {nameExists && (
                            <p className="text-red-500 text-sm mt-1">⚠️ Tên kho đã tồn tại.</p>
                        )}
                    </div>
                    <div>
                        <label className="block font-medium">Địa chỉ:</label>
                        <input
                            type="text"
                            name="address"
                            value={warehouse.address}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-medium">Dung tích (m³):</label>
                        <input
                            type="number"
                            name="capacity"
                            value={warehouse.capacity}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                            required
                            min={1}
                        />
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            className="px-4 py-2 bg-gray-500 text-white rounded"
                            onClick={() => navigate("/warehouses")}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                            disabled={nameExists}
                        >
                            Lưu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddWarehouseComponent;
