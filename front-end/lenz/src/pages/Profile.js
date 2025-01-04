import React, { useState, useEffect } from 'react';
import {FaUser} from 'react-icons/fa';

import './deco/Profile.css';

const Profile = () => {
    const [isPopupOpen, setIsPopupOpen] = useState(false); // 프로필 편집 모드
    const [profilePicture, setprofilePicture] = useState(''); // 프로필 사진
    const [name, setName] = useState('');


    useEffect(() => {
      const fetchProfileData = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            console.error('토큰이 없습니다.');
            return;
          }
    
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
            setName(data.name || "no name"); // 사용자 이름 업데이트
          } else {
            const errorText = await response.text();
            console.error('프로필 데이터를 가져오는 데 실패했습니다:', errorText);
          }
        } catch (error) {
          console.error('서버 오류:', error);
        }
      };
    
      fetchProfileData();
    }, []);
    


    const handlePictureChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setprofilePicture(e.target.result);
                setIsPopupOpen(false);
            };
            reader.readAsDataURL(file); // 파일을 url 형식으로 변환
        }
    }

    const handlePopupToggle = () => {
        setIsPopupOpen(!isPopupOpen);
    }

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
                  <strong>12</strong> 게시물
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
          <div className="posts-section">
            <div className="posts-grid">
              {/* 게시물 미리보기 */}
              {[...Array(6)].map((_, index) => (
                <div key={index} className="post-placeholder"></div>
              ))}
            </div>
          </div>
        


          {/* 프로필 편집 모달 */}
          {isPopupOpen && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2>프로필 사진 변경</h2>
                <input type="file" accept="image/*" onChange={handlePictureChange} />
                <button onClick={handlePopupToggle}>닫기</button>
              </div>
            </div>
          )}
        </div>
      );
};

export default Profile;
