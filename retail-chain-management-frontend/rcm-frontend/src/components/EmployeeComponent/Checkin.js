import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

// const employeeId = localStorage.getItem("employeeId");

const Calendar = () => {
  const { id } = useParams(); // Lấy id từ URL (nếu có)
  const employeeId = id || localStorage.getItem("employeeId"); // Nếu có id, dùng id, không thì lấy từ localStorage
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [checkInMessage, setCheckInMessage] = useState(null);
  const api_url = process.env.REACT_APP_API_URL

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = () => {
    fetch(
      `${api_url}/Attendance/AttendanceDetail?employeeId=${employeeId}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Dữ liệu từ API:", data);

        const formattedAttendance = data.reduce((acc, entry) => {
          const dateStr = format(new Date(entry.attendanceDate), "yyyy-MM-dd");

          acc[dateStr] = {
            checkIn: entry.checkInTime
              ? format(new Date(entry.checkInTime), "HH:mm:ss")
              : null,
            checkOut: entry.checkOutTime
              ? format(new Date(entry.checkOutTime), "HH:mm:ss")
              : null,
          };

          return acc;
        }, {});

        console.log("Dữ liệu chấm công đã format:", formattedAttendance);
        setAttendance(formattedAttendance);
      })
      .catch((error) => console.error("Lỗi lấy dữ liệu:", error));
  };

  const handleCheckIn = async () => {
    try {
      const res = await fetch("${api_url}/Attendance/CheckIn", {
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
        time: data.timeCheckIn,
        overtime: data.overtime
      });
      toast.success("Checkin thành công", { position: "top-right" });
    } catch (error) {
      console.error("Lỗi check-in:", error.message);
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
    console.log("Ngày được chọn:", dateStr);
    setSelectedDate(dateStr);
    setModalOpen(true);
  };

  const changeMonth = (direction) => {
    setCurrentMonth((prev) => prev + direction);
  };

  const firstDay = new Date(new Date().getFullYear(), currentMonth, 1);
  const daysInMonth = new Date(
    new Date().getFullYear(),
    currentMonth + 1,
    0
  ).getDate();
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
        <button
          className="p-2 bg-gray-300 rounded"
          onClick={() => changeMonth(-1)}
        >
          ◀
        </button>
        <h2 className="text-xl font-bold uppercase">
          {" "}
          {format(firstDay, "MMMM yyyy", { locale: vi })}
        </h2>
        <button
          className="p-2 bg-gray-300 rounded"
          onClick={() => changeMonth(1)}
        >
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
              const currentHour = now.getHours();
              const todayStr = format(now, "yyyy-MM-dd");
              const isToday = selectedDate === todayStr;
              const hasCheckedIn = attendance[selectedDate]?.checkIn;
              const hasCheckedOut = attendance[selectedDate]?.checkOut;

              console.log("Giờ hiện tại:", currentHour);
              console.log("Ngày hiện tại:", todayStr);
              console.log("Trạng thái chấm công:", attendance[selectedDate]);

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
                      className="mt-4 p-2 bg-blue-500 text-white rounded mr-16"
                      onClick={handleCheckIn}
                    >
                      Check-in
                    </button>
                  )}
                  {hasCheckedIn && !hasCheckedOut && (
                    <button
                      className="mt-4 p-2 bg-red-500 text-white rounded mr-16"
                      onClick={handleCheckOut}
                    >
                      Check-out
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
      {/* thông báo trạng thái */}
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
              <strong>Tiền phạt:</strong> {checkInMessage.fine}
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
