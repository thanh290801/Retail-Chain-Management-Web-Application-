import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const ProductsOfSupplier = () => {
    const { supplierId } = useParams();
    const [products, setProducts] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [categoryList, setCategoryList] = useState(["Tất cả"]);
    const [selectedCategory, setSelectedCategory] = useState("Tất cả");
    const itemsPerPage = 5;
    const navigate = useNavigate();

    useEffect(() => {
        if (supplierId) {
            axios.get(`https://localhost:5000/api/Supplier/GetProductsBySupplier/${supplierId}`)
                .then(res => {
                    setProducts(res.data);
                    setFiltered(res.data);
                })
                .catch(err => console.error("Lỗi khi lấy sản phẩm:", err));
        }
    }, [supplierId]);

    useEffect(() => {
        if (products.length > 0) {
            const uniqueCategories = [...new Set(products.map(p => p.category || "Khác"))];
            setCategoryList(["Tất cả", ...uniqueCategories]);
        }
    }, [products]);

    useEffect(() => {
        let result = [...products];
        const search = searchTerm.toLowerCase();

        if (selectedCategory !== "Tất cả") {
            result = result.filter(p => p.category === selectedCategory);
        }

        result = result.filter(p =>
            p.name?.toLowerCase().includes(search) ||
            p.barcode?.toLowerCase().includes(search)
        );

        setFiltered(result);
        setCurrentPage(1);
    }, [searchTerm, selectedCategory, products]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const currentData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const handleAddProduct = () => {
        navigate(`/AddProductsToSupplier/${supplierId}`);
    };
    const handleDelete = (productId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xoá sản phẩm này khỏi nhà cung cấp?")) return;

        axios.delete(`https://localhost:5000/api/Supplier/RemoveProductFromSupplier`, {
            params: {
                supplierId: supplierId,
                productId: productId
            }
        })
            .then(() => {
                alert("Xoá sản phẩm thành công!");

                // 🔄 Gọi lại API để cập nhật danh sách
                return axios.get(`https://localhost:5000/api/Supplier/GetProductsBySupplier/${supplierId}`);
            })
            .then(res => {
                setProducts(res.data);
                setFiltered(res.data);
            })
            .catch(err => {
                console.error("❌ Lỗi khi xoá sản phẩm:", err);
                alert("Xoá sản phẩm thất bại.");
            });
    };


    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">📦 Sản phẩm của nhà cung cấp</h2>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-blue-600 hover:underline"
                    >
                        ← Quay lại
                    </button>
                    <button
                        onClick={() => navigate(`/AddProductsToSupplier/${supplierId}`)}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                        ➕ Thêm sản phẩm
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <input
                    type="text"
                    className="border px-3 py-2 w-full mr-4 rounded"
                    placeholder="🔍 Tìm theo tên sản phẩm hoặc barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    className="border px-3 py-2 rounded ml-2"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    {categoryList.map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <div className="mb-2 text-sm text-gray-500">Tổng: {filtered.length} sản phẩm</div>

            <table className="w-full border text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2">Hình ảnh</th>
                        <th className="p-2 text-left">Tên sản phẩm</th>
                        <th className="p-2">Đơn vị</th>
                        <th className="p-2">Mã barcode</th>
                        <th className="p-2">Hành động</th>

                    </tr>
                </thead>
                <tbody>
                    {currentData.map((item, idx) => (
                        <tr key={idx} className="border-t">
                            <td className="p-2">
                                <img
                                    src={item.imageUrl || "/no-image.png"}
                                    alt={item.name}
                                    className="w-12 h-12 object-cover rounded shadow"
                                    onError={(e) => e.target.src = "/no-image.png"}
                                />
                            </td>
                            <td className="p-2">{item.name}</td>
                            <td className="p-2 text-center">{item.unit}</td>
                            <td className="p-2 text-center">{item.barcode}</td>
                            <td className="p-2 text-center">
                                <button
                                    onClick={() => handleDelete(item.productsId)}
                                    className="text-red-600 hover:underline"
                                >
                                    🗑️ Xoá
                                </button>
                            </td>

                        </tr>
                    ))}
                </tbody>
            </table>

            {totalPages > 1 && (
                <div className="flex justify-center mt-4 gap-1">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>⬅️</button>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => handlePageChange(i + 1)}
                            className={`px-3 py-1 border rounded ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white'}`}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>➡️</button>
                </div>
            )}
        </div>
    );
};

export default ProductsOfSupplier;
