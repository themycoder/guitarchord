import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const faqData = [
  {
    question: "Thư viện hợp âm này có miễn phí không?",
    answer:
      "Có, toàn bộ hợp âm và công cụ phân tích đều hoàn toàn miễn phí cho người dùng.",
  },
  {
    question: "Tôi có thể đóng góp hợp âm mới không?",
    answer:
      "Có! Bạn có thể gửi hợp âm mới thông qua tính năng 'Đóng góp' trong thư viện.",
  },
  {
    question: "Làm sao để tra hợp âm theo vị trí tay?",
    answer:
      "Bạn có thể sử dụng công cụ phân tích hợp âm (Chord Analyzer) và chọn các nốt trên cần đàn.",
  },
  {
    question: "Trang web có hỗ trợ điện thoại không?",
    answer:
      "Chắc chắn rồi! Website được tối ưu hiển thị trên cả desktop và mobile.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          ❓ Câu hỏi thường gặp
        </h1>

        <div className="space-y-4">
          {faqData.map((item, index) => (
            <div
              key={index}
              className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggle(index)}
                className="w-full flex justify-between items-center px-4 py-3 bg-gray-100 dark:bg-gray-800 text-left"
              >
                <span className="font-semibold">{item.question}</span>
                {openIndex === index ? (
                  <FaChevronUp className="text-gray-500" />
                ) : (
                  <FaChevronDown className="text-gray-500" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
