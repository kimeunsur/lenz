import React, { useState, useEffect } from 'react';
import { FaUser } from 'react-icons/fa';
import './deco/Profile.css';

const Profile = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false); // 프로필 편집 모드
  const [profilePicture, setProfilePicture] = useState(''); // 프로필 사진
  const [name, setName] = useState('');
  const [editName, setEditName] = useState('');
  const [posts, setPosts] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followers, setFollowers] = useState([]); // 팔로워 목록
  const [following, setFollowing] = useState([]); // 팔로잉 목록
  const [showFollowers, setShowFollowers] = useState(false); // 팔로워 팝업 상태
  const [showFollowing, setShowFollowing] = useState(false); // 팔로잉 팝업 상태

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('token');

        // 프로필 데이터 가져오기
        const profileResponse = await fetch('/profile/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (profileResponse.ok) {
          const data = await profileResponse.json();
          setName(data.name || 'no name');
          setProfilePicture(data.profileImage || '');
        } else {
          console.error('프로필 데이터를 가져오는 데 실패했습니다:', await profileResponse.text());
        }

        // 게시물 데이터 가져오기
        const postsResponse = await fetch('/posts', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (postsResponse.ok) {
          const postData = await postsResponse.json();
          setPosts(postData.posts || []);
        } else {
          console.error('Post 데이터를 가져오는 데 실패했습니다:', await postsResponse.text());
        }

        // 팔로워 데이터 가져오기
        const followersResponse = await fetch('/user/me/followers', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (followersResponse.ok) {
          const followersData = await followersResponse.json();
          setFollowers(followersData.followers || []);
          setFollowerCount(followersData.followers.length || 0);
        }

        // 팔로잉 데이터 가져오기
        const followingResponse = await fetch('/user/me/following', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (followingResponse.ok) {
          const followingData = await followingResponse.json();
          setFollowing(followingData.following || []);
          setFollowingCount(followingData.following.length || 0);
        }
      } catch (error) {
        console.error('서버 오류:', error);
      }
    };

    fetchProfileData();
  }, []);

  const handlePictureChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // 사진 미리보기
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicture(e.target.result);
        setIsPopupOpen(false);
      };
      reader.readAsDataURL(file);

      // 서버로 전송
      const formData = new FormData();
      formData.append('profileImage', file);

      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/user/me/profile-picture', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setProfilePicture(data.profileImage);
          alert('프로필 사진이 성공적으로 업데이트되었습니다.');
        } else {
          console.error('프로필 사진 업로드 실패:', await response.text());
          alert('프로필 사진 업로드에 실패했습니다.');
        }
      } catch (error) {
        console.error('서버 오류:', error);
        alert('서버 오류가 발생했습니다.');
      }
    }
  };

  const handleUpdateName = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/user/me/name', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName }),
      });

      if (response.ok) {
        const data = await response.json();
        setName(data.name);
        alert('이름이 성공적으로 변경되었습니다.');
        setIsPopupOpen(false);
      } else if (response.status === 409) {
        alert('중복된 이름입니다. 다른 이름을 사용하세요.');
      } else {
        console.error('이름 변경 실패:', await response.text());
        alert('이름 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('서버 오류:', error);
      alert('서버 오류가 발생했습니다.');
    }
  };

  const handlePopupToggle = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-picture">
          {profilePicture ? (
            <img src={profilePicture} alt="Profile" />
          ) : (
            <div className="default-icon">
              <FaUser />
            </div>
          )}
        </div>
        <div className="profile-info">
          <h1>{name}</h1>
          <div className="stats">
            <span onClick={() => setShowFollowers(true)} style={{ cursor: 'pointer' }}>
              <strong>{followerCount}</strong> 팔로워
            </span>
            <span onClick={() => setShowFollowing(true)} style={{ cursor: 'pointer' }}>
              <strong>{followingCount}</strong> 팔로잉
            </span>
            <span>
              <strong>{posts.length}</strong> 게시물
            </span>
          </div>
          <button onClick={handlePopupToggle}>프로필 편집</button>
        </div>
      </div>

      {/* 게시물 섹션 */}
      <div className="posts-section">
        <div className="posts-grid">
          {posts.map((post) => (
            <div key={post._id} className="post-placeholder">
              {post.image ? (
                <img src={post.image} alt="Post" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
              ) : (
                <p>{post.content}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 팔로워 팝업 */}
      {showFollowers && (
        <div>
          <div className="overlay" onClick={() => setShowFollowers(false)}></div>
          <div className="popup">
            <h2>팔로워</h2>
            <ul>
              {followers.map((id, index) => (
                <li key={index}>
                  <span>{id}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => setShowFollowers(false)}>닫기</button>
          </div>
        </div>
      )}

      {/* 팔로잉 팝업 */}
      {showFollowing && (
        <div>
          <div className="overlay" onClick={() => setShowFollowing(false)}></div>
          <div className="popup">
            <h2>팔로잉</h2>
            <ul>
              {following.map((id, index) => (
                <li key={index}>
                  <span>{id}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => setShowFollowing(false)}>닫기</button>
          </div>
        </div>
      )}

      {/* 프로필 편집 모달 */}
      {isPopupOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>프로필 사진 변경</h3>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="fileUpload"
                className="hidden-file-input"
                accept="image/*"
                onChange={handlePictureChange}
              />
              <label htmlFor="fileUpload" className="custom-file-label">
                사진 찾기
              </label>
            </div>
            <h3>프로필 이름 변경</h3>
            <input
              type="text"
              className="underline-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <label onClick={handleUpdateName} className="custom-name-label">
              이름 변경
            </label>
            <button onClick={handlePopupToggle}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
