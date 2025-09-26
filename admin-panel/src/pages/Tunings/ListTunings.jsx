import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ListTunings = () => {
  const [tunings, setTunings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTunings = async () => {
      try {
        const res = await axios.get("/api/tunings");
        console.log("API response:", res.data);
        setTunings(res.data);
      } catch (err) {
        setError("Không thể tải danh sách tuning");
        console.error("Error fetching tunings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTunings();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Bạn chắc chắn muốn xóa tuning này?")) {
      try {
        await axios.delete(`/api/tunings/${id}`);
        setTunings(tunings.filter((tuning) => tuning._id !== id));
      } catch (err) {
        console.error("Error deleting tuning:", err);
        alert("Xóa thất bại");
      }
    }
  };

  if (loading) return <div className="p-4">Đang tải...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Danh sách Tunings</h1>
        <Link
          to="/admin/tunings/create"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Thêm Tuning mới
        </Link>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tuning
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mô tả
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tunings.map((tuning) => (
              <tr key={tuning._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {tuning.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tuning.tuning.join(" - ")}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {tuning.description || "--"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    to={`/admin/tunings/edit/${tuning._id}`}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Sửa
                  </Link>
                  <button
                    onClick={() => handleDelete(tuning._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListTunings;
