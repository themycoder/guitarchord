import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const CreateGuitarNote = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const defaultTuning = queryParams.get("tuning");

  const [formData, setFormData] = useState({
    stringNumber: 1,
    fret: 0,
    note: "",
    tuning: defaultTuning || "",
    description: "",
  });
  const [tunings, setTunings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTunings = async () => {
      try {
        const res = await axios.get("/api/tunings");
        setTunings(res.data);
        if (!defaultTuning && res.data.length > 0) {
          setFormData((prev) => ({ ...prev, tuning: res.data[0]._id }));
        }
      } catch (err) {
        console.error("Error fetching tunings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTunings();
  }, [defaultTuning]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/guitar-notes", formData);
      navigate("/admin/guitar-notes");
    } catch (err) {
      setError(err.response?.data?.message || "Tạo note thất bại");
      console.error("Error creating note:", err);
    }
  };

  if (loading) return <div className="p-4">Đang tải...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Thêm Guitar Note mới</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="tuning"
            >
              Tuning
            </label>
            <select
              id="tuning"
              name="tuning"
              value={formData.tuning}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              {tunings.map((tuning) => (
                <option key={tuning._id} value={tuning._id}>
                  {tuning.name} ({tuning.tuning.join("-")})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="stringNumber"
            >
              Số dây (1-6)
            </label>
            <select
              id="stringNumber"
              name="stringNumber"
              value={formData.stringNumber}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  Dây {num}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="fret"
            >
              Ngăn đàn
            </label>
            <input
              type="number"
              id="fret"
              name="fret"
              min="0"
              max="24"
              value={formData.fret}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="note"
            >
              Nốt nhạc
            </label>
            <input
              type="text"
              id="note"
              name="note"
              value={formData.note}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              maxLength="2"
            />
          </div>
        </div>

        <div className="mb-6">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="description"
          >
            Mô tả (tuỳ chọn)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="3"
          />
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Lưu Note
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGuitarNote;
