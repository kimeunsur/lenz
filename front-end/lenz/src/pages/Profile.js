import React, { useState, useEffect } from 'react';
import { FaUser } from 'react-icons/fa';
import './deco/Profile.css';
import './Profile.css';
import { FiHeart } from 'react-icons/fi';
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
  const [selectedPost, setSelectedPost] = useState(null); // 선택한 게시물
  const [selectedPopupOpen, setSelectedPopupOpen] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
  
      try {
        const [profileResponse, postsResponse, followersResponse, followingResponse] = await Promise.all([
          fetch('/profile/me', { method: 'GET', headers }),
          fetch('/post/me', { method: 'GET', headers }),
          fetch('/user/me/followers', { method: 'GET', headers }),
          fetch('/user/me/following', { method: 'GET', headers }),
        ]);
  
        if (profileResponse.ok) {
          const data = await profileResponse.json();
          setName(data.name || 'no name');
          setProfilePicture(data.profileImage || '');
        }
  
        if (postsResponse.ok) {
          const postData = await postsResponse.json();
          setPosts(postData.posts || []);
        }
  
        if (followersResponse.ok) {
          const followersData = await followersResponse.json();
          setFollowers(followersData.followers || []);
          setFollowerCount(followersData.followers.length || 0);
        }
  
        if (followingResponse.ok) {
          const followingData = await followingResponse.json();
          setFollowing(followingData.following || []);
          setFollowingCount(followingData.following.length || 0);
        }
      } catch (error) {
        console.error('데이터 가져오기 실패:', error);
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

  // 사진 클릭 핸들러
  const handlePhotoClick = (post) => {
    setSelectedPost(post); // 선택한 게시물을 저장
    setSelectedPopupOpen(true); // 팝업 열기
  };

  // 팝업 닫기 핸들러
  const handleClosePopup = () => {
    setSelectedPost(null); // 선택된 게시물 초기화
    setSelectedPopupOpen(false); // 사진 팝업만 닫기
  };

  const handlePopupToggle = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const handleLikeToggle = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/post/${postId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (response.ok) {
        const updatedPosts = posts.map((post) =>
          post._id === postId
            ? {
                ...post,
                likes: post.likes.includes(token)
                  ? post.likes.filter((userId) => userId !== token)
                  : [...post.likes, token],
              }
            : post
        );
        setPosts(updatedPosts);
      } else {
        console.error('좋아요 실패:', await response.text());
        alert('좋아요 작업에 실패했습니다.');
      }
    } catch (error) {
      console.error('서버 오류:', error);
      alert('서버 오류가 발생했습니다.');
    }
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
            <div key={post._id} 
            onClick={() => handlePhotoClick(post)} // 사진 클릭 핸들러 연결
            className="post-placeholder">
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
              {followers.map((follower, index) => (
                <li key={index}>
                  <span>{follower.name || follower.email}</span>
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
              {following.map((follow, index) => (
                <li key={index}>
                  <span>{follow.name || follow.email}</span>
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

      {/* 팝업 창 */}
      {/* 사진 클릭 팝업 */}
      {selectedPopupOpen && selectedPost && (
  <div className="post-popup-overlay" onClick={handleClosePopup}>
    <div className="post-popup">
      {/* 이미지 표시 */}
      {selectedPost.image && (
        <img
          src={selectedPost.image}
          alt="Selected Post"
          className="post-popup-image"
        />
      )}
      <p>{selectedPost.content || '내용이 없습니다.'}</p>

      {/* 좋아요 버튼과 개수 */}
      <div className="post-likes">
        <FiHeart
          style={{
            color: selectedPost.likes?.includes(localStorage.getItem('token')) ? 'red' : 'gray',
            cursor: 'pointer',
          }}
          onClick={(e) => {
            e.stopPropagation(); // 부모 클릭 이벤트 방지
            handleLikeToggle(selectedPost._id);
          }}
        />
        <span>{selectedPost.likes?.length || 0}</span>
      </div>
      <button onClick={handleClosePopup}>닫기</button>
    </div>
  </div>
)}



    </div>
  );
};

export default Profile;
