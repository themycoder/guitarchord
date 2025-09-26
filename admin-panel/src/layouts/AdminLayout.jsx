import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const AdminLayout = () => {
  return (
    <div className="h-screen overflow-hidden">
      {/* Hàng ngang, không wrap */}
      <div className="flex flex-row flex-nowrap h-full items-stretch">
        {/* Trái: Sidebar cố định rộng, không co lại */}
        <aside className="w-64 shrink-0 h-full border-r border-gray-200">
          <Sidebar />
        </aside>

        {/* Phải: Nội dung chiếm phần còn lại */}
        <main className="flex-1 min-w-0 h-full overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
