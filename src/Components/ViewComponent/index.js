import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './view-style.css';
import { Helmet } from 'react-helmet-async';
import return_icon from '../img/return-icon.svg';
// Используем `sections` для поиска текста по `score`
const sections = [
  {
    id: 1,
    title: "Teamwork",
    subSections: [
      {
        id: 1,
        title: "Collaboration",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Seeks to collaborate with immediate team members or select group of people (mentor, peer developer, another project resource). Reaches out when they get stuck on tasks" },
          { id: 3, text: "Seeks to collaborate with Small Team regardless of whether the developer shares project work with team members" },
          { id: 4, text: "Promotes team cooperation and seeks to collaborate with a larger group (committees, lead developer talk shops, small teams, other departments), and promotes decisions even if different than their own views" },
          { id: 5, text: "Identifies and reaches out to peers when they need help and is sought out by peers when they get stuck on tasks" }
        ],
        maxPoints: 4,
        comment: ""
      },
      {
        id: 2,
        title: "Conflict Resolution",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Identifies conflict and reports it to the appropriate party (timely)" },
          { id: 3, text: "Identifies conflict and reports it to the appropriate party via appropriate channels, is prepared to offer up relevant information" },
          { id: 4, text: "Identifies conflict and reports it to the appropriate party via appropriate channels. Is prepared to offer up relevant information. Suggests potential solutions" },
          { id: 5, text: "Directly and promptly addresses conflicts while keeping relevant stakeholders in the loop" }
        ],
        maxPoints: 4,
        comment: ""
      },
      {
        id: 3,
        title: "Task Management",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Completes tasks as assigned" },
          { id: 3, text: "Takes ownership of task completion.  Ensures task is resolved to stakeholder's satisfaction" },
          { id: 4, text: "Task efficiency and result exceeds stakeholder's expectations." },
          { id: 5, text: "Delegates tasks to team members" }
        ],
        maxPoints: 4,
        comment: ""
      },
      {
        id: 4,
        title: "Adapting to Change",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Tolerates change as directed" },
          { id: 3, text: "Greets change with a positive attitude" },
          { id: 4, text: "Anticipates change and takes steps to personally adapt" },
          { id: 5, text: "Assesses changes and takes steps to help others adapt as they occur" }
        ],
        maxPoints: 4,
        comment: ""
      },
      {
        id: 5,
        title: "Mentoring",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Remain open and accepting of mentorship from more established peers" },
          { id: 3, text: "Seeks out mentorship from peers" },
          { id: 4, text: "Supports new team members and helps them adjust to role expectations and team processes" },
          { id: 5, text: "Supports peers as a subject matter expert" }
        ],
        maxPoints: 4,
        comment: ""
      }
    ],
    sectionComment: ""
  },
  {
    id: 2,
    title: "Communication",
    subSections: [
      {
        id: 6,
        title: "Engagement",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Is attentive and focused when interacting with others.  Demonstates a positive and patient attitude.  Displays active listening skills" },
          { id: 3, text: "Contributes meaningful discussion when interacting with others" },
          { id: 4, text: "Uses follow up communications and actions when necessary to ensure decisions from interactions remain relevant" },
          { id: 5, text: "Leads and facilitates discussion.  Keeps topics focused and relevant" }
        ],
        maxPoints: 4,
        comment: ""
      },
      {
        id: 7,
        title: "Verbal Communication",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Communicates clearly to people with similar expertise" },
          { id: 3, text: "Chooses correct avenues for communication.  Communicates clearly to a diverse audience including people with whom he or she does not have personal relationship" },
          { id: 4, text: "Listens to and understands audience's viewpoint.  Gauges communication strategy to audience's strength and translates techinical concepts into terms he or she will understand when dealing with a non techinical audience" },
          { id: 5, text: "Conveys his or her expertise with conviction; however dev is not strident and remains open and accepting of other solutions from others, even when different from his or her own" }
        ],
        maxPoints: 4,
        comment: ""
      },
      {
        id: 8,
        title: "Written Communication",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Communicates clearly to people with similar expertise" },
          { id: 3, text: "Chooses correct avenues for communication. Consistently provides communication in a timely fashion.  Communicates clearly to people with a different level of techinical expertise" },
          { id: 4, text: "Listens to and understands audience's viewpoint.  Gauges communication strategy to audience's strength and translates techinical concepts into terms he or she will understand when dealing with a non techinical audience" },
          { id: 5, text: "Conveys his or her expertise with conviction; however dev is not strident and remains open and accepting of other solutions from others, even when different from his or her own" }
        ],
        maxPoints: 4,
        comment: ""
      },
      {
        id: 9,
        title: "Providing Feedback",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Provides general feedback that is not directly actionable" },
          { id: 3, text: "Provides specific actionable feedback through an intermediary" },
          { id: 4, text: "Directly provides quality actionable feedback" },
          { id: 5, text: "Is aware of context and provides feedback in a timely fashion.  Follows through to validate feedback was received." }
        ],
        maxPoints: 4,
        comment: ""
      },
      {
        id: 10,
        title: "Receiving Feedback",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Receptive to feedback regarding his or her work" },
          { id: 3, text: "Able to objectively incorporate feedback in his or her work" },
          { id: 4, text: "Understands and accepts the reasoning behind the feedback" },
          { id: 5, text: "Seeks out feedback from others" }
        ],
        maxPoints: 4,
        comment: ""
      }
    ],
    sectionComment: ""
  },
  {
    id: 3,
    title: "Knowledge Application and Problem Solving",
    subSections: [
      {
        id: 11,
        title: "Strategy and Critical Thinking Comments",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Has vision of the strategy for feature execution but is not privy to the overall project strategy" },
          { id: 3, text: "Has a vision with a solution but may not have considered all of the roadblocks that are likely to occur" },
          { id: 4, text: "Has a vision with a solution and has contigency plans for all of the roadblocks that are likely to occur" },
          { id: 5, text: "Compares multiple options for how their project works with the client's strategy.  Performs a cost benefit analysis, considers scalability of the project" }
        ],
        maxPoints: 4,
        comment: ""
      },
      {
        id: 12,
        title: "Debugging Techniques",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Uses basic debugging techniques with easily accessible tools.  Needs guidance to identify focused area of investigation" },
          { id: 3, text: "Uses tools during development to identify likely issues.  Identifies promising areas for focused investigation." },
          { id: 4, text: "Uses scientific method in existing codebase to identiy and solve issues.  Can articulate a hypothesis of the issue." },
          { id: 5, text: "Uses advanced debugging techiniques to analyze code during debugging.  Can create a reduced test case to identify issues.  Understands and uses tools to prevent new issues." }
        ],
        maxPoints: 4,
        comment: ""
      },
      {
        id: 13,
        title: "Tool Selection and Usage",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Uses basic tools for development aids.  Needs guidance for advanced tool usage.  Comfortable with basics in version control and issue tracking" },
          { id: 3, text: "Identifies third-party tools and libraries to aid in project work.  Comfortable with build tools and process" },
          { id: 4, text: "Configures tools in local development environment to streamline efficiency.  Capabale of owning integrations or deployment." },
          { id: 5, text: "Defines strategies surrounding integration, build processes, version control, and issue tracking for project team" }
        ],
        maxPoints: 4,
        comment: ""
      }
    ],
    sectionComment: ""
  },
  {
    id: 4,
    title: "Code Aesthetics",
    subSections: [
      {
        id: 14,
        title: "Documentation",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Occasionally uses comments to provide context for ambiguous code" },
          { id: 3, text: "Consistently uses comments to provide context for ambiguous code" },
          { id: 4, text: "Prepares documentation to assist in project setup and configuration" },
          { id: 5, text: "Uses documentation to define the contract between developers on a project.  Understands importance for documenting for various audiences" }
        ],
        maxPoints: 4,
        comment: ""
      },
      {
        id: 15,
        title: "Formatting Standards",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Occasionally follows the defined code formatting standards" },
          { id: 3, text: "Consistently follows the defined code formatting standards" },
          { id: 4, text: "Goes beyond the standard and uses code formatting to enhance readability and understanding" },
          { id: 5, text: "Can explain most code standards and identify minor deviations from memory without consulting documentation" }
        ],
        maxPoints: 4,
        comment: ""
      },
      {
        id: 16,
        title: "Naming",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Regularly defines readable variables and method names that are readable.  Avoids namespace collisions" },
          { id: 3, text: "Defines variable and method names that are readable and accurately describe the intended use or function" },
          { id: 4, text: "Selects names that simplify and strongly correspond to terms of art from the problem domain" },
          { id: 5, text: "Uses variables and method names to tell the story of an algorithm.  Names inform the units of work that the code is divided into so that a person readin the high level method can understand the intent of smaller portions without drilling into that method" }
        ],
        maxPoints: 4,
        comment: ""
      },
      {
        id: 17,
        title: "Syntax and Organization",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Creates code that is syntactically accurate and valid.  Occasionaly creates code following the platform's idiomatic conventions" },
          { id: 3, text: "Creates code following the platform's idiomatic conventions.  File strutcture is organized according to platform conventions" },
          { id: 4, text: "Understands when it is appropriate to make an exception to the conventions or validity and can explain why" },
          { id: 5, text: "Consistently creates code following the platform's idiomatic conventions and organizes project structure impeccably.  Can explain reasoning behind conventions" }
        ],
        maxPoints: 4,
        comment: ""
      }
    ],
    sectionComment: ""
  },
  {
    id: 5,
    title: "Best Practices",
    subSections: [
      {
        id: 18,
        title: "Testing",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Manually tests work. Tests work across targeted platforms during QA phase of project development" },
          { id: 3, text: "Tests work across targeted platforms at regular intervals during project development" },
          { id: 4, text: "Creates tests and benchmarks that validates handling of failure states in the project. Examples are scaffolding large data sets, running on low power machines, spoofing invalid responses from APIs." },
          { id: 5, text: "Developer has an efficient and optimized testing process for the project.  Developer accurately identifies issues that are out of scope and manages client expectations." }
        ],
        maxPoints: 4,
        comment: ""
      },
      {
        id: 19,
        title: "Refactoring/Readability",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Common code smells are present in the developers code (long methods, large classes, complex conditionals, too many parameters in a single method)" },
          { id: 3, text: "Is aware of code smells and can identify problem areas in their code but is unsure how to resolve them.  Knowledge of the formal name is unnecessary" },
          { id: 4, text: "Refactors code to remove common code smells on a regular basis" },
          { id: 5, text: "Refactors in such a way that the process adds semantic meaning. Assists other developers in identifying and resolving code smells in their projects" }
        ],
        maxPoints: 4,
        comment: ""
      },
      {
        id: 20,
        title: "Defensive Programming",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Logs errors but does not actively address them in code.  Selects a degree of specificity or visibility that guides other developers to the expected use for the component and defends against unexpected uses.  Does not trust input from users or external systems is safe." },
          { id: 3, text: "Handles all errors, presents relevant information to the user or attempts to gracefully recover.  Writes code with a strategy for managing invalid parameters." },
          { id: 4, text: 'Uses platform tools to communicate specific semantic information regarding error cases (custom exceptions or assertions) to guard against "impossible" scenarios during development and testing' },
          { id: 5, text: "Identifies and codifies strategies and practices that prevent common errors from recurring on a project" }
        ],
        maxPoints: 4,
        comment: ""
      },
      {
        id: 21,
        title: "Performance",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Creates code that is aware of the final environment and optimizes user experience with common practices" },
          { id: 3, text: "Consistently creates code following prescribed conventions for high performing interactions" },
          { id: 4, text: "Uses tools to identify areas of improvement in externally facing environments as well as internal interactions" },
          { id: 5, text: "Designs a codebase scalable to a high-traffic and high-uptime deployment" }
        ],
        maxPoints: 4,
        comment: ""
      },
      {
        id: 22,
        title: "Security",
        options: [
          { id: 1, text: "Does not meet expectations" },
          { id: 2, text: "Maintains good security hygiene in handling of credentials both his or her own and the client's.  Relies on teamates to ensure security standards in application development" },
          { id: 3, text: "Knows and implements discipline-specific security standards" },
          { id: 4, text: "Can identify common security issues by sight during code review in another's code.  Recognizes likely sources of fraud.  Validates vital business objectives have been acheieved using trusted sources or sets appropriate client expectations" },
          { id: 5, text: "Can articulate benefits of specific security practices to clients and work with client to understand and mitigate security concerns" }
        ],
        maxPoints: 4,
        comment: ""
      }
    ],
    sectionComment: ""
  }
];

const getCategoryTitleById = (categoryId) => {
  const section = sections.find(sec => sec.id === categoryId);
  return section ? section.title : `Unknown Category (ID: ${categoryId})`;
};

const getSubSectionTitle = (topicId) => {
  // Проходим по разделам и подразделам
  for (const section of sections) {
    const subSection = section.subSections.find(sub => sub.id === topicId);
    if (subSection) {
      return subSection.title;
    }
  }
  return `Unknown Topic (ID: ${topicId})`;
};

const getSubSectionOptions = (topicId) => {
  for (const section of sections) {
    const subSection = section.subSections.find(sub => sub.id === topicId);
    if (subSection) {
      return subSection.options;
    }
  }
  return [];
};

function ViewComponent() {

  const navigate = useNavigate();

  const { id } = useParams();  // Получаем ID формы из URL
  const [evaluationData, setEvaluationData] = useState(null);  // Данные формы
  const [loading, setLoading] = useState(true);  // Статус загрузки
  const [error, setError] = useState('');  // Статус ошибки
  const [person, setPerson] = useState('');
  const [manager, setManager] = useState('');

  useEffect(() => {
    // Запрос на получение данных формы
    axios.get(`http://localhost:5212/evaluate/user/${id}`)
      .then(response => {
        setEvaluationData(response.data);
        setLoading(false);
        const managerId = response.data.manager_id;
        if (managerId) {
          axios.get(`http://localhost:5212/users/${managerId}`)
            .then(response => {
              setManager(response.data);
            })
            .catch(error => {
              console.error("Failed to fetch manager data", error);
            });
        }
      })
    axios.get(`http://localhost:5212/users/${id}`)
      .then(response => {
        setPerson(response.data);
        setLoading(false);
      })
      .catch(error => {
        setError('Failed to fetch evaluation data');
        console.error(error);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!evaluationData) {
    return <div>No data found</div>;
  }



  return (
    <div className="evaluation-view">
      <Helmet>
        <title>Overview Evaluation</title>
      </Helmet>
      <h1>This is {person.firstname}'s rubrics</h1>
      <div>
        <button className="return-button btn btn-dark" onClick={() => navigate(-1)}>
          <img className="return-button-icon" src={return_icon} alt="Return" />Return
        </button>
      </div>
      <div className="card  mb-3" key={evaluationData.manager_id} style={{ maxWidth: '400px', margin: 'auto' }}>
        <div className="card-header border-bottom-0">
          <h5 className="card-title mb-0">Manager Information</h5>
        </div>
        <div className="card-body">
          <p className="mb-2">
            <strong>Name:</strong> {manager.firstname} {manager.lastname}
          </p>
          <p className="mb-0">
            <strong>Review date:</strong> {new Date(evaluationData.created).toLocaleDateString()}
          </p>
        </div>
      </div>

      {evaluationData.categoryComments && evaluationData.categoryComments.length > 0 ? (
        evaluationData.categoryComments.map(comment => (
          <div key={comment.id} >
            <h1 className='h1-evaluation-title'> {getCategoryTitleById(comment.category_id)}</h1>

            {evaluationData.evaluationOptions && evaluationData.evaluationOptions.length > 0 ? (
              evaluationData.evaluationOptions.filter(option => option.topic?.category_id === comment.category_id)
                .map(option => (
                  <div key={option.id} className="sub-section">
                    <h2 className="h2-evaluatoin-title">{getSubSectionTitle(option.topic.id)}</h2>

                    {/* Отображаем все опции */}
                    <div className="option-wrapper">
                      {getSubSectionOptions(option.topic.id).map(opt => (
                        <div
                          key={opt.id}
                          className={`wrapper-option ${opt.id === option.score ? 'choosen' : ''}`}
                        >
                          <p className="option">{opt.text}</p>
                        </div>
                      ))}
                    </div>

                    <p className='comment-review'><strong>Comment:</strong> {option.comment || 'No comment provided'}</p>
                  </div>
                ))
            ) : (
              <p>No Evaluation Options available.</p>
            )}
            <p className='cat-comment-review'><strong>Category comment:</strong> {comment.comment || 'No comment provided'}</p>
          </div>
        ))
      ) : (
        <p>No Category Comments available.</p>
      )}
    </div>
  );
}

export default ViewComponent;
