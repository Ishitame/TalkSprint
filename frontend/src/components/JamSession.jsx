import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';

const JamSession = () => {
  const [topic, setTopic] = useState('');
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [timer, setTimer] = useState(60);
  const [feedbackData, setFeedbackData] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const fullTranscriptRef = useRef('');
  

  useEffect(() => {
    const fetchTopic = async () => {
      const res = await axios.get('https://talksprint.onrender.com/topic');
      setTopic(res.data.topic);
    };
    fetchTopic();
  }, []);

  useEffect(() => {
    if (recording && timer > 0) {
      timerRef.current = setTimeout(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0 && recording) {
      stopRecording();
    }
    return () => clearTimeout(timerRef.current);
  }, [recording, timer]);

  useEffect(() => {
    if (feedbackData) {
      const countdown = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            navigate('/jam/feedback', {
              state: {
                topic,
                text: transcript,
                feedback: feedbackData.feedback,
              },
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [feedbackData, navigate, topic, transcript]);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    fullTranscriptRef.current = '';

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          fullTranscriptRef.current += event.results[i][0].transcript + ' ';
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      stopRecording();
    };

    recognition.onend = () => {
      console.log('Speech recognition ended.');
    };

    recognition.start();
    setRecording(true);
    setTimer(60);
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setRecording(false);
    setRecorded(true);

    const finalTranscript = fullTranscriptRef.current.trim();
    setTranscript(finalTranscript);

    if (!finalTranscript) {
      alert('No speech detected. Please try again.');
      return;
    }

    try {
      const res = await axios.post('https://talksprint.onrender.com/analyze', {
        transcript: finalTranscript,
        topic,
      });
      setFeedbackData(res.data);
    } catch (error) {
      console.error('Error analyzing transcript:', error);
      alert('Failed to analyze. Try again.');
    }
  };

  
  if (!topic) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white border border-yellow-300 shadow-xl rounded-3xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-yellow-700 mb-4 text-center">🎤 JAM Session</h1>

        <div className="bg-yellow-100 border border-yellow-300 text-yellow-900 p-4 rounded-lg text-lg text-center mb-6">
          {topic || 'Loading topic...'}
        </div>

        <div className="flex flex-col items-center">
          <button
            onClick={startRecording}
            disabled={recording || recorded}
            className={`transition-all duration-300 px-8 py-3 text-lg rounded-full font-semibold cursor-pointer
              ${recording || recorded
                ? 'bg-yellow-300 cursor-not-allowed text-white'
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              }`}
          >
            {recording ? 'Recording...' : recorded ? 'Recorded' : 'Start Speaking'}
          </button>

          {recording && (
            <div className="mt-6 flex flex-col items-center space-y-4">
              <div className="relative w-24 h-24">
                <svg className="animate-pulse w-full h-full text-yellow-500" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" fill="none" />
                </svg>
                <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-mono text-yellow-800">
                  {timer}s
                </span>
              </div>

              <p className="text-sm text-yellow-700">Speaking... Please talk about the topic</p>
            </div>
          )}

          <p className="mt-4 text-sm text-yellow-600">Only one attempt allowed. Max duration: 1 minute</p>
        </div>

        {recorded && !feedbackData && (
          <div className="mt-8 text-center">
            <p className="text-yellow-700 font-semibold">Analyzing your speech...</p>
            <div className="mt-2 flex justify-center">
              <div className="w-6 h-6 border-4 border-yellow-400 border-dashed rounded-full animate-spin"></div>
            </div>
          </div>
        )}

        {recorded && feedbackData && (
          <div className="mt-8 text-center">
            <p className="text-yellow-800 text-lg font-semibold">✅ Analysis complete!</p>
            <p className="text-sm text-yellow-600">Redirecting in {redirectCountdown}s...</p>

            <button
              className="mt-4 cursor-pointer px-6 py-2 bg-yellow-700 text-white rounded-full hover:bg-yellow-800 transition"
              onClick={() =>
                navigate('/jam/feedback', {
                  state: {
                    topic,
                    text: transcript,
                    feedback: feedbackData.feedback,
                  },
                })
              }
            >
              Go to Feedback Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JamSession;
