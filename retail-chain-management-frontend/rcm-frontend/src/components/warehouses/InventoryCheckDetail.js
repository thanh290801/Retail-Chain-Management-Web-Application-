import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const InventoryCheckDetail = () => {
    const { auditId } = useParams(); // Lấy auditId từ URL
    const [details, setDetails] = useState([]);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        // Gọi API lấy chi tiết kiểm kho theo auditId
        fetch(`https://localhost:5000/api/stock-audits/details/${auditId}`)
            .then(res => res.json())
            .then(data => setDetails(data || []))
            .catch(err => console.error("Lỗi lấy chi tiết kiểm kho:", err));

        // Gọi API lấy thông tin sản phẩm
        fetch(`https://localhost:5000/api/products`)
            .then(res => res.json())
            .then(data => setProducts(data || []))
            .catch(err => console.error("Lỗi lấy sản phẩm:", err));
    }, [auditId]);

    const getProductName = (productId) => {
        return products.find(p => p.productsId === productId)?.name || "N/A";
    };

    const getProductUnit = (productId) => {
        return products.find(p => p.productsId === productId)?.unit || "N/A";
    };

    return (
        <div className="p-6 bg-white rounded shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">📦 Chi tiết kiểm kho #{auditId}</h2>
                <Link to="/inventoryhistory" className="text-blue-500 hover:underline">
                    ← Quay lại lịch sử
                </Link>
            </div>

            <table className="w-full text-sm bg-white border rounded">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 border">Mã sản phẩm</th>
                        <th className="p-2 border">Tên sản phẩm</th>
                        <th className="p-2 border">Đơn vị</th>
                        <th className="p-2 border">Số lượng kiểm</th>
                    </tr>
                </thead>
                <tbody>
                    {details.length > 0 ? (
                        details.map((item) => (
                            <tr key={item.stockAuditDetailsId}>
                                <td className="p-2 border">{item.productId}</td>
                                <td className="p-2 border">{getProductName(item.productId)}</td>
                                <td className="p-2 border">{getProductUnit(item.productId)}</td>
                                <td className="p-2 border">{item.recordedQuantity}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="text-center p-2 border">
                                Không có dữ liệu kiểm kho.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default InventoryCheckDetail;
