import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import DepMetricsOverview from '../DepMetricsOverview';
import LineChart from '../Charts/LineChart';
import BarChart from '../Charts/BarChart';
import PageDepDashboard from '../RightPanel/PageDepDashboard';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../lib/api';
import './dep-metrics-style.css';

function DepMetrics() {
  const { user } = useAuth();
  const id = user?.id;
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [managerId, setManagerId] = useState(null);
  const [scores, setScores] = useState(new Array(22).fill(0));
  const [userScoresByTopic, setUserScoresByTopic] = useState({});
  const [peopleScores, setPeopleScores] = useState([]);
  const missingManagerId = !id;

  useEffect(() => {
    if (missingManagerId) {
      return;
    }

    api.get('/metrics/users')
      .then((response) => {
        const userScores = response.data;
        const scoresByTopic = {};
        const peopleScoresData = [];

        userScores.forEach((entry) => {
          let totalScore = 0;

          entry.topics.forEach((topic) => {
            totalScore += topic.score;

            if (!scoresByTopic[topic.topicId]) {
              scoresByTopic[topic.topicId] = [];
            }
            scoresByTopic[topic.topicId].push({
              userName: entry.userName,
              userLastName: entry.userLastName,
              score: topic.score,
            });
          });

          peopleScoresData.push({
            userId: entry.userId,
            userName: entry.userName,
            totalScore,
          });
        });

        setUserScoresByTopic(scoresByTopic);
        setPeopleScores(peopleScoresData);
      })
      .catch(() => {
        setError('Failed to get manager scores data');
      });

    api.get('/metrics/department')
      .then((response) => {
        const { categories: responseCategories, managerId: responseManagerId } = response.data;
        setCategories(responseCategories || []);
        setManagerId(responseManagerId);

        const extractedScores = new Array(22).fill(0);
        responseCategories.forEach((category) => {
          category.topics.forEach((topic) => {
            const topicIndex = topic.topic_id - 1;
            extractedScores[topicIndex] = topic.average_score;
          });
        });

        setScores(extractedScores);
      })
      .catch(() => {
        setError('Failed to get manager scores data');
      });
  }, [id, missingManagerId]);

  return (
    <section className="dep-metrics-page">
      <Helmet>
        <title>DepMetrics</title>
      </Helmet>

      <div className="dep-metrics-layout">
        <div className="dep-metrics-main">
          <h1 className="dep-metrics-title">Team Dashboard</h1>
          <p className="dep-metrics-subtitle">Department trends, topic averages, and team-level evaluation detail.</p>
          {managerId ? (
            <>
              <div className="dep-metrics-chart-card">
                <LineChart scores={scores} />
              </div>
              <div className="dep-metrics-chart-card">
                <BarChart categories={categories} />
              </div>
              <div className="dep-metrics-overview-card">
                <DepMetricsOverview categories={categories} userScoresByTopic={userScoresByTopic} />
              </div>
            </>
          ) : (
            <p>Loading...</p>
          )}
          {(missingManagerId || error) && <p className="text-danger">{error || 'Manager ID is not provided'}</p>}
        </div>
        <aside>
          <PageDepDashboard categories={categories} userScoresByTopic={peopleScores} />
        </aside>
      </div>
    </section>
  );
}

export default DepMetrics;
