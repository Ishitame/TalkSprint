import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from './Loader';

const TestWindow = () => {
  const navigate = useNavigate();

  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [alertShown, setAlertShown] = useState(false);

  // Fetch quiz
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const res = await axios.get('https://talksprint.onrender.com/generate');
        setQuizData(res.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch quiz');
        setLoading(false);
      }
    };
    fetchQuiz();
  }, []);

  // Timer
  useEffect(() => {
    if (loading || error || quizData.length === 0) return;

    if (timeLeft === 0) {
      navigate('/results', { state: { selectedOptions, quizData, timeLeft } });
      return;
    }

    if (timeLeft === 300 && !alertShown) {
      alert("⏳ Only 5 minutes left! Please finish up.");
      setAlertShown(true);
    }

    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, loading, error, quizData, navigate, selectedOptions, alertShown]);

  const currentParagraph = quizData?.[currentParagraphIndex];
  const currentQuestion = currentParagraph?.questions?.[currentQuestionIndex];

  const totalQuestions = quizData.reduce((acc, para) => acc + para.questions.length, 0);
  const currentQuestionNumber = quizData
    .slice(0, currentParagraphIndex)
    .reduce((acc, para) => acc + para.questions.length, 0) + currentQuestionIndex + 1;

  const handlePlayAudio = () => {
    if (!currentParagraph?.paragraph) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(currentParagraph.paragraph);
    setIsPlayingAudio(true);

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setCurrentQuestionIndex(0);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleOptionSelect = (option) => {
    setSelectedOptions(prev => ({
      ...prev,
      [`${currentParagraphIndex}-${currentQuestionIndex}`]: option
    }));
  };

  const handleNext = () => {
    const isLastQuestionInParagraph = currentQuestionIndex === currentParagraph.questions.length - 1;
    const isLastParagraph = currentParagraphIndex === quizData.length - 1;

    if (!isLastQuestionInParagraph) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (!isLastParagraph) {
      setCurrentParagraphIndex(prev => prev + 1);
      setCurrentQuestionIndex(-1);
    }
  };

  const handleFinishTest = () => {
     navigate('/results', {
      state: { selectedOptions, quizData, timeLeft }
    });
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-yellow-50">
        <Loader></Loader>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-yellow-50 px-6">
        <p className="text-red-600 text-xl font-semibold">{error}</p>
      </div>
    );
  }

  if (!currentParagraph) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-yellow-50 px-6">
        <Loader></Loader>
      </div>
    );
  }

 return (
  <div className="min-h-screen bg-yellow-50 flex flex-col items-center px-4 sm:px-6 py-6 sm:py-12 relative">
    {/* Sticky Timer at Top */}
    <div className="w-full sticky top-0 z-10 bg-yellow-100 border-b border-yellow-200 py-4 px-4 sm:px-10 flex justify-center">
      <div className="text-yellow-900 font-bold text-lg sm:text-xl">
        ⏱ Time Left: {formatTime(timeLeft)}
      </div>
    </div>

    {/* Main Content Box */}
    <div className="bg-white shadow-lg rounded-3xl max-w-3xl w-full p-6 sm:p-10 mt-6">
      {currentQuestionIndex === -1 ? (
        <>
          <h2 className="text-2xl sm:text-3xl font-bold text-yellow-800 mb-6 sm:mb-8 text-center">
            Listen to the passage:
          </h2>

          <button
            onClick={handlePlayAudio}
            disabled={isPlayingAudio}
            className={`cursor-pointer w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 mx-auto block rounded-full font-semibold text-base sm:text-lg transition-colors duration-300 ${
              isPlayingAudio
                ? 'bg-yellow-300 cursor-not-allowed text-yellow-700'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-md hover:shadow-yellow-400/60'
            }`}
          >
            {isPlayingAudio ? 'Playing Audio...' : 'Play Audio'}
          </button>

          <p className="mt-4 sm:mt-6 text-yellow-700 italic text-center text-sm sm:text-base">
            Please listen carefully to the passage.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-xl sm:text-3xl font-bold text-yellow-800 mb-4 sm:mb-8 text-center">
            Question {currentQuestionNumber} of {totalQuestions}
          </h2>

          <h3 className="text-base sm:text-xl font-semibold text-yellow-800 mb-4">
            {currentQuestion?.question}
          </h3>

          <div className="grid gap-3 sm:gap-4 mb-8">
            {Object.entries(currentQuestion?.options || {}).map(([letter, option]) => (
              <button
                key={letter}
                onClick={() => handleOptionSelect(letter)}
                className={`w-full text-left px-4 sm:px-6 py-3 sm:py-4 rounded-xl border-2 font-semibold transition-colors duration-200 ${
                  selectedOptions[`${currentParagraphIndex}-${currentQuestionIndex}`] === letter
                    ? 'border-yellow-600 bg-yellow-200 text-yellow-900 shadow-md'
                    : 'border-yellow-300 hover:bg-yellow-100'
                }`}
              >
                {letter}. {option}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {currentParagraphIndex === quizData.length - 1 &&
            currentQuestionIndex === currentParagraph.questions.length - 1 ? (
              <button
                onClick={handleFinishTest}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg bg-yellow-600 text-white hover:bg-yellow-700 shadow-md hover:shadow-yellow-400/60"
              >
                Finish Test
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={
                  selectedOptions[`${currentParagraphIndex}-${currentQuestionIndex}`] == null
                }
                className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-colors duration-300 ${
                  selectedOptions[`${currentParagraphIndex}-${currentQuestionIndex}`] == null
                    ? 'bg-yellow-300 cursor-not-allowed text-yellow-700'
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-md hover:shadow-yellow-400/60'
                }`}
              >
                Next
              </button>
            )}
          </div>
        </>
      )}
    </div>
  </div>
);

};

export default TestWindow;
