import React, { useState, useEffect } from "react";
import Header from "../../headerComponent/header";
import { toast } from "react-toastify";
import { Tag } from "antd";

const SalaryHistory = () => {
  const [data, setData] = useState([]);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [fixedSalary, setUpdateSalary] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [modalStep, setModalStep] = useState(1);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentNote, setPaymentNote] = useState(null);
  const [isAdvancePayment, setIsAdvancePayment] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // Thêm state cho modal xác nhận
  const api_url = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchPayrollData();
  }, [selectedMonth, selectedYear]);

  const fetchPayrollData = async () => {
    try {
      let url = `${api_url}/Payroll/getAllPayroll?month=${selectedMonth}&year=${selectedYear}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
      setData(await response.json());
    } catch (err) {
      console.error("Lỗi khi gọi API:", err);
    }
  };

  const exportFile = async () => {
    try {
      const response = await fetch(
        `${api_url}/Payroll/export?month=${selectedMonth}&year=${selectedYear}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Lỗi khi tải file từ server");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LichSuLuong_${selectedMonth}_${selectedYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Tải file thành công!");
    } catch (error) {
      console.error("Lỗi khi tải file:", error);
      toast.error("Tải file thất bại. Vui lòng thử lại!");
    }
  };

  const fetchEmployeeDetails = async (employeeId) => {
    try {
      const response = await fetch(
        `${api_url}/Payroll/details?employeeId=${employeeId}&month=${selectedMonth}&year=${selectedYear}`
      );
      if (!response.ok) throw new Error("Lỗi khi lấy dữ liệu nhân viên");
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu nhân viên:", error);
      toast.error("Không thể lấy dữ liệu nhân viên!");
      return null;
    }
  };

  const openPaymentModal = async (employeeId, isAdvance = false) => {
    const employee = await fetchEmployeeDetails(employeeId);
    if (!employee) {
      toast.error("Không thể thực hiện giao dịch, nhân viên không hợp lệ!");
      return;
    }

    if (employee.totalWorkDays === 0) {
      toast.error("Không thể thực hiện giao dịch khi số ngày công bằng 0!");
      return;
    }

    if (
      isAdvance &&
      employee?.paymentHistory?.some((p) => p.paymentMethod === 0)
    ) {
      toast.error("Tháng này tiền đã được ứng rồi! Không thể ứng thêm!");
      return;
    }

    const dailySalary = employee.salaryPerShift;
    const totalAdvancePaid =
      employee?.paymentHistory?.reduce(
        (sum, p) => sum + (p.paidAmount || 0),
        0
      ) || 0;
    let defaultAmount = 0;

    if (isAdvance) {
      defaultAmount = (employee.totalWorkDays / 2) * dailySalary;
    } else {
      defaultAmount = employee.totalSalary - totalAdvancePaid;
    }

    setSelectedEmployee(employee);
    setPaidAmount(Math.max(0, Math.floor(defaultAmount)));
    setPaymentNote(null);
    setIsAdvancePayment(isAdvance);
    setIsPaymentModalOpen(true);
  };

  const handlePayment = async () => {
    let employee = selectedEmployee;
    if (!employee) {
      toast.error("Không thể thực hiện giao dịch, nhân viên không hợp lệ!");
      return;
    }

    employee = await fetchEmployeeDetails(employee.employeeId);
    if (!employee) return;

    if (employee.totalWorkDays === 0) {
      toast.error("Không thể thực hiện giao dịch khi số ngày công bằng 0!");
      return;
    }

    try {
      const url = isAdvancePayment
        ? `${api_url}/Payroll/advance-salary`
        : `${api_url}/Payroll/pay-salary`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee.employeeId,
          month: selectedMonth,
          year: selectedYear,
          paidAmount,
          note: paymentNote,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Giao dịch thất bại!");
      }

      toast.success(
        isAdvancePayment ? "Ứng tiền thành công!" : "Thanh toán thành công!"
      );
      setIsPaymentModalOpen(false);
      setIsConfirmModalOpen(false); // Đóng modal xác nhận
      fetchPayrollData();
    } catch (error) {
      const errorMessage = error.message || "Đã có lỗi xảy ra!";
      toast.error(errorMessage, { position: "top-right" });
    }
  };

  const openConfirmModal = () => {
    setIsConfirmModalOpen(true); // Mở modal xác nhận
  };

  const openDetailModal = async (employeeId) => {
    const employee = await fetchEmployeeDetails(employeeId);
    if (!employee) return;
    setSelectedEmployee(employee);
    setModalStep(1);
    setIsDetailModalOpen(true);
  };

  const openUpdateModal = (employee) => {
    setSelectedEmployee(employee);
    setUpdateSalary(employee.fixedSalary);
    setPenalty(employee.penalty);
    setIsUpdateModalOpen(true);
  };

  const updateSalary = async () => {
    try {
      const response = await fetch(`${api_url}/Payroll/update-salary`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee.employeeId,
          fixedSalary,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          finalSalary: 0,
          status: "",
        }),
      });
      if (!response.ok) throw new Error("Cập nhật thất bại");
      toast.success("Cập nhật lương thành công!");
      setIsUpdateModalOpen(false);
      fetchPayrollData();
    } catch (error) {
      console.error("Lỗi khi cập nhật lương:", error);
      toast.error("Cập nhật thất bại!");
    }
  };

  const formatCurrency = (value) => {
    if (typeof value !== "string") return "";
    const numberValue = parseFloat(value.replace(/[^0-9]/g, ""));
    return numberValue
      ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(numberValue)
      : "";
  };

  const handleSalaryChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setUpdateSalary(value);
  };

  return (
    <div>
      <Header />
      <div className="p-10">
        <div className="p-4 border-b bg-white shadow">
          <div className="flex justify-between items-center my-3">
            <div className="text-lg font-bold">Lịch Sử Lương Nhân Viên</div>
            <div className="flex gap-4 items-center">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="border border-gray-300 p-2 rounded w-32 text-center shadow-sm"
              >
                {[...Array(5)].map((_, idx) => (
                  <option key={idx} value={currentYear - 2 + idx}>
                    {currentYear - 2 + idx}
                  </option>
                ))}
              </select>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="border border-gray-300 p-2 rounded w-32 text-center shadow-sm"
              >
                {[...Array(12)].map((_, idx) => (
                  <option key={idx} value={idx + 1}>
                    Tháng {idx + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center mb-4">
            <div className="space-x-2">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded ml-2"
                onClick={exportFile}
              >
                Xuất Excel
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto mt-4">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-center">Mã Nhân viên</th>
                <th className="border p-2 text-center">Tên nhân viên</th>
                <th className="border p-2 text-center">Lương tháng</th>
                <th className="border p-2 text-center">Số ngày công</th>
                <th className="border p-2 text-center">Số giờ tăng ca</th>
                <th className="border p-2 text-center">Lương tăng ca</th>
                <th className="border p-2 text-center">Tổng lương</th>
                <th className="border p-2 text-center">Ngày cập nhật</th>
                <th className="border p-2 text-center">Thanh toán</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr
                  key={item.employeeId}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => openDetailModal(item.employeeId)}
                >
                  <td className="border p-2 text-center">{item.employeeId}</td>
                  <td className="border p-2">{item.employeeName}</td>
                  <td className="border p-2 text-center">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(item.fixedSalary)}
                  </td>
                  <td className="border p-2 text-center">{item.totalWorkDays}</td>
                  <td className="border p-2 text-center">{item.totalOvertimeHours}</td>
                  <td className="border p-2 text-center">
                    {item.overtimePay
                      ? new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(item.overtimePay)
                      : new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(0)}
                  </td>
                  <td className="border p-2 text-center font-bold">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(item.finalSalary)}
                  </td>
                  <td className="border p-2 text-center">
                    {item.updateAt
                      ? new Date(item.updateAt).toLocaleString("vi-VN")
                      : "Chưa cập nhật"}
                  </td>
                  <td className="border p-2 text-center font-bold">
                    {item.paymentStatus === "Đã thanh toán" ? (
                      <Tag color="green">Đã Thanh Toán</Tag>
                    ) : (
                      <button
                        className="bg-yellow-500 text-white px-2 py-1 rounded "
                        onClick={(e) => {
                          e.stopPropagation();
                          openPaymentModal(item.employeeId, false);
                        }}
                      >
                        Thanh toán
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal cập nhật lương */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div
            className="bg-white p-5 rounded shadow-lg w-96"
            style={{ width: "660px" }}
          >
            <h2 className="text-xl font-bold mb-4">
              Cập Nhật Lương Của {selectedEmployee.employeeName}
            </h2>
            <label className="block mb-2">Tiền lương cần cập nhật:</label>
            <input
              type="text"
              value={formatCurrency(fixedSalary.toString())}
              onChange={handleSalaryChange}
              className="border p-2 w-full mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setIsUpdateModalOpen(false)}
              >
                Hủy
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={updateSalary}
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal thông tin lương nhân viên */}
      {isDetailModalOpen && selectedEmployee && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div
            className="bg-white p-6 rounded shadow-lg"
            style={{ width: "660px" }}
          >
            <h1 className="text-2xl font-bold mb-4 uppercase">
              {modalStep === 1
                ? `Chi Tiết Lương Tháng ${selectedMonth}/${selectedYear} Của ${selectedEmployee.employeeName}`
                : `Lịch Sử Thanh Toán`}
            </h1>
            {modalStep === 1 && (
              <div className="space-y-2">
                {[
                  { label: "Mã Nhân Viên", value: selectedEmployee.employeeId },
                  { label: "Họ tên", value: selectedEmployee.employeeName },
                  { label: "Số điện thoại", value: selectedEmployee.phone },
                  { label: "CCCD", value: selectedEmployee.identityNumber },
                  { label: "Quê quán", value: selectedEmployee.hometown },
                  {
                    label: "Lương ngày",
                    value: new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(selectedEmployee.fixedSalary),
                  },
                  {
                    label: "Số ngày công",
                    value: selectedEmployee.totalWorkDays,
                  },
                  {
                    label: "Số giờ tăng ca",
                    value: selectedEmployee.totalOvertimeHours,
                  },
                  {
                    label: "Lương tăng ca",
                    value: new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(selectedEmployee.overtimePay),
                  },
                  {
                    label: "Tổng lương",
                    value: new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(selectedEmployee.totalSalary),
                  },
                ].map((item, index) => (
                  <div key={index} className="flex">
                    <strong className="w-1/2 text-xl">{item.label}:</strong>
                    <span className="flex-1 text-xl">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
            {modalStep === 2 && (
              <div>
                <h2 className="text-xl font-bold mb-2">Lịch sử thanh toán</h2>
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-center">Ngày</th>
                      <th className="border p-2 text-center">Số tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmployee.paymentHistory.length > 0 ? (
                      selectedEmployee.paymentHistory.map((payment, idx) => (
                        <tr key={idx}>
                          <td className="border p-2 text-center">
                            {new Date(payment.paymentDate).toLocaleDateString(
                              "vi-VN"
                            )}
                          </td>
                          <td className="border p-2 text-center">
                            {payment.paidAmount.toLocaleString("vi-VN")} VND
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" className="border p-2 text-center">
                          Chưa có lịch sử thanh toán
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-between mt-6">
              {modalStep === 2 && (
                <button
                  onClick={() => setModalStep(1)}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Quay lại
                </button>
              )}
              {modalStep === 1 && (
                <button
                  onClick={() => setModalStep(2)}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Xem lịch sử
                </button>
              )}
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal thanh toán lương nhân viên */}
      {isPaymentModalOpen && selectedEmployee && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">
              {isAdvancePayment ? "Ứng Tiền Lương" : "Thanh Toán Lương"}
            </h2>

            <label className="block mb-2">Số tiền thanh toán:</label>
            <input
              type="text"
              value={new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(paidAmount)}
              readOnly
              className="border p-2 w-full mb-4 bg-gray-100 cursor-not-allowed"
            />

            <label className="block mb-2">Ghi chú:</label>
            <textarea
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              className="border p-2 w-full mb-4"
              placeholder="Nhập ghi chú (không bắt buộc)"
            />

            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                Hủy
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={openConfirmModal} // Mở modal xác nhận thay vì gọi handlePayment trực tiếp
              >
                {isAdvancePayment ? "Ứng Tiền" : "Thanh Toán"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal xác nhận thanh toán */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Xác Nhận Thanh Toán</h2>
            <p className="mb-4">
              Bạn có chắc chắn muốn{" "}
              {isAdvancePayment ? "ứng tiền" : "thanh toán"} số tiền{" "}
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(paidAmount)}{" "}
              cho {selectedEmployee.employeeName} không?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Hủy
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={handlePayment} // Gọi handlePayment khi xác nhận
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryHistory;