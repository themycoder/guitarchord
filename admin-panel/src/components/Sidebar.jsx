import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="h-full bg-gray-800 text-white p-4">
      <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
      <nav>
        <ul className="space-y-2">
          <li>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `block p-2 rounded ${
                  isActive ? "bg-blue-600" : "hover:bg-gray-700"
                }`
              }
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/add-chord"
              className={({ isActive }) =>
                `block p-2 rounded ${
                  isActive ? "bg-blue-600" : "hover:bg-gray-700"
                }`
              }
            >
              Thêm Hợp Âm
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/add-scale"
              className={({ isActive }) =>
                `block p-2 rounded ${
                  isActive ? "bg-blue-600" : "hover:bg-gray-700"
                }`
              }
            >
              Thêm Scale
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/add-information"
              className={({ isActive }) =>
                `block p-2 rounded ${
                  isActive ? "bg-blue-600" : "hover:bg-gray-700"
                }`
              }
            >
              Thêm information
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/add-quiz"
              className={({ isActive }) =>
                `block p-2 rounded ${
                  isActive ? "bg-blue-600" : "hover:bg-gray-700"
                }`
              }
            >
              Thêm Quiz
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/add-theory"
              className={({ isActive }) =>
                `block p-2 rounded ${
                  isActive ? "bg-blue-600" : "hover:bg-gray-700"
                }`
              }
            >
              Thêm Theory
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/add-lesson"
              className={({ isActive }) =>
                `block p-2 rounded ${
                  isActive ? "bg-blue-600" : "hover:bg-gray-700"
                }`
              }
            >
              Thêm lesson
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/add-quiz"
              className={({ isActive }) =>
                `block p-2 rounded ${
                  isActive ? "bg-blue-600" : "hover:bg-gray-700"
                }`
              }
            >
              Thêm quiz
            </NavLink>
          </li>
          {/* <li>
            <NavLink
              to="/admin/tunings"
              className={({ isActive }) =>
                `block p-2 rounded ${
                  isActive ? "bg-blue-600" : "hover:bg-gray-700"
                }`
              }
            >
              Quản lý Tunings
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/guitar-notes"
              className={({ isActive }) =>
                `block p-2 rounded ${
                  isActive ? "bg-blue-600" : "hover:bg-gray-700"
                }`
              }
            >
              Quản lý Guitar Notes
            </NavLink>
          </li> */}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
