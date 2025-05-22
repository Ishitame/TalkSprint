import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedOptions, quizData, timeLeft } = location.state || {};

  if (!selectedOptions || !quizData) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-yellow-50">
        <p className="text-red-600 text-xl font-semibold">
          Result data not found. Please complete a test first.
        </p>
      </div>
    );
  }

  const totalQuestions = quizData.reduce((acc, para) => acc + para.questions.length, 0);
  let correctCount = 0;

  quizData.forEach((paragraph, pIndex) => {
    paragraph.questions.forEach((question, qIndex) => {
      const key = `${pIndex}-${qIndex}`;
      if (selectedOptions[key] === question.correct_answer) {
  correctCount += 1;
} 
    });
  });

  const incorrectCount = totalQuestions - correctCount;
  const timeTaken = 20 * 60 - timeLeft;
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-yellow-50 px-6 py-10">
      <div className="bg-white shadow-2xl rounded-3xl p-10 max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-yellow-700 mb-8">Quiz Result</h1>

        <div className="space-y-6 text-xl font-semibold text-yellow-800">
          <p>Total Questions: <span className="text-yellow-900">{totalQuestions}</span></p>
          <p>Correct Answers: <span className="text-green-700">{correctCount}</span></p>
          <p>Incorrect Answers: <span className="text-red-600">{incorrectCount}</span></p>
          <p>Time Taken: <span className="text-yellow-900">{formatTime(timeTaken)}</span></p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-10 px-8 py-4 rounded-full font-semibold text-lg
          bg-yellow-500 hover:bg-yellow-600 text-white shadow-md hover:shadow-yellow-400/60 transition-all duration-300"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default ResultPage;
