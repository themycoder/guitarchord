import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CreateTuning = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    tuning: ["E", "A", "D", "G", "B", "E"],
    description: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStringChange = (index, value) => {
    const newTuning = [...formData.tuning];
    newTuning[index] = value;
    setFormData((prev) => ({
      ...prev,
      tuning: newTuning,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/tunings", formData);
      navigate("/admin/tunings");
    } catch (err) {
      setError(err.response?.data?.message || "Tạo tuning thất bại");
      console.error("Error creating tuning:", err);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Thêm Tuning mới</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="name"
          >
            Tên tuning
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Các dây (từ dày nhất đến mỏng nhất)
          </label>
          {formData.tuning.map((note, index) => (
            <div key={index} className="mb-2">
              <label className="block text-gray-700 text-sm mb-1">
                Dây {6 - index}
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => handleStringChange(index, e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                maxLength="2"
              />
            </div>
          ))}
        </div>

        <div className="mb-6">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="description"
          >
            Mô tả
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
            Lưu Tuning
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTuning;
