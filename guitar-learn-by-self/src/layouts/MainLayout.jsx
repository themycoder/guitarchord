// src/layouts/MainLayout.jsx
import React from "react";
import Header from "../components/Layouts/Header";
import Navbar from "../components/Layouts/Navbar";
import Footer from "../components/Layouts/Footer";

const MainLayout = ({ children }) => {
  return (
    <div className="app-container dark:bg-black min-h-screen flex flex-col">
      <Header />
      <Navbar />

      <main className="main-content w-full dark:bg-black pt-[var(--nav-h,64px)]">
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;
