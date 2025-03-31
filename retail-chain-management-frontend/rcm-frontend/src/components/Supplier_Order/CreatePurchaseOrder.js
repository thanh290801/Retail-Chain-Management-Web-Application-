import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaTrash } from "react-icons/fa";
import Header from "../../headerComponent/header";

const CreatePurchaseOrder = () => {
    const [branches, setBranches] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState("");
    const [selectedSupplier, setSelectedSupplier] = useState("");
    const [products, setProducts] = useState([]);
    const [orderItems, setOrderItems] = useState([]);
    const [searchProduct, setSearchProduct] = useState("");
    const [searchSupplier, setSearchSupplier] = useState("");
    const [notes, setNotes] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("https://localhost:5000/api/Warehouses")
            .then((res) => setBranches(res.data))
            .catch((err) => console.error("Lỗi lấy chi nhánh:", err));
    }, []);
   

    useEffect(() => {
        axios.get("https://localhost:5000/api/Supplier")
            .then((res) => setSuppliers(res.data))
            .catch((err) => console.error("Lỗi lấy nhà cung cấp:", err));
    }, []);
    useEffect(() => {
        setFilteredSuppliers(suppliers.filter(s => s.name.toLowerCase().includes(searchSupplier.toLowerCase())));
    }, [searchSupplier, suppliers]);

    useEffect(() => {
        setFilteredProducts(products);
    }, [products]);

    useEffect(() => {
        const filtered = products.filter((p) =>
            (p.productName || "").toLowerCase().includes(searchProduct.toLowerCase())
        );
        setFilteredProducts(filtered);
    }, [searchProduct, products]);



    useEffect(() => {
        if (selectedBranch && selectedSupplier) {
            axios.get(`https://localhost:5000/api/StockLevels/GetAvailableProducts?supplierId=${selectedSupplier}&warehouseId=${selectedBranch}`)
                .then((res) => {
                    if (res.data.length > 0) {
                        setProducts(res.data);
                    } else {
                        setProducts([]);  // Giữ bảng sản phẩm rỗng thay vì mất luôn
                    }
                })
                .catch((err) => {
                    console.error("Lỗi lấy sản phẩm:", err);
                    setProducts([]);
                });
        } else {
            setProducts([]);  // Khi chưa chọn, vẫn giữ bảng sản phẩm
        }
    }, [selectedBranch, selectedSupplier]);

    const handleAddProduct = (product) => {
        setOrderItems((prev) => {
            // Kiểm tra nếu sản phẩm đã tồn tại trong danh sách order
            if (prev.some(item => item.productId === product.productId)) {
                return prev.map(item =>
                    item.productId === product.productId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    
        // Loại bỏ sản phẩm khỏi danh sách sản phẩm hiển thị
        setFilteredProducts((prev) => prev.filter(p => p.productId !== product.productId));
    };
    
    const handleRemoveProduct = (productId) => {
        // Xoá sản phẩm khỏi danh sách order
        const removedProduct = orderItems.find(item => item.productId === productId);
        setOrderItems(prev => prev.filter(item => item.productId !== productId));
    
        // Thêm sản phẩm trở lại danh sách sản phẩm hiển thị
        if (removedProduct) {
            setFilteredProducts((prev) => [...prev, removedProduct]);
        }
    };
    

    const handleQuantityChange = (index, value) => {
        setOrderItems(prev => {
            const updatedItems = [...prev];
            updatedItems[index].quantity = Math.max(1, parseInt(value) || 1);
            return updatedItems;
        });
    };

    const calculateTotal = (item) => (item.quantity || 0) * (item.purchasePrice || 0);
    const totalAmount = orderItems.reduce((sum, item) => sum + calculateTotal(item), 0);

    const formatDateVN = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    const handleCreateOrder = () => {
        const payload = {
            supplierId: selectedSupplier,
            branchId: selectedBranch,
            notes: notes,
            items: orderItems.map(item => ({
                productId: item.productId,
                quantityOrdered: item.quantity,
                price: item.purchasePrice
            }))
        };

        axios.post("https://localhost:5000/api/PurchaseOrders/Create", payload)
            .then((res) => {
                alert("Đơn hàng được tạo thành công!");
                navigate("/ownerorderlist");
            })
            .catch(err => {
                console.error("Lỗi khi tạo đơn hàng:", err.response?.data || err.message);
                alert("Có lỗi xảy ra khi tạo đơn hàng.");
            });
    };



    return (
        <div>
            <Header/>
            <div className="container mx-auto p-6">
            <h2 className="text-2xl font-semibold mb-4">🛒 Tạo đơn đặt hàng</h2>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="font-medium">🏬 Chọn chi nhánh:</label>
                    <select className="border p-2 w-full" value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                        <option value="">Chọn chi nhánh</option>
                        {branches.map(branch => <option key={branch.warehousesId} value={branch.warehousesId}>{branch.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="font-semibold">📑 Nhà cung cấp:</label>
                    <input type="text" className="w-full p-2 border rounded" value={searchSupplier} placeholder="Tìm nhà cung cấp..." onChange={(e) => setSearchSupplier(e.target.value)} />
                    <select className="w-full p-2 border rounded" value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
                        <option value="">Chọn nhà cung cấp</option>
                        {filteredSuppliers.map(supplier => <option key={supplier.suppliersId} value={supplier.suppliersId}>{supplier.name}</option>)}
                    </select>
                </div>
            </div>

            <h3 className="text-lg font-semibold mt-6">📦 Danh sách sản phẩm</h3>
            <input type="text" className="border p-2 w-full mb-2" value={searchProduct} onChange={(e) => setSearchProduct(e.target.value)} placeholder="🔍 Tìm sản phẩm..." />

            {filteredProducts.length === 0 ? (
                <p className="text-gray-500">Không có sản phẩm nào khả dụng cho nhà cung cấp này.</p>
            ) : (
                <table className="w-full border">
                    <thead>
                        <tr className="bg-gray-200">
                            <th>Sản phẩm</th><th>Đơn vị</th><th>Giá nhập</th><th>Chọn</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
                            <tr key={product.productId}>
                                <td>{product.productName}</td>
                                <td>{product.unit}</td>
                                <td>{product.purchasePrice.toLocaleString()} VNĐ</td>
                                <td>
                                    <button
                                        className="bg-blue-500 text-white p-2 rounded"
                                        onClick={() => handleAddProduct(product)}
                                    >
                                        Chọn
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}


            <h3 className="text-lg font-semibold mt-6">🛍️ Sản phẩm đã chọn</h3>
            {orderItems.length === 0 ? <p className="text-gray-500">Chưa có sản phẩm nào được chọn.</p> : (
                <table className="w-full border">
                    <thead>
                        <tr className="bg-gray-200">
                            <th>Sản phẩm</th><th>Số lượng</th><th>Đơn vị</th><th>Giá nhập</th><th>Thành tiền</th><th>Xóa</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orderItems.map((item, index) => (
                            <tr key={item.productId}>
                                <td>{item.productName}</td>
                                
                                <td>
                                    <input
                                        type="number"
                                        className="border w-16 text-center"
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                                    />
                                </td>
                                <td>{item.unit}</td>
                                <td>{item.purchasePrice.toLocaleString()} VNĐ</td>
                                <td>{calculateTotal(item).toLocaleString()} VNĐ</td>
                                <td>
                                    <button className="text-red-600" onClick={() => handleRemoveProduct(item.productId)}>
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <div className="mt-4">
                <label className="font-medium block mb-1">📝 Ghi chú đơn hàng:</label>
                <textarea
                    className="w-full border rounded p-2"
                    rows={3}
                    placeholder="Nhập ghi chú đơn hàng (nếu có)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            <h3 className="text-lg font-bold mt-6">💰 Tổng tiền: {totalAmount.toLocaleString()} VNĐ</h3>
            <td>
            <button
                className="bg-green-600 text-white p-3 rounded mt-4"
                onClick={handleCreateOrder}
            >
                🛒 Tạo đơn đặt hàng
            </button>
            <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate("/ownerorderlist")}>
                ⬅️ Danh sách đơn hàng
            </button></td>

        </div>
        </div>
    );
};

export default CreatePurchaseOrder;
