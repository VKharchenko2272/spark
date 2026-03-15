import React from "react";
import '../ConfirmationModal/modal.css'

function SelfEvaluation({ message, onClose }) {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{message}</h2>
                <div className="modal-self-evaluation">
                    <button className="return-button" onClick={onClose} >Return to previous page</button>
                </div>
            </div>
        </div>
    )
}

export default SelfEvaluation;

