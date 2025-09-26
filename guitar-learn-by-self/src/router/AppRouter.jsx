// src/router/AppRouter.js
import React from "react";
import { Routes, Route } from "react-router-dom"; 
// Layout
import MainLayout from "../layouts/MainLayout";

// Pages
import Home from "../pages/Home/Home";
import Analyzer from "../pages/Analyzer/Dashboard";
import ChordLibrary from "../pages/ChordLibrary/ChordLibrary";
import Scales from "../pages/Scales/Scales";
import Progressions from "../pages/Progression/Progressions";
import About from "../pages/About/About";
import Contact from "../pages/Contact/Contact";
import Theory from "../pages/Theory/Theory";
import FAQ from "../pages/FAQ/FAQ";
import Login from "../pages/Login/Login";

const AppRouter = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyze" element={<Analyzer />} />
        <Route path="/chord-library" element={<ChordLibrary />} />
        <Route path="/scales" element={<Scales />} />
        <Route path="/progressions" element={<Progressions />} />
        <Route path="/theory" element={<Theory />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </MainLayout>
  );
};

export default AppRouter;
