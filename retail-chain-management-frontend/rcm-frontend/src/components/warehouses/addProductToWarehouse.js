import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../../headerComponent/header";

const AddProductsToWarehouse = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [priceData, setPriceData] = useState({});

  useEffect(() => {
    axios.get("https://localhost:5000/api/addtostock/warehouses")
      .then(response => {
        setWarehouses(response.data);
        if (response.data.length > 0) setSelectedWarehouse(response.data[0].warehousesId);
      })
      .catch(error => console.error("Error fetching warehouses:", error));
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      axios.get(`https://localhost:5000/api/addtostock/${selectedWarehouse}/products-not-in-stock`)
        .then(response => setProducts(response.data))
        .catch(error => console.error("Error fetching products:", error));
    }
  }, [selectedWarehouse]);

  const handleProductSelect = (productId) => {
    if (!selectedProducts.includes(productId)) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    }
  };

  const handlePriceChange = (productId, field, value) => {
    setPriceData((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value }
    }));
  };

  const handleAddProducts = () => {
    const productDtos = selectedProducts.map((productId) => ({
      ProductId: productId,
      PurchasePrice: parseFloat(priceData[productId]?.PurchasePrice || 0),
      WholesalePrice: parseFloat(priceData[productId]?.WholesalePrice || 0),
      RetailPrice: parseFloat(priceData[productId]?.RetailPrice || 0)
    }));

    axios.post(`https://localhost:5000/api/addtostock/${selectedWarehouse}/add-products`, productDtos)
      .then(() => {
        alert("Sản phẩm đã được thêm vào kho thành công!");
        setSelectedProducts([]);
        setPriceData({});
        navigate("/ownerproductstock");
      })
      .catch(error => console.error("Error adding products to warehouse:", error));
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Header />
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">➕ Thêm sản phẩm vào kho</h2>

        <div className="mb-4">
          <label>🏬 Chọn kho: </label>
          <select className="p-2 border rounded" value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)}>
            {warehouses.map(warehouse => (
              <option key={warehouse.warehousesId} value={warehouse.warehousesId}>{warehouse.name}</option>
            ))}
          </select>
        </div>

        <input 
          type="text" 
          placeholder="Tìm kiếm sản phẩm..." 
          className="p-2 border rounded w-full mb-4" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {filteredProducts.length === 0 ? (
          <p className="text-gray-500">Không có sản phẩm nào để thêm vào kho này.</p>
        ) : (
          <table className="w-full bg-white shadow-md rounded">
            <thead className="bg-gray-100">
              <tr>
                <th>Chọn</th>
                <th>Mã sản phẩm</th>
                <th>Tên sản phẩm</th>
                <th>Giá nhập</th>
                <th>Giá bán buôn</th>
                <th>Giá bán lẻ</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.productsId}>
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
                    <input type="number" placeholder="Giá nhập" onChange={(e) => handlePriceChange(product.productsId, 'PurchasePrice', e.target.value)} />
                  </td>
                  <td>
                    <input type="number" placeholder="Giá bán buôn" onChange={(e) => handlePriceChange(product.productsId, 'WholesalePrice', e.target.value)} />
                  </td>
                  <td>
                    <input type="number" placeholder="Giá bán lẻ" onChange={(e) => handlePriceChange(product.productsId, 'RetailPrice', e.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button 
          className="bg-green-500 text-white p-2 mt-4 rounded" 
          onClick={handleAddProducts}
          disabled={selectedProducts.length === 0}
        >
          ➕ Thêm sản phẩm vào kho
        </button>
      </div>
    </div>
  );
};

export default AddProductsToWarehouse;
