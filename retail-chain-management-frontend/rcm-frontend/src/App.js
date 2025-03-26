import './App.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import Header from './headerComponent/header';
import LoginPage from './components/login';
import StaffHomeComponent from './components/staffHomeConponent/staffHome';
import TransactionForm from './components/transactionFormConponent/transactionForm';
// import FundTransactionReport from './components/cashbookConponent/historyTrans';
import Main from './components/pos/main';
import ProductStockComponent from './components/warehouses/listProduct';
import WarehouseManagementComponent from './components/warehouses/warehouseManagement';
import ProductListComponent from './components/warehouses/listAllProduct';
import AddProductComponent from './components/warehouses/addProduct';
import ProductStockForOwner from './components/warehouses/listProductForBoss';
import LowStockProducts from './components/warehouses/lowStockProduct';
import PurchaseOrder from './components/warehouses/PurchaseOrder';
import StockCheck from './components/warehouses/stockCheck';
import StockAdjustment from './components/warehouses/stockAdjustment';
import OrderList from './components/warehouses/orderList';
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

import FinancialReport from './components/FinancialReportConponent/financialReport';
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
          <Route path='/orderlist' element= {<OrderList/>} />
          <Route path='/order/:orderId' element= {<OrderCheck/>} />
          <Route path='/stockcheck' element= {<StockCheck/>} />
          <Route path='/stockadjustment' element= {<CreateStockAdjustment/>} />
          <Route path="/header" element={<ProtectedRoute><Header /></ProtectedRoute>} />
          <Route path="/transactionForm" element={<ProtectedRoute><TransactionForm /></ProtectedRoute>} />
          <Route path="/cashBook" element={<ProtectedRoute><CashBookComponent /></ProtectedRoute>} />
          <Route path="/cashBookOwner" element={<ProtectedRoute><CashBookOwner /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/revenue-summary-owner" element={<ProtectedRoute><RevenueSummaryOwner /></ProtectedRoute>} />
          <Route path="/financial-report" element={<ProtectedRoute><FinancialReport /></ProtectedRoute>} />
          <Route path="/cashBook" element={<ProtectedRoute><CashBookStaff /></ProtectedRoute>} />
          {/* <Route path="/cashBookOwner" element={<ProtectedRoute><CashBookOwner /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} /> */}
          {/* <Route path="/revenue-summary-owner" element={<ProtectedRoute><RevenueSummaryOwner /></ProtectedRoute>} /> */}
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
