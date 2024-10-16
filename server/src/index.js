import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import 'dotenv/config';

const app = express();

app.use(cors({
    origin: process.env.ORIGIN
}));
app.use(express.json());

app.get('/api/questions', async (req, res) => {
    
    const groq = new Groq({ apiKey: process.env.API_KEY });

    const messages = [
        {
          role: "system",
          content: `
          You are a career advisor who helps applicants with career guidance.
          Create exactly 10 questions in Ukrainian that will help determine the most suitable profession. For each of them, provide 4 answers in Ukrainian.
          The questions should be in valid JSON format. Each object must have correctly opened and closed curly braces, quotes, and commas.
          Do not write additional text, just JSON.
          Only use the Ukrainian alphabet.
          Response format: 
          {"questions": [{"id": 0, "question": "", "options": []}]}`
        },
      ];

    try {
        const completion = await groq.chat.completions.create({
            model: process.env.MODEL,
            response_format: {"type": "json_object"},
            messages
        });

        const response = completion.choices[0]?.message?.content || "";

        const json = JSON.parse(response);
        res.json(json);
    } catch(e) {
        console.error("Error:", e.message);
        res.sendStatus(400);
    }
});

app.post('/api/verdict', async (req, res) => {
    const groq = new Groq({ apiKey: process.env.API_KEY });

    const { answers } = req.body;

    const messages = [
        {
          role: "system",
          content: `
          You are a career advisor who helps applicants with career guidance.
          Here are the applicant's answers to the questions. Based on these answers,
          give a conclusion about which profession is most suitable for this person.
          Write the conclusion briefly, just a few sentences. There must be at least one example of a suitable profession.
          Conclusion must be in Ukrainian.
          Here are the answers in JSON format:
          ${JSON.stringify(answers)}`
        },
      ];

    try {
        const completion = await groq.chat.completions.create({
            model: process.env.MODEL,
            messages
        });

        const response = completion.choices[0]?.message?.content || "";

        const verdict = response;
        res.json({ verdict });
    } catch(e) {
        console.error("Error:", e.message);
        res.sendStatus(400);
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Example app is listening on port ${process.env.PORT}!`);
});