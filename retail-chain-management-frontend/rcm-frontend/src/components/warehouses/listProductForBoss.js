import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom"; // Import useNavigate nếu sử dụng React Router
import Header from "../../headerComponent/header";
import axios from "axios";
import PromotionCreate from '../promotion/promotion_create';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProductStockForOwner = () => {
    const navigate = useNavigate(); // Hook để điều hướng trong React Router
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [products, setProducts] = useState([]);
    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const [updatedPrices, setUpdatedPrices] = useState({});
    const [searchTerm, setSearchTerm] = useState(""); // Giữ trạng thái search khi đổi kho
    const [showLowStock, setShowLowStock] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isCreatePromotionModalOpen, setIsCreatePromotionModalOpen] = useState(false);
    const productsPerPage = 10;


    useEffect(() => {
        fetch("https://localhost:5000/api/warehouse")
            .then(response => response.json())
            .then(data => {
                setWarehouses(data);
                if (data.length > 0) setSelectedWarehouse(data[0].warehousesId);
            })
            .catch(error => console.error("Error fetching warehouses:", error));
    }, []);

    useEffect(() => {
        if (selectedWarehouse) {
            fetch(`https://localhost:5000/api/warehouse/${selectedWarehouse}/products`)
                .then(response => response.json())
                .then(data => setProducts(data))
                .catch(error => console.error("Error fetching stock:", error));
        }
    }, [selectedWarehouse]);

    const handlePriceChange = (productId, field, value) => {
        setUpdatedPrices(prev => ({
            ...prev,
            [productId]: { ...prev[productId], [field]: value }
        }));
    };

    const handleSavePrices = () => {
        const token = localStorage.getItem("token");
        let decodedToken = jwtDecode(token);
        const accountId = decodedToken?.AccountId;

        const priceUpdates = Object.entries(updatedPrices).flatMap(([productId, priceData]) => {
            return Object.entries(priceData).map(([priceType, newPrice]) => ({
                ProductId: parseInt(productId),
                WarehouseId: selectedWarehouse,
                PriceType: priceType,
                NewPrice: parseFloat(newPrice),
                ChangedBy: accountId
            }));
        });

        fetch("https://localhost:5000/api/products/update-price", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(priceUpdates)
        })
            .then(response => response.json())
            .then(() => {
                alert("Cập nhật giá thành công!");
                setIsEditingPrice(false);
                setUpdatedPrices({});
            })
            .catch(error => console.error("Error updating prices:", error));
    };

    const handleToggleStatus = (productId, currentStatus) => {
        const confirmMessage = currentStatus
            ? "Bạn có chắc chắn muốn vô hiệu hóa sản phẩm này?"
            : "Bạn có chắc chắn muốn bật lại sản phẩm này?";

        if (!window.confirm(confirmMessage)) return;
        axios.put(`https://localhost:5000/api/warehouse/${selectedWarehouse}/toggle-product-status/${productId}`, {
            status: !currentStatus
        })
            .then(() => {
                setProducts(products.map(product =>
                    product.productsId === productId ? { ...product, status: !currentStatus } : product
                ));
            })
            .catch(error => console.error("Error toggling product status:", error));
    };

    //tick chọn nhiều sản phẩm
    const handleCheckboxChange = (product) => {
        setSelectedProducts((prevSelected) => {
            const isSelected = prevSelected.some((p) => p.productsId === product.productsId);
            if (isSelected) {
                return prevSelected.filter((p) => p.productsId !== product.productsId); // Bỏ chọn
            } else {
                return [...prevSelected, product]; // Chọn thêm
            }
        });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedProducts(filteredProducts);
        } else {
            setSelectedProducts([]);
        }
    };
    //mở modal tạo khuyến mãi
    const handleCreatePromotion = () => {
        if (selectedProducts.length === 0) {
           toast.error("Vui lòng chọn ít nhất một sản phẩm để tạo khuyến mãi.");
            console.log('Selected Products:', selectedProducts);
            return;
        }
        setIsCreatePromotionModalOpen(true);
    };

    const handlePromotionCreated = () => {
        console.log('Khuyến mãi đã được tạo thành công!');
        setIsCreatePromotionModalOpen(false);
    };

    // Lọc sản phẩm theo tên
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    // Tính toán phân trang
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
    return (
        <div>
            <Header />
            <ToastContainer />
            <div className="p-6 bg-white rounded-lg shadow-md">

                <div className="mb-4 flex justify-between items-center">
                    {/* Select Kho */}
                    <select
                        className="p-2 border rounded"
                        value={selectedWarehouse || ""}
                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                    >
                        {warehouses.map(warehouse => (
                            <option key={warehouse.warehousesId} value={warehouse.warehousesId}>{warehouse.name}</option>
                        ))}
                    </select>

                    {/* Ô tìm kiếm sản phẩm */}
                    <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        className="p-2 border rounded w-1/3"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    {/* Nút Chỉnh Sửa Giá */}
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={() => {
                            if (isEditingPrice) {
                                handleSavePrices();
                            }
                            setIsEditingPrice(!isEditingPrice);
                        }}
                    >
                        {isEditingPrice ? "Lưu giá" : "Chỉnh sửa giá"}
                    </button>
                    <button
                        className="bg-purple-500 text-white px-4 py-2 rounded"
                        onClick={handleCreatePromotion}
                    >
                        Tạo Khuyến Mãi
                    </button>
                    <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={() => navigate('/addproducttowarehouse')}>
                        ➕ Thêm sản phẩm vào kho
                    </button>
                </div>

                {/* Bảng Sản Phẩm */}
                <table className="w-full bg-white shadow-md rounded">
                    <thead className="bg-gray-100">
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0}
                                />
                            </th>
                            <th>Mã sản phẩm</th>
                            <th>Tên sản phẩm</th>
                            <th>Tồn kho</th>
                            <th>Tồn kho tối thiểu</th>
                            <th>Giá nhập</th>
                            <th>Giá bán buôn</th>
                            <th>Giá bán lẻ</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
                            <tr key={product.productsId}
                                className={product.quantity < product.minQuantity ? "bg-red-100" : ""}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.some((p) => p.productsId === product.productsId)}
                                        onChange={() => handleCheckboxChange(product)}
                                    />
                                </td>
                                <td>{product.productsId}</td>
                                <td>{product.name}</td>
                                <td className={`font-semibold ${product.quantity < product.minQuantity ? "text-red-600" : ""}`}>
                                    {product.quantity}
                                </td>
                                <td>{product.minQuantity}</td>
                                <td>
                                    <input
                                        type="number"
                                        value={updatedPrices[product.productsId]?.NewPurchasePrice || product.purchasePrice}
                                        onChange={(e) => handlePriceChange(product.productsId, "NewPurchasePrice", e.target.value)}
                                        disabled={!isEditingPrice}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={updatedPrices[product.productsId]?.NewWholesalePrice || product.wholesalePrice}
                                        onChange={(e) => handlePriceChange(product.productsId, "NewWholesalePrice", e.target.value)}
                                        disabled={!isEditingPrice}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={updatedPrices[product.productsId]?.NewRetailPrice || product.retailPrice}
                                        onChange={(e) => handlePriceChange(product.productsId, "NewRetailPrice", e.target.value)}
                                        disabled={!isEditingPrice}
                                    />
                                </td>
                                <td>{product.status ? "Hoạt động" : "Ngừng hoạt động"}</td>
                                <td>
                                    <button
                                        className={product.status ? "bg-red-500 text-white p-2 rounded" : "bg-green-500 text-white p-2 rounded"}
                                        onClick={() => handleToggleStatus(product.productsId, product.status)}
                                    >
                                        {product.status ? "Disable" : "Enable"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Phân trang */}
                <div className="flex justify-center mt-4">
                    {[...Array(totalPages).keys()].map(page => (
                        <button key={page + 1} onClick={() => handlePageChange(page + 1)} className={`px-4 py-2 mx-1 rounded ${currentPage === page + 1 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>{page + 1}</button>
                    ))}
                </div>
                {isCreatePromotionModalOpen && (
                    <PromotionCreate
                        onClose={() => setIsCreatePromotionModalOpen(false)}
                        onPromotionCreated={handlePromotionCreated}
                        selectedProducts={selectedProducts}
                        warehouseId={selectedWarehouse}
                    />
                )}
            </div>
        </div>
    );
};

export default ProductStockForOwner;
