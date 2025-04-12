import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import Header from "../../headerComponent/header";
import axios from "axios";
import PromotionCreate from "../promotion/promotion_create";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddProductsToWarehouse from "./addProductToWarehouse";

const ProductStockForOwner = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 10;

    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [products, setProducts] = useState([]);
    const [visibleProducts, setVisibleProducts] = useState([]); // ✅ Tách riêng dữ liệu hiển thị
    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const [updatedPrices, setUpdatedPrices] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isCreatePromotionModalOpen, setIsCreatePromotionModalOpen] = useState(false);
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [showOnlyLossProducts, setShowOnlyLossProducts] = useState(false);
    const [hasLossProducts, setHasLossProducts] = useState(false);

    useEffect(() => {
        fetch("https://localhost:5000/api/warehouse")
            .then(response => response.json())
            .then(data => {
                setWarehouses(data);
                if (data.length > 0) setSelectedWarehouse(data[0].warehousesId);
            })
            .catch(error => console.error("Error fetching warehouses:", error));
    }, []);

    const fetchProducts = () => {
        if (selectedWarehouse) {
            fetch(`https://localhost:5000/api/warehouse/${selectedWarehouse}/products`)
                .then(response => response.json())
                .then(data => {
                    setProducts(data);
                    setVisibleProducts(data); // ✅ luôn giữ danh sách gốc để render
                    const hasLoss = data.some(product => parseFloat(product.retailPrice) <= parseFloat(product.purchasePrice));
                    setHasLossProducts(hasLoss);
                })
                .catch(error => console.error("Error fetching stock:", error));
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [selectedWarehouse]);

    useEffect(() => {
        if (isAddProductModalOpen || isCreatePromotionModalOpen) {
            document.body.classList.add("overflow-hidden");
        } else {
            document.body.classList.remove("overflow-hidden");
        }
        return () => document.body.classList.remove("overflow-hidden");
    }, [isAddProductModalOpen, isCreatePromotionModalOpen]);

    const handleToggleShowLoss = (checked) => {
        setShowOnlyLossProducts(checked);
        if (checked) {
            const filtered = products.filter(p => parseFloat(p.retailPrice) <= parseFloat(p.purchasePrice));
            setVisibleProducts(filtered);
        } else {
            setVisibleProducts(products);
        }
    };

    const handlePriceChange = (productId, field, value) => {
        setUpdatedPrices(prev => ({
            ...prev,
            [productId]: { ...prev[productId], [field]: value }
        }));
    };

    const handleSavePrices = () => {
        const token = localStorage.getItem("token");
        const decodedToken = jwtDecode(token);
        const accountId = decodedToken?.AccountId;

        const priceUpdates = Object.entries(updatedPrices).flatMap(([productId, priceData]) =>
            Object.entries(priceData).map(([priceType, newPrice]) => ({
                ProductId: parseInt(productId),
                WarehouseId: selectedWarehouse,
                PriceType: priceType,
                NewPrice: parseFloat(newPrice),
                ChangedBy: accountId
            }))
        );

        fetch("https://localhost:5000/api/products/update-price", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(priceUpdates)
        })
            .then(response => {
                if (!response.ok) throw new Error("Lỗi khi cập nhật giá");
                return response.json();
            })
            .then(() => {
                toast.success("✅ Cập nhật giá thành công!");
                setIsEditingPrice(false);
                setUpdatedPrices({});
                fetchProducts();
            })
            .catch(error => {
                console.error("Error updating prices:", error);
                toast.error("❌ Cập nhật giá thất bại.");
            });
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

    const handleCheckboxChange = (product) => {
        setSelectedProducts(prev =>
            prev.some(p => p.productsId === product.productsId)
                ? prev.filter(p => p.productsId !== product.productsId)
                : [...prev, product]
        );
    };

    const handleSelectAll = (e) => {
        setSelectedProducts(e.target.checked ? currentProducts : []);
    };

    const handleCreatePromotion = () => {
        if (selectedProducts.length === 0) {
            toast.error("Vui lòng chọn ít nhất một sản phẩm để tạo khuyến mãi.");
            return;
        }
        setIsCreatePromotionModalOpen(true);
    };

    const handlePromotionCreated = () => {
        setIsCreatePromotionModalOpen(false);
    };

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = visibleProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(visibleProducts.length / productsPerPage);

    return (
        <div>
            <Header />
            <ToastContainer />
            <div className="p-6 bg-white rounded-lg shadow-md">
                <div className="mb-4 flex flex-wrap gap-4 justify-between items-center">
                    <select
                        className="p-2 border rounded"
                        value={selectedWarehouse || ""}
                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                    >
                        {warehouses.map(warehouse => (
                            <option key={warehouse.warehousesId} value={warehouse.warehousesId}>
                                {warehouse.name}
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        className="p-2 border rounded w-1/3"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={() => {
                            if (isEditingPrice) handleSavePrices();
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
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={showOnlyLossProducts}
                        onChange={(e) => handleToggleShowLoss(e.target.checked)}
                    />
                    <label>Chỉ hiển thị sản phẩm lỗ</label>
                </div>

                {hasLossProducts && (
                    <div className="bg-yellow-200 text-yellow-800 font-medium p-3 rounded mb-4">
                        ⚠️ Có sản phẩm đang bán thấp hơn giá nhập! Vui lòng kiểm tra lại.
                    </div>
                )}

<table className="w-full bg-white shadow-md rounded text-center">
    <thead className="bg-gray-100">
        <tr>
            <th><input type="checkbox" onChange={handleSelectAll} checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0} /></th>
            <th>Mã</th>
            <th>Tên</th>
            <th>Tồn kho</th>
            <th>Tối thiểu</th>
            <th>Giá nhập</th>
            <th>Giá lẻ</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
        </tr>
    </thead>
    <tbody>
        {currentProducts.length > 0 ? currentProducts.map(product => {
            const purchasePrice = parseFloat(updatedPrices[product.productsId]?.NewPurchasePrice || product.purchasePrice);
            const retailPrice = parseFloat(updatedPrices[product.productsId]?.NewRetailPrice || product.retailPrice);
            const isLowStock = product.quantity < product.minQuantity;

            // Kiểm tra nếu giá bán <= giá nhập
            const isPriceLessThanOrEqual = retailPrice <= purchasePrice;

            let rowClass = "";
            if (isPriceLessThanOrEqual) rowClass = "bg-yellow-100"; // Highlight vàng nếu giá bán <= giá nhập
            else if (isLowStock) rowClass = "bg-red-100";

            return (
                <tr key={product.productsId} className={rowClass}>
                    <td><input type="checkbox" checked={selectedProducts.some(p => p.productsId === product.productsId)} onChange={() => handleCheckboxChange(product)} /></td>
                    <td>{product.productsId}</td>
                    <td>{product.name}</td>
                    <td className={`font-semibold ${isLowStock ? "text-red-600" : ""}`}>{product.quantity}</td>
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
                            value={updatedPrices[product.productsId]?.NewRetailPrice || product.retailPrice}
                            onChange={(e) => handlePriceChange(product.productsId, "NewRetailPrice", e.target.value)}
                            disabled={!isEditingPrice}
                        />
                    </td>
                    <td>{product.status ? "Đang bán" : "Ngừng bán"}</td>
                    <td>
                        <button
                            className={`${product.status ? "bg-red-500" : "bg-green-500"} text-white p-2 rounded`}
                            onClick={() => handleToggleStatus(product.productsId, product.status)}
                        >
                            {product.status ? "Ngưng bán" : "Mở bán"}
                        </button>
                    </td>
                </tr>
            );
        }) : (
            <tr>
                <td colSpan="9" className="p-4 text-center">Chưa có sản phẩm</td>
            </tr>
        )}
    </tbody>
</table>

                <div className="flex justify-center mt-4">
                    {[...Array(totalPages)].map((_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => setCurrentPage(index + 1)}
                            className={`px-4 py-2 mx-1 rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
                        >
                            {index + 1}
                        </button>
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

                {isAddProductModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 overflow-y-auto" onClick={() => setIsAddProductModalOpen(false)}>
                        <div className="min-h-screen flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold">➕ Thêm sản phẩm vào kho</h3>
                                    <button onClick={() => setIsAddProductModalOpen(false)} className="text-gray-600 hover:text-red-500 text-2xl">✕</button>
                                </div>
                                <AddProductsToWarehouse
                                    warehouseId={selectedWarehouse}
                                    onClose={() => setIsAddProductModalOpen(false)}
                                    onProductAdded={() => {
                                        fetchProducts();
                                        setIsAddProductModalOpen(false);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductStockForOwner;