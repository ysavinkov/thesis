import { useState, useEffect } from 'react';
import { useQuery } from "react-query";
import './App.css';

const SERVER = import.meta.env.VITE_SERVER_ADDRESS;

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [verdict, setVerdict] = useState("");

  const { isLoading, data, error, refetch } = useQuery("questions", () => {
    return fetch(`${SERVER}/api/questions`).then((res) => {
        console.log("response arrives...");
        if (!res.ok) {
          throw new Error('Не вдалося отримати відповіді');
        }
        return res.json();
      });
  }, {
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data && data.questions) {
      setQuestions(data.questions);
    }
  }, [data]);

  const startQuiz = () => {
    setQuizStarted(true);
    setQuizFinished(false);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSelectedOption("");
    setVerdict("");
  }

  const handleAnswer = () => {

    if (selectedOption) {
      setAnswers([
        ...answers,
        { question: questions[currentQuestionIndex].question, answer: selectedOption }
      ])
  
      setSelectedOption("");

      setTimeout(() => {
        if(currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
          sendAnswersToAI();
          setQuizFinished(true);
        }
      }, 250);
    }
  }

  const sendAnswersToAI = async () => {
    try {
      const res = await fetch(`${SERVER}/api/verdict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers })
      });

      const data = await res.json();
      setVerdict(data.verdict);
    } catch (e) {
      console.error("Failed to get verdict:", e);
      setVerdict("Не вдалося отримати вердикт");
    }
  }

  if(isLoading) {
    return <div className="container">
      <p>Отримуємо запитання...</p>
    </div>
  }

  if (error) {
    return (
      <div className="container">
        <p>{error.message}</p>
        <button onClick={refetch}>Спробувати ще раз</button>
      </div>
    );
  }

  return (
    <div className="container">
      {!quizStarted || quizFinished ? (
        <>
          <button onClick={startQuiz}>{quizFinished ? 'Пройти це опитування знову' : 'Почати опитування'}</button>
          {quizFinished && (
            <div className="rescontainer">
              <h2>Опитування завершено!</h2>
              {/* {console.log(questions)}
              {console.log(answers)}
              {verdict && console.log(verdict)} */}
              {verdict ? (
                <div className="verdict-container">
                  <h3>Вердикт ШІ</h3>
                  <p>{verdict}</p>
                </div>
              ) : (
                <div className="verdict-container">
                  <h3>Отримуємо вердикт від ШІ...</h3>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div>
          <h2>
            Запитання №{currentQuestionIndex + 1}/{questions.length}
          </h2>
          <h3>
            {questions[currentQuestionIndex].question}
          </h3>
          <div className="optcontainer">
            {questions[currentQuestionIndex].options.map((option, index) => (
              <div key={index}>
                <label>
                  <input
                    type="radio"
                    name="answer"
                    value={option}
                    checked={selectedOption === option}
                    onChange={(e) => setSelectedOption(e.target.value)}
                  />
                  {option}
                </label>
              </div>
            ))}
          </div>
          <button onClick={handleAnswer} disabled={!selectedOption}>
            Далі
          </button>
        </div>
      )}
    </div>
  );
}

export default App
