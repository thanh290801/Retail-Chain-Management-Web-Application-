import './App.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import Header from './headerComponent/header';
import LoginPage from './components/login';
import StaffHomeComponent from './components/staffHomeConponent/staffHome';
import TransactionForm from './components/transactionFormConponent/transactionForm';
// import FundTransactionReport from './components/cashbookConponent/historyTrans';
import ProductStockComponent from './components/warehouses/listProduct';
import WarehouseManagementComponent from './components/warehouses/warehouseManagement';
import ProductListComponent from './components/warehouses/listAllProduct';
import AddProductComponent from './components/warehouses/addProduct';
import ProductStockForOwner from './components/warehouses/listProductForBoss';
import LowStockProducts from './components/warehouses/lowStockProduct';
import PurchaseOrder from './components/warehouses/PurchaseOrder';
import StockCheck from './components/warehouses/stockCheck';
import StockAdjustment from './components/warehouses/stockAdjustment';
import OrderLists from './components/warehouses/orderList';
import OrderCheck from './components/warehouses/orderCheck';
import CashBookStaff from './components/cashbookConponent/cashBook';
import InventoryCheckHistory from './components/warehouses/InventoryCheckHistory';
import InventoryCheckDetail from './components/warehouses/InventoryCheckDetail';
import WarehouseTransferHistory from './components/warehouses/warehouseTransferHistory';
import WarehouseTransferDetail from './components/warehouses/warehouseTransferDetail';
import WarehouseTransferConfirmation from './components/warehouses/warehouseTransferConfirmation';
import WarehouseTransfer from './components/warehouses/WareHouseTransfer';
import CreateStockAdjustment from './components/warehouses/newStockAdjustment';


import CashBookComponent from './components/cashbookConponent/cashBook';
import Main from './components/pos/main';
// import FundTransactionReport from './components/cashbookConponent/historyTrans';
import CashBookOwner from './components/CashBookOwnerCp/CashBookOwner';
import UserProfile from './components/profileUser/profile';
import ForgotPassword from './components/resetPass/sendOTP';
import ResetPassword from './components/resetPass/resetPassword.js';
import Attendance from "./components/EmployeeComponent/AttendanceTracking";
import EmployeeCheckInDetail from "./components/EmployeeComponent/Checkin";
import StaffManager from "./components/EmployeeComponent/StaffManager";
import { ToastContainer } from "react-toastify";
import SalaryHistory from "./components/EmployeeComponent/SalaryHistory";
import AttendanceTable from "./components/EmployeeComponent/AttendanceTable";
import RevenueSummaryOwner from './sale-dashboadConponent/RevenueOwner';
import PendingOvertimeList from "./components/EmployeeComponent/PendingOvertimeList";
import OrderList from './sale-dashboadConponent/orderList.js';
import PromotionMain from './components/promotion/promotion_main.js';

import FinancialReport from './components/FinancialReportConponent/financialReport';
import CreateSupplierForm from './components/Supplier_Order/AddSupplier.js';
import AddProductsToSupplier from './components/Supplier_Order/AddProductsToSupplier.js';
import CreatePurchaseOrder from './components/Supplier_Order/CreatePurchaseOrder.js';
import EditSupplier from './components/Supplier_Order/EditSupplier.js';
import OwnerOrderList from './components/Supplier_Order/OrderList.js';
import ProductDetail from './components/Supplier_Order/ProductDetail.js';
import ProductEdit from './components/Supplier_Order/ProductEdit.js';
import ProductsOfSupplier from './components/Supplier_Order/ProductsOfSupplier.js';
import PurchaseOrderDetail from './components/Supplier_Order/PurchaseOrderDetail.js';
import SupplierList from './components/Supplier_Order/SupplierList.js';
import WarehousesListDetail from './components/Supplier_Order/WarehousesListDetail.js';
import AddProductsToWarehouse from './components/warehouses/addProductToWarehouse.js';

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
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Trang Login */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          {/* <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} /> */}


          {/* Các trang cần đăng nhập */}
          <Route path='/pos' element={<Main />} />
          <Route path="/staffHome" element={<ProtectedRoute><StaffHomeComponent /></ProtectedRoute>} />
          {/* Quân */}
          <Route path='/addproduct' element= {<AddProductComponent/>} />
          <Route path='/productstock' element= {<ProtectedRoute><ProductStockComponent/></ProtectedRoute>} />
          <Route path='/warehousemanagement' element= {<WarehouseManagementComponent/>} />
          <Route path='/stock-adjustment/:stockadjustmentId' element= {<StockAdjustment/>} />
          <Route path='/ownerproductstock' element= {<ProductStockForOwner/>} />
          <Route path='/lowstockproduct' element= {<LowStockProducts/>} />
          <Route path='/create-order' element= {<PurchaseOrder/>} />
          <Route path='/inventoryhistory' element= {<InventoryCheckHistory/>} />
          <Route path='/inventoryhistory/:auditId' element= {<InventoryCheckDetail/>} />
          <Route path='/warehousetransfer' element= {<WarehouseTransfer/>} />
          <Route path="/warehouse-transfers-history" element={<WarehouseTransferHistory />} />
          <Route path="/warehouse-transfers-confirm" element={<WarehouseTransferConfirmation />} />
          <Route path="/warehouse-transfer/:id" element={<WarehouseTransferDetail />} />
          <Route path='/listallproduct' element= {<ProductListComponent/>} />
          <Route path='/orderlist' element= {<OrderLists/>} />
          <Route path='/order/:orderId' element= {<OrderCheck/>} />
          <Route path='/stockcheck' element= {<StockCheck/>} />
          <Route path='/stockadjustment' element= {<CreateStockAdjustment/>} />
          <Route path='/addproducttowarehouse' element= {<AddProductsToWarehouse/>} />
          <Route path='/promotion' element= {<PromotionMain/>} />
          {/* Đại */}
          <Route path='/addsupplier' element= {<CreateSupplierForm/>} />
          <Route path='/addproductsupplier/:supplierId' element= {<AddProductsToSupplier/>} />
          <Route path='/createpurchaseorder' element= {<CreatePurchaseOrder/>} />
          <Route path='/editsupplier/:id' element= {<EditSupplier/>} />
          <Route path='/ownerorderlist' element= {<OwnerOrderList/>} />
          <Route path='/listallproduct/:productId' element= {<ProductDetail/>} />
          <Route path='/productedit/:id' element= {<ProductEdit/>} />
          <Route path='/supplierproducts/:supplierId' element= {<ProductsOfSupplier/>} />
          <Route path='/purchaseorderdetail/:id' element= {<PurchaseOrderDetail/>} />
          <Route path='/supplierlist' element= {<SupplierList/>} />
          <Route path='/warehouselistdetail' element= {<WarehousesListDetail/>} />

          <Route path="/header" element={<ProtectedRoute><Header /></ProtectedRoute>} />
          <Route path="/transactionForm" element={<ProtectedRoute><TransactionForm /></ProtectedRoute>} />
          <Route path="/cashBook" element={<ProtectedRoute><CashBookComponent /></ProtectedRoute>} />
          <Route path="/cashBookOwner" element={<ProtectedRoute><CashBookOwner /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/revenue-summary-owner" element={<ProtectedRoute><RevenueSummaryOwner /></ProtectedRoute>} />
          <Route path="/financial-report" element={<ProtectedRoute><FinancialReport /></ProtectedRoute>} />
          <Route path="/order-list" element={<OrderList />} />

          {/* Redirect tất cả các đường dẫn không hợp lệ về /login */}
          <Route path="*" element={<Navigate to="/login" />} />


          {/* */}
          <Route path="/attendance" element={<Attendance />} />
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <PendingOvertimeList />
                <ToastContainer position="top-right" autoClose={3000} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkin"
            element={
              <>
                <AttendanceTable />
                <ToastContainer position="top-right" autoClose={3000} />
              </>
            }
          />
          <Route
            path="/attendance-detail/:id"
            element={
              <ProtectedRoute>
                <AttendanceTable />
                <ToastContainer position="top-right" autoClose={3000} />
              </ProtectedRoute>
            }
          />
                    <Route
            path="/staffmanage"
            element={
              <ProtectedRoute>
                <StaffManager />
                <ToastContainer position="top-right" autoClose={3000} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/salary"
            element={
              <ProtectedRoute>
                <SalaryHistory />
                <ToastContainer position="top-right" autoClose={3000} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
