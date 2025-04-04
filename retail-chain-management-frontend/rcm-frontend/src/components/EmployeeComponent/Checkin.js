import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

const Calendar = () => {
  const { id } = useParams();
  const employeeId = id || localStorage.getItem("employeeId");
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [overtimeModalOpen, setOvertimeModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [checkInMessage, setCheckInMessage] = useState(null);
  const [workShiftId, setWorkShiftId] = useState(null);
  const [overtimeStartTime, setOvertimeStartTime] = useState("");
  const [overtimeHours, setOvertimeHours] = useState("");

  const api_url = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = () => {
    console.log("Bắt đầu fetch dữ liệu chấm công..."); // Log để kiểm tra hàm được gọi
    fetch(`${api_url}/Attendance/AttendanceDetail?employeeId=${employeeId}`)
      .then((res) => {
        console.log("Response status:", res.status); // Log status của response
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Dữ liệu từ API:", data); // Log toàn bộ dữ liệu trả về
        // Kiểm tra nếu data là mảng và có ít nhất 1 bản ghi
        if (Array.isArray(data) && data.length > 0) {
          console.log("Bản ghi đầu tiên:", data[0]); // Log bản ghi đầu tiên
          console.log("WorkShiftId:", data[0].workShiftId); // Log workShiftId
          setWorkShiftId(data[0].workShiftId); // Gán workShiftId vào state
        } else {
          console.log("Không có dữ liệu chấm công hoặc workShiftId không tồn tại.");
          setWorkShiftId(null);
        }
  
        // Format dữ liệu chấm công
        const formattedAttendance = data.reduce((acc, entry) => {
          const dateStr = format(new Date(entry.attendanceDate), "yyyy-MM-dd");
          acc[dateStr] = {
            checkIn: entry.checkInTime ? format(new Date(entry.checkInTime), "HH:mm:ss") : null,
            checkOut: entry.checkOutTime ? format(new Date(entry.checkOutTime), "HH:mm:ss") : null,
          };
          return acc;
        }, {});
  
        setAttendance(formattedAttendance);
      })
      .catch((error) => {
        console.error("Lỗi khi fetch dữ liệu:", error.message); // Log lỗi chi tiết
      });
  };

  const handleCheckIn = async () => {
    try {
      const res = await fetch(`${api_url}/Attendance/CheckIn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Đã có lỗi xảy ra!");
      }

      const data = await res.json();
      fetchAttendanceData();
      setModalOpen(false);

      setCheckInMessage({
        message: data.message,
        shift: data.shift,
        status: data.status,
        time: data.checkInTime,
        overtime: data.overtime,
      });
      toast.success("Check-in thành công", { position: "top-right" });
    } catch (error) {
      toast.error(error.message, { position: "top-right" });
    }
  };

  const handleCheckOut = () => {
    fetch(`${api_url}/Attendance/CheckOut`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Đã có lỗi xảy ra!");
        }
        return res.json();
      })
      .then((data) => {
        fetchAttendanceData();
        setModalOpen(false);
        toast.success("Check-out thành công", { position: "top-right" });
      })
      .catch((error) => {
        toast.error(error.message, { position: "top-right" });
      });
  };

  const handleRequestOvertime = () => {
    fetch(`${api_url}/Attendance/RequestOvertime`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId,
        date: selectedDate,
        startTime: overtimeStartTime,
        totalHours: parseFloat(overtimeHours),
        reason: "Đề xuất tăng ca",
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Đã có lỗi xảy ra!");
        }
        return res.json();
      })
      .then((data) => {
        setOvertimeModalOpen(false);
        toast.success("Đề xuất tăng ca thành công", { position: "top-right" });
      })
      .catch((error) => {
        toast.error(error.message, { position: "top-right" });
      });
  };

  const getColorClass = (dateStr) => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const entry = attendance[dateStr];
    if (!entry) {
      return dateStr < todayStr ? "bg-red-300 text-white" : "bg-gray-200";
    }
    if (entry.checkIn && !entry.checkOut) {
      return "bg-yellow-500 text-white";
    }
    if (entry.checkIn && entry.checkOut) {
      return "bg-green-500 text-white";
    }
    return "bg-gray-200";
  };

  const openModal = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setSelectedDate(dateStr);
    setModalOpen(true);
  };

  const changeMonth = (direction) => {
    setCurrentMonth((prev) => prev + direction);
  };

  // Tạo danh sách giờ tăng ca hợp lệ dựa trên workShiftId
  const getOvertimeHours = () => {
    const hours = [];
    if (workShiftId === 1) { // Ca sáng: 6:00 - 14:00, tăng ca từ 14:00 - 22:00
      for (let i = 14; i <= 22; i++) {
        hours.push(`${i.toString().padStart(2, "0")}:00`);
      }
    } else if (workShiftId === 2) { // Ca chiều: 14:00 - 22:00, tăng ca từ 6:00 - 14:00
      for (let i = 6; i <= 14; i++) {
        hours.push(`${i.toString().padStart(2, "0")}:00`);
      }
    }
    return hours;
  };

  const firstDay = new Date(new Date().getFullYear(), currentMonth, 1);
  const daysInMonth = new Date(new Date().getFullYear(), currentMonth + 1, 0).getDate();
  const paddedDates = Array(firstDay.getDay())
    .fill(null)
    .concat(
      Array.from(
        { length: daysInMonth },
        (_, i) => new Date(new Date().getFullYear(), currentMonth, i + 1)
      )
    );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <button className="p-2 bg-gray-300 rounded" onClick={() => changeMonth(-1)}>
          ◀
        </button>
        <h2 className="text-xl font-bold uppercase">
          {format(firstDay, "MMMM yyyy", { locale: vi })}
        </h2>
        <button className="p-2 bg-gray-300 rounded" onClick={() => changeMonth(1)}>
          ▶
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
          <div key={day} className="font-semibold text-center">
            {day}
          </div>
        ))}

        {paddedDates.map((date, index) => {
          if (!date) return <div key={index} className="h-24"></div>;
          const dateStr = format(date, "yyyy-MM-dd");
          const bgColor = getColorClass(dateStr);
          return (
            <div
              key={index}
              className={`h-24 p-2 border rounded cursor-pointer flex flex-col justify-center items-center ${bgColor}`}
              onClick={() => openModal(date)}
            >
              <div className="font-semibold">
                {format(date, "d")}/{currentMonth + 1}
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-xl font-bold mb-2">
              Chi tiết ngày {selectedDate}
            </h2>
            {(() => {
              const now = new Date();
              const todayStr = format(now, "yyyy-MM-dd");
              const isToday = selectedDate === todayStr;
              const hasCheckedIn = attendance[selectedDate]?.checkIn;
              const hasCheckedOut = attendance[selectedDate]?.checkOut;

              return (
                <>
                  <p>
                    <strong>Check-in:</strong> {hasCheckedIn || "Chưa Check-in"}
                  </p>
                  <p>
                    <strong>Check-out:</strong>{" "}
                    {hasCheckedIn ? hasCheckedOut || "Chưa Check-out" : "-"}
                  </p>

                  {isToday && !hasCheckedIn && (
                    <button
                      className="mt-4 p-2 bg-blue-500 text-white rounded mr-4"
                      onClick={handleCheckIn}
                    >
                      Check-in
                    </button>
                  )}
                  {hasCheckedIn && !hasCheckedOut && (
                    <button
                      className="mt-4 p-2 bg-red-500 text-white rounded mr-4"
                      onClick={handleCheckOut}
                    >
                      Check-out
                    </button>
                  )}
                  {isToday && (
                    <button
                      className="mt-4 p-2 bg-green-500 text-white rounded mr-4"
                      onClick={() => setOvertimeModalOpen(true)}
                    >
                      Đề xuất tăng ca
                    </button>
                  )}
                </>
              );
            })()}
            <button
              className="mt-4 p-2 bg-gray-400 text-white rounded"
              onClick={() => setModalOpen(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {overtimeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-xl font-bold mb-2">Đề xuất tăng ca</h2>
            <div className="mb-4">
              <label className="block mb-1">Giờ bắt đầu:</label>
              <select
                value={overtimeStartTime}
                onChange={(e) => setOvertimeStartTime(e.target.value)}
                className="p-2 border rounded w-full"
              >
                <option value="">Chọn giờ</option>
                {getOvertimeHours().map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1">Số giờ tăng ca:</label>
              <input
                type="number"
                value={overtimeHours}
                onChange={(e) => setOvertimeHours(e.target.value)}
                className="p-2 border rounded w-full"
                min="1"
                step="0.5"
              />
            </div>
            <button
              className="mt-4 p-2 bg-blue-500 text-white rounded mr-4"
              onClick={handleRequestOvertime}
            >
              Đề xuất
            </button>
            <button
              className="mt-4 p-2 bg-gray-400 text-white rounded"
              onClick={() => setOvertimeModalOpen(false)}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {checkInMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-xl font-bold mb-2">Thông báo Check-in</h2>
            <p>
              <strong>Trạng thái:</strong> {checkInMessage.status}
            </p>
            <p>
              <strong>Thời gian:</strong> {checkInMessage.time}
            </p>
            <p>
              <strong>Ca làm:</strong> {checkInMessage.shift}
            </p>
            <p>
              <strong>Tăng ca:</strong> {checkInMessage.overtime}
            </p>
            <button
              className="mt-4 p-2 bg-gray-400 text-white rounded"
              onClick={() => setCheckInMessage(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;