import React, { useState } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import Cart from './cart';
import Calculator from './calculator';
import './main.css';

const productList = [
    { id: 1, name: 'Hoa Yến Mạch', price: 170000, unit: 'Bó', barcode: '123456789' },
    { id: 2, name: 'Lọ hoa gốm trang trí - S', price: 600000, unit: 'Chiếc', barcode: '987654321' },
    { id: 3, name: 'Bình hoa thủy tinh', price: 250000, unit: 'Chiếc', barcode: '555555555' },
    { id: 4, name: 'Hoa cẩm tú cầu', price: 200000, unit: 'Bó', barcode: '111222333' }
];

const Main = () => {
    const [cartData, setCartData] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleUpdateCart = (updatedCart) => {
        setCartData(updatedCart);
    };

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
        setShowSuggestions(true);
    };

    const handleAddProductToCart = (product) => {
        const existingProduct = cartData.find(item => item.id === product.id);
        let updatedCart;

        if (existingProduct) {
            updatedCart = cartData.map(item =>
                item.id === product.id
                    ? { ...item, quantity: (parseFloat(item.quantity) + 1).toString() }
                    : item
            );
        } else {
            updatedCart = [...cartData, { ...product, quantity: '1' }];
        }

        setCartData(updatedCart);
        setSearchText('');
        setShowSuggestions(false);
    };

    const filteredProducts = productList.filter(
        product =>
            product.name.toLowerCase().includes(searchText.toLowerCase()) ||
            product.barcode === searchText
    );

    const handleClickOutside = () => {
        setShowSuggestions(false);
    };

    return (
        <Container fluid className='page-body' onClick={handleClickOutside}>
            <Row className='tool-bar'>
                <Col md={4} className="mt-2 position-relative">
                    <Form.Control
                        type="text"
                        placeholder="Tìm kiếm sản phẩm hoặc quét mã vạch..."
                        value={searchText}
                        onChange={handleSearchChange}
                        onFocus={() => setShowSuggestions(true)}
                        className="form-control h-75"
                    />
                    {showSuggestions && searchText && (
                        <div
                            className="search-suggestions border bg-white shadow mt-2 position-absolute w-100"
                            style={{
                                maxHeight: '200px',
                                overflowY: 'auto',
                                zIndex: 10,
                                borderRadius: '4px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(product => (
                                    <div
                                        key={product.id}
                                        onClick={() => handleAddProductToCart(product)}
                                        className="p-2 border-bottom cursor-pointer hover-bg-light"
                                    >
                                        {product.name} - {product.price.toLocaleString()} VND
                                    </div>
                                ))
                            ) : (
                                <div className="p-2 text-muted">Không tìm thấy sản phẩm nào</div>
                            )}
                        </div>
                    )}
                </Col>
            </Row>
            <Row>
                <Col md={8} className='mt-2'>
                    <Container className='item-card left-item'>
                        <Cart cartData={cartData} onUpdateCart={handleUpdateCart} />
                    </Container>
                </Col>
                <Col md={4} className='mt-2'>
                    <Container className='item-card right-item'>
                        <Calculator cartData={cartData} />
                    </Container>
                </Col>
            </Row>
        </Container>
    );
};

export default Main;
