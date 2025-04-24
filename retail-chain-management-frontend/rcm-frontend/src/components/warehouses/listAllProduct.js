import React, { useEffect, useState } from 'react';
import Header from '../../headerComponent/header';
import AddProductComponent from './addProduct';
import ProductEdit from '../Supplier_Order/ProductEdit';

const ProductListComponent = () => {
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState(null);
    const productsPerPage = 10;
    const [searchTerm, setSearchTerm] = useState("");

    const fetchProducts = () => {
        fetch('https://localhost:5000/api/products')
            .then(response => response.json())
            .then(data => setProducts(data))
            .catch(error => console.error('Error fetching products:', error));
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (showAddModal || selectedProductId !== null) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
        };
    }, [showAddModal, selectedProductId]);

    const toggleProductStatus = async (product) => {
        if (product.has_pending_orders) {
            alert(`Sản phẩm "${product.name}" đang có giao dịch xử lý, không thể ẩn!`);
            return;
        }

        const confirmMessage = product.isEnabled
            ? "Bạn có chắc chắn muốn ẩn sản phẩm này?"
            : "Bạn có chắc chắn muốn hiển thị sản phẩm này?";

        if (window.confirm(confirmMessage)) {
            try {
                const response = await fetch(`https://localhost:5000/api/products/${product.productsId}/toggle-status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    fetchProducts(); // ✅ reload sau khi đổi trạng thái
                    alert("Cập nhật trạng thái sản phẩm thành công!");
                } else {
                    alert("Có lỗi xảy ra khi cập nhật trạng thái sản phẩm!");
                }
            } catch (error) {
                console.error("Error updating product status:", error);
                alert("Lỗi kết nối đến server!");
            }
        }
    };

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(products.length / productsPerPage);

    const handleAddProductSuccess = () => {
        setShowAddModal(false);
        fetchProducts(); // ✅ reload khi thêm xong
    };

    const handleEditProductSuccess = () => {
        setSelectedProductId(null);
        fetchProducts(); // ✅ reload khi chỉnh sửa xong
    };

    const modalStyle = {
        backgroundColor: 'rgba(0,0,0,0.2)',
        backdropFilter: 'blur(6px)',
    };

    return (
        <div>
            <Header />
            <div className="p-6 bg-white rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">📦 Danh Sách Sản Phẩm</h2>
                    <button
                        className="bg-green-500 text-white px-4 py-2 rounded"
                        onClick={() => setShowAddModal(true)}
                    >
                        + Thêm sản phẩm
                    </button>
                </div>

                {/* Modal thêm sản phẩm */}
                {showAddModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={modalStyle}
                        onClick={() => setShowAddModal(false)}
                    >
                        <div
                            className="bg-white rounded-lg p-6 w-full max-w-2xl relative max-h-screen overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="absolute top-2 right-4 text-xl text-gray-500 hover:text-red-600"
                                onClick={() => setShowAddModal(false)}
                            >
                                ✕
                            </button>
                            <AddProductComponent
                                onSuccess={handleAddProductSuccess}
                                onCancel={() => setShowAddModal(false)}
                            />
                        </div>
                    </div>
                )}

                {/* Modal chỉnh sửa sản phẩm */}
                {selectedProductId !== null && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={modalStyle}
                        onClick={() => setSelectedProductId(null)}
                    >
                        <div
                            className="bg-white rounded-lg p-6 w-full max-w-4xl relative max-h-screen overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="absolute top-2 right-4 text-xl text-gray-500 hover:text-red-600"
                                onClick={() => setSelectedProductId(null)}
                            >
                                ✕
                            </button>
                            <ProductEdit
                                id={selectedProductId}
                                isModal
                                onSuccess={handleEditProductSuccess} // ✅ callback khi sửa xong
                            />
                        </div>
                    </div>
                )}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="🔍 Tìm kiếm tên sản phẩm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 border rounded w-full max-w-md"
                    />
                </div>

                <table className="w-full bg-white shadow-md rounded">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2">ID</th>
                            <th className="p-2">Tên sản phẩm</th>
                            <th className="p-2">Mã vạch</th>
                            <th className="p-2">Đơn vị</th>
                            <th className="p-2">Trọng lượng (kg)</th>
                            <th className="p-2">Thể tích (ml)</th>
                            <th className="p-2">Hình ảnh</th>
                            <th className="p-2">Danh mục</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentProducts.map((product) => (
                            <tr
                                key={product.productsId}
                                onClick={() => setSelectedProductId(product.productsId)}
                                className="cursor-pointer hover:bg-gray-100"
                            >
                                <td className="p-2">{product.productsId}</td>
                                <td className="p-2">{product.name}</td>
                                <td className="p-2">{product.barcode}</td>
                                <td className="p-2">{product.unit}</td>
                                <td className="p-2">{product.weight ?? 'N/A'}</td>
                                <td className="p-2">{product.volume ?? 'N/A'}</td>
                                <td className="p-2">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover" />
                                    ) : 'Không có ảnh'}
                                </td>
                                <td className="p-2">{product.category}</td>

                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-4 flex justify-center space-x-2">
                    {Array.from({ length: totalPages }, (_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => setCurrentPage(index + 1)}
                            className={`px-4 py-2 rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductListComponent;
