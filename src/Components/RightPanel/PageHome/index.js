import { Link } from 'react-router-dom';
import React from 'react';

import '../right-panel-style.css';

function PageHome({ user, userId, isEvaluationExists, isLoading }) {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const isManager = localStorage.getItem('isManager') === 'true'
    const managerId = localStorage.getItem('userId');


    console.log("userId", { managerId })
    const isTheSamePerson = userId === managerId;
    console.log("admin?", isAdmin);
    return (
        <div className='col-auto right-panel-width'>
            <div className="row flex-column gy-3 right-panel-view-evaluation-button">
                {isAdmin && (
                    <Link to={`/EditUser/${userId}`} className='col-12 py-1 btn btn-dark'>
                        Edit User
                    </Link>
                )}

                {isLoading ? ( // Пока загружается, показываем неактивную кнопку
                    <button className='col-12 py-1 btn btn-dark' disabled>
                        Loading...
                    </button>
                ) : (
                    isEvaluationExists && (
                        <Link to={`/View/${userId}`} className='col-12 py-1 btn btn-dark'>
                            View evaluation
                        </Link>
                    )
                )}
                {!isEvaluationExists && (isAdmin || isManager) && !isTheSamePerson && ( // Conditionally render the Evaluation button
                    <Link to={`/Eval/${userId}`} className='col-12 py-1 btn btn-dark'>
                        Evaluation
                    </Link>
                )}
            </div>
        </div>
    );
}

export default PageHome;