import React from 'react';
import { Helmet } from 'react-helmet-async';
import EvalOverlook from '../EvaluationComponent';

function Eval() {
  return (
    <div className="evaluation-view">
      <Helmet>
        <title>Evaluation</title>
      </Helmet>
      <EvalOverlook />
    </div>
  );
}

export default Eval;
