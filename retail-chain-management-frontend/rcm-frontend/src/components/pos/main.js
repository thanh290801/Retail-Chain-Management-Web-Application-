
import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Button, ButtonGroup, Modal } from 'react-bootstrap';
import Cart from './cart';
import Calculator from './calculator';
import ReturnInvoiceModal from './ReturnInvoiceModal'; // Không dùng dấu ngoặc nhọn {}
import { BsX, BsPlus } from 'react-icons/bs';
import './main.css';
import { useNavigate } from "react-router-dom";
import { IoArrowBackOutline } from "react-icons/io5";


const productList = [
    { id: 1, name: 'Tương ớt Chinsu 1kg', price: 28000, unit: 'Chai', barcode: '8936136161150' },
    { id: 2, name: 'Spirte 1.5L', price: 17000, unit: 'Chai', barcode: '8935049501039' },
    { id: 3, name: 'Cocacola 1.5L', price: 17000, unit: 'Chai', barcode: '8935049501381' },
    { id: 4, name: 'Ô mai mơ xí muội', price: 10000, unit: 'Gói', barcode: '8936205950760' },
    { id: 5, name: 'Pepsi Cola Chanh', price: 10000, unit: 'Lon', barcode: '8934588672118' }
];

const ordersData = [
    { id: "HD000046", date: "04/03/2025 17:52", staff: "Hoàng - Kinh Doanh", customer: "Anh Giang - Kim Mã", total: 62000, 
      products: [
        { id: 1, name: "Tương ớt Chinsu 1kg", quantity: 1, price: 28000 },
        { id: 2, name: "Spirte 1.5L", quantity: 2, price: 17000 }
      ] 
    },
    { id: "HD000045", date: "03/03/2025 17:51", staff: "h", customer: "Anh Hoàng - Sài Gòn", total: 27000, 
      products: [
        { id: 3, name: "Cocacola 1.5L", quantity: 1, price: 17000 },
        { id: 4, name: "Ô mai mơ xí muội", quantity: 1, price: 10000 }
      ] 
    }
];

const Main = () => {
    const [invoices, setInvoices] = useState({ 'Hóa đơn 1': { cart: [], cashGiven: 0, change: 0 } });
    const [currentInvoice, setCurrentInvoice] = useState('Hóa đơn 1');
    const [searchText, setSearchText] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const searchInputRef = useRef(null);
    const quantityInputRefs = useRef({});
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        setOrders(ordersData); // ✅ Gán dữ liệu mẫu vào state
    }, []);    

    const [showReturnModal, setShowReturnModal] = useState(false);

    useEffect(() => {
        // 🔹 Focus vào ô tìm kiếm ngay khi load trang
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 100);
    }, []);

    // ✅ Thêm hóa đơn mới
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
        setInvoices(prev => ({ ...prev, [newInvoiceId]: { cart: [], cashGiven: 0, change: 0 } }));
        setCurrentInvoice(newInvoiceId);
    
        // 🔹 Sau khi thêm hóa đơn mới, focus lại vào ô tìm kiếm
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 100);
    };    

    // ✅ Xử lý tìm kiếm sản phẩm
    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
        setShowSuggestions(true);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && searchText.trim() !== '') {
            const foundProduct = productList.find(product => product.barcode === searchText.trim());
    
            if (!foundProduct) {
                setSearchText('');
                setShowSuggestions(false);
                return;
            }
    
            if (invoices[currentInvoice]?.isReturn) {
                // 🔹 Nếu là phiếu trả hàng, tăng số lượng trả thay vì thêm mới
                setInvoices(prev => ({
                    ...prev,
                    [currentInvoice]: {
                        ...prev[currentInvoice],
                        cart: prev[currentInvoice].cart.map(item =>
                            item.id === foundProduct.id
                                ? { ...item, returnQuantity: Math.min((item.returnQuantity || 0) + 1, item.quantity) }
                                : item
                        )
                    }
                }));
            } else {
                // 🔹 Nếu là hóa đơn thường, thêm sản phẩm vào giỏ
                handleAddProductToCart(foundProduct);
            }
    
            setSearchText('');
            setShowSuggestions(false);
        }
    };    

    const filteredProducts = productList.filter(product =>
        product.name.toLowerCase().includes(searchText.toLowerCase()) || product.barcode === searchText
    );

    // ✅ Thêm sản phẩm vào giỏ hàng
    const handleAddProductToCart = (product) => {
        const existingProduct = invoices[currentInvoice]?.cart.find(item => item.id === product.id);
        let updatedCart;
    
        if (existingProduct) {
            updatedCart = invoices[currentInvoice].cart.map(item =>
                item.id === product.id
                    ? { ...item, quantity: (parseFloat(item.quantity) + 1).toString() }
                    : item
            );
        } else {
            updatedCart = [...invoices[currentInvoice].cart, { ...product, quantity: '1' }];
        }
    
        setInvoices(prev => ({
            ...prev,
            [currentInvoice]: {
                ...prev[currentInvoice],
                cart: updatedCart
            }
        }));
    
        setSearchText('');
        setShowSuggestions(false);
    
        // 🔹 Sau khi thêm sản phẩm, focus lại vào ô tìm kiếm để tiếp tục quét mã
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 100);
    };

    // ✅ Hàm kiểm tra trước khi xóa hóa đơn
    const confirmRemoveInvoice = (invoiceId) => {
    if (invoices[invoiceId]?.cart.length > 0) {
        // 🔹 Nếu hóa đơn có sản phẩm, hiển thị modal xác nhận
        setInvoiceToDelete(invoiceId);
        setShowConfirmModal(true);
    } else {
        // 🔹 Nếu hóa đơn trống, xóa ngay lập tức
        handleRemoveInvoice(invoiceId);
    }
    };

    // ✅ Hàm xóa hóa đơn (Chỉ gọi từ modal hoặc nếu hóa đơn trống)
    const handleRemoveInvoice = (invoiceId) => {
    setInvoices((prevInvoices) => {
        const updatedInvoices = { ...prevInvoices };
        delete updatedInvoices[invoiceId];

        let newCurrentInvoice = currentInvoice;

        // 🔹 Nếu đang xóa hóa đơn hiện tại, chọn hóa đơn khác
        if (invoiceId === currentInvoice) {
            const invoiceKeys = Object.keys(updatedInvoices);
            newCurrentInvoice = invoiceKeys.length > 0 ? invoiceKeys[0] : 'Hóa đơn 1';
        }

        // 🔹 Nếu không còn hóa đơn nào, tạo lại hóa đơn mặc định
        if (Object.keys(updatedInvoices).length === 0) {
            updatedInvoices['Hóa đơn 1'] = { cart: [], cashGiven: 0, change: 0 };
            newCurrentInvoice = 'Hóa đơn 1';
        }

        setCurrentInvoice(newCurrentInvoice);
        setShowConfirmModal(false);
        setInvoiceToDelete(null);

        return updatedInvoices;
    });

    // 🔹 Sau khi xóa, focus lại vào ô tìm kiếm
    setTimeout(() => {
        searchInputRef.current?.focus();
    }, 100);
    };     

    const handleSwitchInvoice = (invoiceId) => {
        setCurrentInvoice(invoiceId);
    };

    const handleCreateReturnInvoice = (order) => {
        if (!order || !order.products) {
            console.error("🚨 LỖI: order hoặc order.products bị undefined!", order);
            return;
        }
    
        const returnInvoiceId = `Phiếu trả ${Object.keys(invoices).length + 1}`;
    
        // ✅ Chuẩn bị sản phẩm từ hóa đơn gốc (số lượng trả = 0)
        const returnItems = order.products.map(product => ({
            ...product,
            returnQuantity: 0 // Mặc định số lượng trả = 0
        }));
    
        // ✅ Thêm phiếu trả hàng vào danh sách hóa đơn
        setInvoices(prev => ({
            ...prev,
            [returnInvoiceId]: { cart: returnItems, cashGiven: 0, change: 0, isReturn: true }
        }));
    
        // ✅ Chuyển tab sang phiếu trả hàng
        setCurrentInvoice(returnInvoiceId);
    };    

    // ✅ Gán hotkey
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (e.altKey && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            if (e.altKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                handleAddNewInvoice();
            }
            if (e.key === 'PageDown') {
                e.preventDefault();
    
                // 🔹 Lấy giỏ hàng hiện tại
                const currentCart = invoices[currentInvoice]?.cart || [];
    
                // 🔹 Focus vào input số lượng của sản phẩm cuối cùng (nếu có sản phẩm)
                if (currentCart.length > 0) {
                    const lastItem = currentCart[currentCart.length - 1];
                    if (quantityInputRefs.current[lastItem.id]) {
                        quantityInputRefs.current[lastItem.id].focus();
                    }
                }
            }
        };
    
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [invoices]);    

    return (
        <Container fluid>
            <Row className='tool-bar align-items-center page-body'>
                <Col md={3} className="mt-2 position-relative">
                    <Form.Control
                        ref={searchInputRef}
                        type="text"
                        placeholder="Tìm kiếm sản phẩm hoặc quét mã vạch..."
                        value={searchText}
                        onChange={handleSearchChange}
                        onKeyDown={handleKeyDown}
                        className="form-control h-75"
                    />
                    {showSuggestions && searchText && (
                        <div className="search-suggestions border bg-white shadow mt-2 position-absolute w-100"
                            style={{ maxHeight: '200px', overflowY: 'auto', zIndex: 10, borderRadius: '4px' }}>
                            {filteredProducts.map(product => (
                                <div key={product.id} onClick={() => handleAddProductToCart(product)}
                                    className="p-2 border-bottom cursor-pointer hover-bg-light">
                                    {product.name} - {product.price.toLocaleString()} VND
                                </div>
                            ))}
                        </div>
                    )}
                </Col>

                <Col md={8}>
                    <ButtonGroup className="invoice-tabs">
                        {Object.keys(invoices).map((invoiceId) => (
                            <Button key={invoiceId} variant={invoiceId === currentInvoice ? 'light' : 'primary'}
                                className={`invoice-tab d-flex align-items-center ${invoiceId === currentInvoice ? 'active' : ''}`}
                                onClick={() => handleSwitchInvoice(invoiceId)}>
                                <span>{invoiceId}</span>
                                <BsX className="invoice-close ms-2" onClick={(e) => { e.stopPropagation(); confirmRemoveInvoice(invoiceId); }} />
                            </Button>
                        ))}
                        <Button variant='light' className="add-invoice ms-2" onClick={handleAddNewInvoice}>
                            <BsPlus />
                        </Button>
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
                    isReturn={invoices[currentInvoice]?.isReturn || false} // Xác định là phiếu trả hàng hay không
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
