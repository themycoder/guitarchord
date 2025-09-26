import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ListGuitarNotes = () => {
  const [notes, setNotes] = useState([]);
  const [tunings, setTunings] = useState([]);
  const [selectedTuning, setSelectedTuning] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tuningsRes] = await Promise.all([axios.get("/api/tunings")]);
        setTunings(tuningsRes.data);
        if (tuningsRes.data.length > 0) {
          setSelectedTuning(tuningsRes.data[0]._id);
        }
      } catch (err) {
        setError("Không thể tải dữ liệu");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTuning) {
      const fetchNotes = async () => {
        try {
          const res = await axios.get(
            `/api/guitar-notes?tuning=${selectedTuning}`
          );
          setNotes(res.data);
        } catch (err) {
          console.error("Error fetching notes:", err);
        }
      };
      fetchNotes();
    }
  }, [selectedTuning]);

  const handleDelete = async (id) => {
    if (window.confirm("Bạn chắc chắn muốn xóa note này?")) {
      try {
        await axios.delete(`/api/guitar-notes/${id}`);
        setNotes(notes.filter((note) => note._id !== id));
      } catch (err) {
        console.error("Error deleting note:", err);
      }
    }
  };

  if (loading) return <div className="p-4">Đang tải...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Danh sách Guitar Notes</h1>
        <Link
          to={`/admin/guitar-notes/create?tuning=${selectedTuning}`}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Thêm Note mới
        </Link>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Lọc theo Tuning:
        </label>
        <select
          className="shadow border rounded w-full md:w-1/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={selectedTuning}
          onChange={(e) => setSelectedTuning(e.target.value)}
        >
          {tunings.map((tuning) => (
            <option key={tuning._id} value={tuning._id}>
              {tuning.name} ({tuning.tuning.join("-")})
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dây
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngăn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nốt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tuning
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {notes.map((note) => (
              <tr key={note._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {note.stringNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {note.fret}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {note.note}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {note.tuning?.name || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    to={`/admin/guitar-notes/edit/${note._id}`}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Sửa
                  </Link>
                  <button
                    onClick={() => handleDelete(note._id)}
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

export default ListGuitarNotes;
