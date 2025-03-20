import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AddProductComponent from "./components/addProduct";
import Attendance from "./components/EmployeeComponent/AttendanceTracking";
import EmployeeCheckInDetail from "./components/EmployeeComponent/Checkin";
import ProductManagementComponent from "./components/listProduct";
import LoginPage from "./components/login";
import Main from "./components/pos/main";
import Header from "./headerComponent/header";
import SalesChartPage from "./sale-dashboadConponent/SalesChartPage";
import StaffManager from "./components/EmployeeComponent/StaffManager";
import { ToastContainer } from "react-toastify";
import SalaryHistory from "./components/EmployeeComponent/SalaryHistory";
import AttendanceTable from "./components/EmployeeComponent/AttendanceTable";
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
          {/* <Route path="/att" element={<AttendanceTable />} /> */}
          <Route
            path="/attendance-detail/:id"
            element={
              <>
                <AttendanceTable />
                <ToastContainer position="top-right" autoClose={3000} />
              </>
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

          {/* Trang Login */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/attendance" element={<Attendance />} />
          {/* Các trang cần đăng nhập */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <SalesChartPage />
              </ProtectedRoute>
            }
          />
          <Route path="/pos" element={<Main />} />

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
          {/* Redirect tất cả các đường dẫn không hợp lệ về /login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
