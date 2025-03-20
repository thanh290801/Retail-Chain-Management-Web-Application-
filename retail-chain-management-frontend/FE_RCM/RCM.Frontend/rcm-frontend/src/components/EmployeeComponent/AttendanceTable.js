import React, { useState, useEffect } from "react";
import { Table, Select, Tag } from "antd";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import localeData from "dayjs/plugin/localeData";
import Header from "../../headerComponent/header";
import { toast } from "react-toastify";
import "dayjs/locale/vi";
import { useParams } from "react-router-dom";

dayjs.locale("vi");
dayjs.extend(isBetween);
dayjs.extend(localeData);

const { Option } = Select;

const AttendanceTable = () => {
  const { id } = useParams();
  const localEmployeeId = localStorage.getItem("employeeId");
  const employeeId = id || localEmployeeId;

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

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedMonth, selectedYear, employeeId]);

  const fetchAttendanceData = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/Attendance/AttendanceDetail?employeeId=${employeeId}`
      );
      const result = await response.json();
      setData(result);
      calculateWorkDaysAndLates(result);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu chấm công!");
    }
  };

  const calculateWorkDaysAndLates = (attendanceData) => {
    const uniqueDates = new Set();
    let lateCounter = 0;

    attendanceData.forEach((item) => {
      const itemDate = dayjs(item.attendanceDate);
      if (itemDate.month() + 1 === selectedMonth) {
        uniqueDates.add(item.attendanceDate);

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
      const res = await fetch("http://localhost:5000/api/Attendance/CheckIn", {
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
        time: dayjs(data.checkInTime).format("HH:mm:ss"),
        overtime: data.overtime,
      });
      toast.success("Checkin thành công", { position: "top-right" });
    } catch (error) {
      console.error("Lỗi check-in:", error.message);
      toast.error(error.message, { position: "top-right" });
    }
  };
  const handleCheckOut = async () => {
    fetch("http://localhost:5000/api/Attendance/CheckOut", {
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

      // Chuyển đổi shift name để đảm bảo khớp với dữ liệu từ API
      const normalizedData = data.map((item) => ({
        ...item,
        shift: item.shift.toLowerCase().includes("sáng")
          ? "Morning"
          : "Afternoon",
      }));

      const attendances = normalizedData.filter(
        (item) => dayjs(item.attendanceDate).format("YYYY-MM-DD") === date
      );
      const morningShift = attendances.find((item) => item.shift === "Morning");
      const afternoonShift = attendances.find(
        (item) => item.shift === "Afternoon"
      );

      formattedData.push({
        key: date,
        date: dayjs(date).format("DD/MM/YYYY"),

        morningCheckIn: isFutureDate ? (
          "-"
        ) : morningShift?.checkInTime ? (
          <p className="text-xl font-bold">
            {dayjs(morningShift.checkInTime).format("HH:mm:ss")}
          </p>
        ) : (
          "-"
        ),

        morningCheckOut: isFutureDate ? (
          "-"
        ) : morningShift?.checkOutTime ? (
          <p className="text-xl font-bold">
            {dayjs(morningShift.checkOutTime).format("HH:mm:ss")}
          </p>
        ) : (
          "-"
        ),

        morningStatus: isFutureDate ? (
          "-"
        ) : morningShift ? (
          <Tag color={morningShift.onTimeStatus === "On Time" ? "blue" : "red"}>
            {morningShift.onTimeStatus === "On Time" ? "Đúng giờ" : "Muộn"}
          </Tag>
        ) : (
          <Tag color="red">Nghỉ</Tag>
        ),

        afternoonCheckIn: isFutureDate ? (
          "-"
        ) : afternoonShift?.checkInTime ? (
          <p className="text-xl font-bold">
            {dayjs(afternoonShift.checkInTime).format("HH:mm:ss")}
          </p>
        ) : (
          "-"
        ),

        afternoonCheckOut: isFutureDate ? (
          "-"
        ) : afternoonShift?.checkOutTime ? (
          <p className="text-xl font-bold">
            {dayjs(afternoonShift.checkOutTime).format("HH:mm:ss")}
          </p>
        ) : (
          "-"
        ),

        afternoonStatus: isFutureDate ? (
          "-"
        ) : afternoonShift ? (
          <Tag
            color={afternoonShift.onTimeStatus === "On Time" ? "blue" : "red"}
          >
            {afternoonShift.onTimeStatus === "On Time" ? "Đúng giờ" : "Muộn"}
          </Tag>
        ) : (
          <Tag color="red">Nghỉ</Tag>
        ),
      });
    }

    return formattedData;
  };

  return (
    <div>
      <Header />
      <div className="m-10 flex justify-between">
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
        {isOwner && (
          <div className="flex justify-between w-full my-4">
            <button
              className="bg-blue-500 text-white py-2 px-4 rounded w-1/2 mr-2"
              onClick={handleCheckIn}
            >
              Check In
            </button>
            <button
              className="bg-red-500 text-white py-2 px-4 rounded w-1/2 ml-2"
              onClick={handleCheckOut}
            >
              Check Out
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
    </div>
  );
};

export default AttendanceTable;
