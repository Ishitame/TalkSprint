import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';

const FeedBackPage = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('https://talksprint.onrender.com/api/feedback')
      .then(response => {
        setFeedbackList(response.data.feedbacks);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching feedback:', error);
        setLoading(false);
      });
  }, []);

  if (loading)
    return <Loader/>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-100 py-10 px-6">
      <div className="max-w-4xl mx-auto bg-white border-4 border-yellow-400 rounded-3xl shadow-2xl p-8">
        <h1 className="text-4xl font-extrabold mb-8 text-yellow-900 text-center drop-shadow-md">
          Reading Feedback Summary
        </h1>

        {feedbackList.length === 0 ? (
          <p className="text-center text-yellow-700 font-medium">No feedback available yet.</p>
        ) : (
          feedbackList.map((item, i) => (
            <div
              key={i}
              className="bg-yellow-50 border border-yellow-300 rounded-xl p-6 mb-6 shadow-md hover:shadow-yellow-400/60 transition-shadow"
            >
              <div className="mb-2 text-sm text-yellow-700">
                Prompt #{item.index + 1} • {new Date(item.timestamp).toLocaleString()}
              </div>
              <p className="font-semibold mb-1">
                Original: <span className="text-yellow-800">{item.original}</span>
              </p>
              <p className="mb-4">
                You Said: <span className="text-yellow-700">{item.spoken}</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-yellow-100 rounded-lg p-4 text-center border border-yellow-300">
                  <h2 className="font-medium text-yellow-800 mb-1">Accuracy</h2>
                  <p className="text-2xl font-bold text-yellow-900">{item.accuracy?.toFixed(1)}%</p>
                </div>
                <div className="bg-yellow-100 rounded-lg p-4 text-center border border-yellow-300">
                  <h2 className="font-medium text-yellow-800 mb-1">Fluency</h2>
                  <p className="text-2xl font-bold text-yellow-900">{item.fluency?.toFixed(1)}%</p>
                </div>
                <div className="bg-yellow-100 rounded-lg p-4 text-center border border-yellow-300">
                  <h2 className="font-medium text-yellow-800 mb-1">Pronunciation</h2>
                  <p className="text-2xl font-bold text-yellow-900">{item.pronunciation?.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Back to Home button */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-semibold text-lg shadow-xl
                       hover:from-yellow-500 hover:to-yellow-600 active:scale-95 active:shadow-yellow-600/70 transition duration-300"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedBackPage;
