import React, { useState } from "react";
import axios from "axios";

const AddScale = () => {
  const [form, setForm] = useState({
    name: "",
    type: "",
    key: "",
    notes: "",
    intervals: "",
    description: "",
    suitable_for: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const validateNotes = (notesArray) => {
    const validNotes = [
      "A",
      "A#",
      "Bb",
      "B",
      "C",
      "C#",
      "Db",
      "D",
      "D#",
      "Eb",
      "E",
      "F",
      "F#",
      "Gb",
      "G",
      "G#",
      "Ab",
    ];
    return notesArray.every((note) => validNotes.includes(note));
  };

  const validateIntervals = (intervalsArray) => {
    const validIntervals = [
      "1",
      "2",
      "b2",
      "3",
      "b3",
      "4",
      "b5",
      "5",
      "#5",
      "6",
      "b6",
      "7",
      "b7",
    ];
    return intervalsArray.every((i) => validIntervals.includes(i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const notes = form.notes.split(",").map((s) => s.trim());
    const intervals = form.intervals.split(",").map((s) => s.trim());
    const suitable_for = form.suitable_for.split(",").map((s) => s.trim());

    if (
      !form.name ||
      !form.type ||
      !form.key ||
      notes.length === 0 ||
      intervals.length === 0
    ) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }

    if (!validateNotes(notes)) {
      setError("🎵 Danh sách nốt không hợp lệ. Ví dụ: C,E,G");
      return;
    }

    if (!validateIntervals(intervals)) {
      setError("🎼 Interval không hợp lệ. Ví dụ: 1,2,3,4,5,6,7");
      return;
    }

    const payload = {
      name: form.name,
      type: form.type,
      key: form.key,
      notes,
      intervals,
      description: form.description,
      suitable_for,
    };

    try {
      const res = await axios.post("http://localhost:3000/api/scales", payload);
      alert("✅ Thêm âm giai thành công!");
      console.log(res.data);
      setForm({
        name: "",
        type: "",
        key: "",
        notes: "",
        intervals: "",
        description: "",
        suitable_for: "",
      });
    } catch (error) {
      setError("❌ Lỗi khi gửi lên server: " + error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Thêm Âm Giai Mới (Scale)</h1>
      {error && (
        <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="Tên âm giai (ví dụ: C_major_scale)"
          onChange={handleChange}
          value={form.name}
          className="w-full p-2 border rounded"
        />
        <input
          name="type"
          placeholder="Loại âm giai (major, minor, pentatonic...)"
          onChange={handleChange}
          value={form.type}
          className="w-full p-2 border rounded"
        />
        <input
          name="key"
          placeholder="Tông chủ đạo (C, D#, Bb...)"
          onChange={handleChange}
          value={form.key}
          className="w-full p-2 border rounded"
        />
        <input
          name="notes"
          placeholder="Các nốt (ví dụ: C,D,E,F,G,A,B)"
          onChange={handleChange}
          value={form.notes}
          className="w-full p-2 border rounded"
        />
        <input
          name="intervals"
          placeholder="Các interval (ví dụ: 1,2,3,4,5,6,7)"
          onChange={handleChange}
          value={form.intervals}
          className="w-full p-2 border rounded"
        />
        <input
          name="suitable_for"
          placeholder="Phù hợp với ai? (beginners, advanced...)"
          onChange={handleChange}
          value={form.suitable_for}
          className="w-full p-2 border rounded"
        />
        <textarea
          name="description"
          placeholder="Mô tả thêm về âm giai"
          onChange={handleChange}
          value={form.description}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Thêm Âm Giai
        </button>
      </form>
    </div>
  );
};

export default AddScale;
