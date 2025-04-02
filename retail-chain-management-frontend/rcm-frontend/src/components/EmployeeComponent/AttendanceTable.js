import React, { useState, useEffect } from "react";
import {
  Table,
  Select,
  Tag,
  Modal,
  DatePicker,
  TimePicker,
  InputNumber,
  Input,
} from "antd";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import localeData from "dayjs/plugin/localeData";
import Header from "../../headerComponent/header";
import { toast } from "react-toastify";
import "dayjs/locale/vi";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

dayjs.locale("vi");
dayjs.extend(isBetween);
dayjs.extend(localeData);

const { Option } = Select;
const api_url = process.env.REACT_APP_API_URL

const AttendanceTable = () => {
  const { id } = useParams();
  const localEmployeeId = localStorage.getItem("employeeId");
  const employeeId = id || localEmployeeId;
  const navigate = useNavigate();

  // Kiểm tra nếu employeeId lấy từ localStorage = id từ URL
  const isCheckInRoute = window.location.pathname === "/checkin";
  const isOwner = (id && id === localEmployeeId) || isCheckInRoute;
  const [data, setData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [totalWorkDays, setTotalWorkDays] = useState(0);
  const [lateCount, setLateCount] = useState(0);
  const [checkInMessage, setCheckInMessage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalOvertimeOpen, setModalOvertimeOpen] = useState(false);
  const [overtimeDate, setOvertimeDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [startTime, setStartTime] = useState(null);
  const [totalHours, setTotalHours] = useState(1);
  const [reason, setReason] = useState("");
  const [totalOvertimeHours, setTotalOvertimeHours] = useState(0);
  const [overtimeHoursForMonth, setOvertimeHoursForMonth] = useState({});

  useEffect(() => {
    fetchAttendanceData();
    fetchApprovedOvertimeData();
    fetchOvertimeHoursForMonth().then(overtimeHours => {
      setOvertimeHoursForMonth(overtimeHours); // Lưu trữ số giờ tăng ca vào state
    });
  }, [selectedMonth, selectedYear, employeeId]);

  const fetchAttendanceData = async () => {
    try {
      const response = await fetch(
        `${api_url}/Attendance/AttendanceDetail?employeeId=${employeeId}`
      );
      const result = await response.json();
      setData(result);
      calculateWorkDaysAndLates(result);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu chấm công!");
    }
  };

  const fetchApprovedOvertimeData = async () => {
    try {
      const response = await fetch(
        `${api_url}/Staff/ApprovedOvertimeList?employeeId=${employeeId}&month=${selectedMonth}&year=${selectedYear}`
      );
      const result = await response.json();
      
      // Tính tổng số giờ tăng ca
      const totalHours = result.approvedOvertimeRecords.reduce((sum, record) => {
        return sum + parseFloat(record.totalHours);
      }, 0);
      
      setTotalOvertimeHours(totalHours);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu tăng ca!");
    }
  };

  const fetchOvertimeHoursForMonth = async () => {
    const overtimeHours = {};
    const monthDays = dayjs(`${selectedYear}-${selectedMonth}-01`).daysInMonth();
  
    try {
      const response = await fetch(
        `${api_url}/Staff/ApprovedOvertimeList?employeeId=${employeeId}&month=${selectedMonth}&year=${selectedYear}`
      );
      const result = await response.json();
  
      // Duyệt qua các bản ghi tăng ca
      result.approvedOvertimeRecords.forEach(record => {
        const date = dayjs(record.date, "DD/MM/YYYY").format("YYYY-MM-DD"); // Đảm bảo định dạng ngày đúng
        if (!overtimeHours[date]) {
          overtimeHours[date] = 0; // Khởi tạo nếu chưa có
        }
        overtimeHours[date] += parseFloat(record.totalHours); // Cộng dồn số giờ tăng ca
      });
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu tăng ca:", error);
    }
  
    return overtimeHours;
  };
  const calculateWorkDaysAndLates = (attendanceData) => {
    const uniqueDates = new Set();
    let lateCounter = 0;

    attendanceData.forEach((item) => {
      const itemDate = dayjs(item.attendanceDate, "DD/MM/YYYY"); // Cập nhật cách parse
      if (itemDate.month() + 1 === selectedMonth) {
        uniqueDates.add(itemDate.format("YYYY-MM-DD")); // Đảm bảo format đồng nhất

        if (item.onTimeStatus === "Late") {
          lateCounter++;
        }
      }
    });

    setTotalWorkDays(uniqueDates.size);
    setLateCount(lateCounter);
  };

  const handleCheckIn = async () => {
    try {
      const res = await fetch(`${api_url}/Attendance/CheckIn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      if (!res.ok) {
        // Nếu response không OK, lấy lỗi trả về dưới dạng text
        const errorText = await res.text();
        throw new Error(errorText || "Đã có lỗi xảy ra!");
      }
      const data = await res.json();
      console.log("Check-in thành công:", data);
      fetchAttendanceData(); // Cập nhật lại dữ liệu sau khi check-in
      setModalOpen(false);
      setCheckInMessage({
        message: data.message,
        shift: data.shift,
        status: data.status,
        time: dayjs(data.checkInTime, "DD/MM/YYYY HH:mm:ss").format("HH:mm:ss"),
        late: data.lateMinutes,
        overtime: data.overtime,
      });
      toast.success("Checkin thành công", { position: "top-right" });
    } catch (error) {
      console.error("Lỗi check-in:", error.message);
      toast.error(error.message, { position: "top-right" });
    }
  };
  const handleCheckOut = async () => {
    fetch(`${api_url}/Attendance/CheckOut`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId }),
    })
      .then(async (res) => {
        if (!res.ok) {
          // Nếu response không OK (ví dụ 400, 500)
          const textData = await res.text(); // Đọc dữ liệu trả về dưới dạng text
          throw new Error(textData || "Đã có lỗi xảy ra!"); // Ném lỗi để bắt trong catch
        }
        return res.json(); // Nếu OK, parse JSON
      })
      .then((data) => {
        console.log("Check-out thành công:", data);
        fetchAttendanceData(); // Cập nhật lại dữ liệu sau khi check-out
        setModalOpen(false);
        toast.success("Checkout thành công", { position: "top-right" });
      })
      .catch((error) => {
        toast.error(error.message, { position: "top-right" });
      });
  };

  const resetOvertimeForm = () => {
    setOvertimeDate(dayjs().format("YYYY-MM-DD"));
    setStartTime(null);
    setTotalHours(1);
    setReason("");
  };

  const formattedStartTime = dayjs(startTime).format("HH:mm:ss");
  const handleRequestOvertime = async () => {
    if (!startTime || totalHours <= 0 || !reason) {
      toast.error("Vui lòng nhập đầy đủ thông tin tăng ca.");
      return;
    }

    try {
      const response = await fetch(
        `${api_url}/Attendance/RequestOvertime`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId,
            date: overtimeDate,
            startTime: formattedStartTime,
            totalHours,
            reason,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Lỗi khi gửi đề xuất tăng ca");
      }

      toast.success("Đề xuất tăng ca thành công!");
      setModalOvertimeOpen(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // const formatAttendanceData = () => {
  //   const formattedData = [];
  //   const monthDays = dayjs(
  //     `${selectedYear}-${selectedMonth}-01`
  //   ).daysInMonth();
  //   const today = dayjs().format("YYYY-MM-DD");

  //   for (let day = 1; day <= monthDays; day++) {
  //     const date = dayjs(`${selectedYear}-${selectedMonth}-${day}`).format(
  //       "YYYY-MM-DD"
  //     );
  //     const isFutureDate = dayjs(date).isAfter(today);

  //     const normalizedData = data.map((item) => ({
  //       ...item,
  //       shift: item.shift.includes("sáng") ? "Morning" : "Afternoon",
  //       attendanceDate: dayjs(item.attendanceDate, [
  //         "DD/MM/YYYY",
  //         "YYYY-MM-DD",
  //       ]).format("YYYY-MM-DD"),
  //     }));

  //     const attendances = normalizedData.filter(
  //       (item) => item.attendanceDate === date
  //     );
  //     const morningShift = attendances.find((item) => item.shift === "Morning");
  //     const afternoonShift = attendances.find(
  //       (item) => item.shift === "Afternoon"
  //     );

  //     const getStatus = (shift) => {
  //       if (!shift) return "-"; // Nếu không có ca làm thì hiển thị "-"
  //       return shift.onTimeStatus === "Late" ? "Đi muộn" : "Đúng giờ";
  //     };

  //     formattedData.push({
  //       key: date,
  //       date: dayjs(date).format("DD/MM/YYYY"),

  //       morningCheckIn: morningShift?.checkInTime
  //         ? dayjs(morningShift.checkInTime, [
  //           "DD/MM/YYYY HH:mm:ss",
  //           "YYYY-MM-DDTHH:mm:ss",
  //         ]).format("HH:mm:ss")
  //         : "-",

  //       morningCheckOut: morningShift?.checkOutTime
  //         ? dayjs(morningShift.checkOutTime, [
  //           "DD/MM/YYYY HH:mm:ss",
  //           "YYYY-MM-DDTHH:mm:ss",
  //         ]).format("HH:mm:ss")
  //         : "-",

  //       afternoonCheckIn: afternoonShift?.checkInTime
  //         ? dayjs(afternoonShift.checkInTime, [
  //           "DD/MM/YYYY HH:mm:ss",
  //           "YYYY-MM-DDTHH:mm:ss",
  //         ]).format("HH:mm:ss")
  //         : "-",

  //       afternoonCheckOut: afternoonShift?.checkOutTime
  //         ? dayjs(afternoonShift.checkOutTime, [
  //           "DD/MM/YYYY HH:mm:ss",
  //           "YYYY-MM-DDTHH:mm:ss",
  //         ]).format("HH:mm:ss")
  //         : "-",

  //       morningStatus: isFutureDate
  //         ? "-"
  //         : morningShift
  //           ? getStatus(morningShift)
  //           : "-",
  //       afternoonStatus: isFutureDate
  //         ? "-"
  //         : afternoonShift
  //           ? getStatus(afternoonShift)
  //           : "-",
  //     });
  //   }

  //   return formattedData;
  // };

  const formatAttendanceData = () => {
    const formattedData = [];
    const monthDays = dayjs(
      `${selectedYear}-${selectedMonth}-01`
    ).daysInMonth();
    const today = dayjs().format("YYYY-MM-DD");
  
    for (let day = 1; day <= monthDays; day++) {
      const date = dayjs(`${selectedYear}-${selectedMonth}-${day}`).format(
        "YYYY-MM-DD"
      );
      const isFutureDate = dayjs(date).isAfter(today);
  
      const normalizedData = data.map((item) => ({
        ...item,
        shift: item.shift.includes("sáng") ? "Morning" : "Afternoon",
        attendanceDate: dayjs(item.attendanceDate, [
          "DD/MM/YYYY",
          "YYYY-MM-DD",
        ]).format("YYYY-MM-DD"),
      }));
  
      const attendances = normalizedData.filter(
        (item) => item.attendanceDate === date
      );
      const morningShift = attendances.find((item) => item.shift === "Morning");
      const afternoonShift = attendances.find(
        (item) => item.shift === "Afternoon"
      );

      const getStatus = (shift) => {
        if (!shift) return "-"; // Nếu không có ca làm thì hiển thị "-"
        return shift.onTimeStatus === "Late" ? "Đi muộn" : "Đúng giờ";
      };
  
      formattedData.push({
        key: date,
        date: dayjs(date).format("DD/MM/YYYY"),
        morningCheckIn: morningShift?.checkInTime
          ? dayjs(morningShift.checkInTime, [
            "DD/MM/YYYY HH:mm:ss",
            "YYYY-MM-DDTHH:mm:ss",
          ]).format("HH:mm:ss")
          : "-",
        morningCheckOut: morningShift?.checkOutTime
          ? dayjs(morningShift.checkOutTime, [
            "DD/MM/YYYY HH:mm:ss",
            "YYYY-MM-DDTHH:mm:ss",
          ]).format("HH:mm:ss")
          : "-",
        afternoonCheckIn: afternoonShift?.checkInTime
          ? dayjs(afternoonShift.checkInTime, [
            "DD/MM/YYYY HH:mm:ss",
            "YYYY-MM-DDTHH:mm:ss",
          ]).format("HH:mm:ss")
          : "-",
        afternoonCheckOut: afternoonShift?.checkOutTime
          ? dayjs(afternoonShift.checkOutTime, [
            "DD/MM/YYYY HH:mm:ss",
            "YYYY-MM-DDTHH:mm:ss",
          ]).format("HH:mm:ss")
          : "-",
        totalOvertime: overtimeHoursForMonth[date] ? overtimeHoursForMonth[date].toFixed(2) : "0.00", // Lấy số giờ tăng ca từ state
        morningStatus: isFutureDate
          ? "-"
          : morningShift
            ? getStatus(morningShift)
            : "-",
        afternoonStatus: isFutureDate
          ? "-"
          : afternoonShift
            ? getStatus(afternoonShift)
            : "-",
      });
    }
  
    return formattedData;
  };

  const getStatusTag = (status) => {
    if (status === "-") return status;
    const color =
      status === "Đúng giờ" ? "blue" : status === "Đi muộn" ? "red" : "gray";
    return <Tag color={color}>{status}</Tag>;
  };

  return (
    <div>
      <button
        onClick={() => navigate("/staffHome")}
        className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold shadow-md">
        Quay lại
      </button>      <div className="m-10 flex justify-between">
        <h2 className="uppercase">Bảng Chấm Công Theo Tháng</h2>
        <div className="flex gap-2">
          <Select value={selectedMonth} onChange={setSelectedMonth}>
            {Array.from({ length: 12 }, (_, i) => (
              <Option key={i + 1} value={i + 1}>
                Tháng {i + 1}
              </Option>
            ))}
          </Select>
          <Select value={selectedYear} onChange={setSelectedYear}>
            {Array.from({ length: 5 }, (_, i) => (
              <Option key={i} value={dayjs().year() - 2 + i}>
                {dayjs().year() - 2 + i}
              </Option>
            ))}
          </Select>
        </div>
      </div>
      <div className="m-10">
        <h3 className="text-lg font-bold mb-4">
          Tổng số ngày công: {totalWorkDays}
        </h3>
        <h3 className="text-lg font-bold mb-4">Số lần đi muộn: {lateCount}</h3>
        <h3 className="text-lg font-bold mb-4">Tổng số giờ tăng ca: {totalOvertimeHours.toFixed(2)} giờ</h3>
        {isOwner && (
          <div className="flex justify-between w-full my-4">
            <button
              className="bg-blue-500 text-white py-2 px-4 rounded w-1/3 mr-2 uppercase"
              onClick={handleCheckIn}
            >
              Check In
            </button>
            <button
              className="bg-red-500 text-white py-2 px-4 rounded w-1/3 mx-2 uppercase"
              onClick={handleCheckOut}
            >
              Check Out
            </button>
            <button
              className="bg-green-500 text-white py-2 px-4 rounded w-1/3 ml-2 uppercase"
              onClick={() => setModalOvertimeOpen(true)}
            >
              Đề xuất tăng ca
            </button>
          </div>
        )}
        <Table
          columns={[
            { title: "Ngày", dataIndex: "date", key: "date" },
            {
              title: "Check-in Sáng",
              dataIndex: "morningCheckIn",
              key: "morningCheckIn",
            },
            {
              title: "Check-out Sáng",
              dataIndex: "morningCheckOut",
              key: "morningCheckOut",
            },
            {
              title: "Trạng thái Sáng",
              dataIndex: "morningStatus",
              key: "morningStatus",
              render: (status) => getStatusTag(status),
            },
            {
              title: "Check-in Chiều",
              dataIndex: "afternoonCheckIn",
              key: "afternoonCheckIn",
            },
            {
              title: "Check-out Chiều",
              dataIndex: "afternoonCheckOut",
              key: "afternoonCheckOut",
            },
            {
              title: "Trạng thái Chiều",
              dataIndex: "afternoonStatus",
              key: "afternoonStatus",
              render: (status) => getStatusTag(status),
            },
            {
              title: "Số giờ tăng ca",
              dataIndex: "totalOvertime",
              key: "totalOvertime",
            },
          ]}
          dataSource={formatAttendanceData()}
          pagination={false}
          bordered
        />
      </div>
      {/* thông báo trạng thái */}
      {checkInMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div
            className="bg-white p-6 rounded shadow-lg"
            style={{ width: "400px" }}
          >
            <h2 className="text-xl font-bold mb-2">Thông báo Check-in</h2>
            <p>
              <strong>Trạng thái:</strong> {checkInMessage.status}
            </p>
            <p>
              <strong>Thời gian:</strong> {checkInMessage.time}
            </p>
            <p>
              <strong>Thời gian muộn:</strong> {checkInMessage.late} phút
            </p>
            <p>
              <strong>Ca Làm Việc:</strong> {checkInMessage.shift}
            </p>
            <p>
              <strong>Tăng ca:</strong> {checkInMessage.overtime}
            </p>
            <div className="flex justify-center">
              <button
                className="mt-4 p-2 bg-gray-400 text-white rounded text-center"
                onClick={() => setCheckInMessage(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      <Modal
        title="Đề xuất tăng ca"
        open={modalOvertimeOpen} // Sử dụng state modalOvertimeOpen thay vì visible
        onCancel={() => {
          resetOvertimeForm();
          setModalOvertimeOpen(false);
        }}
        onOk={handleRequestOvertime}
        okText="Đề xuất"
        cancelText="Hủy"
      >
        <label>Ngày tăng ca:</label>
        <DatePicker
          className="w-full mb-2"
          value={overtimeDate ? dayjs(overtimeDate) : null}
          onChange={(date) =>
            setOvertimeDate(date ? dayjs(date).format("YYYY-MM-DD") : null)
          }
        />

        <label>Giờ bắt đầu:</label>
        <TimePicker
          className="w-full mb-2"
          format="HH:mm"
          value={startTime}
          onChange={(time) => setStartTime(time)}
        />

        <label>Tổng số giờ:</label>
        <InputNumber
          className="w-full mb-2"
          min={1}
          max={12}
          value={totalHours}
          onChange={setTotalHours}
        />

        <label>Lý do:</label>
        <Input.TextArea
          className="w-full"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default AttendanceTable;
