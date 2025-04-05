import { useEffect, useState } from "react";
import Header from "../../headerComponent/header";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";
import { Tag, Dropdown, Menu, Button } from "antd";

const PendingOvertimeList = () => {
  const [overtimeList, setOvertimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState("pending"); // Trạng thái tab: pending, approved, rejected
  
  const api_url = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const fetchOvertimeList = async () => {
      try {
        const response = await fetch(
          `${api_url}/Staff/ApprovedOvertimeList?month=${month}&year=${year}`
        );
        if (!response.ok) {
          throw new Error("Lỗi khi lấy dữ liệu");
        }
        const result = await response.json();

        // Lọc dữ liệu dựa trên selectedTab
        let filteredList = result.approvedOvertimeRecords;
        if (selectedTab === "pending") {
          filteredList = filteredList.filter(
            (item) => !item.isApproved && !item.isRejected
          ); // Chưa duyệt
        } else if (selectedTab === "approved") {
          filteredList = filteredList.filter((item) => item.isApproved); // Đã duyệt
        } else if (selectedTab === "rejected") {
          filteredList = filteredList.filter(
            (item) => !item.isApproved && item.isRejected
          ); // Không được duyệt
        }

        setOvertimeList(filteredList);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOvertimeList();
  }, [search, selectedTab]);

  const approveOvertime = async (overtimeId) => {
    try {
      const response = await fetch(
        `${api_url}/Payroll/approve-overtime/${overtimeId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
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

  const rejectOvertime = async (overtimeId) => {
    try {
      const response = await fetch(
        `${api_url}/Payroll/reject-overtime/${overtimeId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.message || "Lỗi khi từ chối đơn", {
          position: "top-right",
        });
        return;
      }
      toast.success(result.message || "Đã từ chối yêu cầu tăng ca", {
        position: "top-right",
      });
      setOvertimeList(
        overtimeList.filter((item) => item.overtimeId !== overtimeId)
      );
    } catch (error) {
      toast.error(error.message, { position: "top-right" });
    }
  };

  const actionMenu = (overtimeId) => (
    <Menu>
      <Menu.Item key="approve">
        <Button
          type="link"
          onClick={() => approveOvertime(overtimeId)}
          style={{ color: "blue" }}
        >
          Duyệt
        </Button>
      </Menu.Item>
      <Menu.Item key="reject">
        <Button
          type="link"
          onClick={() => rejectOvertime(overtimeId)}
          style={{ color: "red" }}
        >
          Hủy
        </Button>
      </Menu.Item>
    </Menu>
  );

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
        <h2 className="my-5 uppercase">Yêu cầu tăng ca</h2>

        <div className="flex gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded uppercase ${
              selectedTab === "pending" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setSelectedTab("pending")}
          >
            Chưa duyệt
          </button>
          <button
            className={`px-4 py-2 rounded uppercase ${
              selectedTab === "approved" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setSelectedTab("approved")}
          >
            Đã duyệt
          </button>
          <button
            className={`px-4 py-2 rounded uppercase ${
              selectedTab === "rejected" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setSelectedTab("rejected")}
          >
            Không được duyệt
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-2 w-full lg:w-1/3 mb-4">
          <input
            type="text"
            className="form-control w-full lg:w-[30rem] px-3 py-2 border rounded"
            placeholder="Tìm kiếm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <table className="w-full bg-white shadow-md rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-center">ID</th>
              <th className="p-2 text-center">Họ tên</th>
              <th className="p-2 text-center">Ngày</th>
              <th className="p-2 text-center">Số giờ tăng ca</th>
              <th className="p-2 text-center">Lý do</th>
              <th className="p-2 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {overtimeList.length > 0 ? (
              overtimeList.map((item) => (
                <tr key={item.overtimeId}>
                  <td className="p-2 text-center">{item.overtimeId}</td>
                  <td className="p-2 text-center">{item.employeeName}</td>
                  <td className="p-2 text-center">{item.date}</td>
                  <td className="p-2 text-center">{item.totalHours}</td>
                  <td className="p-2 text-center">{item.reason}</td>
                  <td className="p-2 text-center">
                    {selectedTab === "approved" ? (
                      <Tag color="green">Đã duyệt</Tag>
                    ) : selectedTab === "rejected" ? (
                      <Tag color="red">Không được duyệt</Tag>
                    ) : (
                      <Dropdown overlay={actionMenu(item.overtimeId)} trigger={["click"]}>
                        <Button className="bg-gray-200">Thao tác</Button>
                      </Dropdown>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="text-center p-2" colSpan="6">
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