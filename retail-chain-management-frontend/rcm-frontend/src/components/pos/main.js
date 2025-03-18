
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Form, Button, ButtonGroup, Modal } from 'react-bootstrap';
import Cart from './cart';
import Calculator from './calculator';
import ReturnInvoiceModal from './returnInvoiceModal'; // Không dùng dấu ngoặc nhọn {}
import { BsX, BsPlus } from 'react-icons/bs';
import './main.css';
import { data, useNavigate } from "react-router-dom";
import { IoArrowBackOutline } from "react-icons/io5";
import axios from 'axios';

const API_BASE_URL = "http://localhost:5000/api/sale-invoice";

const Main = () => {
    const [invoices, setInvoices] = useState({
        'Hóa đơn 1': { cart: [], cashGiven: 0, change: 0, paymentMethod: 'cash' }
    });
    const navigate = useNavigate();
    const [currentInvoice, setCurrentInvoice] = useState('Hóa đơn 1');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const quantityInputRefs = useRef({});
    const [orders, setOrders] = useState([]);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [suggestedProducts, setSuggestedProducts] = useState([]); // ✅ Khai báo state để lưu sản phẩm gợi ý
    const searchInputRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);

    const [lastScanTime, setLastScanTime] = useState(0);

    const barcodeRef = useRef("");

    useEffect(() => {
        const handleGlobalKeyDown = async (e) => {
            const currentTime = new Date().getTime();

            if (currentTime - lastScanTime > 1000) {
                barcodeRef.current = "";
            }

            setLastScanTime(currentTime);

            if (e.key === 'Enter' && barcodeRef.current.trim() !== '') {
                await handleBarcodeScan(barcodeRef.current.trim());
                barcodeRef.current = "";
            } else {
                barcodeRef.current += e.key;
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []); // ✅ Không có dependency → Không bị lặp vô hạn

    // ✅ 3. Hàm xử lý hóa đơn
    const handleAddNewInvoice = () => {
        const existingNumbers = Object.keys(invoices).map(name => parseInt(name.replace('Hóa đơn ', ''))).sort((a, b) => a - b);
        let newNumber = 1;
        for (let i = 1; i <= existingNumbers.length + 1; i++) {
            if (!existingNumbers.includes(i)) {
                newNumber = i;
                break;
            }
        }
        const newInvoiceId = `Hóa đơn ${newNumber}`;
        setInvoices(prev => ({
            ...prev,
            [newInvoiceId]: { cart: [], cashGiven: 0, change: 0, paymentMethod: "cash" }
        }));
        setCurrentInvoice(newInvoiceId);
    };

    const handleSwitchInvoice = (invoiceId) => {
        setCurrentInvoice(invoiceId);
    };

    const confirmRemoveInvoice = (invoiceId) => {
        if (invoices[invoiceId]?.cart.length > 0) {
            setInvoiceToDelete(invoiceId);
            setShowConfirmModal(true);
        } else {
            handleRemoveInvoice(invoiceId);
        }
    };

    const handlePaymentMethodChange = (method) => {
        setInvoices(prev => ({
            ...prev,
            [currentInvoice]: {
                ...prev[currentInvoice],
                paymentMethod: method
            }
        }));
    };

    const handleRemoveInvoice = (invoiceId) => {
        setInvoices((prevInvoices) => {
            const updatedInvoices = { ...prevInvoices };
            delete updatedInvoices[invoiceId];

            if (Object.keys(updatedInvoices).length === 0) {
                updatedInvoices['Hóa đơn 1'] = { cart: [], cashGiven: 0, change: 0 };
                return updatedInvoices;
            }

            return updatedInvoices;
        });

        setCurrentInvoice(prev => Object.keys(invoices)[0] || 'Hóa đơn 1');
        setShowConfirmModal(false);
        setInvoiceToDelete(null);
    };

    // ✅ Hàm xử lý thay đổi input tìm kiếm
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchText(value);
        setIsLoading(true);
        setNotFound(false);

        if (value.length < 2) {
            setSuggestedProducts([]);
            setIsLoading(false);
            return;
        }

        const fetchProducts = async () => {
            try {
                const response = await axios.post(`${API_BASE_URL}/search`, {
                    Query: value.trim(),
                    WarehouseId: 1
                });

                if (response.data && response.data.length > 0) {
                    setSuggestedProducts(response.data);
                    setNotFound(false);
                } else {
                    setSuggestedProducts([]);
                    setNotFound(true);
                }
            } catch (error) {
                console.error("❌ Không tìm thấy sản phẩm:", error);
                setSuggestedProducts([]);
                setNotFound(true);
            }

            setIsLoading(false);
        };

        fetchProducts();
    };

    // ✅ Hàm xử lý quét mã vạch
    const handleBarcodeScan = async (scannedBarcode) => {
        setIsLoading(true);
        setNotFound(false);

        try {
            const response = await axios.post(`${API_BASE_URL}/barcode`, {
                Barcode: scannedBarcode,
                WarehouseId: 1
            });

            if (response.data) {
                const product = {
                    id: response.data.ProductsId || response.data.id,
                    name: response.data.productName || response.data.name,
                    price: response.data.finalPrice || response.data.price || 0,
                    unit: response.data.unit || 'Cái',
                    barcode: response.data.barcode || scannedBarcode,
                    quantity: 1
                };

                handleAddProductToCart(product);
                setNotFound(false);
            } else {
                setNotFound(true);
            }
        } catch (error) {
            console.error("❌ Lỗi khi quét mã vạch:", error);
            setNotFound(true);
        }

        setIsLoading(false);
    };

    // ✅ 5. Hàm xử lý giỏ hàng
    const handleAddProductToCart = (product) => {
        setInvoices(prev => {
            const updatedCart = [...prev[currentInvoice].cart];
            const existingProductIndex = updatedCart.findIndex(item => item.id === product.id);

            if (existingProductIndex > -1) {
                // ✅ Chuyển đổi quantity sang số nguyên, tránh tăng 2 lần
                updatedCart[existingProductIndex] = {
                    ...updatedCart[existingProductIndex],
                    quantity: parseInt(updatedCart[existingProductIndex].quantity, 10) + 1
                };
            } else {
                updatedCart.push({ ...product, quantity: 1 });
            }

            return {
                ...prev,
                [currentInvoice]: {
                    ...prev[currentInvoice],
                    cart: updatedCart
                }
            };
        });

        setSearchText('');
        setSuggestedProducts([]);

        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 100);
    };

    // ✅ 6. Hàm xử lý trả hàng
    const handleCreateReturnInvoice = (order, orderDetails) => {
        if (!order || !orderDetails) return;

        const returnInvoiceId = `Phiếu trả ${Object.keys(invoices).length + 1}`;

        const returnItems = orderDetails.map(p => ({
            orderDetailId: p.orderDetailId,  // 🔹 ID chi tiết đơn hàng
            productId: p.productId,  // 🔹 ID sản phẩm
            productName: p.productName, // 🔹 Tên sản phẩm
            quantity: p.quantity, // ✅ Số lượng mua ban đầu
            returnQuantity: 0, // ✅ Ban đầu chưa có số lượng trả
            unitPrice: p.unitPrice, // ✅ Đơn giá
            totalPrice: p.totalPrice, // ✅ Tổng giá trị ban đầu (không cần dùng khi tính toán)
        }));

        setInvoices(prev => ({
            ...prev,
            [returnInvoiceId]: { cart: returnItems, cashGiven: 0, change: 0, isReturn: true }
        }));

        setCurrentInvoice(returnInvoiceId);
    };

    const handleCashUpdate = useCallback((cashGiven, change) => {
        setInvoices((prev) => ({
            ...prev,
            [currentInvoice]: {
                ...prev[currentInvoice],
                cashGiven,
                change,
            },
        }));
    }, [currentInvoice, setInvoices]);

    return (
        <Container fluid>
            <Row className='tool-bar align-items-center page-body'>

                <Col md={3} className="mt-2 position-relative">

                    <Form.Control
                        ref={searchInputRef}
                        type="text"
                        placeholder="Tìm sản phẩm hoặc quét mã vạch..."
                        value={searchText}
                        onChange={handleSearchChange}
                        className="form-control"
                    />
                    <div className="search-suggestions border bg-white shadow mt-2 position-absolute w-100"
                        style={{ maxHeight: '200px', overflowY: 'auto', zIndex: 10, borderRadius: '4px' }}>

                        {/* ✅ Hiển thị loading */}
                        {isLoading && (
                            <div className="p-2 text-center">
                                <span className="spinner-border spinner-border-sm"></span> Đang tìm kiếm...
                            </div>
                        )}

                        {/* ✅ Hiển thị lỗi nếu không tìm thấy */}
                        {!isLoading && notFound && (
                            <div className="p-2 text-center text-danger">
                                ❌ Không tìm thấy sản phẩm
                            </div>
                        )}

                        {/* ✅ Hiển thị danh sách sản phẩm gợi ý */}
                        {!isLoading && !notFound && suggestedProducts.length > 0 && suggestedProducts.map(product => (
                            <div key={product.productsId}
                                onClick={() => handleAddProductToCart({
                                    id: product.productsId,
                                    name: product.productName,
                                    price: product.finalPrice || 0,
                                    unit: product.unit || 'Cái',
                                    barcode: product.barcode || '',
                                    quantity: 1
                                })}
                                className="p-2 border-bottom cursor-pointer hover-bg-light d-flex align-items-center">

                                {/* Ảnh sản phẩm */}
                                <img src={product.imageUrl || "/placeholder.jpg"}
                                    alt={product.productName}
                                    className="me-2 rounded border"
                                    style={{ width: "50px", height: "50px", objectFit: "cover" }} />

                                {/* Thông tin sản phẩm */}
                                <div className="flex-grow-1">
                                    <div className="fw-bold">{product.productName}</div>
                                    <div className="text-muted">
                                        <span>{product.finalPrice ? product.finalPrice.toLocaleString() : "Giá không có"} VND</span>
                                        {" • "} {product.unit || "Cái"}
                                        {/* {" • "} Mã vạch: {product.barcode || "Không có"} */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Col>

                <Col md={8}>
                    <ButtonGroup className="invoice-tabs">
                        {Object.keys(invoices).map((invoiceId) => (
                            <Button
                                key={invoiceId} // ✅ Thêm key vào đây
                                variant={invoiceId === currentInvoice ? 'light' : 'primary'}
                                onClick={() => handleSwitchInvoice(invoiceId)}
                                className={`invoice-tab d-flex align-items-center ${invoiceId === currentInvoice ? 'active' : ''}`}
                            >
                                <span>{invoiceId}</span>
                                <BsX
                                    className="invoice-close ms-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        confirmRemoveInvoice(invoiceId);
                                    }}
                                />
                            </Button>
                        ))}
                    </ButtonGroup>
                </Col>

                <Col md={1}>
                    <Button variant='success' onClick={() => setShowReturnModal(true)}>Trả hàng</Button>
                    <ReturnInvoiceModal
                        show={showReturnModal}
                        onHide={() => setShowReturnModal(false)}
                        orders={orders}
                        handleCreateReturnInvoice={handleCreateReturnInvoice}
                    />
                </Col>
            </Row>

            <Row>
                <Col md={8} className='mt-2'>
                    <Cart
                        cartData={invoices[currentInvoice].cart}
                        onUpdateCart={(updatedCart) => setInvoices((prev) => ({
                            ...prev,
                            [currentInvoice]: { ...prev[currentInvoice], cart: updatedCart }
                        }))}
                        quantityInputRefs={quantityInputRefs}
                        isReturn={invoices[currentInvoice]?.isReturn || false} // Xác định phiếu trả hàng
                    />
                </Col>
                <Col md={4} className='mt-2'>
                    <Calculator
                        cartData={invoices[currentInvoice].cart}
                        cashGiven={invoices[currentInvoice].cashGiven}
                        change={invoices[currentInvoice].change}
                        onCashUpdate={(cashGiven, change) => setInvoices((prev) => ({
                            ...prev,
                            [currentInvoice]: { ...prev[currentInvoice], cashGiven, change }
                        }))}
                        paymentMethod={invoices[currentInvoice].paymentMethod}
                        onPaymentMethodChange={handlePaymentMethodChange} // ✅ Truyền function xuống Calculator
                        isReturn={invoices[currentInvoice]?.isReturn || false}
                    />
                </Col>
            </Row>

            <Modal className='' show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>Xác nhận xóa</Modal.Title></Modal.Header>
                <Modal.Body>Bạn có chắc chắn muốn xóa <strong>{invoiceToDelete}</strong> không?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>Hủy</Button>
                    <Button variant="danger" onClick={handleRemoveInvoice}>Xóa</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Main;
