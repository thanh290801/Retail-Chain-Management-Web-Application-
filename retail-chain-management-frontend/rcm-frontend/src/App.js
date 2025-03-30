import "./App.css";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import AddProductComponent from "./components/addProduct";
import ProductManagementComponent from "./components/listProduct";
import Header from "./headerComponent/header";
import LoginPage from "./components/login";
import Main from "./components/pos/main";
import StaffHomeComponent from "./components/staffHomeConponent/staffHome";
import TransactionForm from "./components/transactionFormConponent/transactionForm";
import CashBookComponent from "./components/cashbookConponent/cashBook";
import CashBookOwner from "./components/CashBookOwnerCp/CashBookOwner";
import UserProfile from "./components/profileUser/profile";
import ForgotPassword from "./components/resetPass/sendOTP";
import ResetPassword from "./components/resetPass/resetPassword.js";
import Attendance from "./components/EmployeeComponent/AttendanceTracking";
import EmployeeCheckInDetail from "./components/EmployeeComponent/Checkin";
import StaffManager from "./components/EmployeeComponent/StaffManager";
import { ToastContainer } from "react-toastify";
import SalaryHistory from "./components/EmployeeComponent/SalaryHistory";
import StaffSalaryHistory from "./components/EmployeeComponent/StaffSalaryHistory";

import AttendanceTable from "./components/EmployeeComponent/AttendanceTable";
import RevenueSummaryOwner from "./sale-dashboadConponent/RevenueOwner";
import PendingOvertimeList from "./components/EmployeeComponent/PendingOvertimeList";

import FinancialReport from "./components/FinancialReportConponent/financialReport";
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
            path="/cashBookOwner"
            element={
              <ProtectedRoute>
                <CashBookOwner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/revenue-summary-owner"
            element={
              <ProtectedRoute>
                <RevenueSummaryOwner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/financial-report"
            element={
              <ProtectedRoute>
                <FinancialReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/salary/:staffId"
            element={
              <ProtectedRoute>
                <StaffSalaryHistory />
              </ProtectedRoute>
            }
          />
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
