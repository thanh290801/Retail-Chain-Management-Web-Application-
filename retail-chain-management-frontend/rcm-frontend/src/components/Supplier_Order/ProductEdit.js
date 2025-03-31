import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const ProductEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState({});
    const [originalBarcode, setOriginalBarcode] = useState("");
    const [barcodeError, setBarcodeError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        axios.get(`https://localhost:5000/api/products/${id}`)
            .then((res) => {
                setProduct(res.data);
                setOriginalBarcode(res.data.barcode);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Lỗi khi lấy chi tiết sản phẩm:", err);
                alert("Không thể tải thông tin sản phẩm.");
            });
    }, [id]);

    useEffect(() => {
        if (!product.barcode || product.barcode === originalBarcode) {
            setBarcodeError("");
            return;
        }

        axios.get("https://localhost:5000/api/products")
            .then((res) => {
                const exists = res.data.some(p =>
                    p.barcode === product.barcode && p.productsId !== parseInt(id)
                );
                setBarcodeError(exists ? "Mã barcode đã tồn tại." : "");
            });
    }, [product.barcode, originalBarcode, id]);

    const handleChange = (field, value) => {
        setProduct(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (barcodeError) {
            alert("Không thể lưu. Mã barcode bị trùng.");
            return;
        }

        axios.put(`https://localhost:5000/api/products/${id}`, {
            name: product.name,
            barcode: product.barcode,
            unit: product.unit,
            weight: product.weight === "" ? null : parseFloat(product.weight),
            volume: product.volume === "" ? null : parseFloat(product.volume),
            imageUrl: product.imageUrl,
            category: product.category
        })
            .then(() => {
                alert("Cập nhật sản phẩm thành công!");
                navigate(-1);
            })
            .catch((err) => {
                console.error("Lỗi khi cập nhật sản phẩm:", err.response?.data || err.message);
                alert("Cập nhật sản phẩm thất bại.");
            });

    };

    if (isLoading) return <p>Đang tải...</p>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-xl font-bold mb-4">📝 Chỉnh sửa sản phẩm</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block mb-1 font-medium">Tên sản phẩm</label>
                    <input
                        type="text"
                        className="border rounded px-3 py-2 w-full"
                        value={product.name || ""}
                        onChange={(e) => handleChange("name", e.target.value)}
                    />
                </div>
                <div>
                    <label className="block mb-1 font-medium">Mã barcode</label>
                    <input
                        type="text"
                        className={`border rounded px-3 py-2 w-full ${barcodeError ? "border-red-500" : ""}`}
                        value={product.barcode || ""}
                        onChange={(e) => handleChange("barcode", e.target.value)}
                    />
                    {barcodeError && <p className="text-red-500 text-sm mt-1">{barcodeError}</p>}
                </div>

                <div>
                    <label className="block mb-1 font-medium">Đơn vị</label>
                    <input
                        type="text"
                        className="border rounded px-3 py-2 w-full"
                        value={product.unit || ""}
                        onChange={(e) => handleChange("unit", e.target.value)}
                        disabled
                    />
                    <select name="unit" value={product.unit} onChange={(e) => handleChange("unit", e.target.value)} className="w-full p-2 border rounded">
                        <option value="">Chọn đơn vị</option>
                        <option value="Thùng">Thùng</option>
                        <option value="Lon">Lon</option>
                        <option value="Chai">Chai</option>
                        <option value="Túi">Túi</option>
                        <option value="Hộp">Hộp</option>
                        <option value="Gói">Gói</option>
                        <option value="Dây">Dây</option>
                    </select>
                </div>
                <div>
                    <label className="block mb-1 font-medium">Nhóm hàng (category)</label>
                    <input
                        type="text"
                        className="border rounded px-3 py-2 w-full"
                        value={product.category || ""}
                        onChange={(e) => handleChange("category", e.target.value)}
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Khối lượng (gram)</label>
                    <input
                        type="number"
                        className="border rounded px-3 py-2 w-full"
                        value={product.weight || ""}
                        onChange={(e) => handleChange("weight", e.target.value)}
                    />
                </div>
                <div>
                    <label className="block mb-1 font-medium">Thể tích (ml)</label>
                    <input
                        type="number"
                        className="border rounded px-3 py-2 w-full"
                        value={product.volume || ""}
                        onChange={(e) => handleChange("volume", e.target.value)}
                    />
                </div>

                <div className="col-span-2">
                    <label className="block mb-1 font-medium">Link ảnh</label>
                    <input
                        type="text"
                        className="border rounded px-3 py-2 w-full"
                        value={product.imageUrl || ""}
                        onChange={(e) => handleChange("imageUrl", e.target.value)}
                    />
                </div>
            </div>

            {product.imageUrl && (
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-28 h-28 mt-4 object-cover border rounded shadow"
                    onError={(e) => e.target.src = "https://via.placeholder.com/100x100?text=No+Image"}
                />
            )}

            <div className="mt-6 flex justify-between items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="text-blue-600 hover:underline"
                >
                    ← Quay lại
                </button>
                <button
                    onClick={handleSubmit}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                >
                    💾 Lưu thay đổi
                </button>
            </div>
            
        </div>
    );
};

export default ProductEdit;
