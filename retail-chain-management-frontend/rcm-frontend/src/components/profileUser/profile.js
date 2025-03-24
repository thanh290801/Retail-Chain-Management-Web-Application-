import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
const UserProfile = () => {
    const [employee, setEmployee] = useState(null);
    const [role, setRole] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const api_url = process.env.REACT_APP_API_URL
    useEffect(() => {
        const fetchEmployeeData = async () => {
            try {
                const token = localStorage.getItem("token"); // 🔹 Lấy token từ LocalStorage
                if (!token) {
                    setError("Bạn chưa đăng nhập.");
                    setLoading(false);
                    return;
                }

                const decodedToken = jwtDecode(token); // 🔹 Giải mã token để kiểm tra
                console.log("Decoded Token:", decodedToken);
                const response = await axios.get(`${api_url}/employees/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setEmployee(response.data);
            } catch (err) {
                setError("Không thể tải dữ liệu nhân viên.");
            } finally {
                setLoading(false);
            }
        };

        const fetRoleData = async () => {
            try {
                const token = localStorage.getItem("token"); // 🔹 Lấy token từ LocalStorage
                if (!token) {
                    setError("Bạn chưa đăng nhập.");
                    setLoading(false);
                    return;
                }
                const response = await axios.get(`${api_url}/Account/me`, {
                    headers: { Authorization: `Bearer ${token}` },

                });
                setRole(response.data.role);
            } catch (err) {
                setError("Không thể tải dữ liệu nhân viên.");
            } finally {
                setLoading(false);
            }
        };
        fetRoleData();
        fetchEmployeeData();
    }, []);

    if (loading) return <p>Đang tải...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!employee) return <p>Không tìm thấy nhân viên.</p>;

    return (
        <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg p-6">
            {/* Nút quay lại */}
            <button onClick={() => navigate(role === "Owner" ? "/header" : "/staffHome")}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold shadow-md">
                ⬅ Quay lại
            </button>
            <div className="text-center">
                <img
                    src={employee.profileImage || "https://via.placeholder.com/150"}
                    alt="Profile"
                    className="w-32 h-32 rounded-full mx-auto"
                />
                <h2 className="text-xl font-semibold mt-2">{employee.FullName}</h2>
                <p className="text-gray-600">{employee.branchName || "Chủ sở hữu"}</p>
            </div>

            <div className="mt-4">
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium">Họ và tên:</span>
                    <span>{employee.fullName}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium">Số điện thoại:</span>
                    <span>{employee.phone}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium">Giới tính:</span>
                    <span>{employee.gender === "Female" ? "Nữ" : employee.gender === "Male" ? "Nam" : "Khác"}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium">Ngày sinh:</span>
                    <span>{new Date(employee.birthDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium">CMND/CCCD:</span>
                    <span>{employee.identityNumber}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium">Quê quán:</span>
                    <span>{employee.hometown}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium">Lương cố định:</span>
                    <span>{employee.fixedSalary !== undefined ? employee.fixedSalary.toLocaleString() + " VND" : "Chưa cập nhật"}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium">Ngày bắt đầu:</span>
                    <span>{new Date(employee.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium">Trạng thái:</span>
                    <span className={employee.IsActive ? "text-green-600" : "text-red-600"}>
                        {employee.isActive ? "Đang làm việc" : "Đã nghỉ"}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
