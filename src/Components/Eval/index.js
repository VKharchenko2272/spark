import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet';
import { useParams } from "react-router-dom";
import EvalOverlook from '../EvaluationComponent';

function Eval() {

    const [categories, setCategories] = useState([]);
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);  // Loading state for data fetching
    // Fetch user data
    useEffect(() => {
        if (!id) {
            setError('User ID is not provided in the URL');
            setLoading(false);
            return;
        }

        const fetchUserData = async () => {
            try {
                const response = await axios.get(`http://localhost:5212/eval/${id}`);
                setUser(response.data);
            } catch (error) {
                console.log('Current User ID:', id);
                setError('Failed to get user data');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [id]);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('http://localhost:5212/categories');
                setCategories(response.data);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
                setError('Failed to fetch categories');
            }
        };

        fetchCategories();
    }, []);

    if (loading) {
        return <p>Loading...</p>;  // Display loading state
    }

    if (error) {
        return <p>{error}</p>;  // Display error message if there's an error
    }

    return (
        <div className="evaluation-view">
            <Helmet>
                <title>Evaluation</title>
            </Helmet>
            {/* Render CategoryComponent only if categories are available */}
            {categories.length > 0 ? (
                // <CategoryComponent categories={categories} />
                <EvalOverlook categories={categories} />
            ) : (
                <p>No categories available.</p>
            )}
        </div>
    );
}

export default Eval;