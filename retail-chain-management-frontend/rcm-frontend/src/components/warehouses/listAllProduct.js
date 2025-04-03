import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../headerComponent/header';
import AddProductComponent from './addProduct';

const ProductListComponent = () => {
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const productsPerPage = 10;
    const navigate = useNavigate();

    // Khóa scroll background khi modal mở
    useEffect(() => {
        if (showModal) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }

        return () => {
            document.body.classList.remove('overflow-hidden');
        };
    }, [showModal]);

    useEffect(() => {
        fetch('https://localhost:5000/api/products')
            .then(response => response.json())
            .then(data => setProducts(data))
            .catch(error => console.error('Error fetching products:', error));
    }, []);

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
                    setProducts(products.map(p =>
                        p.productsId === product.productsId
                            ? { ...p, isEnabled: !p.isEnabled }
                            : p
                    ));
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

    const handleProductClick = (productsId) => {
        navigate(`/listallproduct/${productsId}`);
    };

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(products.length / productsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleAddProductSuccess = (newProduct) => {
        setProducts([newProduct, ...products]);
        setShowModal(false);
    };

    return (
        <div>
            <Header />
            <div className="p-6 bg-white rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">📦 Danh Sách Sản Phẩm</h2>
                    <button
                        className="bg-green-500 text-white px-4 py-2 rounded"
                        onClick={() => setShowModal(true)}
                    >
                        + Thêm sản phẩm
                    </button>
                </div>

                {/* Modal thêm sản phẩm */}
                {showModal && (
                    <div
                        className="fixed inset-0 z-50 bg-white bg-opacity-50 overflow-y-auto"
                        onClick={() => setShowModal(false)}
                    >
                        <div className="min-h-screen flex items-center justify-center px-4 py-8">
                            <div
                                className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10">
                                    <h2 className="text-xl font-bold">➕ Thêm sản phẩm mới</h2>
                                    <button
                                        className="text-gray-500 hover:text-red-600 text-xl"
                                        onClick={() => setShowModal(false)}
                                    >
                                        ✕
                                    </button>
                                </div>

                                <AddProductComponent
                                    onSuccess={handleAddProductSuccess}
                                    onCancel={() => setShowModal(false)}
                                />
                            </div>
                        </div>
                    </div>
                )}

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
                            <th className="p-2">Trạng thái</th>
                            <th className="p-2">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentProducts.map((product) => (
                            <tr
                                key={product.productsId}
                                onClick={() => handleProductClick(product.productsId)}
                                className="cursor-pointer hover:bg-gray-100"
                            >
                                <td className="p-2">{product.productsId}</td>
                                <td className="p-2">{product.name}</td>
                                <td className="p-2">{product.barcode}</td>
                                <td className="p-2">{product.unit}</td>
                                <td className="p-2">{product.weight !== null ? product.weight : 'N/A'}</td>
                                <td className="p-2">{product.volume !== null ? product.volume : 'N/A'}</td>
                                <td className="p-2">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover" />
                                    ) : ('Không có ảnh')}
                                </td>
                                <td className="p-2">{product.category}</td>
                                <td className="p-2">{product.isEnabled ? 'Hiển thị' : 'Ẩn'}</td>
                                <td className="p-2 space-x-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        className={`px-3 py-1 rounded ${product.isEnabled ? 'bg-red-500' : 'bg-blue-500'} text-white`}
                                        onClick={() => toggleProductStatus(product)}
                                    >
                                        {product.isEnabled ? 'Ẩn' : 'Hiển thị'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="mt-4 flex justify-center space-x-2">
                    {Array.from({ length: totalPages }, (_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => handlePageChange(index + 1)}
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
