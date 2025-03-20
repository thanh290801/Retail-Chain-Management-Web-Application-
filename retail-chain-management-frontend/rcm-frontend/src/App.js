import './App.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import Header from './headerComponent/header';
import LoginPage from './components/login';
import StaffHomeComponent from './components/staffHomeConponent/staffHome';
import EndDayReport from './components/reportStaffConponent/EndShiftReport';
import TransactionForm from './components/transactionFormConponent/transactionForm';
import CashBookComponent from './components/cashbookConponent/cashBook';
import FundTransactionReport from './components/cashbookConponent/historyTrans';
import Main from './components/pos/main';
import ProductStockComponent from './components/warehouses/listProduct';
import WarehouseManagementComponent from './components/warehouses/warehouseManagement';
import OrderCheckComponent from './components/warehouses/orderCheck';
import WarehouseTransferComponent from './components/warehouses/WareHouseTransfer';
import ProductListComponent from './components/warehouses/listAllProduct';
import AddProductComponent from './components/warehouses/addProduct';
import ProductStockForOwner from './components/warehouses/listProductForBoss';
import LowStockProducts from './components/warehouses/lowStockProduct';
import PurchaseOrder from './components/warehouses/PurchaseOrder';
import StockCheck from './components/warehouses/stockCheck';
import StockAdjustment from './components/warehouses/stockAdjustment';
import OrderList from './components/warehouses/orderList';
import OrderCheck from './components/warehouses/orderCheck';



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
          <Route path='/pos' element={<Main />} />
          <Route path="/staffHome" element={<ProtectedRoute><StaffHomeComponent /></ProtectedRoute>} />
          <Route path='/addproduct' element= {<AddProductComponent/>} />
          <Route path='/productstock' element= {<ProtectedRoute><ProductStockComponent/></ProtectedRoute>} />
          <Route path='/warehousemanagement' element= {<WarehouseManagementComponent/>} />
          <Route path='/stock-adjustment/:stockadjustmentId' element= {<StockAdjustment/>} />
          <Route path='/ownerproductstock' element= {<ProductStockForOwner/>} />
          <Route path='/lowstockproduct' element= {<LowStockProducts/>} />
          <Route path='/create-order' element= {<PurchaseOrder/>} />
          <Route path='/warehousetransfer' element= {<WarehouseTransferComponent/>} />
          <Route path='/listallproduct' element= {<ProductListComponent/>} />
          <Route path='/orderlist' element= {<OrderList/>} />
          <Route path='/order/:orderId' element= {<OrderCheck/>} />
          <Route path='/stockcheck' element= {<StockCheck/>} />
          <Route path="/header" element={<ProtectedRoute><Header /></ProtectedRoute>} />
          <Route path="/endDaytReport" element={<ProtectedRoute><EndDayReport /></ProtectedRoute>} />
          <Route path="/transactionForm" element={<ProtectedRoute><TransactionForm /></ProtectedRoute>} />
          <Route path="/cashBook" element={<ProtectedRoute><CashBookComponent /></ProtectedRoute>} />
          <Route path="/fundTransactionReport" element={<ProtectedRoute><FundTransactionReport /></ProtectedRoute>} />
          {/* Redirect tất cả các đường dẫn không hợp lệ về /login */}
          <Route path="*" element={<Navigate to="/login" />} />

        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
