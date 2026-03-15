import React, { useEffect, useState } from 'react';
import axios from 'axios';
import profile_icon from '../People/img/profile.png';

function ProfileInfo({ userId, altText }) {
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [department, setDepartment] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    // Fetch profile image
    axios.get(`http://localhost:5212/images/${userId}`, { responseType: 'blob' })
      .then(imageResponse => {
        const imageUrl = URL.createObjectURL(imageResponse.data);
        setProfileImageUrl(imageUrl);
      })
      .catch(error => {
        console.error('Error fetching profile image:', error);
        setProfileImageUrl(null); // Fall back to null if there's an error
      });

    // Fetch user details
    axios.get(`http://localhost:5212/users/${userId}`)
      .then(response => {
        if (response.data) {
          const { firstname, lastname, department } = response.data;
          setFirstName(firstname);
          setLastName(lastname);
          setDepartment(department ? department.name : ''); // Assuming department has a `name` field
        }
      })
      .catch(error => {
        setError('Failed to fetch user information');
        console.error(error);
      });
  }, [userId]);

  return (
    <div>
      <img  className='col-auto p-0 img-thumbnail'
        src={profileImageUrl || profile_icon} // Use fetched image or fallback
        style={{ width: '100px', height: '100px', borderRadius: '50%' }}
      />
      {error && <p>{error}</p>}
      {!error && (
        <div>
          <p>{firstName} {lastName}</p>
          <p>Department: {department}</p>
        </div>
      )}
    </div>
  );
}

export default ProfileInfo;
