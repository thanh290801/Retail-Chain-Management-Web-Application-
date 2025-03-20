import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const WarehouseTransfer = () => {
    const [warehouses, setWarehouses] = useState([]);
    const [sourceWarehouse, setSourceWarehouse] = useState("");
    const [destinationWarehouse, setDestinationWarehouse] = useState("");
    const [products, setProducts] = useState([]);
    const [transferList, setTransferList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    const [accountId, setAccountId] = useState(null);

    // Lấy AccountID từ token
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setAccountId(decodedToken.AccountId);
            } catch (error) {
                console.error("Lỗi khi decode token:", error);
            }
        }
    }, []);

    // Fetch danh sách kho
    useEffect(() => {
        fetch("https://localhost:5000/api/warehouses")
            .then(response => response.json())
            .then(data => setWarehouses(data))
            .catch(error => console.error("Error fetching warehouses:", error));
    }, []);

    // Fetch danh sách sản phẩm có thể điều chuyển
    const fetchProductsForTransfer = () => {
        if (sourceWarehouse && destinationWarehouse) {
            fetch(`https://localhost:5000/api/warehouses/available-products?sourceWarehouseId=${sourceWarehouse}&destinationWarehouseId=${destinationWarehouse}`)
                .then(response => response.json())
                .then(data => {
                    console.log("Sản phẩm nhận được từ API:", data);
                    setProducts(data);
                })
                .catch(error => console.error("Error fetching available products:", error));
        }
    };

    useEffect(() => {
        setTransferList([]);
        fetchProductsForTransfer();
    }, [sourceWarehouse, destinationWarehouse]);

    // Kiểm tra điều kiện enable nút "Tạo Phiếu Điều Chuyển"
    useEffect(() => {
        const allQuantitiesValid = transferList.length > 0 &&
            transferList.every(p => p.transferQuantity > 0 && p.transferQuantity <= (p.quantity - p.minQuantity));

        setIsButtonDisabled(!sourceWarehouse || !destinationWarehouse || !allQuantitiesValid);
    }, [sourceWarehouse, destinationWarehouse, transferList]);

    // Xử lý chọn kho nguồn
    const handleSourceWarehouseChange = (warehousesId) => {
        setSourceWarehouse(warehousesId);
        if (warehousesId === destinationWarehouse) {
            setDestinationWarehouse("");
        }
        setTransferList([]);
    };

    // Xử lý chọn kho đích
    const handleDestinationWarehouseChange = (warehousesId) => {
        if (warehousesId === sourceWarehouse) return;
        setDestinationWarehouse(warehousesId);
    };

    // Xử lý thêm sản phẩm vào danh sách điều chuyển
    const handleAddToTransferList = (product) => {
        setProducts(prevProducts => prevProducts.filter(p => p.productId !== product.productId));
        setTransferList(prevTransfer => [...prevTransfer, { ...product, transferQuantity: 0 }]);
    };

    // Xử lý xóa sản phẩm khỏi danh sách điều chuyển
    const handleRemoveFromTransferList = (product) => {
        setTransferList(prevTransfer => prevTransfer.filter(p => p.productId !== product.productId));
        setProducts(prevProducts => [...prevProducts, product]);
    };

    // Xử lý cập nhật số lượng điều chuyển
    const handleQuantityChange = (productId, quantity, maxQuantity) => {
        if (quantity < 0 || quantity > maxQuantity) return;
        setTransferList(prevTransfer =>
            prevTransfer.map(p => p.productId === productId ? { ...p, transferQuantity: quantity } : p)
        );
    };

    // Gửi yêu cầu điều chuyển kho
    const handleTransfer = () => {
        if (isButtonDisabled || !accountId) {
            console.error("❌ Không thể tạo phiếu điều chuyển. Kiểm tra thông tin nhập.");
            return;
        }
    
        if (transferList.length === 0) {
            alert("⚠️ Vui lòng chọn ít nhất một sản phẩm để điều chuyển.");
            return;
        }
    
        const transferPayload = {
            sourceWarehouseId: parseInt(sourceWarehouse),
            destinationWarehouseId: parseInt(destinationWarehouse),
            createdBy: accountId,
            items: transferList.map(p => ({
                productId: p.productId,
                quantity: parseInt(p.transferQuantity, 10)
            }))
        };
    
        console.log("📤 Payload gửi lên API:", transferPayload);
    
        fetch("https://localhost:5000/api/warehouses/transfer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transferPayload)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(`Lỗi API: ${err.message || response.statusText}`);
                });
            }
            return response.json();
        })
        .then(() => {
            alert("✅ Tạo phiếu điều chuyển thành công!");
            setSourceWarehouse("");
            setDestinationWarehouse("");
            setTransferList([]);
            fetchProductsForTransfer();
        })
        .catch(error => console.error("❌ Lỗi khi tạo phiếu điều chuyển:", error.message));
    };
    

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">🔄 Tạo Phiếu Điều Chuyển Kho</h2>

            <div className="flex space-x-4">
                <div className="w-1/2">
                    <label className="block font-medium">Kho nguồn:</label>
                    <select className="p-2 border rounded w-full" value={sourceWarehouse} onChange={(e) => handleSourceWarehouseChange(e.target.value)}>
                        <option value="">-- Chọn kho nguồn --</option>
                        {warehouses.map(wh => <option key={wh.warehousesId} value={wh.warehousesId}>{wh.name}</option>)}
                    </select>
                </div>

                <div className="w-1/2">
                    <label className="block font-medium">Kho đích:</label>
                    <select className="p-2 border rounded w-full" value={destinationWarehouse} onChange={(e) => handleDestinationWarehouseChange(e.target.value)}>
                        <option value="">-- Chọn kho đích --</option>
                        {warehouses
                            .filter(wh => wh.warehousesId !== sourceWarehouse)
                            .map(wh => <option key={wh.warehousesId} value={wh.warehousesId}>{wh.name}</option>)
                        }
                    </select>
                </div>
            </div>

            <div className="mt-6">
                <input type="text" placeholder="Tìm kiếm sản phẩm..." className="p-2 border rounded w-full mb-4"
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="flex">
                {/* Danh sách sản phẩm */}
                <div className="w-1/2 pr-2">
                    <h3 className="text-lg font-semibold mb-3">📋 Danh sách sản phẩm</h3>
                    <table className="w-full bg-white shadow-md rounded">
                        <thead className="bg-gray-100">
                            <tr>
                                <th>Mã</th><th>Tên</th><th>Đơn vị</th><th>Tồn kho</th><th>Tồn kho tối thiểu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.productId} onClick={() => handleAddToTransferList(product)} className="cursor-pointer hover:bg-gray-200">
                                    <td>{product.productId}</td>
                                    <td>{product.name}</td>
                                    <td>{product.unit}</td>
                                    <td>{product.quantity}</td>
                                    <td>{product.minQuantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Danh sách điều chuyển */}
                <div className="w-1/2 pl-2">
                    <h3 className="text-lg font-semibold mb-3">📦 Danh sách điều chuyển</h3>
                    <table className="w-full bg-white shadow-md rounded">
                        <thead className="bg-gray-100">
                            <tr>
                                <th>Mã</th><th>Tên</th><th>SL điều chuyển</th><th>Tồn kho</th><th>Tồn kho tối thiểu</th><th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {transferList.map(product => (
                                <tr key={product.productId}>
                                    <td>{product.productId}</td>
                                    <td>{product.name}</td>
                                    <td>
                                        <input type="number" min="0" max={product.quantity - product.minQuantity}
                                            value={product.transferQuantity || 0}
                                            onChange={(e) => handleQuantityChange(product.productId, e.target.value, product.quantity - product.minQuantity)}
                                        />
                                    </td>
                                    <td>{product.quantity}</td>
                                    <td>{product.minQuantity}</td>
                                    <td><button onClick={() => handleRemoveFromTransferList(product)}>❌</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
               
            </div>
            <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded w-full" disabled={isButtonDisabled} onClick={handleTransfer}>
                    ✅ Tạo Phiếu Điều Chuyển
                </button>
        </div>
    );
};

export default WarehouseTransfer;
