import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";

const ProductDetail = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    


    useEffect(() => {
        axios.get(`https://localhost:5000/api/Product/${productId}`)
            .then(res => setProduct(res.data))
            .catch(err => {
                console.error("Lỗi khi lấy chi tiết sản phẩm:", err);
                alert("Không thể lấy thông tin sản phẩm.");
            });
    }, [productId]);

    if (!product) return <div className="p-6">Đang tải...</div>;

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">📦 Chi tiết sản phẩm</h2>

            <div className="flex gap-6 items-start mb-6">
                <img
                    src={product.imageUrl || "/no-image.png"}
                    onError={(e) => e.target.src = "/no-image.png"}
                    alt={product.name}
                    className="w-40 h-40 object-cover border rounded"
                />

                <div className="flex-1 space-y-2">
                    <p><strong>Tên sản phẩm:</strong> {product.name}</p>
                    <p><strong>Mã barcode:</strong> {product.barcode}</p>
                    <p><strong>Đơn vị:</strong> {product.unit}</p>
                    <p><strong>Nhóm hàng:</strong> {product.category || "Không có"}</p>
                    <p><strong>Khối lượng:</strong> {product.weight ?? "Chưa nhập"} </p>
                    <p><strong>Thể tích:</strong> {product.volume ?? "Chưa nhập"} </p>
                    <p>
                        <strong>Trạng thái:</strong>{" "}
                        <span className={`px-2 py-1 rounded text-white text-sm ${product.isEnabled ? 'bg-green-500' : 'bg-gray-500'}`}>
                            {product.isEnabled ? "Đang hoạt động" : "Đã vô hiệu hóa"}
                        </span>
                    </p>
                </div>
            </div>
            
            
                <Button
                    variant="secondary"
                    className="fw-semibold px-4 py-2 rounded-pill shadow-sm"
                    onClick={() => navigate(-1)}
                >
                    ← Quay lại
                </Button>
            
            
            <Button
                variant="success"
                className="fw-semibold px-4 py-2 rounded-pill shadow-sm ms-3"
                onClick={() => navigate(`/ProductEdit/${productId}`)}
            >
                ✏️ Sửa
            </Button>

                
            
        </div>
    );
};

export default ProductDetail;
