import React, { useState, useEffect } from 'react';
import { FaUser } from 'react-icons/fa';
import './deco/Profile.css';

const Profile = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false); // 프로필 편집 모드
  const [profilePicture, setProfilePicture] = useState(''); // 프로필 사진
  const [name, setName] = useState('');
  const [editName, setEditName] = useState('');
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('token');

        const response = await fetch('/profile/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('API 응답 데이터:', data);
          setName(data.name || 'no name'); // 사용자 이름 업데이트

          if (data.profileImage) {
            setProfilePicture(data.profileImage);
          } else {
            setProfilePicture('');
          }
        } else {
          const errorText = await response.text();
          console.error('프로필 데이터를 가져오는 데 실패했습니다:', errorText);
        }
      } catch (error) {
        console.error('서버 오류:', error);
      }
    };

    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem('token'); // JWT 토큰 가져오기

        const response = await fetch('/posts', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`, // 인증 헤더 추가
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Post 데이터를 가져오지 못했습니다.');
        }

        const data = await response.json();
        setPosts(data.posts); // Post 데이터를 상태에 저장
      } catch (error) {
        console.error('Post 가져오기 실패:', error.message);
        //alert('Post 데이터를 가져오는 중 문제가 발생했습니다.');
      }
    };

    fetchProfileData();
    fetchPosts();
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
      reader.readAsDataURL(file); // 파일을 URL 형식으로 변환

      // 서버로 전송
      const formData = new FormData();
      formData.append('profileImage', file);

      try {
        const token = localStorage.getItem('token'); // 토큰 가져오기
        const response = await fetch('/user/me/profile-picture', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`, // 인증 헤더 추가
          },
          body: formData, // FormData 전송
        });

        if (response.ok) {
          const data = await response.json();
          setProfilePicture(data.profileImage); // 서버에서 반환된 URL을 저장
          alert('프로필 사진이 성공적으로 업데이트되었습니다.');
          setIsPopupOpen(false);
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
      {/* 프로필 보기 */}
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
            <span>
              <strong>{posts.length}</strong> 게시물
            </span>
            <span>
              <strong>340</strong> 팔로워
            </span>
            <span>
              <strong>180</strong> 팔로잉
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
                <img
                  src={post.image}
                  alt="Post"
                  style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                />
              ) : (
                <p>{post.content}</p>
              )}
            </div>
          ))}
        </div>
      </div>

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
