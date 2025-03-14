import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "https://localhost:5000/api/CashHandover";
const EMPLOYEE_API = "https://localhost:5000/api/Account/all"; // API lấy danh sách nhân viên
const USER_INFO_API = "https://localhost:5000/api/Account/me"; // API lấy thông tin người dùng

const CashHandover = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]); // Danh sách nhân viên
    const [userInfo, setUserInfo] = useState(null); // Thông tin người lập phiếu

    const [handover, setHandover] = useState({
        createdBy: 0,  // ID người tạo phiếu (lấy từ userInfo)
        employeeID: 0, // Nhân viên bàn giao
        receiverID: "", // Nhân viên nhận (hoặc chọn "Khác")
        branchID: 0,   // Chi nhánh thực hiện bàn giao
        amount: 0.00,  // Số tiền bàn giao
        transactionType: "Thu", // Mặc định là "Thu"
        description: "",
        personName: "", // Nếu chọn "Khác" trong receiverID
        note: "",
    });

    // 🛠 Lấy thông tin người dùng từ token
    const fetchUserInfo = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("❌ Không có token! Người dùng có thể chưa đăng nhập.");
                return;
            }

            const response = await axios.get(USER_INFO_API, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("✅ Thông tin người dùng:", response.data);
            setUserInfo(response.data);

            // Gán ID người lập phiếu vào handover
            setHandover(prev => ({
                ...prev,
                createdBy: response.data.EmployeeId
            }));

        } catch (error) {
            console.error("❌ Lỗi khi lấy thông tin người dùng:", error.response ? error.response.data : error);
        }
    };

    // 🛠 Lấy danh sách nhân viên
    useEffect(() => {
        fetchUserInfo();
        axios.get(EMPLOYEE_API)
            .then(response => {
                setEmployees(response.data);
            })
            .catch(error => console.error("❌ Lỗi lấy danh sách nhân viên:", error));
    }, []);

    // Xử lý nhập liệu
    const handleChange = (e) => {
        const { name, value } = e.target;

        setHandover(prev => ({
            ...prev,
            [name]: ["amount", "branchID", "createdBy", "employeeID", "receiverID"].includes(name)
                ? parseInt(value) || 0  // ✅ Đảm bảo kiểu số
                : value
        }));
    };


    // Xử lý khi chọn người nhận bàn giao
    const handleReceiverChange = (e) => {
        const value = e.target.value;
        setHandover(prev => ({
            ...prev,
            receiverID: value === "Khác" ? 0 : parseInt(value) || 0, // Đảm bảo kiểu số
            personName: value === "Khác" ? "" : prev.personName
        }));
    };

    // Tạo phiếu bàn giao
    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log("📩 Dữ liệu gửi lên API:", JSON.stringify(handover, null, 2)); // ✅ Kiểm tra dữ liệu trước khi gửi

        try {
            const response = await axios.post(API_URL, handover, {
                headers: { "Content-Type": "application/json" }
            });
            alert("✅ Phiếu bàn giao đã được tạo thành công!");
            navigate("/cashBook");
        } catch (error) {
            console.error("❌ Lỗi khi tạo phiếu:", error.response?.data || error);
            alert(`Lỗi khi tạo phiếu: ${JSON.stringify(error.response?.data)}`);
        }
    };



    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">📝 Tạo Phiếu Bàn Giao Tiền Mặt</h2>

            <form onSubmit={handleSubmit} className="p-4 border rounded shadow">
                <div className="grid grid-cols-2 gap-4">
                    {/* Người tạo phiếu (hiển thị, không chỉnh sửa) */}
                    <div>
                        <label>👤 Người tạo phiếu</label>
                        <input
                            type="text"
                            value={userInfo ? userInfo.fullname : ""}
                            disabled
                            className="w-full border p-2 rounded bg-gray-100"
                        />
                    </div>

                    {/* Nhân viên bàn giao */}
                    <div>
                        <label>📌 Nhân viên bàn giao</label>
                        <select name="employeeID" onChange={handleChange} required className="w-full border p-2 rounded">
                            <option value="">-- Chọn nhân viên --</option>
                            {employees.map(emp => (
                                <option key={emp.EmployeeId} value={emp.EmployeeId}>{emp.fullName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Nhân viên nhận */}
                    <div>
                        <label>✅ Nhân viên nhận</label>
                        <select name="receiverID" onChange={handleReceiverChange} required className="w-full border p-2 rounded">
                            <option value="">-- Chọn nhân viên hoặc "Khác" --</option>
                            {employees.map(emp => (
                                <option key={emp.EmployeeId} value={emp.EmployeeId}>{emp.fullName}</option>
                            ))}
                            <option value="Khác">Khác</option>
                        </select>
                    </div>

                    {/* Nếu chọn "Khác", nhập tên người nhận */}
                    {handover.receiverID === "" && (
                        <div>
                            <label>👤 Tên người nhận bên ngoài</label>
                            <input
                                type="text"
                                name="personName"
                                onChange={handleChange}
                                className="w-full border p-2 rounded"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label>🏢 Chi nhánh</label>
                        <input type="number" name="branchID" onChange={handleChange} required className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label>💰 Số tiền</label>
                        <input type="number" name="amount" onChange={handleChange} required className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label>🔄 Loại giao dịch</label>
                        <select name="transactionType" value={handover.transactionType} onChange={handleChange} className="w-full border p-2 rounded">
                            <option value="Thu">Thu</option>
                            <option value="Chi">Chi</option>
                        </select>
                    </div>
                    <div>
                        <label>📝 Ghi chú</label>
                        <input type="text" name="description" onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                </div>
                <div className="mt-4 flex gap-4">
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">✅ Tạo Phiếu</button>
                    <button type="button" onClick={() => navigate("/cashBook")} className="px-4 py-2 bg-gray-400 text-white rounded">❌ Hủy</button>
                </div>
            </form>
        </div>
    );
};

export default CashHandover;
