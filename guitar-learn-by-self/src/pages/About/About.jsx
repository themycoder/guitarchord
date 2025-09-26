import React from "react";
import { FaGuitar, FaSearch, FaUsers } from "react-icons/fa";

const About = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 px-6 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Tiêu đề chính */}
        <h1 className="text-4xl font-bold mb-4 text-center">
          🎵 Giới thiệu về Thư viện Hợp âm
        </h1>
        <p className="text-center text-lg text-gray-600 dark:text-gray-400 mb-10">
          Khám phá thế giới hợp âm với công cụ hiện đại, dễ dùng và thân thiện
          với người học guitar ở mọi trình độ.
        </p>

        {/* Ảnh minh họa (có thể thay bằng hình thật sau) */}
        <div className="mb-12 flex justify-center">
          <img
            src="https://miguitarraelectrica.com/wp-content/uploads/2022/04/circle-of-fifths-minor.png"
            alt="Guitar illustration"
            className="rounded-xl shadow-lg w-50 max-w-xl"
          />
        </div>

        {/* Nội dung chia cột */}
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow">
            <FaGuitar className="text-4xl mx-auto mb-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-semibold mb-2">
              Thư viện hợp âm phong phú
            </h3>
            <p className="text-sm">
              Hơn 100+ hợp âm phổ biến và mở rộng với hình ảnh minh họa thế bấm
              trực quan.
            </p>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow">
            <FaSearch className="text-4xl mx-auto mb-4 text-green-600 dark:text-green-400" />
            <h3 className="text-xl font-semibold mb-2">Tìm kiếm thông minh</h3>
            <p className="text-sm">
              Tìm hợp âm theo nốt, theo tên, hoặc theo vị trí ngón tay trên cần
              đàn.
            </p>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow">
            <FaUsers className="text-4xl mx-auto mb-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-xl font-semibold mb-2">Cộng đồng đóng góp</h3>
            <p className="text-sm">
              Cho phép người dùng thêm hợp âm mới, đề xuất thế bấm và cùng xây
              dựng thư viện.
            </p>
          </div>
        </div>

        {/* Phần kết */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-2">Tại sao nên dùng?</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Đây không chỉ là thư viện hợp âm, mà là công cụ hỗ trợ luyện tập,
            tra cứu và học guitar hiệu quả – dành cho bạn!
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
