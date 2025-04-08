import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import StaffHeaderComponent from '../staffHomeConponent/staffHeader';

const ProductStockComponent = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showLowStock, setShowLowStock] = useState(false);
    const [isEditingminQuantity, setIsEditingminQuantity] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 15;

    useEffect(() => {
        const token = localStorage.getItem('token');
        let employeeId = null;

        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                employeeId = decodedToken.AccountId;
            } catch (error) {
                console.error('Lỗi khi giải mã token:', error);
            }
        }

        if (employeeId) {
            fetch(`https://localhost:5000/api/products/warehouse/${employeeId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(response => response.json())
                .then(data => {
                    setProducts(data.map(product => ({
                        ...product,
                        minQuantity: product.minQuantity || 50
                    })));
                })
                .catch(error => console.error('Lỗi lấy dữ liệu kho:', error));
        }
    }, []);

    const handleminQuantityChange = (index, value) => {
        if (isEditingminQuantity) {
            const updatedProducts = [...products];
            updatedProducts[index].minQuantity = Number(value);
            setProducts(updatedProducts);
        }
    };

    const handleSaveminQuantity = () => {
        const token = localStorage.getItem('token');
        const updateData = products.map(product => ({
            productId: product.productsId,
            minQuantity: product.minQuantity
        }));

        fetch('https://localhost:5000/api/stocklevels/update-min-quantity', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            setIsEditingminQuantity(false);
        })
        .catch(error => console.error('Lỗi khi cập nhật tồn kho tối thiểu:', error));
    };

    const filteredProducts = products.filter(product => 
        (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productsId.toString().includes(searchTerm)) &&
        (!showLowStock || product.quantity < product.minQuantity)
    );

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    return (
        <div>
            <StaffHeaderComponent/>
            <div className="p-6 bg-white rounded-lg shadow-md">
                <div className="mb-4 flex justify-between items-center">
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm theo mã hoặc tên sản phẩm..." 
                        className="p-2 border rounded w-1/3" 
                        value={searchTerm} 
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }} 
                    />
                    <div className="flex items-center">
                        <input 
                            type="checkbox" 
                            className="mr-2" 
                            checked={showLowStock} 
                            onChange={() => {
                                setShowLowStock(!showLowStock);
                                setCurrentPage(1);
                            }} 
                        />
                        <label>Chỉ hiển thị sản phẩm sắp hết hàng</label>
                    </div>
                </div>

                <button 
                    className="mb-4 bg-blue-500 text-white px-4 py-2 rounded" 
                    onClick={() => {
                        if (isEditingminQuantity) {
                            handleSaveminQuantity();
                        } else {
                            setIsEditingminQuantity(true);
                        }
                    }}
                >
                    {isEditingminQuantity ? 'Lưu tồn kho tối thiểu' : 'Chỉnh sửa tồn kho tối thiểu'}
                </button>

                <table className="w-full bg-white shadow-md rounded">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2">Mã sản phẩm</th>
                            <th className="p-2">Ảnh sản phẩm</th>
                            <th className="p-2">Tên sản phẩm</th>
                            <th className="p-2">Loại sản phẩm</th>
                            <th className="p-2">Đơn vị</th>
                            <th className="p-2">Tồn kho</th>
                            <th className="p-2">Tồn kho tối thiểu</th>
                            <th className="p-2">Giá nhập</th>
                            
                            <th className="p-2">Giá bán lẻ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentProducts.map((product, index) => (
                            <tr key={product.productsId} className={product.quantity < product.minQuantity ? 'bg-red-100' : ''}>
                                <td className="p-2">{product.productsId}</td>
                                <td className="p-2">
                                    <img src={product.imageUrl || "https://via.placeholder.com/50"} alt="Ảnh sản phẩm" width="50" />
                                </td>
                                <td className="p-2">{product.name}</td>
                                <td className="p-2">{product.category}</td>
                                <td className="p-2">{product.unit}</td>
                                <td className={`p-2 font-semibold ${product.quantity < product.minQuantity ? 'text-red-600' : ''}`}>{product.quantity}</td>
                                <td className="p-2">
                                    <input 
                                        type="number" 
                                        className="w-16 p-1 border rounded text-center" 
                                        value={product.minQuantity} 
                                        onChange={(e) => handleminQuantityChange(indexOfFirstProduct + index, e.target.value)}
                                        disabled={!isEditingminQuantity}
                                    />
                                </td>
                                <td className="p-2">{product.purchasePrice.toLocaleString()} đ</td>
                               
                                <td className="p-2">{product.retailPrice.toLocaleString()} đ</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Phân trang */}
                {totalPages > 1 && (
                    <div className="mt-4 flex justify-center space-x-2">
                        {Array.from({ length: totalPages }, (_, index) => (
                            <button
                                key={index}
                                className={`px-4 py-2 rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                onClick={() => setCurrentPage(index + 1)}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductStockComponent;
