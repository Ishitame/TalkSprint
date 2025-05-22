const express=require('express')

require('dotenv').config();
const app=express();
const cors=require('cors');
const multer = require('multer');
const { exec ,execFile} = require('child_process');
const fs = require('fs');
const path = require('path');



app.use(cors())
app.use(express.json()); 

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Init model once
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const generateParagraph = async () => {
  const prompt = `
Generate   80-100 word paragraph suitable for a listening comprehension test.create simple paragraphs such that when read by/listened by student it easy to recall  they can be descriptions about normal life  try to generate different than the previous one generated 
Include  simple specific names, dates, events, or locations. Do not include questions since it's for speech generation just generate the paragraph no extra wishes or lines
`;


  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

const generateQuestions = async (paragraph) => {
  const prompt = `
Based on the following paragraph, generate exactly 3 comprehension questions.

For each question:
- Ask a relevant question about the paragraph (factual, inference, or meaning).
- Provide 4 answer options labeled A, B, C, D.
- Only one option should be correct.
- Clearly mark the correct answer at the end using this format: Correct Answer: [A/B/C/D].

Strictly follow this format:

Q1: [question]
A. [option A]
B. [option B]
C. [option C]
D. [option D]
Correct Answer: [A/B/C/D]

Q2: ...
Paragraph:
${paragraph}`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

app.get("/generate", async (req, res) => {
  try {
    const results = [];

    for (let idx = 0; idx < 3; idx++) {
      const paragraph = await generateParagraph();
      const qaText = await generateQuestions(paragraph);

      

      // Parse Q&A from raw Gemini output
      const lines = qaText.split("\n").map(line => line.trim()).filter(Boolean);
      const questions = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("Q")) {
          const questionText = lines[i].split(":").slice(1).join(":").trim();

          // Get next 4 lines as options (A, B, C, D)
          const optionLines = lines.slice(i + 1, i + 5);
          const options = {};
          optionLines.forEach(line => {
            const letter = line[0].toUpperCase(); // 'A', 'B', 'C', 'D'
            const text = line.slice(2).trim();
            options[letter] = text;
          });

          // The correct answer line should be right after the options
          const correctLine = lines[i + 5] || "";
         

          // Regex to catch "Correct Answer: [A]" with optional spaces and case-insensitive
          const correctMatch = correctLine.match(/Correct Answer\s*[:\-]?\s*[\[\(]?([ABCD])[)\]]?/i);

          let correctAnswerText = "Not provided";

          if (correctMatch) {
            const letter = correctMatch[1].toUpperCase();
            if (options[letter]) {
              correctAnswerText = letter; // or options[letter] if you want full text
            }
          } else {
            console.log("No match for correct answer line.");
          }

          questions.push({
            question: questionText,
            options,
            correct_answer: correctAnswerText,
          });

          i += 5; // Skip parsed lines for next iteration
        }
      }

      results.push({
        paragraph,
        questions,
      });
    }

    return res.json(results);

  } catch (err) {
    console.error("Generation error:", err);
    res.status(500).json({ error: "Failed to generate paragraphs or questions" });
  }
});


app.get('/generate-prompts', async (req, res) => {
 
  try {
    const prompt = `
      Generate a JSON object with:
     
      - "readingLines": an array of 4 strings:
        - 2 short easy to medium difficulty sentences ,
        - 4 compound/complex sentences  they should have easy language and contains 10-15 words).

        generate very unique sentences don't just repeat cat,bird sentences

      Respond ONLY with a JSON object — no markdown, no explanation, no formatting.
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // Strip markdown formatting if present
    text = text.trim();
    if (text.startsWith("```")) {
      text = text.replace(/```(?:json)?\s*/g, "").replace(/```$/, "").trim();
    }

    const data = JSON.parse(text);
    res.json({ prompts: data });
  } catch (err) {
    console.error('Error generating prompts:', err.message);
    res.status(500).json({ error: 'Failed to generate prompts' });
  }
});

const pronunciation = Math.round(60 + Math.random() * 40);
const levenshtein = require('js-levenshtein');
const upload = require('./config/multerConfig');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

// Tell fluent-ffmpeg where to find ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);


function convertWebmToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('wav')
      .audioFrequency(16000)    // sample rate 16kHz
      .audioChannels(1)         // mono channel
      .on('error', (err) => {
        console.error('FFmpeg error:', err.message);
        reject(err);
      })
      .on('end', () => {
        console.log('Conversion complete:', outputPath);
        resolve(outputPath);
      })
      .save(outputPath);
  });
}


function analyzeSpeech(original, spoken, durationInSeconds ) {
  const distance = levenshtein(original.toLowerCase(), spoken.toLowerCase());
  const accuracy = Math.max(0, (1 - distance / original.length)) * 100;

  const words = spoken.split(' ').length;
  const wordsPerSec = words / durationInSeconds;

  let fluency;
  if (wordsPerSec < 1.2) fluency = 60;
  else if (wordsPerSec < 2.0) fluency = 80;
  else fluency = 95;

  const pronunciation = Math.round(60 + Math.random() * 40);

  return {
    accuracy: parseFloat(accuracy.toFixed(2)),
    fluency,
    pronunciation,
  };
}

let feedbacks = []; // In-memory storage

app.post('/api/analyze', (req, res) => {
  const { original, spoken, index ,userAudioDuration} = req.body;

  if (!original || !spoken || index === undefined) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const analysis = analyzeSpeech(original, spoken,userAudioDuration);
  const feedback = {
    index,
    original,
    spoken,
    ...analysis,
    timestamp: new Date()
  };

  feedbacks.push(feedback);
  res.status(200).json({ message: 'Feedback stored', feedback });
});

// GET /api/feedback
app.get('/api/feedback', (req, res) => {
  res.status(200).json({ feedbacks });
  feedbacks.length = 0; // Clear the array after sending response
});

const generateTopic = async () => {
  const prompt = `
Generate a random JAM (Just A Minute) session topic based on everyday life. The topic should be thought-provoking, simple to understand, and suitable for college students. Use common, relatable themes such as technology, habits, relationships, emotions, modern society, campus life, or personal experiences.

Constraints:
- Keep the topic short (5 to 10 words).
- Avoid repetition or technical jargon  it should contain words thta are easy to understand and known by people in general.
- Output only one topic without any explanation or extra text.

Example topics:
- The impact of social media on friendships
- Why mornings are better than nights
- The art of doing nothing
- Is multitasking really productive?
- Small talk with strangers

Now generate one fresh topic.
`;


  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};


app.get('/topic', async (req, res) => {
  try {
    const text=await generateTopic();
    res.json({ topic: text });
  } catch (error) {
    console.error('Error generating topic:', error);
    res.status(500).json({ error: 'Failed to generate topic' });
  }
});




async function analyzeWithGemini(transcript, topic) {
  const prompt = `
You are evaluating a JAM (Just A Minute) session.

**Topic:** "${topic}"

**Transcript:** "${transcript}"



Please analyze and give ratings (1 to 10) for the following aspects:
1. **Fluency** – How smoothly the speaker spoke, including pauses and flow.
2. **Pronunciation** – Clarity of speech, correct articulation of words.
3. **Confidence** – Tone, pace, and assertiveness.
4. **Content Relevance** – How well the speaker stayed on topic and provided meaningful points related to "${topic}".

Provide a rating for each and a brief reason. Conclude with an overall summary and suggestion for improvement.
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}



app.post('/analyze', async (req, res) => {
  try {
    const { transcript, topic } = req.body;

    if (!transcript || !topic ) {
      return res.status(400).json({ error: 'Transcript, topic, and duration are required' });
    }

    const feedback = await analyzeWithGemini(transcript, topic);
    res.json({ transcript, topic, feedback });

  } catch (err) {
    console.error('Error analyzing JAM session:', err);
    res.status(500).send('Error analyzing JAM session');
  }
});




app.listen(3000);
