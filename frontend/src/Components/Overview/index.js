import React from 'react';
import PropTypes from 'prop-types';

const categoryNameMap = {
    1: "Teamwork",
    2: "Communication",
    3: "Knowledge Application and Problem Solving",
    4: "Code Aesthetics",
    5: "Best Practices"
};

const topicNameMap = {
    1: "Collaboration",
    2: "Conflict Resolution",
    3: "Task Management",
    4: "Adapting to Change",
    5: "Mentoring",
    6: "Engagement",
    7: "Verbal Communication",
    8: "Written Communication",
    9: "Providing Feedback",
    10: "Receiving Feedback",
    11: "Strategy and Critical Thinking Comments",
    12: "Debugging Techniques",
    13: "Tool Selection and Usage",
    14: "Documentation",
    15: "Formatting Standards",
    16: "Naming",
    17: "Syntax and Organization",
    18: "Testing",
    19: "Refactoring/Readability",
    20: "Defensive Programming",
    21: "Performance",
    22: "Security"
};

const categoryTopicMap = {
    1: [1, 2, 3, 4, 5],
    2: [6, 7, 8, 9, 10],
    3: [11, 12, 13],
    4: [14, 15, 16, 17],
    5: [18, 19, 20, 21, 22]
};

function TopicScore({ topicId, score }) {
    const topicName = topicNameMap[topicId] || `Topic ${topicId}`;
    return (
        <div className="row">
            <p className="col-auto text-secondary">{topicName}</p>
            <p className="col text-end fw-bold">{score}</p>
        </div>
    );
}

TopicScore.propTypes = {
    topicId: PropTypes.number.isRequired,
    score: PropTypes.number.isRequired,
};

function CategoryOverview({ categoryId, topics = [], totalScore }) {
    const categoryName = categoryNameMap[categoryId] || `Category ${categoryId}`;
    const categoryTopics = categoryTopicMap[categoryId] || [];

    return (
        <div className="col-6 flex-column justify-content-start text-start">
            <div className="row border-bottom">
                <p className="h5 col-auto pb-1">{categoryName}</p>
                <p className="h5 col text-end">{totalScore}</p>
            </div>
            <div>
                {categoryTopics.map((topicId, index) => {
                    const topic = topics.find(t => t.id === topicId);
                    if (topic) {
                        return <TopicScore key={index} topicId={topic.id} score={topic.score} />;
                    }
                    return <TopicScore key={index} topicId={topicId} score={0} />;
                })}
            </div>
        </div>
    );
}

CategoryOverview.propTypes = {
    categoryId: PropTypes.number.isRequired,
    topics: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            score: PropTypes.number.isRequired,
        })
    ),
    totalScore: PropTypes.number.isRequired,
};


export default function Overview({ categories = [] }) {
    return (
        <div className="row gx-5 gy-3">
            {categories.map(category => (
                <CategoryOverview
                    key={category.category_id}
                    categoryId={category.category_id}
                    topics={category.topics || []}
                    totalScore={category.total_score || 0}
                />
            ))}
        </div>
    );
}

Overview.propTypes = {
    categories: PropTypes.arrayOf(
        PropTypes.shape({
            category_id: PropTypes.number.isRequired,
            total_score: PropTypes.number,
            topics: PropTypes.arrayOf(
                PropTypes.shape({
                    id: PropTypes.number.isRequired,
                    score: PropTypes.number.isRequired,
                })
            ),
        })
    ),
};
