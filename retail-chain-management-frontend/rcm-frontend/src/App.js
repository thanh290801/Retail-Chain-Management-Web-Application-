import './App.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import AddProductComponent from './components/addProduct';
import ProductManagementComponent from './components/listProduct';
import Header from './headerComponent/header';
import LoginPage from './components/login';
import StaffHomeComponent from './components/staffHomeConponent/staffHome';
import SalesChartPage from './sale-dashboadConponent/SalesChartPage';
import EndDayReport from './components/reportStaffConponent/EndShiftReport';
import TransactionForm from './components/transactionFormConponent/transactionForm';
import CashBookComponent from './components/cashbookConponent/cashBook';
import Main from './components/pos/Main';

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
          <Route path="/home" element={<ProtectedRoute><SalesChartPage /></ProtectedRoute>} />
          <Route path='/pos' element={<Main />} />
          <Route path="/staffHome" element={<ProtectedRoute><StaffHomeComponent /></ProtectedRoute>} />
          <Route path="/addproduct" element={<ProtectedRoute><AddProductComponent /></ProtectedRoute>} />
          <Route path="/productmanage" element={<ProtectedRoute><ProductManagementComponent /></ProtectedRoute>} />
          <Route path="/header" element={<ProtectedRoute><Header /></ProtectedRoute>} />
          <Route path="/endDaytReport" element={<ProtectedRoute><EndDayReport /></ProtectedRoute>} />
          <Route path="/transactionForm" element={<ProtectedRoute><TransactionForm /></ProtectedRoute>} />
          <Route path="/cashBook" element={<ProtectedRoute><CashBookComponent /></ProtectedRoute>} />
          {/* Redirect tất cả các đường dẫn không hợp lệ về /login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
