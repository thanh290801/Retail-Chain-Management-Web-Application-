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
const api_url = process.env.REACT_APP_API_URL;

const AttendanceTable = () => {
  const { id } = useParams();
  const localEmployeeId = localStorage.getItem("employeeId");
  const employeeId = id || localEmployeeId;
  const navigate = useNavigate();

  const isCheckInRoute = window.location.pathname === "/checkin";
  const isOwner = (id && id === localEmployeeId) || isCheckInRoute;
  const [data, setData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [totalWorkDays, setTotalWorkDays] = useState(0);
  const [lateCount, setLateCount] = useState(0);
  const [workShiftId, setWorkShiftId] = useState(null);

  const [checkInMessage, setCheckInMessage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalOvertimeOpen, setModalOvertimeOpen] = useState(false);
  const [overtimeDate, setOvertimeDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [startTime, setStartTime] = useState(null);
  const [totalHours, setTotalHours] = useState(1);
  const [reason, setReason] = useState("");
  const [totalOvertimeHours, setTotalOvertimeHours] = useState(0);
  const [overtimeHoursForMonth, setOvertimeHoursForMonth] = useState({});

  useEffect(() => {
    fetchAttendanceData();
    fetchApprovedOvertimeData();
    fetchOvertimeHoursForMonth().then((overtimeHours) => {
      setOvertimeHoursForMonth(overtimeHours);
    });
  }, [selectedMonth, selectedYear, employeeId]);

  const fetchAttendanceData = async () => {
    try {
      const response = await fetch(
        `${api_url}/Attendance/AttendanceDetail?employeeId=${employeeId}`
      );

      if (!response.ok) {
        throw new Error("Không thể tải dữ liệu chấm công");
      }

      const result = await response.json();
      setData(result);

      if (Array.isArray(result) && result.length > 0) {
        console.log("Bản ghi đầu tiên:", result[0]);
        console.log("WorkShiftId:", result[0].workShiftId);
        setWorkShiftId(result[0].workShiftId);
      } else {
        console.log("Không có dữ liệu chấm công, lấy workShiftId từ API Employee...");
        const employeeResponse = await fetch(
          `${api_url}/Employee/GetEmployee?employeeId=${employeeId}`
        );
        if (!employeeResponse.ok) {
          throw new Error("Không thể tải thông tin nhân viên");
        }
        const employeeData = await employeeResponse.json();
        if (employeeData && employeeData.workShiftId) {
          console.log("WorkShiftId từ Employee:", employeeData.workShiftId);
          setWorkShiftId(employeeData.workShiftId);
        } else {
          console.log("Không tìm thấy workShiftId trong thông tin nhân viên.");
          setWorkShiftId(null);
        }
      }

      calculateWorkDaysAndLates(result);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu chấm công:", error);
      toast.error("Lỗi khi tải dữ liệu chấm công!");
    }
  };

  const fetchApprovedOvertimeData = async () => {
    try {
      const response = await fetch(
        `${api_url}/Staff/ApprovedOvertimeList?employeeId=${employeeId}&month=${selectedMonth}&year=${selectedYear}`
      );
      const result = await response.json();

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

      result.approvedOvertimeRecords.forEach((record) => {
        const date = dayjs(record.date, "DD/MM/YYYY").format("YYYY-MM-DD");
        if (!overtimeHours[date]) {
          overtimeHours[date] = 0;
        }
        overtimeHours[date] += parseFloat(record.totalHours);
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
      const itemDate = dayjs(item.attendanceDate, "DD/MM/YYYY");
      if (itemDate.month() + 1 === selectedMonth) {
        uniqueDates.add(itemDate.format("YYYY-MM-DD"));

        if (item.status === "Late") {
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
        const errorText = await res.text();
        throw new Error(errorText || "Đã có lỗi xảy ra!");
      }
      const data = await res.json();
      console.log("Check-in thành công:", data);
      fetchAttendanceData();
      setModalOpen(false);
      setCheckInMessage({
        message: data.message,
        shift: data.shift,
        status: data.status,
        time: dayjs(data.checkInTime, "DD/MM/YYYY HH:mm:ss").format("HH:mm:ss"),
        late: data.lateDuration,
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
          const textData = await res.text();
          throw new Error(textData || "Đã có lỗi xảy ra!");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Check-out thành công:", data);
        fetchAttendanceData();
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

  // Kiểm tra xem ngày đã có nhân viên nào được duyệt tăng ca chưa
  const checkOvertimeAvailability = async (date) => {
    try {
      const response = await fetch(
        `${api_url}/Staff/ApprovedOvertimeList?month=${dayjs(date).month() + 1}&year=${dayjs(date).year()}`
      );
      if (!response.ok) {
        throw new Error("Không thể kiểm tra dữ liệu tăng ca");
      }
      const result = await response.json();
      const hasApprovedOvertime = result.approvedOvertimeRecords.some(
        (record) =>
          dayjs(record.date, "DD/MM/YYYY").format("YYYY-MM-DD") === date &&
          record.employeeId !== employeeId
      );
      return hasApprovedOvertime;
    } catch (error) {
      console.error("Lỗi khi kiểm tra dữ liệu tăng ca:", error);
      return false;
    }
  };

  const handleRequestOvertime = async () => {
    if (!startTime || totalHours <= 0 || !reason) {
      toast.error("Vui lòng nhập đầy đủ thông tin tăng ca.");
      return;
    }

    // Kiểm tra xem ngày đã có nhân viên nào được duyệt tăng ca chưa
    const hasApprovedOvertime = await checkOvertimeAvailability(overtimeDate);
    if (hasApprovedOvertime) {
      toast.error("Đã có nhân viên khác được duyệt tăng ca cho ngày này.");
      return;
    }

    const formattedStartTime = dayjs(startTime).format("HH:mm:ss");

    try {
      const response = await fetch(`${api_url}/Attendance/RequestOvertime`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          date: overtimeDate,
          startTime: formattedStartTime,
          totalHours,
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi gửi đề xuất tăng ca");
      }

      toast.success("Đề xuất tăng ca thành công!");
      setModalOvertimeOpen(false);
      resetOvertimeForm();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Sửa logic hiển thị giờ tăng ca
  const getDisabledHours = () => {
    console.log("WorkShiftId trong getDisabledHours:", workShiftId);
    const hours = [];
    if (workShiftId === 1) {
      // Ca sáng (6:00 - 14:00), tăng ca từ 14:00 - 22:00
      // Disable các giờ từ 0:00 - 13:00 và 23:00
      for (let i = 0; i < 14; i++) {
        hours.push(i);
      }
      hours.push(23);
    } else if (workShiftId === 2) {
      // Ca chiều (14:00 - 22:00), tăng ca từ 6:00 - 14:00
      // Disable các giờ từ 15:00 - 23:00
      for (let i = 15; i <= 23; i++) {
        hours.push(i);
      }
    } else {
      // Nếu workShiftId chưa được gán, disable tất cả giờ
      for (let i = 0; i <= 23; i++) {
        hours.push(i);
      }
    }
    console.log("Giờ bị disable:", hours);
    return hours;
  };

  const formatAttendanceData = () => {
    const formattedData = [];
    const monthDays = dayjs(`${selectedYear}-${selectedMonth}-01`).daysInMonth();
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
        if (!shift) return "-";
        return shift.status === "Late" ? "Đi muộn" : "Đúng giờ";
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
        totalOvertime: overtimeHoursForMonth[date]
          ? overtimeHoursForMonth[date].toFixed(2)
          : "0.00",
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
          morningLateDuration: morningShift?.lateDuration || "-",
          afternoonLateDuration: afternoonShift?.lateDuration || "-",
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
        className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold shadow-md"
      >
        Quay lại
      </button>
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
        <h3 className="text-lg font-bold mb-4">
          Tổng số giờ tăng ca: {totalOvertimeHours.toFixed(2)} giờ
        </h3>
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
              title: "Check-in Ca 1",
              dataIndex: "morningCheckIn",
              key: "morningCheckIn",
            },
            {
              title: "Check-out Ca 1",
              dataIndex: "morningCheckOut",
              key: "morningCheckOut",
            },
            {
              title: "Trạng thái Ca 1",
              dataIndex: "morningStatus",
              key: "morningStatus",
              render: (status) => getStatusTag(status),
            },
            {
              title: "Thời gian đi muộn Ca 1",
              dataIndex: "morningLateDuration",
              key: "morningLateDuration",
            },
            {
              title: "Check-in Ca 2",
              dataIndex: "afternoonCheckIn",
              key: "afternoonCheckIn",
            },
            {
              title: "Check-out Ca 2",
              dataIndex: "afternoonCheckOut",
              key: "afternoonCheckOut",
            },
            {
              title: "Trạng thái Ca 2",
              dataIndex: "afternoonStatus",
              key: "afternoonStatus",
              render: (status) => getStatusTag(status),
            },
            {
              title: "Thời gian đi muộn Ca 2",
              dataIndex: "afternoonLateDuration",
              key: "afternoonLateDuration",
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
      {checkInMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg" style={{ width: "400px" }}>
            <h2 className="text-xl font-bold mb-2">Thông báo Check-in</h2>
            <p>
              <strong>Trạng thái:</strong> {checkInMessage.status}
            </p>
            <p>
              <strong>Thời gian:</strong> {checkInMessage.time}
            </p>
            <p>
              <strong>Thời gian muộn:</strong> {checkInMessage.late} phút
            </p>
            <p>
              <strong>Ca Làm Việc:</strong> {checkInMessage.shift}
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
        open={modalOvertimeOpen}
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
          disabledHours={getDisabledHours}
          minuteStep={15}
          placeholder="Chọn giờ bắt đầu"
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