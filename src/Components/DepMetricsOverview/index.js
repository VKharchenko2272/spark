import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

// Topic and Category Name Maps
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

// Link Topics to Categories
const categoryTopicMap = {
    1: [1, 2, 3, 4, 5], // Teamwork topics
    2: [6, 7, 8, 9, 10], // Communication topics
    3: [11, 12, 13], // Knowledge Application and Problem Solving topics
    4: [14, 15, 16, 17], // Code Aesthetics topics
    5: [18, 19, 20, 21, 22] // Best Practices topics
};

// Utility function to round score to nearest 0.5
const roundToHalf = (num) => {
    return Math.round(num * 2) / 2;
};

// Component to display individual topic scores
function TopicScore({ topicId, score, userScores }) {
    const topicName = topicNameMap[topicId] || `Topic ${topicId}`;
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const dropdownRef = useRef(null);
    const triggerRef = useRef(null); // Reference to the element triggering the dropdown

    // Toggle dropdown visibility
    const toggleDropdown = () => {
        setDropdownVisible((prev) => !prev);
    };

    // Close the dropdown when clicking outside
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target) && triggerRef.current !== event.target) {
            setDropdownVisible(false);
        }
    };

    // Close the dropdown when the mouse leaves
    const handleMouseLeave = () => {
        setDropdownVisible(false);
    };

    useEffect(() => {
        // Add event listener to handle click outside
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="dep-topic-row">
            <button
                ref={triggerRef} // Attach ref to the trigger element
                className="dep-topic-trigger"
                onClick={toggleDropdown}
                type="button"
            >
                {topicName}
            </button>
            <span className="dep-topic-score">{roundToHalf(score)}</span>

            {isDropdownVisible && (
                <div
                    ref={dropdownRef}
                    className="dep-topic-popover"
                    onMouseLeave={handleMouseLeave}
                >
                    <p className="dep-topic-popover-title">{topicName}</p>
                    {userScores.length > 0 ? (
                        userScores.map((userScore, index) => (
                            <div key={index} className="dep-topic-popover-item">
                                <span>{userScore.userName} {userScore.userLastName}</span>
                                <span className="dep-topic-popover-score">{roundToHalf(userScore.score)}</span>
                            </div>
                        ))
                    ) : (
                        <p className="dep-topic-popover-empty">No scores available</p>
                    )}
                </div>
            )}
        </div>
    );
}

TopicScore.propTypes = {
    topicId: PropTypes.number.isRequired,
    score: PropTypes.number.isRequired,
    userScores: PropTypes.arrayOf(
        PropTypes.shape({
            userName: PropTypes.string,
            userLastName: PropTypes.string,
            score: PropTypes.number.isRequired,
        })
    ).isRequired,
};

// Component to display a category and its topics
function CategoryOverview({ categoryId, topics = [], totalScore, userScoresByTopic }) {
    const categoryName = categoryNameMap[categoryId] || `Category ${categoryId}`;
    const categoryTopics = categoryTopicMap[categoryId] || [];

    return (
        <div className="dep-category-card">
            <div className="dep-category-header">
                <p className="dep-category-title">{categoryName}</p>
                <p className="dep-category-total">{roundToHalf(totalScore)}</p>
            </div>
            <div className='dep-topic-list'>
                {categoryTopics.map((topicId, index) => {
                    const topic = topics.find(t => t.topic_id === topicId);
                    const userScores = userScoresByTopic[topicId] || []; // Get user scores for this topic
                    if (topic) {
                        return <TopicScore key={index} topicId={topic.topic_id} score={topic.average_score} userScores={userScores} />;
                    }
                    return <TopicScore key={index} topicId={topicId} score={0} userScores={userScores} />; // Placeholder for missing topics
                })}
            </div>
        </div>
    );
}

CategoryOverview.propTypes = {
    categoryId: PropTypes.number.isRequired,
    topics: PropTypes.arrayOf(
        PropTypes.shape({
            topic_id: PropTypes.number.isRequired,
            average_score: PropTypes.number.isRequired,
        })
    ),
    totalScore: PropTypes.number.isRequired,
    userScoresByTopic: PropTypes.objectOf(
        PropTypes.arrayOf(
            PropTypes.shape({
                userName: PropTypes.string,
                userLastName: PropTypes.string,
                score: PropTypes.number.isRequired,
            })
        )
    ).isRequired,
};

// Main Overview component to render all categories
export default function DepMetricsOverview({ categories = [], userScoresByTopic = {} }) {
    return (
        <div className="dep-metrics-overview-grid">
            {categories.map(category => (
                <CategoryOverview
                    key={category.category_id} // Use category_id from API response
                    categoryId={category.category_id} // Pass category_id
                    topics={category.topics || []} // Pass topics array
                    totalScore={category.total_score || 0} // Pass total score
                    userScoresByTopic={userScoresByTopic} // Pass user scores by topic
                />
            ))}
        </div>
    );
}

DepMetricsOverview.propTypes = {
    categories: PropTypes.arrayOf(
        PropTypes.shape({
            category_id: PropTypes.number.isRequired,
            total_score: PropTypes.number,
            topics: PropTypes.arrayOf(
                PropTypes.shape({
                    topic_id: PropTypes.number.isRequired,
                    average_score: PropTypes.number.isRequired,
                })
            ),
        })
    ),
    userScoresByTopic: PropTypes.objectOf(
        PropTypes.arrayOf(
            PropTypes.shape({
                userName: PropTypes.string,
                userLastName: PropTypes.string,
                score: PropTypes.number.isRequired,
            })
        )
    ),
};
