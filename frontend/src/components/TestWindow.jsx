import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
        <p className="text-yellow-700 text-xl font-semibold">Loading quiz...</p>
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
        <p className="text-yellow-700 text-xl font-semibold">Preparing quiz...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center px-6 py-12">
      <div className="bg-white shadow-lg rounded-3xl max-w-3xl w-full p-10 relative">
        <div className="absolute top-6 right-6 bg-yellow-200 text-yellow-900 font-bold rounded-xl px-4 py-2 text-lg select-none">
          Time Left: {formatTime(timeLeft)}
        </div>

        {currentQuestionIndex === -1 ? (
          <>
            <h2 className="text-2xl font-bold text-yellow-800 mb-8">
              Listen to the passage:
            </h2>

            <button
              onClick={handlePlayAudio}
              disabled={isPlayingAudio}
              className={`px-8 py-4 rounded-full font-semibold text-lg transition-colors duration-300 ${
                isPlayingAudio
                  ? 'bg-yellow-300 cursor-not-allowed text-yellow-700'
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-md hover:shadow-yellow-400/60'
              }`}
            >
              {isPlayingAudio ? 'Playing Audio...' : 'Play Audio'}
            </button>

            <p className="mt-6 text-yellow-700 italic">
              Please listen carefully to the passage.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-yellow-800 mb-8">
              Question {currentQuestionNumber} of {totalQuestions}
            </h2>

            <h3 className="text-xl font-semibold text-yellow-800 mb-4">
              {currentQuestion?.question}
            </h3>

            <div className="grid gap-4 mb-8">
              {Object.entries(currentQuestion?.options || {}).map(([letter, option]) => (
                <button
                  key={letter}
                  onClick={() => handleOptionSelect(letter)}
                  className={`w-full text-left px-6 py-4 rounded-xl border-2 font-semibold transition-colors duration-200 ${
                    selectedOptions[`${currentParagraphIndex}-${currentQuestionIndex}`] === letter
                      ? 'border-yellow-600 bg-yellow-200 text-yellow-900 shadow-md'
                      : 'border-yellow-300 hover:bg-yellow-100'
                  }`}
                >
                  {letter}. {option}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center gap-4">
              {currentParagraphIndex === quizData.length - 1 &&
              currentQuestionIndex === currentParagraph.questions.length - 1 ? (
                <button
                  onClick={handleFinishTest}
                  className="px-8 py-4 rounded-full font-semibold text-lg bg-yellow-600 text-white hover:bg-yellow-700 shadow-md hover:shadow-yellow-400/60"
                >
                  Finish Test
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={
                    selectedOptions[`${currentParagraphIndex}-${currentQuestionIndex}`] == null
                  }
                  className={`px-8 py-4 rounded-full font-semibold text-lg transition-colors duration-300 ${
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
