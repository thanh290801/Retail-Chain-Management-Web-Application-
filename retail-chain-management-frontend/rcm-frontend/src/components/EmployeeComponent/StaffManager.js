import React, { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "../../headerComponent/header";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const shifts = [
  { id: 1, name: "Ca sáng" },
  { id: 2, name: "Ca chiều" },
];
const ITEMS_PER_PAGE = 10;

export default function StaffManager() {
  const [staffList, setStaffList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [shiftAssignments, setShiftAssignments] = useState({});
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [staffToChangeStatus, setStaffToChangeStatus] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImages, setProfileImages] = useState({});
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false); // State cho modal setup
  const [staffToSetup, setStaffToSetup] = useState(null); // Nhân viên được chọn để setup

  const api_url = process.env.REACT_APP_API_URL;
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      role: "Staff",
      startDate: new Date().toISOString().split("T")[0],
      fixedSalary: "",
    },
  });
  const {
    register: registerSetup,
    handleSubmit: handleSetupSubmit,
    setValue: setSetupValue,
    watch: watchSetup,
  } = useForm(); // Form cho modal setup
  const navigate = useNavigate();

  const goToSalaryCal = (staffId) => {
    navigate(`/salary/${staffId}`);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStaff(searchTerm);
      fetchWarehouses();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchWarehouses = async () => {
    try {
      const response = await axios.get(`${api_url}/Warehouses/GetWarehouses`);
      setWarehouses(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách kho hàng:", error);
    }
  };

  const fetchStaff = async (search = "") => {
    try {
      const response = await axios.get(
        `${api_url}/Staff/getStaff?name=${search}`
      );
      const sortedStaffList = response.data.sort((a, b) => {
        return (b.activeStatus ? 1 : 0) - (a.activeStatus ? 1 : 0);
      });
      setStaffList(sortedStaffList);
      setTotalPages(Math.ceil(sortedStaffList.length / ITEMS_PER_PAGE));
      const images = {};
      for (const staff of sortedStaffList) {
        const imageUrl = await fetchProfileImage(staff.id);
        images[staff.id] = imageUrl;
      }
      setProfileImages(images);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách nhân viên:", error);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return staffList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const openStatusModal = (staffId, currentActiveStatus) => {
    setStaffToChangeStatus(staffId);
    setCurrentStatus(currentActiveStatus);
    setIsStatusModalOpen(true);
  };

  const handleStatusChange = async () => {
    try {
      await axios.put(`${api_url}/Staff/update-employee-Active/${staffToChangeStatus}`, {
        isActive: !currentStatus,
      });
      toast.success("Cập nhật trạng thái nhân viên thành công!", {
        position: "top-right",
      });
      fetchStaff();
      setIsStatusModalOpen(false);
    } catch (error) {
      toast.error("Lỗi khi cập nhật trạng thái!", {
        position: "top-right",
      });
    }
  };

  const openDetailModal = async (id) => {
    try {
      const response = await axios.get(`${api_url}/Staff/${id}`);
      if (response.data) {
        setSelectedStaff(response.data);
        setIsDetailModalOpen(true);
        setShowPassword(false);
      } else {
        toast.error("Không tìm thấy nhân viên!");
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin nhân viên:", error);
      toast.error("Không thể lấy thông tin nhân viên!");
    }
  };

  const fetchProfileImage = async (employId) => {
    try {
      const response = await axios.get(
        `https://localhost:5000/api/Staff/staff/image/${employId}`,
        { responseType: "blob" }
      );
      return URL.createObjectURL(response.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return "https://icons.veryicon.com/png/o/miscellaneous/standard/avatar-15.png";
      } else {
        console.error("Lỗi khi lấy ảnh hồ sơ:", error);
        return null;
      }
    }
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("fullName", data.fullName);
    formData.append("username", data.username);
    formData.append("passwordHash", data.passwordHash);
    formData.append("role", "Staff");
    formData.append("birthDate", new Date(data.birthDate).toISOString());
    formData.append("gender", data.gender);
    formData.append("phoneNumber", data.phoneNumber);
    formData.append("identityNumber", data.identityNumber);
    formData.append("hometown", data.hometown);
    formData.append("currentAddress", data.currentAddress);
    formData.append("branchId", data.branchId);
    formData.append("fixedSalary", Number(data.fixedSalary));
    formData.append("workShiftId", data.workShiftId);

    if (profileImage) {
      formData.append("avatar", profileImage);
    }

    try {
      await axios.post(`${api_url}/Staff/add-employee`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Thêm nhân viên thành công!", {
        position: "top-right",
      });
      closeModal();
      fetchStaff();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Tên đăng nhập đã tồn tại!";
      toast.error(errorMessage, { position: "top-right" });
    }
  };

  const handleFileChangeImage = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfileImage(file);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsDetailModalOpen(false);
    setIsStatusModalOpen(false);
    setIsSetupModalOpen(false); // Đóng modal setup
    setStep(1);
    setSelectedStaff(null);
    setStaffToSetup(null);
    setProfileImage(null);
    reset();
  };

  const handleInputChange = (e) => {
    let rawValue = e.target.value.replace(/\D/g, "");
    if (rawValue === "") {
      setValue("fixedSalary", "");
    } else {
      setValue("fixedSalary", parseInt(rawValue, 10));
    }
  };

  const handleSetupInputChange = (field, e) => {
    let rawValue = e.target.value.replace(/\D/g, "");
    if (rawValue === "") {
      setSetupValue(field, "");
    } else {
      setSetupValue(field, parseInt(rawValue, 10));
    }
  };

  const updateShift = async (staffId, workShiftId) => {
    try {
      const response = await axios.put(
        `${api_url}/Staff/update-employee-workshift/${staffId}`,
        { workShiftId }
      );
      if (response.status === 200) {
        toast.success(`Cập nhật ca làm việc thành công cho nhân viên`);
      }
    } catch (error) {
      console.error("Lỗi cập nhật ca làm việc:", error);
      toast.error("Cập nhật thất bại! Vui lòng thử lại.");
    }
  };

  const handleShiftChange = (staffId, workShiftId) => {
    setShiftAssignments((prev) => ({
      ...prev,
      [staffId]: workShiftId,
    }));
    updateShift(staffId, workShiftId);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const validExtensions = ["xlsx", "xls", "csv"];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      toast.error("Chỉ hỗ trợ file Excel (.xlsx, .xls) hoặc CSV!", {
        position: "top-right",
      });
      return;
    }
    uploadFile(file);
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`${api_url}/Staff/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Nhập file thành công!", { position: "top-right" });
      fetchStaff();
    } catch (error) {
      toast.error("Lỗi khi nhập file!", { position: "top-right" });
    }
  };

  const exportFile = async (format) => {
    try {
      const response = await axios.get(
        `${api_url}/Staff/export?format=${format}`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `DanhSachNhanVien.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Lỗi khi xuất file!", { position: "top-right" });
    }
  };

  const openSetupModal = (staffId, currentFixedSalary, currentOvertimeRate) => {
    setStaffToSetup(staffId);
    setSetupValue("fixedSalary", currentFixedSalary || "");
    setSetupValue("overtimeRate", currentOvertimeRate || "");
    setIsSetupModalOpen(true);
  };

  const onSetupSubmit = async (data) => {
    try {
      // Gọi API setEmployeeSalary
      if (data.fixedSalary !== "") {
        await axios.post(`${api_url}/Payroll/setEmployeeSalary`, {
          employeeId: staffToSetup,
          fixedSalary: Number(data.fixedSalary),
        });
      }

      // Gọi API setEmployeeOvertimeRate
      if (data.overtimeRate !== "") {
        await axios.post(`${api_url}/Payroll/setEmployeeOvertimeRate`, {
          employeeId: staffToSetup,
          overtimeRate: Number(data.overtimeRate),
        });
      }

      toast.success("Thiết lập lương và tỷ lệ tăng ca thành công!", {
        position: "top-right",
      });
      closeModal();
      fetchStaff();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Lỗi khi thiết lập lương!";
      toast.error(errorMessage, { position: "top-right" });
    }
  };

  return (
    <>
      <Header />
      <div className="p-10 h-screen bg-gray-100">
        <div className="mx-auto flex flex-col xl:flex-row justify-between items-center mb-4 space-y-2 xl:space-y-0">
          <div className="flex flex-col lg:flex-row gap-2 w-full lg:w-1/2">
            <input
              type="text"
              className="form-control w-full lg:w-[30rem] px-3 py-2 border rounded"
              placeholder="Theo tên nhân viên"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-nowrap justify-center lg:justify-end gap-2 w-full lg:w-auto overflow-hidden">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded min-w-[120px]"
              onClick={() => setIsModalOpen(true)}
            >
              Thêm nhân viên
            </button>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded min-w-[120px]"
              onClick={() => exportFile("xlsx")}
            >
              Xuất Excel
            </button>
          </div>
        </div>
        <table className="w-full bg-white shadow-md rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-center">Mã nhân viên</th>
              <th className="p-2 text-center">Ảnh hồ sơ</th>
              <th className="p-2 text-center">Họ tên nhân viên</th>
              <th className="p-2 text-center">Ngày sinh</th>
              <th className="p-2 text-center">Giới tính</th>
              <th className="p-2 text-center">Quê quán</th>
              <th className="p-2 text-center">Số điện thoại</th>
              <th className="p-2 text-center">Ngày vào làm</th>
              <th className="p-2 text-center">Ca làm việc</th>
              <th className="p-2 text-center">Trạng thái</th>
              <th className="p-2 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {getCurrentPageData().length > 0 ? (
              getCurrentPageData().map((staff) => (
                <tr key={staff.id} onClick={() => openDetailModal(staff.id)}>
                  <td className="p-2 text-center">{staff.id}</td>
                  <td className="p-2 flex justify-center">
                    <img
                      src={
                        profileImages[staff.id] ||
                        "https://icons.veryicon.com/png/o/miscellaneous/standard/avatar-15.png"
                      }
                      alt="Ảnh hồ sơ"
                      width="50"
                      height="50"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://icons.veryicon.com/png/o/miscellaneous/standard/avatar-15.png";
                      }}
                    />
                  </td>
                  <td className="p-2 text-center">{staff.fullName}</td>
                  <td className="p-2 text-center">
                    {new Date(staff.birthDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="p-2 text-center">
                    {staff.gender === "Female" ? "Nữ" : "Nam"}
                  </td>
                  <td className="p-2 text-center">
                    {staff.hometown || "Chưa cập nhật"}
                  </td>
                  <td className="p-2 text-center">{staff.phoneNumber}</td>
                  <td className="p-2 text-center">
                    {new Date(staff.startDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="p-2 text-center">
                    <select
                      className="border rounded px-2 py-1"
                      value={
                        shiftAssignments[staff.id] || staff.workShiftId || ""
                      }
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleShiftChange(staff.id, Number(e.target.value));
                      }}
                    >
                      <option value="">Chọn ca</option>
                      {shifts.map((shift) => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    {staff.activeStatus ? (
                      <span className="text-green-500">Đang làm việc</span>
                    ) : (
                      <span className="text-red-500">Đã nghỉ việc</span>
                    )}
                  </td>
                  <td className="p-2 text-center flex justify-center gap-2">
                    <button
                      className={`${
                        staff.activeStatus ? "bg-red-500" : "bg-blue-500"
                      } text-white px-2 py-1 rounded`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openStatusModal(staff.id, staff.activeStatus);
                      }}
                    >
                      {staff.activeStatus ? "Nghỉ việc" : "Kích hoạt"}
                    </button>
                    <button
                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSetupModal(staff.id, staff.fixedSalary, staff.overtimeRate);
                      }}
                    >
                      Setup
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="text-center p-4">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex justify-between items-center mt-4">
          <button
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded disabled:opacity-50"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Trước
          </button>
          <span>
            Trang {currentPage} / {totalPages}
          </span>
          <button
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded disabled:opacity-50"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Sau
          </button>
        </div>

        {/* Modal Thêm nhân viên */}
        {isModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
            onClick={closeModal}
          >
            <div
              className="bg-white p-6 rounded-lg w-1/3 max-h-screen overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold mb-4">Thêm nhân viên</h2>
              <form onSubmit={handleSubmit(onSubmit)}>
                {step === 1 && (
                  <div className="space-y-2">
                    <label className="block font-medium">Họ tên</label>
                    <input
                      {...register("fullName")}
                      className="w-full p-2 border rounded"
                      required
                    />
                    <label className="block font-medium">Tên đăng nhập</label>
                    <input
                      {...register("username")}
                      className="w-full p-2 border rounded"
                      required
                    />
                    <label className="block font-medium">Mật khẩu</label>
                    <input
                      type="password"
                      {...register("passwordHash")}
                      className="w-full p-2 border rounded"
                      required
                    />
                    <label className="block font-medium">Ngày sinh</label>
                    <input
                      type="date"
                      {...register("birthDate")}
                      className="w-full p-2 border rounded"
                      required
                    />
                    <label className="block font-medium">Giới tính</label>
                    <select
                      {...register("gender")}
                      className="w-full p-2 border rounded"
                    >
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                    </select>
                    <label className="block font-medium">Số điện thoại</label>
                    <input
                      {...register("phoneNumber")}
                      className="w-full p-2 border rounded"
                      required
                    />
                    <label className="block font-medium">Địa chỉ cụ thể</label>
                    <input
                      {...register("hometown")}
                      className="w-full p-2 border rounded"
                      placeholder="Nhập địa chỉ cụ thể"
                      required
                    />
                    <label className="block font-medium">Ảnh hồ sơ</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChangeImage}
                      className="w-full p-2 border rounded"
                    />
                    {profileImage && (
                      <div className="mt-2">
                        <img
                          src={URL.createObjectURL(profileImage)}
                          alt="Ảnh hồ sơ"
                          className="w-32 h-32 object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-2">
                    <label className="block font-medium">Ca làm việc</label>
                    <select
                      {...register("workShiftId")}
                      className="w-full p-2 border rounded"
                    >
                      <option value="1">Ca sáng</option>
                      <option value="2">Ca chiều</option>
                    </select>
                    <label className="block font-medium">Chi nhánh</label>
                    <select
                      {...register("branchId")}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Chọn Chi Nhánh</option>
                      {warehouses.map((warehouse) => (
                        <option
                          key={warehouse.warehousesId}
                          value={warehouse.warehousesId}
                        >
                          {warehouse.name}
                        </option>
                      ))}
                    </select>
                    <label className="block font-medium">Lương tháng</label>
                    <input
                      type="text"
                      value={
                        watch("fixedSalary") !== ""
                          ? new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(watch("fixedSalary"))
                          : ""
                      }
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    />
                    <label className="block font-medium">Số CMND/CCCD</label>
                    <input
                      type="text"
                      {...register("identityNumber")}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                )}
                <div className="flex justify-between mt-4">
                  {step > 1 && (
                    <button
                      type="button"
                      className="bg-gray-400 text-white px-4 py-2 rounded"
                      onClick={() => setStep(step - 1)}
                    >
                      Quay lại
                    </button>
                  )}
                  {step < 2 ? (
                    <button
                      type="button"
                      className="bg-blue-500 text-white px-4 py-2 rounded ml-auto"
                      onClick={(e) => {
                        e.preventDefault();
                        setStep(step + 1);
                      }}
                    >
                      Tiếp theo
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="bg-green-500 text-white px-4 py-2 rounded ml-auto"
                    >
                      Thêm nhân viên
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Chi tiết nhân viên */}
        {isDetailModalOpen && selectedStaff && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
            onClick={closeModal}
          >
            <div
              className="bg-white p-6 rounded-lg w-1/3 max-h-screen overflow-y-auto shadow-lg m-10"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-3xl font-bold mb-4 text-center">
                Chi tiết nhân viên {selectedStaff.fullName}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <p className="font-semibold text-xl">Họ tên:</p>
                <p className="text-xl">{selectedStaff.fullName}</p>
                <p className="font-semibold text-xl">Ngày sinh:</p>
                <p className="text-xl">
                  {new Date(selectedStaff.birthDate).toLocaleDateString("vi-VN")}
                </p>
                <p className="font-semibold text-xl">Tên đăng nhập:</p>
                <p className="text-xl">{selectedStaff.username}</p>
                <p className="font-semibold text-xl">Mật khẩu:</p>
                <div className="flex items-center text-xl">
                  <p>{showPassword ? selectedStaff.passwordHash : "••••••••"}</p>
                  <button
                    type="button"
                    className="ml-2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <p className="font-semibold text-xl">Giới tính:</p>
                <p className="text-xl">
                  {selectedStaff.gender === "Female" ? "Nữ" : "Nam"}
                </p>
                <p className="font-semibold text-xl">Số điện thoại:</p>
                <p className="text-xl">{selectedStaff.phoneNumber}</p>
                <p className="font-semibold text-xl">Ngày bắt đầu:</p>
                <p className="text-xl">
                  {new Date(selectedStaff.startDate).toLocaleDateString("vi-VN")}
                </p>
                <p className="font-semibold text-xl">Số CMND/CCCD:</p>
                <p className="text-xl">{selectedStaff.identityNumber}</p>
                <p className="font-semibold text-xl">Quê quán:</p>
                <p className="text-xl">
                  {selectedStaff.hometown || "Chưa cập nhật"}
                </p>
                <p className="font-semibold text-xl">Trạng thái:</p>
                <p className="text-xl">
                  {selectedStaff.activeStatus ? "Đang làm việc" : "Nghỉ việc"}
                </p>
                <p className="font-semibold text-xl">Lương tháng:</p>
                <p className="text-xl">
                  {selectedStaff.fixedSalary
                    ? selectedStaff.fixedSalary.toLocaleString("vi-VN") + " VNĐ"
                    : "Chưa thiết lập"}
                </p>
                <p className="font-semibold text-xl">Tỷ lệ tăng ca:</p>
                <p className="text-xl">
                  {selectedStaff.overtimeRate
                    ? selectedStaff.overtimeRate.toLocaleString("vi-VN") + " VNĐ/giờ"
                    : "Chưa thiết lập"}
                </p>
              </div>
              <div className="flex justify-center mt-6 gap-4">
                <button
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                  onClick={() =>
                    openSetupModal(
                      selectedStaff.id,
                      selectedStaff.fixedSalary,
                      selectedStaff.overtimeRate
                    )
                  }
                >
                  Setup lương
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  onClick={closeModal}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Setup lương và tỷ lệ tăng ca */}
        {isSetupModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
            onClick={closeModal}
          >
            <div
              className="bg-white p-6 rounded-lg w-1/3"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold mb-4">Thiết lập lương cho nhân viên</h2>
              <form onSubmit={handleSetupSubmit(onSetupSubmit)}>
                <div className="space-y-4">
                  <div>
                    <label className="block font-medium">Lương cố định (VNĐ)</label>
                    <input
                      type="text"
                      value={
                        watchSetup("fixedSalary") !== ""
                          ? new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(watchSetup("fixedSalary"))
                          : ""
                      }
                      onChange={(e) => handleSetupInputChange("fixedSalary", e)}
                      className="w-full p-2 border rounded"
                      placeholder="Nhập lương cố định"
                    />
                  </div>
                  <div>
                    <label className="block font-medium">Tỷ lệ tăng ca (VNĐ/giờ)</label>
                    <input
                      type="text"
                      value={
                        watchSetup("overtimeRate") !== ""
                          ? new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(watchSetup("overtimeRate"))
                          : ""
                      }
                      onChange={(e) => handleSetupInputChange("overtimeRate", e)}
                      className="w-full p-2 border rounded"
                      placeholder="Nhập tỷ lệ tăng ca"
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-6">
                  <button
                    type="button"
                    className="bg-gray-400 text-white px-4 py-2 rounded"
                    onClick={closeModal}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Thay đổi trạng thái */}
        {isStatusModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
            onClick={() => setIsStatusModalOpen(false)}
          >
            <div
              className="bg-white p-6 rounded-lg w-1/3"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold mb-4">
                Bạn có chắc chắn muốn{" "}
                {currentStatus ? "cho nhân viên nghỉ việc" : "kích hoạt lại nhân viên"} không?
              </h2>
              <div className="flex justify-between">
                <button
                  className={`${currentStatus ? "bg-red-500" : "bg-blue-500"} text-white px-4 py-2 rounded`}
                  onClick={handleStatusChange}
                >
                  {currentStatus ? "Nghỉ việc" : "Kích hoạt"}
                </button>
                <button
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                  onClick={() => setIsStatusModalOpen(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}