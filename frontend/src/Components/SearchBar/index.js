import React from 'react';
import PropTypes from 'prop-types';
import './search-style.css';
function SearchBar({ searchQuery, setSearchQuery }) {
    const handleInputChange = (event) => {
        setSearchQuery(event.target.value);
    };

    return (
        <div className="search-container">
            <input className='search-bar'
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={handleInputChange}
            />
        </div>
    );
}

export default SearchBar;

SearchBar.propTypes = {
    searchQuery: PropTypes.string.isRequired,
    setSearchQuery: PropTypes.func.isRequired,
};
