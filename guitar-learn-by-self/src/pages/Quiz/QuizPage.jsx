import React from "react";
import { useNavigate } from "react-router-dom";
import Quiz from "../../Features/Quizz/components/QuizPage";

const QuizPage = () => {
  

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center  transition-colors duration-300">
      <Quiz />
    </div>
  );
   
};

export default QuizPage;
