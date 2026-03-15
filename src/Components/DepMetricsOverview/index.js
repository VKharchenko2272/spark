import React, { useState, useRef, useEffect } from 'react';

// Topic and Category Name Maps
const categoryNameMap = {
    1: "Teamwork",
    2: "Code Aesthetics",
    3: "Communication",
    4: "Best Practices",
    5: "Knowledge Application and Problem Solving Comments"
};

const topicNameMap = {
    1: "Collaboration",
    2: "Conflict Resolution",
    3: "Task Manager",
    4: "Adapting to Change",
    5: "Mentoring",
    6: "Documentation",
    7: "Formatting Standards",
    8: "Naming",
    9: "Syntax and Organization",
    10: "Engagement",
    11: "Verbal Communication",
    12: "Written Communication",
    13: "Providing Feedback",
    14: "Receiving Feedback",
    15: "Testing",
    16: "Refactoring/Readability",
    17: "Defensive Programming",
    18: "Performance",
    19: "Security",
    20: "Strategy and Critical Thinking Comments",
    21: "Debugging Techniques",
    22: "Tool Selection and Usage"
};

// Link Topics to Categories
const categoryTopicMap = {
    1: [1, 2, 3, 4, 5], // Teamwork topics
    2: [6, 7, 8, 9, 10], // Code Aesthetics topics
    3: [11, 12, 13], // Communication topics
    4: [14, 15, 16, 17], // Best Practices topics
    5: [18, 19, 20, 21, 22] // Knowledge Application and Problem Solving Comments topics
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
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

    // Toggle dropdown visibility
    const toggleDropdown = () => {
        setDropdownVisible((prev) => !prev);
        if (!isDropdownVisible && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
        }
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
        <div className="row">
            <p
                ref={triggerRef} // Attach ref to the trigger element
                className="col-auto text-secondary"
                onClick={toggleDropdown}
                style={{ cursor: 'pointer' }}
            >
                {topicName}
            </p>
            <p className="col text-end fw-bold">{roundToHalf(score)}</p> {/* Round the score */}

            {isDropdownVisible && (
                <div
                    ref={dropdownRef}
                    className="dropdown-menu show"
                    style={{
                        position: 'absolute',
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        zIndex: 1000,
                        width: 'auto',
                    }}
                    onMouseLeave={handleMouseLeave}
                >
                    {userScores.length > 0 ? (
                        userScores.map((userScore, index) => (
                            <div key={index} className="dropdown-item">
                                {userScore.userName} {userScore.userLastName}: {roundToHalf(userScore.score)} {/* Round user scores */}
                            </div>
                        ))
                    ) : (
                        <div className="dropdown-item">No scores available</div>
                    )}
                </div>
            )}
        </div>
    );
}

// Component to display a category and its topics
function CategoryOverview({ categoryId, topics = [], totalScore, userScoresByTopic }) {
    const categoryName = categoryNameMap[categoryId] || `Category ${categoryId}`;
    const categoryTopics = categoryTopicMap[categoryId] || [];

    return (
        <div className="col-6 flex-column justify-content-start text-start">
            <div className="row border-bottom">
                <p className="h5 col-auto pb-1">{categoryName}</p>
                <p className="h5 col text-end">{roundToHalf(totalScore)}</p> {/* Round total score */}
            </div>
            <div className='cat-score-wrapper'>
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

// Main Overview component to render all categories
export default function DepMetricsOverview({ categories = [], userScoresByTopic = {} }) {
    return (
        <div className="row gx-5 gy-3">
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
