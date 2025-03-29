import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const AddProductsToSupplier = () => {
    const { supplierId } = useParams();
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState("");
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("https://localhost:5000/api/Supplier")
            .then(res => setSuppliers(res.data))
            .catch(err => console.error("Lỗi khi lấy danh sách nhà cung cấp:", err));
    }, []);

    useEffect(() => {
        if (supplierId) {
            setSelectedSupplierId(supplierId);
        }
    }, [supplierId]);

    useEffect(() => {
        if (selectedSupplierId) {
            axios.get(`https://localhost:5000/api/Supplier/GetUnlinkedProducts/${selectedSupplierId}`)
                .then(res => {
                    setProducts(res.data);
                    setFilteredProducts(res.data);
                })
                .catch(err => console.error("Lỗi khi lấy sản phẩm chưa liên kết:", err));
        } else {
            setProducts([]);
            setFilteredProducts([]);
            setSelectedProductIds([]);
        }
    }, [selectedSupplierId]);

    useEffect(() => {
        const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        setFilteredProducts(filtered);
        setCurrentPage(1);
    }, [searchTerm, products]);

    const handleProductToggle = (productId) => {
        setSelectedProductIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handleSubmit = () => {
        if (!selectedSupplierId || selectedProductIds.length === 0) {
            alert("Vui lòng chọn nhà cung cấp và ít nhất 1 sản phẩm.");
            return;
        }

        const payload = {
            supplierId: parseInt(selectedSupplierId),
            productIds: selectedProductIds
        };

        axios.post("https://localhost:5000/api/Supplier/AddProductsToSupplier", payload)
            .then(() => {
                alert("Đã thêm sản phẩm cho nhà cung cấp.");
                setSelectedProductIds([]);

                // 🔄 Gọi lại API để load lại danh sách chưa liên kết
                return axios.get(`https://localhost:5000/api/Supplier/GetUnlinkedProducts/${selectedSupplierId}`);
            })
            .then(res => {
                setProducts(res.data);
                setFilteredProducts(res.data);
            })
            .catch(err => {
                console.error("Lỗi khi thêm sản phẩm:", err);
                alert("Thêm sản phẩm thất bại.");
            });
            navigate(`/supplierproducts/${supplierId}`);
    };


    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h2 className="text-xl font-bold mb-4">📦 Thêm sản phẩm vào nhà cung cấp</h2>

            <div className="mb-4">
                <label className="font-medium mr-2">Chọn nhà cung cấp:</label>
                {supplierId ? (
                    <p className="inline-block text-gray-700 font-medium">
                        {suppliers.find(s => s.suppliersId.toString() === supplierId)?.name}
                    </p>
                ) : (
                    <select
                        className="border p-2 rounded w-64"
                        value={selectedSupplierId}
                        onChange={(e) => setSelectedSupplierId(e.target.value)}
                    >
                        <option value="">-- Chọn nhà cung cấp --</option>
                        {suppliers.map(supplier => (
                            <option key={supplier.suppliersId} value={supplier.suppliersId}>
                                {supplier.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div className="mb-4 flex justify-between items-center">
                <input
                    type="text"
                    placeholder="🔍 Tìm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded px-4 py-2 w-80"
                />
                <span className="text-sm text-gray-600">🧮 Đã chọn: {selectedProductIds.length} sản phẩm</span>
            </div>

            {paginatedProducts.length === 0 ? (
                <p className="text-gray-500">Không còn sản phẩm nào chưa liên kết.</p>
            ) : (
                <table className="w-full border text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 text-left">Chọn</th>
                            <th className="p-2 text-left">Hình ảnh</th>
                            <th className="p-2 text-left">Tên sản phẩm</th>
                            <th className="p-2 text-left">Đơn vị</th>
                            <th className="p-2 text-left">Mã barcode</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedProducts.map(product => (
                            <tr key={product.productsId} className="border-t">
                                <td className="p-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedProductIds.includes(product.productsId)}
                                        onChange={() => handleProductToggle(product.productsId)}
                                    />
                                </td>
                                <td className="p-2">
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        onError={(e) => e.target.src = "https://via.placeholder.com/80x80?text=No+Image"}
                                        className="w-14 h-14 object-cover rounded"
                                    />
                                </td>
                                <td className="p-2">{product.name}</td>
                                <td className="p-2">{product.unit}</td>
                                <td className="p-2">{product.barcode}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center mt-4 gap-1">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-white"}`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
            <div className="flex justify-between items-center mb-4">
            
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-blue-600 hover:underline"
                    >
                        ← Quay lại
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="mt-6 bg-green-600 text-white px-4 py-2 rounded flex items-center"
                    >
                        <FaPlus className="mr-2" /> Thêm sản phẩm
                    </button>
                </div>
            </div>
            
        </div>
    );
};

export default AddProductsToSupplier;