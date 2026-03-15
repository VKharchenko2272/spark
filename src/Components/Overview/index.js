import React from 'react';

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

// Component to display individual topic scores
function TopicScore({ topicId, score }) {
    const topicName = topicNameMap[topicId] || `Topic ${topicId}`;
    return (
        <div className="row">
            <p className="col-auto text-secondary">{topicName}</p>
            <p className="col text-end fw-bold">{score}</p>
        </div>
    );
}

// Component to display a category and its topics
function CategoryOverview({ categoryId, topics = [], totalScore }) {
    const categoryName = categoryNameMap[categoryId] || `Category ${categoryId}`;
    const categoryTopics = categoryTopicMap[categoryId] || [];

    return (
        <div className="col-6 flex-column justify-content-start text-start">
            <div className="row border-bottom">
                <p className="h5 col-auto pb-1">{categoryName}</p>
                <p className="h5 col text-end">{totalScore}</p> {/* Display total score */}
            </div>
            <div>
                {categoryTopics.map((topicId, index) => {
                    const topic = topics.find(t => t.id === topicId);
                    if (topic) {
                        return <TopicScore key={index} topicId={topic.id} score={topic.score} />;
                    }
                    return <TopicScore key={index} topicId={topicId} score={0} />; // Placeholder for missing topics
                })}
            </div>
        </div>
    );
}


// Main Overview component to render all categories
export default function Overview({ categories = [] }) {
    return (
        <div className="row gx-5 gy-3">
            {categories.map(category => (
                <CategoryOverview
                    key={category.category_id} // Use category_id from the API response
                    categoryId={category.category_id} // Pass category_id correctly
                    topics={category.topics || []} // Pass topics array correctly
                    totalScore={category.total_score || 0} // Pass the total_score correctly
                />
            ))}
        </div>
    );
}
