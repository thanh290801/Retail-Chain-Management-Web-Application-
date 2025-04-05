import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import Header from "../../headerComponent/header";

const WarehouseTransfer = () => {
    const navigate = useNavigate();
    const [warehouses, setWarehouses] = useState([]);
    const [sourceWarehouse, setSourceWarehouse] = useState("");
    const [destinationWarehouse, setDestinationWarehouse] = useState("");
    const [products, setProducts] = useState([]);
    const [transferList, setTransferList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    const [accountId, setAccountId] = useState(null);

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

    useEffect(() => {
        fetch("https://localhost:5000/api/warehouse")
            .then(response => response.json())
            .then(data => setWarehouses(data))
            .catch(error => console.error("Lỗi khi lấy danh sách kho:", error));
    }, []);

    const fetchProductsForTransfer = () => {
        if (sourceWarehouse && destinationWarehouse) {
            fetch(`https://localhost:5000/api/warehouse/available-products?sourceWarehouseId=${sourceWarehouse}&destinationWarehouseId=${destinationWarehouse}`)
                .then(response => response.json())
                .then(data => {
                    setProducts(data);
                    setTransferList([]);
                })
                .catch(error => console.error("Lỗi khi lấy sản phẩm có thể điều chuyển:", error));
        }
    };

    useEffect(() => {
        fetchProductsForTransfer();
    }, [sourceWarehouse, destinationWarehouse]);

    useEffect(() => {
        const allValid = transferList.length > 0 &&
            transferList.every(p => p.transferQuantity > 0 && p.transferQuantity <= (p.quantity - p.minQuantity));
        setIsButtonDisabled(!sourceWarehouse || !destinationWarehouse || !allValid);
    }, [sourceWarehouse, destinationWarehouse, transferList]);

    const handleSourceWarehouseChange = (id) => {
        setSourceWarehouse(id);
        if (id === destinationWarehouse) setDestinationWarehouse("");
        setTransferList([]);
    };

    const handleDestinationWarehouseChange = (id) => {
        if (id === sourceWarehouse) return;
        setDestinationWarehouse(id);
    };

    const handleAddProduct = (product) => {
        setProducts(prev => prev.filter(p => p.productId !== product.productId));
        setTransferList(prev => [...prev, { ...product, transferQuantity: 0 }]);
    };

    const handleRemoveProduct = (product) => {
        setTransferList(prev => prev.filter(p => p.productId !== product.productId));
        setProducts(prev => [...prev, product]);
    };

    const handleQuantityChange = (productId, quantity, max) => {
        const safeQty = Math.min(Math.max(0, quantity), max);
        setTransferList(prev =>
            prev.map(p => p.productId === productId ? { ...p, transferQuantity: safeQty } : p)
        );
    };

    const handleTransfer = async () => {
        if (!accountId || isButtonDisabled || transferList.length === 0) {
            alert("Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        const payload = {
            sourceWarehouseId: parseInt(sourceWarehouse),
            destinationWarehouseId: parseInt(destinationWarehouse),
            createdBy: accountId,
            items: transferList.map(p => ({
                productId: p.productId,
                quantity: p.transferQuantity
            }))
        };

        try {
            const res = await fetch("https://localhost:5000/api/warehouse/transfer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Tạo phiếu điều chuyển thất bại.");
            }

            alert("✅ Tạo phiếu điều chuyển thành công.");
            navigate("/ownerproductstock");
        } catch (error) {
            console.error("❌ Lỗi khi tạo phiếu điều chuyển:", error.message);
        }
    };

    return (
        <div>
            <Header />
            <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">🔁 Tạo Phiếu Điều Chuyển Kho</h2>

                <div className="flex gap-4">
                    <div className="w-1/2">
                        <label className="block font-medium">Kho nguồn:</label>
                        <select className="w-full p-2 border rounded" value={sourceWarehouse} onChange={(e) => handleSourceWarehouseChange(e.target.value)}>
                            <option value="">-- Chọn kho nguồn --</option>
                            {warehouses.map(w => <option key={w.warehousesId} value={w.warehousesId}>{w.name}</option>)}
                        </select>
                    </div>
                    <div className="w-1/2">
                        <label className="block font-medium">Kho đích:</label>
                        <select className="w-full p-2 border rounded" value={destinationWarehouse} onChange={(e) => handleDestinationWarehouseChange(e.target.value)}>
                            <option value="">-- Chọn kho đích --</option>
                            {warehouses
                                .filter(w => w.warehousesId !== parseInt(sourceWarehouse))
                                .map(w => <option key={w.warehousesId} value={w.warehousesId}>{w.name}</option>)}
                        </select>
                    </div>
                </div>

                <input type="text" className="w-full p-2 border my-4" placeholder="🔍 Tìm sản phẩm..."
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />

                <div className="flex gap-4">
                    <div className="w-1/2">
                        <h3 className="font-semibold mb-2">📋 Sản phẩm có thể điều chuyển</h3>
                        <table className="w-full border text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th>Mã</th><th>Tên</th><th>Tồn</th><th>Tối thiểu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products
                                    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map(p => (
                                        <tr key={p.productId} className="cursor-pointer hover:bg-gray-200" onClick={() => handleAddProduct(p)}>
                                            <td>{p.productId}</td>
                                            <td>{p.name}</td>
                                            <td>{p.quantity}</td>
                                            <td>{p.minQuantity}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="w-1/2">
                        <h3 className="font-semibold mb-2">📦 Sản phẩm sẽ điều chuyển</h3>
                        <table className="w-full border text-sm">
                            <thead className="bg-gray-100">
                                <tr><th>Mã</th><th>Tên</th><th>SL</th><th>Tồn</th><th>Tối thiểu</th><th></th></tr>
                            </thead>
                            <tbody>
                                {transferList.map(p => (
                                    <tr key={p.productId}>
                                        <td>{p.productId}</td>
                                        <td>{p.name}</td>
                                        <td>
                                            <input
                                                type="number"
                                                value={p.transferQuantity}
                                                min="0"
                                                max={p.quantity - p.minQuantity}
                                                onChange={e => handleQuantityChange(p.productId, parseInt(e.target.value), p.quantity - p.minQuantity)}
                                                className="w-16 p-1 border rounded text-center"
                                            />
                                        </td>
                                        <td>{p.quantity}</td>
                                        <td>{p.minQuantity}</td>
                                        <td><button onClick={() => handleRemoveProduct(p)}>❌</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <button disabled={isButtonDisabled} onClick={handleTransfer}
                    className={`mt-4 w-full py-2 rounded text-white ${isButtonDisabled ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}>
                    ✅ Tạo Phiếu Điều Chuyển
                </button>
            </div>
        </div>
    );
};

export default WarehouseTransfer;
