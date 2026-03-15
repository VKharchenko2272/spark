import React from 'react';
import './modal.css';


function ConfirmationModal({ isOpen, onConfirm, onCancel, message }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Confirm Deletion</h2>
                <p>{message}</p>
                <div className="modal-actions">
                    <button className="confirm-button" onClick={onConfirm}>Confirm</button>
                    <button className="cancel-button" onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationModal;