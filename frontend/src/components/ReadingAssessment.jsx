import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';

const ReadingAssessment = () => {
  const [prompts, setPrompts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [hasListened, setHasListened] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [userAudioDuration, setUserAudioDuration] = useState(0);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const res = await axios.get('https://talksprint.onrender.com/generate-prompts');
        if (res.data?.prompts?.readingLines) {
          setPrompts(res.data.prompts.readingLines);
        } else {
          console.error('Unexpected prompts format:', res.data);
          setPrompts([]);
        }
      } catch (err) {
        console.error('Error fetching prompts:', err);
        setPrompts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPrompts();
  }, []);

  const estimateDuration = (text) => {
    const words = text.trim().split(/\s+/).length;
    const wordsPerMinute = 130;
    return (words / wordsPerMinute) * 60;
  };

  const speak = (text) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.onend = () => {
      setHasListened(true);
    };
    window.speechSynthesis.speak(utterance);
    setHasPlayed(true);
  };

  const startCountdown = () => {
    setTimeLeft(30);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopRecording();
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = () => {
    if (recording || prompts.length === 0 || hasRecorded) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = async (event) => {
      const spokenText = event.results[0][0].transcript;
      console.log('Transcript:', spokenText);

      try {
        await axios.post('https://talksprint.onrender.com/api/analyze', {
          original: prompts[currentIndex],
          spoken: spokenText,
          index: currentIndex,
          originalAudioDuration: estimateDuration(prompts[currentIndex]),
          userAudioDuration,
        });
        setHasRecorded(true);
      } catch (err) {
        console.error('Error sending transcript to backend:', err);
      }
    };

    recognition.onerror = (event) => {
      console.error('Recognition error:', event.error);

      // Handle specific errors
      if (event.error === 'network') {
        alert('⚠️ Network error with speech recognition. Try checking your internet connection or using HTTPS.');
      } else if (event.error === 'not-allowed') {
        alert('⚠️ Microphone access denied. Please allow microphone usage and try again.');
      } else if (event.error === 'service-not-allowed') {
        alert('⚠️ Speech recognition service not allowed in this context. Use HTTPS and supported browsers.');
      } else {
        alert(`⚠️ Speech recognition error: ${event.error}`);
      }

      stopRecording();
    };

    recognition.onend = () => {
      stopRecording();
    };

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current);
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onloadedmetadata = () => {
          setUserAudioDuration(audio.duration);
          URL.revokeObjectURL(audioUrl);
        };
      };

      mediaRecorder.start();
    }).catch((err) => {
      console.error('Microphone access error:', err);
      alert('⚠️ Failed to access microphone. Please check your permissions.');
    });

    recognition.start();
    setRecording(true);
    startCountdown();
  };

  const stopRecording = () => {
    if (!recording) return;

    if (recognitionRef.current) recognitionRef.current.stop();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  };

  const nextPrompt = () => {
    stopRecording();
    setHasPlayed(false);
    setHasListened(false);
    setHasRecorded(false);
    setTimeLeft(30);
    setUserAudioDuration(0);
    if (currentIndex < prompts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigate('/feedback');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fffdea] text-xl">
        <Loader></Loader>
      </div>
    );
  }

  if (currentIndex >= prompts.length) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#fffdea] text-2xl font-semibold">
        Assessment finished. Thank you!
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffdea] flex flex-col items-center justify-center px-6">
      <div className="bg-yellow-100 rounded-3xl p-12 max-w-md w-full shadow-md shadow-yellow-200 text-yellow-900 font-sans text-center">

        <h1 className="text-3xl md:text-4xl font-bold mb-12 text-black">Reading Practice</h1>

        <button
          disabled={hasPlayed}
          onClick={() => speak(prompts[currentIndex])}
          className={`bg-yellow-50 border border-black px-8 py-4 rounded-xl font-semibold transition mb-10
            ${hasPlayed ? 'opacity-60 cursor-not-allowed text-gray-400 border-gray-400' : 'text-black hover:bg-yellow-100'}`}
        >
          🔊 {hasPlayed ? 'Played' : 'Listen'}
        </button>

        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <button
            disabled={recording || !hasListened || hasRecorded}
            onClick={startRecording}
            className={`bg-yellow-50 border border-black px-6 py-3 rounded-xl font-semibold transition
              ${recording || !hasListened || hasRecorded
                ? 'opacity-60 cursor-not-allowed text-gray-400 border-gray-400'
                : 'text-green-700 hover:bg-yellow-100'}`}
          >
            {recording ? 'Recording...' : 'Start Recording'}
          </button>

          <button
            disabled={!recording}
            onClick={stopRecording}
            className={`bg-yellow-50 border border-black px-6 py-3 rounded-xl font-semibold transition
              ${!recording
                ? 'opacity-60 cursor-not-allowed text-gray-400 border-gray-400'
                : 'text-red-700 hover:bg-yellow-100'}`}
          >
            ⏹ Stop
          </button>
        </div>

        {recording && <p className="text-lg text-gray-700 mb-4">⏱ Time left: {timeLeft}s</p>}

        <button
          onClick={nextPrompt}
          className="bg-yellow-50 border border-black px-10 py-4 rounded-2xl font-semibold text-black hover:bg-yellow-100 transition"
        >
          {currentIndex < prompts.length - 1 ? 'Next Prompt' : 'Finish'}
        </button>
      </div>
    </div>
  );
};

export default ReadingAssessment;
