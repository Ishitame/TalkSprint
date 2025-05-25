import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';


// Utility function to bold **text** and remove asterisks
const formatTextWithBold = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    )
  );
};

const JamFeedback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { topic, text, feedback } = location.state || {};

  if (!topic || !text || !feedback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50 px-4">
        <div className="text-center bg-white p-8 rounded-2xl border border-yellow-300 shadow-lg max-w-lg w-full">
          <p className="text-xl text-yellow-800">⚠️ No data to show. Please attempt a JAM session first.</p>
          <button
            onClick={() => navigate('/speak')}
            className="mt-4 px-6 py-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700 transition"
          >
            Go to JAM Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white border border-yellow-300 shadow-xl rounded-3xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-yellow-700 mb-6 text-center">📝 JAM Feedback</h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-1">🟨 Topic:</h2>
          <p className="bg-yellow-100 text-yellow-900 border border-yellow-300 rounded-lg p-3">{topic}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-1">🎙️ Your Response:</h2>
          <p className="bg-yellow-100 text-yellow-900 border border-yellow-300 rounded-lg p-3 whitespace-pre-wrap">
            {formatTextWithBold(text)}
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-yellow-800 mb-1">🔍 Feedback:</h2>
          <div className="space-y-3">
            {feedback.map((item, index) => (
              <div
                key={index}
                className="bg-yellow-100 text-yellow-900 border border-yellow-300 rounded-lg p-3"
              >
                {formatTextWithBold(item)}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate('/speak')}
            className="px-6 py-2 bg-yellow-700 text-white rounded-full hover:bg-yellow-800 transition"
          >
            🎯 Try Another Topic
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-yellow-700 text-white rounded-full hover:bg-yellow-800 transition"
          >
            🏠 Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default JamFeedback;
