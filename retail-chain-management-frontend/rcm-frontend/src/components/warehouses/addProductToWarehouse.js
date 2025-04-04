import React, { useEffect, useState } from "react";
import axios from "axios";

const AddProductToWarehouseForm = ({ warehouseId, onClose, onProductAdded }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [priceData, setPriceData] = useState({});

  useEffect(() => {
    if (warehouseId) {
      axios
        .get(`https://localhost:5000/api/addtostock/${warehouseId}/products-not-in-stock`)
        .then((res) => setProducts(res.data))
        .catch((err) => console.error("Lỗi khi tải sản phẩm:", err));
    }
  }, [warehouseId]);

  const handleProductSelect = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handlePriceChange = (productId, field, value) => {
    setPriceData((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));
  };

  const handleAddProducts = () => {
    const productDtos = selectedProducts.map((productId) => ({
      ProductId: productId,
      PurchasePrice: parseFloat(priceData[productId]?.PurchasePrice || 0),
      RetailPrice: parseFloat(priceData[productId]?.RetailPrice || 0),
    }));

    axios
      .post(`https://localhost:5000/api/addtostock/${warehouseId}/add-products`, productDtos)
      .then(() => {
        alert("✅ Thêm sản phẩm vào kho thành công!");
        setSelectedProducts([]);
        setPriceData({});
        if (onProductAdded) onProductAdded(); // ✅ Gọi callback khi thêm xong
      })
      .catch((error) => {
        console.error("❌ Lỗi khi thêm sản phẩm:", error);
        alert("⚠️ Thêm sản phẩm thất bại!");
      });
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <input
        type="text"
        placeholder="🔍 Tìm sản phẩm..."
        className="p-2 border rounded w-full mb-4"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {filteredProducts.length === 0 ? (
        <p className="text-gray-500">Không còn sản phẩm nào để thêm.</p>
      ) : (
        <table className="w-full text-sm text-center border">
          <thead className="bg-gray-100">
            <tr>
              <th>Chọn</th>
              <th>Mã SP</th>
              <th>Tên SP</th>
              <th>Giá nhập</th>
              <th>Giá lẻ</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.productsId} className="border-t">
                <td>
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.productsId)}
                    onChange={() => handleProductSelect(product.productsId)}
                  />
                </td>
                <td>{product.productsId}</td>
                <td>{product.name}</td>
                <td>
                  <input
                    type="number"
                    className="w-20 p-1 border rounded"
                    onChange={(e) =>
                      handlePriceChange(product.productsId, "PurchasePrice", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="w-20 p-1 border rounded"
                    onChange={(e) =>
                      handlePriceChange(product.productsId, "RetailPrice", e.target.value)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex justify-end mt-4">
        <button
          className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
          onClick={onClose}
        >
          ❌ Hủy
        </button>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={handleAddProducts}
          disabled={selectedProducts.length === 0}
        >
          ➕ Thêm vào kho
        </button>
      </div>
    </div>
  );
};

export default AddProductToWarehouseForm;
