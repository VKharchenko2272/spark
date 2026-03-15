import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import DepMetricsOverview from '../DepMetricsOverview';
import LineChart from '../Charts/LineChart';
import BarChart from '../Charts/BarChart';
import '../Home/Home.css';
import PageDepDashboard from '../RightPanel/PageDepDashboard';

function DepMetrics() {
  const id = localStorage.getItem('userId');
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [managerId, setManagerId] = useState(null);
  const [scores, setScores] = useState(new Array(22).fill(0));
  const [userScoresByTopic, setUserScoresByTopic] = useState({});
  const [peopleScores, setPeopleScores] = useState([]); // Для хранения данных людей с total score

  useEffect(() => {
    if (!id) {
      setError('Manager ID is not provided');
      return;
    }

    // Получение оценок пользователей по темам
    axios.get(`http://localhost:5212/manager-user-scores/${id}`)
      .then(response => {
        const userScores = response.data;
        const scoresByTopic = {};
        const peopleScoresData = [];

        userScores.forEach(user => {
          let totalScore = 0;

          user.topics.forEach(topic => {
            totalScore += topic.score;

            if (!scoresByTopic[topic.topicId]) {
              scoresByTopic[topic.topicId] = [];
            }
            scoresByTopic[topic.topicId].push({
              userName: user.userName,
              userLastName: user.userLastName,
              score: topic.score
            });
          });

          // Добавляем пользователя и его общий балл в peopleScoresData
          peopleScoresData.push({
            userId: user.userId,
            userName: user.userName,
            totalScore: totalScore
          });
        });

        setUserScoresByTopic(scoresByTopic);
        setPeopleScores(peopleScoresData); // Устанавливаем данные людей с total score
      })
      .catch(error => {
        setError('Failed to get manager scores data');
      });

    // Получение данных по категориям
    axios.get(`http://localhost:5212/department-scores/${id}`)
      .then(response => {
        const { categories, managerId } = response.data;
        setCategories(categories || []);
        setManagerId(managerId);

        const extractedScores = new Array(22).fill(0);
        categories.forEach(category => {
          category.topics.forEach(topic => {
            const topicIndex = topic.topic_id - 1;
            extractedScores[topicIndex] = topic.average_score;
          });
        });

        setScores(extractedScores);
      })
      .catch(error => {
        setError('Failed to get manager scores data');
      });
  }, [id]);

  return (
    <div className="container">
      <Helmet> <title>DepMetrics</title></Helmet>

      <div className="row">
        {/* Left Section: Main Content */}
        <div className="col-10 container-width-dashboard">
          <h1>Team's Dashboard</h1>
          {managerId ? (
            <>
              <LineChart scores={scores} /> {/* Pass scores as a prop */}
              <BarChart categories={categories} />
              <DepMetricsOverview categories={categories} userScoresByTopic={userScoresByTopic} />
            </>
          ) : (
            <p>Loading...</p>
          )}
          {error && <p className="text-danger">{error}</p>}
        </div>
        <div className="col-2 custom-margin">
          <PageDepDashboard categories={categories} userScoresByTopic={peopleScores} /> {/* Передаем peopleScores */}
        </div>
      </div>
    </div>
  );
}

export default DepMetrics;
