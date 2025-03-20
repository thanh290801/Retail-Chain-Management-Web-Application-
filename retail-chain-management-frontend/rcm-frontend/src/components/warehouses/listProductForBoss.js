import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom"; // Import useNavigate nếu sử dụng React Router


const ProductStockForOwner = () => {
    const navigate = useNavigate(); // Hook để điều hướng trong React Router
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [products, setProducts] = useState([]);
    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const [updatedPrices, setUpdatedPrices] = useState({});
    const [searchTerm, setSearchTerm] = useState(""); // Giữ trạng thái search khi đổi kho
    const [showLowStock, setShowLowStock] = useState(false);

    useEffect(() => {
        fetch("https://localhost:5000/api/warehouses")
            .then(response => response.json())
            .then(data => {
                setWarehouses(data);
                if (data.length > 0) setSelectedWarehouse(data[0].warehousesId);
            })
            .catch(error => console.error("Error fetching warehouses:", error));
    }, []);

    useEffect(() => {
        if (selectedWarehouse) {
            fetch(`https://localhost:5000/api/warehouses/${selectedWarehouse}/products`)
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

    // Lọc sản phẩm theo tên
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
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

                {/* Nút Tạo Phiếu Điều Chuyển Kho */}
                <button
                    className="bg-purple-500 text-white px-4 py-2 rounded"
                    onClick={() => navigate("/warehousetransfer")} // Điều hướng đến /warehousetransfer
                >
                    Tạo phiếu điều chuyển kho
                </button>
            </div>

            {/* Bảng Sản Phẩm */}
            <table className="w-full bg-white shadow-md rounded">
                <thead className="bg-gray-100">
                    <tr>
                        <th>Mã sản phẩm</th>
                        <th>Tên sản phẩm</th>
                        <th>Tồn kho</th>
                        <th>Tồn kho tối thiểu</th>
                        <th>Giá nhập</th>
                        <th>Giá bán buôn</th>
                        <th>Giá bán lẻ</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProducts.map(product => (
                        <tr key={product.productsId} 
                            className={product.quantity < product.minQuantity ? "bg-red-100" : ""}>
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
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductStockForOwner;
