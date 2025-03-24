import "./App.css";

import { BrowserRouter, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import AddProductComponent from "./components/addProduct";
import ProductManagementComponent from "./components/listProduct";
import Header from "./headerComponent/header";
import LoginPage from "./components/login";
import Main from "./components/pos/main";
import StaffHomeComponent from "./components/staffHomeConponent/staffHome";
import EndDayReport from "./components/reportStaffConponent/EndShiftReport";
import TransactionForm from "./components/transactionFormConponent/transactionForm";
import CashBookComponent from "./components/cashbookConponent/cashBook";
import FundTransactionReport from "./components/cashbookConponent/historyTrans";
import React from "react";
import SupplierList from "./components/Supplier_Order/SupplierList";
import AddSupplier from "./components/Supplier_Order/AddSupplier";
import EditSupplier from "./components/Supplier_Order/EditSupplier";
import CreatePurchaseOrder from "./components/Supplier_Order/CreatePurchaseOrder";
import PurchaseOrderDetail from "./components/Supplier_Order/PurchaseOrderDetail";
import OrderList from "./components/Supplier_Order/OrderList";
import AddProductsToSupplier from "./components/Supplier_Order/AddProductsToSupplier";
import ProductsOfSupplier from "./components/Supplier_Order/ProductsOfSupplier";
import ProductDetail from "./components/Supplier_Order/ProductDetail";
import ProductEdit from "./components/Supplier_Order/ProductEdit";
import WarehousesListDetail from "./components/Supplier_Order/WarehousesListDetail";



const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    return token ? children : <Navigate to="/login" />;
};

function App() {

   
    return (
        <>
            <BrowserRouter>
                <Routes>
                    {/* Định tuyến trang mặc định về Login nếu chưa có token */}
                    <Route path="/" element={<Navigate to="/login" />} />

                    {/* Trang Login */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Các trang cần đăng nhập */}
                    <Route path="/pos" element={<Main />} />
                    <Route
                        path="/staffHome"
                        element={
                            <ProtectedRoute>
                                <StaffHomeComponent />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/addproduct"
                        element={
                            <ProtectedRoute>
                                <AddProductComponent />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/productmanage"
                        element={
                            <ProtectedRoute>
                                <ProductManagementComponent />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/header"
                        element={
                            <ProtectedRoute>
                                <Header />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/endDaytReport"
                        element={
                            <ProtectedRoute>
                                <EndDayReport />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/transactionForm"
                        element={
                            <ProtectedRoute>
                                <TransactionForm />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/cashBook"
                        element={
                            <ProtectedRoute>
                                <CashBookComponent />
                            </ProtectedRoute>
                        }
                    />
                   
                    <Route
                        path="/historyTrans"
                        element={
                            <ProtectedRoute>
                                <FundTransactionReport />
                            </ProtectedRoute>
                        } />
                    <Route
                        path="/addproduct"
                        element={
                            <ProtectedRoute>
                                <AddProductComponent />
                            </ProtectedRoute>
                        } />
                    {/* ✅ Quản lý nhà cung cấp */}
                    <Route path="/SupplierList" element={<ProtectedRoute><SupplierList /></ProtectedRoute>} />
                    <Route path="/EditSupplier/:id" element={<ProtectedRoute><EditSupplier /></ProtectedRoute>} />
                    <Route path="/AddSupplier" element={<ProtectedRoute><AddSupplier /></ProtectedRoute>} />
                    <Route path="/CreatePurchaseOrder" element={<ProtectedRoute><CreatePurchaseOrder /></ProtectedRoute>} />
                    <Route path="/PurchaseOrderDetail/:id" element={<ProtectedRoute><PurchaseOrderDetail /></ProtectedRoute>} />
                    <Route path="/OrderList" element={<ProtectedRoute><OrderList /></ProtectedRoute>} />                   
                    <Route path="/AddProductsToSupplier/:supplierId?" element={<ProtectedRoute><AddProductsToSupplier /></ProtectedRoute>} />
                    <Route path="/ProductsOfSupplier/:supplierId" element={<ProtectedRoute><ProductsOfSupplier /></ProtectedRoute>} />
                    <Route path="/ProductDetail/:productId" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
                    <Route path="/ProductEdit/:id" element={<ProtectedRoute><ProductEdit /></ProtectedRoute>} />
                    <Route path="/WarehousesListDetail" element={<ProtectedRoute><WarehousesListDetail /></ProtectedRoute>} />
                    {/* Redirect tất cả các đường dẫn không hợp lệ về /login */}
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
