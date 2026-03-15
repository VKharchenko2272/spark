import React, { useEffect, useState } from 'react';
import axios from 'axios';
import profile_icon from '../People/img/profile.png';

function HeaderInfo({ userId, altText }) {
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [department, setDepartment] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    axios.get(`http://localhost:5212/images/${userId}`, { responseType: 'blob' })
      .then(imageResponse => {
        const imageUrl = URL.createObjectURL(imageResponse.data);
        setProfileImageUrl(imageUrl);
      })
      .catch(error => {
        console.error('Error fetching profile image:', error);
        setProfileImageUrl(null);
      });

    axios.get(`http://localhost:5212/users/${userId}`)
      .then(response => {
        if (response.data) {
          const { firstname, lastname, department } = response.data;
          setFirstName(firstname);
          setLastName(lastname);
          setDepartment(department ? department.name : '');
        }
      })
      .catch(error => {
        setError('Failed to fetch user information');
        console.error(error);
      });
  }, [userId]);

  return (
    // <div className='col-auto row align-items-center m-0 ms-auto'></div>
    <>
      {!error && (
        <p className='col-auto m-0 p-0 ms-auto'>{firstName}</p>
      )}
      <img
      className='col-auto p-0 img-thumbnail'
        src={profileImageUrl || profile_icon}
        alt={altText || `${firstName} ${lastName}`}
        style={{ width: '75px', height: '75px', borderRadius: '50%' }}
      />
    </>
  );
}

export default HeaderInfo;
