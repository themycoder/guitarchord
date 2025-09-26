import React from "react";

const Contact = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-center">
          📬 Liên hệ với chúng tôi
        </h1>
        <p className="text-center text-lg text-gray-600 dark:text-gray-400 mb-10">
          Bạn có thắc mắc, góp ý, hoặc cần hỗ trợ? Đừng ngần ngại liên hệ!
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Thông tin liên hệ */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Thông tin liên hệ</h3>
              <p>
                Email:{" "}
                <a
                  href="mailto:support@oolimo.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  support@oolimo.com
                </a>
              </p>
              <p>
                Số điện thoại:{" "}
                <span className="text-gray-700 dark:text-gray-300">
                  0123 456 789
                </span>
              </p>
              <p>
                Địa chỉ:{" "}
                <span className="text-gray-700 dark:text-gray-300">
                  123 Guitar Street, HN
                </span>
              </p>
            </div>

            {/* Google Maps */}
            <div>
              <h3 className="text-xl font-semibold mb-2">Bản đồ</h3>
              <div className="w-full h-64 rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.0964841660014!2d105.78010817599617!3d21.028820080615252!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab354920c253%3A0xe6f06e56ed6a330!2zMTIzIFBo4bqhbmggTMOqbiBHacOhLCBM4bqtcCBUcsOsbmgsIEhhaSBCw6AgVHLGsG5nLCBIw6AgTuG7mWksIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1698765432100!5m2!1svi!2s"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Google Maps - Oolimo Location"
                ></iframe>
              </div>
            </div>
          </div>

          {/* Form liên hệ */}
          <form className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow space-y-4">
            <h3 className="text-xl font-semibold mb-4">Gửi tin nhắn</h3>

            <div>
              <label className="block text-sm font-medium mb-1">
                Tên của bạn
              </label>
              <input
                type="text"
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white"
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tin nhắn</label>
              <textarea
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white"
                rows="4"
                placeholder="Bạn cần hỗ trợ gì..."
              ></textarea>
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Gửi tin nhắn
            </button>
          </form>
        </div>
      </div>
      
    </div>
  );
};

export default Contact;
