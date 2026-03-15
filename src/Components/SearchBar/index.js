// SearchBar.js
import React from 'react';
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
