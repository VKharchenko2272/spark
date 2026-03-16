import React from 'react';
import PropTypes from 'prop-types';
import '../right-panel-style.css';
import { Link } from 'react-router-dom';

const categoryNameMap = {
    1: "Teamwork",
    2: "Communication",
    3: "Knowledge Application and Problem Solving",
    4: "Code Aesthetics",
    5: "Best Practices"
};

const truncateName = (name, length = 15) => {
    return name.length > length ? name.substring(0, length) + '...' : name;
};

function PeopleOverview({ firstname, totalScore }) {
    return (
        <li className="topic-item">
            <span className="topic-name">{firstname}</span>
            <span className="topic-score"> {totalScore}</span>
        </li>
    );
}

PeopleOverview.propTypes = {
    firstname: PropTypes.string.isRequired,
    totalScore: PropTypes.number.isRequired,
};

function CategoryOverview({ categoryId, totalScore }) {
    const categoryName = truncateName(categoryNameMap[categoryId] || `Category ${categoryId}`);

    return (
        <li className="topic-item">
            <span className="topic-name">{categoryName}</span>
            <span className="topic-score"> {totalScore}</span>
        </li>
    );
}

CategoryOverview.propTypes = {
    categoryId: PropTypes.number.isRequired,
    totalScore: PropTypes.number.isRequired,
};

function getRandomUsers(users, count = 5) {
    const shuffled = [...users].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

export default function PageDepDashboard({ categories = [], userScoresByTopic = [] }) {
    const userScoresArray = Array.isArray(userScoresByTopic) ? userScoresByTopic : Object.values(userScoresByTopic);

    const randomUsers = getRandomUsers(userScoresArray, 5);

    return (

        <div className="page-dep-dashboard">
            <h6 className="category-title title-block-item">People:</h6>
            <ul className="topic-list">
                {randomUsers.map((person, index) => (
                    <PeopleOverview
                        key={index}
                        firstname={person.userName}
                        totalScore={person.totalScore || 0}
                    />
                ))}
                <Link to="/People" className='btn btn-dark people-more-btn'>
                    Open more
                </Link>
            </ul>
            <h6 className="category-title category-block-score title-block-item">Topic scores:</h6>
            <ul className="topic-list">
                {categories.map(category => (
                    <CategoryOverview
                        key={category.category_id}
                        categoryId={category.category_id}
                        totalScore={category.total_score || 0}
                    />
                ))}
            </ul>

        </div>
    );
}

PageDepDashboard.propTypes = {
    categories: PropTypes.arrayOf(
        PropTypes.shape({
            category_id: PropTypes.number.isRequired,
            total_score: PropTypes.number,
        })
    ),
    userScoresByTopic: PropTypes.oneOfType([
        PropTypes.arrayOf(
            PropTypes.shape({
                userName: PropTypes.string.isRequired,
                totalScore: PropTypes.number,
            })
        ),
        PropTypes.objectOf(
            PropTypes.shape({
                userName: PropTypes.string,
                totalScore: PropTypes.number,
            })
        ),
    ]),
};
