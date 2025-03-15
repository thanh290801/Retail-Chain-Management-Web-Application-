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
import OrderListComponent from './components/warehouses/orderList';
import StockCheckComponent from './components/warehouses/stockCheck';
import AddProductComponent from './components/warehouses/addProduct';
import ProductStockForOwner from './components/warehouses/listProductForBoss';
import LowStockProducts from './components/warehouses/lowStockProduct';
import PurchaseOrder from './components/warehouses/PurchaseOrder';
import FundTransactionReport from './components/cashbookConponent/historyTrans';


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
          <Route path='/ownerproductstock' element= {<ProductStockForOwner/>} />
          <Route path='/lowstockproduct' element= {<LowStockProducts/>} />
          <Route path='/create-order' element= {<PurchaseOrder/>} />
          <Route path='/ordercheck/:orderId' element= {<OrderCheckComponent/>} />
          <Route path='/warehousetransfer' element= {<WarehouseTransferComponent/>} />
          <Route path='/listallproduct' element= {<ProductListComponent/>} />
          <Route path='/orderlist' element= {<OrderListComponent/>} />
          <Route path='/stockcheck' element= {<StockCheckComponent/>} />
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
