import React from 'react';
import '../right-panel-style.css';
import { Link } from 'react-router-dom';

const categoryNameMap = {
    1: "Teamwork",
    2: "Code Aesthetics",
    3: "Communication",
    4: "Best Practices",
    5: "Knowledge Application and Problem Solving Comments"
};

// Function to truncate the category name to 15 characters
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

function CategoryOverview({ categoryId, totalScore }) {
    const categoryName = truncateName(categoryNameMap[categoryId] || `Category ${categoryId}`);

    return (
        <li className="topic-item">
            <span className="topic-name">{categoryName}</span>
            <span className="topic-score"> {totalScore}</span>
        </li>
    );
}

// Функция для случайного выбора 5 элементов из массива
function getRandomUsers(users, count = 5) {
    const shuffled = [...users].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

export default function PageDepDashboard({ categories = [], userScoresByTopic = [] }) {
    const userScoresArray = Array.isArray(userScoresByTopic) ? userScoresByTopic : Object.values(userScoresByTopic);

    // Получаем случайных 5 пользователей
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
