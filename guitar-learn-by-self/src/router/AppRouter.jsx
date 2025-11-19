import React from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

import Home from "../pages/Home/Home";
import Analyzer from "../pages/Analyzer/Dashboard";
import ChordLibrary from "../pages/ChordLibrary/ChordLibrary";
import Scales from "../pages/Scales/Scales";
import Progressions from "../pages/Progression/Progressions";
import About from "../pages/About/About";
import Contact from "../pages/Contact/Contact";
import FAQ from "../pages/FAQ/FAQ";
import Login from "../pages/Login/Login";
import Quiz from "../pages/Quiz/QuizPage";
import Profile from "../pages/Profile/Profile";
import Information from "../pages/Information/Theory";
// ML pages
import Theory from "../pages/Theory/Theory";
import OnboardingPage from "../pages/OnboardingPage";

// Guards
import RequireAuth from "../routes/RequireAuth";
import RequireOnboarding from "../routes/RequireOnboarding";

const AppRouter = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyze" element={<Analyzer />} />
        <Route path="/chord-library" element={<ChordLibrary />} />
        <Route path="/scales" element={<Scales />} />
        <Route path="/progressions" element={<Progressions />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/login" element={<Login />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/information" element={<Information />} />

        {/* Onboarding: yêu cầu đăng nhập */}
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <OnboardingPage />
            </RequireAuth>
          }
        />

        {/* Theory: yêu cầu đăng nhập + đã onboarding */}
        <Route
          path="/theory"
          element={
            <RequireAuth>
              <RequireOnboarding>
                <Theory />
              </RequireOnboarding>
            </RequireAuth>
          }
        />

        {/* Nếu có trang lesson chi tiết, cũng nên bảo vệ tương tự */}
        {/* <Route
          path="/lesson/:id"
          element={
            <RequireAuth>
              <RequireOnboarding>
                <LessonDetail />
              </RequireOnboarding>
            </RequireAuth>
          }
        /> */}
      </Routes>
    </MainLayout>
  );
};

export default AppRouter;
