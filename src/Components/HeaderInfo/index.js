import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import profile_icon from '../People/img/profile.png';
import { buildApiUrl } from '../../lib/api';

function HeaderInfo({ user, altText }) {
  const [useFallbackImage, setUseFallbackImage] = useState(false);

  const fullName = useMemo(() => `${user?.firstname || ''} ${user?.lastname || ''}`.trim(), [user?.firstname, user?.lastname]);
  const imageSrc = !useFallbackImage && user?.img ? buildApiUrl(`/users/${user.id}/image`) : profile_icon;

  if (!user) {
    return null;
  }

  return (
    <div className="header-info">
      <p className="name-block">{fullName || user.username}</p>
      <img
        className="img-thumbnail"
        src={imageSrc}
        alt={altText || fullName || user.username}
        style={{ width: '52px', height: '52px', borderRadius: '50%' }}
        onError={() => setUseFallbackImage(true)}
      />
    </div>
  );
}

export default HeaderInfo;

HeaderInfo.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    firstname: PropTypes.string,
    lastname: PropTypes.string,
    username: PropTypes.string.isRequired,
    img: PropTypes.string,
  }),
  altText: PropTypes.string,
};
