import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from "react-router-dom";
import PageHome from '../RightPanel/PageHome';
import Overview from '../Overview';
import LineChart from '../Charts/LineChart';
import BarChart from '../Charts/BarChart';
import ProfileInfo from '../ProfileInfo';
import NoData from '../img/no-data.svg';
import './Home.css';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../lib/api';

function Home() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [scores, setScores] = useState(new Array(22).fill(0));
  const [isEvaluationExists, setIsEvaluationExists] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = currentUser?.id?.toString();
  const isTheSamePerson = id === currentUserId;
  const missingUserId = !id;

  useEffect(() => {
    if (missingUserId) {
      return;
    }

    api.get(`/evaluations/users/${id}`)
      .then((response) => {
        if (response.data) {
          setIsEvaluationExists(true);
        }
      })
      .catch((requestError) => {
        setError(requestError?.response?.data?.message || 'Failed to check evaluation status');
      })
      .finally(() => {
        setIsLoading(false);
      });

    api.get(`/ratings/users/${id}`)
      .then((response) => {
        const { categories: ratingCategories, user_id, created } = response.data;
        setCategories(ratingCategories || []);
        setUser({ user_id, created });

        const extractedScores = new Array(22).fill(0);
        ratingCategories.forEach((category) => {
          category.topics.forEach((topic) => {
            const topicIndex = topic.id - 1;
            extractedScores[topicIndex] = topic.score;
          });
        });
        setScores(extractedScores);
      })
      .catch((requestError) => {
        setError(requestError?.response?.data?.message || 'Failed to get evaluation data');
      });
  }, [id, missingUserId]);

  return (
    <>
      <Helmet>
        <title>{isTheSamePerson ? 'Home' : 'Employee Dashboard'}</title>
      </Helmet>
      <div className="home-page">
        <div className="row">
          <div className="home-main">
            <h1>Dashboard</h1>
            {!isTheSamePerson && <ProfileInfo userId={id} />}
            {user ? (
              <>
                <p>Evaluation created on: {new Date(user.created).toLocaleDateString()}</p>
                <LineChart scores={scores} />
                <BarChart categories={categories} />
                <Overview categories={categories} />
              </>
            ) : (
              <div className="no-data">
                <p>{error || (missingUserId ? 'User ID is not provided in the URL' : 'Data is not available right now')}</p>
                <div className="data">
                  <img src={NoData} alt="No data available illustration" />
                </div>
              </div>
            )}
          </div>
          <div className="home-side-panel custom-margin">
            <PageHome userId={id} isEvaluationExists={isEvaluationExists} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
