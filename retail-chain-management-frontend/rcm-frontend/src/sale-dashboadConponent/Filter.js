import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import axios from 'axios';

const Filter = ({ onFilterChange }) => {
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [categories, setCategories] = useState([]);

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedWarehouses, setSelectedWarehouses] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);

    useEffect(() => {
        fetchProducts();
        fetchWarehouses();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        const response = await axios.get('http://localhost:5000/api/products');
        setProducts([{ value: 'all', label: 'Tất cả' }, ...response.data.map(p => ({ value: p.ProductsId, label: p.Name }))]);
    };

    const fetchWarehouses = async () => {
        const response = await axios.get('http://localhost:5000/api/warehouses');
        setWarehouses(response.data.map(w => ({ value: w.WarehousesId, label: w.Name })));
    };

    const fetchCategories = async () => {
        const response = await axios.get('http://localhost:5000/api/products/categories');
        setCategories([{ value: 'all', label: 'Tất cả' }, ...response.data.map(c => ({ value: c, label: c }))]);
    };

    useEffect(() => {
        onFilterChange({
            product: selectedProduct,
            warehouses: selectedWarehouses.map(w => w.value),
            category: selectedCategories.map(c => c.value)
        });
    }, [selectedProduct, selectedWarehouses, selectedCategories, onFilterChange]);

    return (
        <div>
             <h2 className="text-2xl font-bold mb-4">Dashboard Bán Hàng</h2>
            <h3 className="text-lg font-semibold mb-2">Mặt hàng</h3>
            <Select options={products} onChange={setSelectedProduct} placeholder="Chọn mặt hàng" />
            <h3 className="text-lg font-semibold mb-2">Chi nhánh</h3> 
            <Select options={warehouses} onChange={setSelectedWarehouses} isMulti placeholder="Chọn chi nhánh" />
            <h3 className="text-lg font-semibold mb-2">Nhóm hàng hóa</h3> 
            <Select options={categories} onChange={setSelectedCategories} isMulti placeholder="Chọn nhóm hàng" />
        </div>
    );
};

export default Filter;
