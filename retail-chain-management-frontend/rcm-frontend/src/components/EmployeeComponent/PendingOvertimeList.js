import { useEffect, useState } from "react";
import Header from "../../headerComponent/header";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";

const PendingOvertimeList = () => {
  const [overtimeList, setOvertimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const api_url = process.env.REACT_APP_API_URL

  useEffect(() => {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1; // Lấy tháng hiện tại (0-11 nên cần +1)
    const year = currentDate.getFullYear(); // Lấy năm hiện tại

    const fetchOvertimeList = async () => {
      try {
        const response = await fetch(
          `${api_url}/Payroll/list-pending-overtime?month=${month}&year=${year}&search=${search}`
        );
        if (!response.ok) {
          throw new Error("Lỗi khi lấy dữ liệu");
        }
        const result = await response.json();
        setOvertimeList(result.data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOvertimeList();
  }, [search]);
  const approveOvertime = async (overtimeId) => {
    try {
      const response = await fetch(
        `${api_url}/Payroll/approve-overtime/${overtimeId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.message || "Lỗi khi duyệt đơn", {
          position: "top-right",
        });
        return;
      }
      toast.success(result.message || "Duyệt đơn thành công", {
        position: "top-right",
      });
      setOvertimeList(
        overtimeList.filter((item) => item.overtimeId !== overtimeId)
      );
    } catch (error) {
      toast.error(error.message, { position: "top-right" });
    }
  };
  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <ClipLoader size={50} color={"#123abc"} />
      </div>
    );
  if (error) return <p>Lỗi: {error}</p>;

  return (
    <div>
      <Header />
      <div className="p-10 h-screen bg-gray-100">
        <h2 className="my-5 uppercase">
       Yeu Cau Tang Ca
        </h2>

        <div className="flex flex-col lg:flex-row gap-2 w-full lg:w-1/3 mb-4">
          <input
            type="text"
            className="form-control w-full lg:w-[30rem] px-3 py-2 border rounded"
            placeholder="Tìm kiếm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <table className="w-full bg-white shadow-md rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-center">ID</th>
              <th className="p-2 text-center">Họ tên</th>
              <th className="p-2 text-center">Số điện thoại</th>
              <th className="p-2 text-center">Ngày</th>
              <th className="p-2 text-center">Số giờ tăng ca</th>
              <th className="p-2 text-center">Lý do</th>
              <th className="p-2 text-center">Số CMND</th>
              <th className="p-2 text-center">Quê quán</th>
              <th className="p-2 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {overtimeList.length > 0 ? (
              overtimeList.map((item) => (
                <tr key={item.overtimeId}>
                  <td className="p-2 text-center">{item.overtimeId}</td>
                  <td className="p-2 text-center">{item.employeeName}</td>
                  <td className="p-2 text-center">{item.phone}</td>
                  <td className="p-2 text-center">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="p-2 text-center">{item.totalHours}</td>
                  <td className="p-2 text-center">{item.reason}</td>
                  <td className="p-2 text-center">{item.identityNumber}</td>
                  <td className="p-2 text-center">{item.hometown}</td>
                  <td className="p-2 text-center">
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded"
                      onClick={() => approveOvertime(item.overtimeId)}
                    >
                      Duyệt Đơn
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="text-center p-2" colSpan="8">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingOvertimeList;
