import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';

const LandingPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleTestStart = async (path) => {
    setLoading(true);
    setError(null);
    try {
      navigate(path);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-100 flex flex-col justify-center items-center px-6">
      <div className="bg-white shadow-2xl rounded-3xl max-w-3xl w-full p-12 md:p-16 text-center
                      border-4 border-yellow-400
                      hover:scale-[1.02] transition-transform duration-300">
        <h1 className="text-5xl md:text-6xl font-extrabold text-yellow-900 mb-8 drop-shadow-lg">
         TalkSprint
        </h1>
        <p className="text-yellow-800 text-xl md:text-2xl mb-12 tracking-wide">
          Sharpen your listening and reading skills with our interactive assessments.
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-10">
          {[
            { label: 'Listening Comprehension', path: '/test' },
            { label: 'Listen & Repeat', path: '/reading-assessment' },
            { label: 'Speaking Skills ', path: '/speak' }
          ].map(({ label, path }) => (
            <button
              key={path}
              onClick={() => handleTestStart(path)}
              disabled={loading}
              className={`
                cursor-pointer
                px-10 py-5 rounded-full font-semibold text-lg
                bg-gradient-to-r from-yellow-400 to-yellow-500
                text-white shadow-xl 
                hover:from-yellow-500 hover:to-yellow-600
                active:scale-95 active:shadow-yellow-600/70
                transition duration-300
                disabled:bg-yellow-300 disabled:cursor-not-allowed disabled:text-yellow-700
              `}
            >
              {loading ? Loader : label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-8 text-red-600 font-semibold text-lg animate-shake">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
