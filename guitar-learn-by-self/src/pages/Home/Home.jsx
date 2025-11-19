import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-6 transition-colors duration-300">
      <div className="max-w-4xl text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-white mb-6">
          Chào mừng đến với{" "}
          <span className="text-blue-600 dark:text-blue-400">
            Guitarhiho
          </span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Khám phá thư viện hợp âm, phân tích hợp âm theo nốt bấm, gợi ý scale
          và vòng hợp âm dành cho người yêu guitar 🎸.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button
            onClick={() => navigate("/chord-library")}
            className="px-6 py-3 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 dark:hover:bg-blue-500 transition"
          >
            Vào thư viện hợp âm
          </button>
          <button
            onClick={() => navigate("/analyze")}
            className="px-6 py-3 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Phân tích hợp âm
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
