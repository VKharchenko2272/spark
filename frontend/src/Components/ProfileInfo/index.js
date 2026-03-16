import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import profile_icon from '../People/img/profile.png';
import { api, buildApiUrl } from '../../lib/api';

function ProfileInfo({ userId, altText }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [useFallbackImage, setUseFallbackImage] = useState(false);

  useEffect(() => {
    if (!userId) {
      return;
    }

    api.get(`/users/${userId}`)
      .then((response) => {
        setUser(response.data);
        setUseFallbackImage(false);
      })
      .catch(() => {
        setError('Failed to fetch user information');
      });
  }, [userId]);

  const imageSrc = !useFallbackImage && user?.img
    ? buildApiUrl(`/users/${userId}/image`)
    : profile_icon;

  return (
    <div>
      <img
        className="col-auto p-0 img-thumbnail"
        src={imageSrc}
        alt={altText || `${user?.firstname || ''} ${user?.lastname || ''}`.trim()}
        style={{ width: '100px', height: '100px', borderRadius: '50%' }}
        onError={() => setUseFallbackImage(true)}
      />
      {error && <p>{error}</p>}
      {user && !error && (
        <div>
          <p>{user.firstname} {user.lastname}</p>
          <p>Department: {user.department?.name || ''}</p>
        </div>
      )}
    </div>
  );
}

export default ProfileInfo;

ProfileInfo.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  altText: PropTypes.string,
};
