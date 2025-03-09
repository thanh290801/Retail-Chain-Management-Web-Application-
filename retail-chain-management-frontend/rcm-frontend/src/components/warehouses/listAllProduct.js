import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProductListComponent = () => {
    const [products, setProducts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:5000/api/products')
            .then(response => response.json())
            .then(data => setProducts(data))
            .catch(error => console.error('Error fetching products:', error));
    }, []);

    const toggleProductStatus = async (product) => {
        if (product.has_pending_orders) {
            alert(`Sản phẩm "${product.name}" đang có giao dịch xử lý, không thể ẩn!`);
            return;
        }
        const confirmMessage = product.isEnabled ? "Bạn có chắc chắn muốn ẩn sản phẩm này?" : "Bạn có chắc chắn muốn hiển thị sản phẩm này?";
        if (window.confirm(confirmMessage)) {
            try {
                const response = await fetch(`http://localhost:5000/api/products/${product.productsId}/toggle-status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (response.ok) {
                    setProducts(products.map(p => p.productsId === product.productsId ? { ...p, isEnabled: !p.isEnabled } : p));
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


    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">📦 Danh Sách Sản Phẩm</h2>
                <button 
                    className="bg-green-500 text-white px-4 py-2 rounded"
                    onClick={() => navigate('/addproduct')}
                >
                    + Thêm sản phẩm
                </button>
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
                        <th className="p-2">Trạng thái</th>
                        <th className="p-2">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product.productsId}>
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
                            <td className="p-2 space-x-2">
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
        </div>
    );
};

export default ProductListComponent;
