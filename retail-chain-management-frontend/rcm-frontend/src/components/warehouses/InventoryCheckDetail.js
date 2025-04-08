import React, { useEffect, useState, useRef } from "react";

const InventoryCheckDetail = ({ auditId, onClose }) => {
    const [details, setDetails] = useState([]);
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (!auditId) return;

        fetch(`https://localhost:5000/api/stock-audits/details/${auditId}`)
            .then(res => res.json())
            .then(data => setDetails(data || []))
            .catch(err => console.error("Lỗi lấy chi tiết kiểm kho:", err));

        fetch(`https://localhost:5000/api/products`)
            .then(res => res.json())
            .then(data => setProducts(data || []))
            .catch(err => console.error("Lỗi lấy sản phẩm:", err));
    }, [auditId]);

    const getProductInfo = (productId) => {
        return products.find(p => p.productsId === productId) || {};
    };

    const totalPages = Math.ceil(details.length / itemsPerPage);
    const pageData = details.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={onClose} // click ngoài popup
        >
            <div
                className="bg-white p-6 rounded max-w-5xl w-full max-h-[90vh] overflow-y-auto relative"
                onClick={(e) => e.stopPropagation()} // ngăn click truyền xuống overlay
            >
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 text-xl">×</button>
                <h2 className="text-xl font-semibold mb-4">📦 Chi tiết kiểm kho #{auditId}</h2>

                <table className="w-full text-sm bg-white border rounded">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 border">Mã sản phẩm</th>
                            <th className="p-2 border">Tên sản phẩm</th>
                            <th className="p-2 border">Đơn vị</th>
                            <th className="p-2 border">Số lượng trước kiểm kho</th>
                            <th className="p-2 border">Số lượng kiểm</th>
                            <th className="p-2 border">Lý do</th>
                        </tr>
                    </thead>
                    <tbody>
    {pageData.length > 0 ? (
        pageData.map((item) => {
            const product = getProductInfo(item.productId);
            return (
                <tr key={item.stockAuditDetailsId}>
                    <td className="p-2 border">{item.productId}</td>
                    <td className="p-2 border">{product.name || "N/A"}</td>
                    <td className="p-2 border">{product.unit || "N/A"}</td>
                    <td className="p-2 border">{item.stockQuantity ?? "Chưa cập nhật"}</td>
                    <td className="p-2 border">{item.recordedQuantity}</td>
                    <td className="p-2 border">
                        {item.reason?.trim() || "Không có ghi chú"}
                    </td>
                </tr>
            );
        })
    ) : (
        <tr>
            <td colSpan="6" className="text-center p-2 border">
                Không có dữ liệu kiểm kho.
            </td>
        </tr>
    )}
</tbody>

                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-4 flex justify-center gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>◀</button>
                        {[...Array(totalPages)].map((_, idx) => (
                            <button
                                key={idx}
                                className={`px-2 ${idx + 1 === currentPage ? "bg-blue-500 text-white" : ""}`}
                                onClick={() => setCurrentPage(idx + 1)}
                            >
                                {idx + 1}
                            </button>
                        ))}
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>▶</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryCheckDetail;
