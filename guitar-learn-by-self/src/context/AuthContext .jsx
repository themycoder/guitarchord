// import { createContext, useContext, useState, useEffect } from "react";
// import axiosHandler from "../services/axiosHandler"; 
// import { useNavigate, useLocation } from "react-router-dom";


// const AuthContext = createContext();


// export const AuthProvider = ({ children }) => {
//   const navigate = useNavigate();
//   const location = useLocation();

//   //  Lưu trạng thái đăng nhập
//   const [user, setUser] = useState(() => {
//     try {
//       return JSON.parse(localStorage.getItem("user")) || null;
//     } catch (error) {
//       console.error("Lỗi khi đọc user từ localStorage:", error);
//       return null;
//     }
//   });

 
//   const protectedRoutes = ["/carts", "/profile"];

//   useEffect(() => {
//     if (!user && protectedRoutes.includes(location.pathname)) {
//       alert("Cần đăng nhập để xem");
//       navigate("/login");
//     }
//   }, [user, navigate, location]);


//   const login = async (username, password) => {
//     try {
//       const { data } = await axiosHandler.post("/auth/login", {
//         username,
//         password,
//         expiresInMins: 30,
//       });

//       setUser(data);
//       localStorage.setItem("user", JSON.stringify(data));
//       localStorage.setItem("accessToken", data.accessToken);

//       navigate(location.state?.from || "/");
//     } catch (error) {
//       alert(error.response?.data?.message || "Sai tài khoản hoặc mật khẩu!");
//       console.error("Lỗi đăng nhập:", error);
//     }
//   };


//   const logout = () => {
//     setUser(null);
//     localStorage.removeItem("user");
//     localStorage.removeItem("accessToken");
//     navigate("/");
//   };


//   const fetchUser = async () => {

//     try {
//       const { data } = await axiosHandler.get("/user/me");

//       setUser(data);
//     } catch (error) {
//       console.error("Lỗi khi lấy thông tin user:", error);
//     }
//   };

//   useEffect(() => {
//     if (user) {
//       fetchUser();
//     }
//   }, [user]);

//   return (
//     <AuthContext.Provider value={{ user, login, logout, fetchUser }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };


// export const useAuth = () => useContext(AuthContext);
