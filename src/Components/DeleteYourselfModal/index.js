import React from "react";
import '../ConfirmationModal/modal.css'


function DeleteYourself({ isOpen, onCancel, message }) {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Error!</h2>
                <p>{message}</p>
                <div className="modal-actions-self-delete">
                    <button className="close-button" onClick={onCancel}>Close</button>
                </div>
            </div>
        </div>
    );

}

export default DeleteYourself;