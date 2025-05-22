import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import TestWindow from './components/TestWindow';
import ResultPage from './components/ResultPage';
import ReadingTest from './components/ReadingAssessment';
import FeedBackPage from './components/FeedBackPage';
import JamSession from './components/JamSession';
import JamFeedback from './components/JamFeedback';

const App = () => {
  return (
    
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/test" element={<TestWindow />} />
        <Route path="/results" element={<ResultPage />} />
        <Route path="/reading-assessment" element={<ReadingTest />} />
        <Route path="/feedback" element={<FeedBackPage />} />
         <Route path="/speak" element={<JamSession />} />
         <Route path="/jam/feedback" element={<JamFeedback />} />

      </Routes>
   
  );
};

export default App;
