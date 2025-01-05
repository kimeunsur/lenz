import React, { useState, useEffect } from 'react';
import { FaUser } from 'react-icons/fa';
import './deco/Profile.css';
import FollowingName from '../components/FollowingName'; // 이름 표시용 컴포넌트
import './Profile.css';
const Profile = () => {
    const [profilePicture, setProfilePicture] = useState('');
    const [name, setName] = useState('');
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [postCount, setPostCount] = useState(0);
    const [followers, setFollowers] = useState([]); // 팔로워 목록
    const [following, setFollowing] = useState([]); // 팔로잉 목록
    const [showFollowers, setShowFollowers] = useState(false); // 팔로워 팝업 상태
    const [showFollowing, setShowFollowing] = useState(false); // 팔로잉 팝업 상태

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const token = localStorage.getItem('token');

                // 프로필 데이터 가져오기
                const response = await fetch('/profile/me', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setName(data.name || 'no name');
                    setProfilePicture(data.profileImage || '');
                } else {
                    console.error('프로필 데이터를 가져오는 데 실패했습니다:', await response.text());
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
                    setFollowerCount(followersData.followers.length);
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
                    setFollowingCount(followingData.following.length);
                }
            } catch (error) {
                console.error('서버 오류:', error);
            }
        };

        fetchProfileData();
    }, []);

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
                            <strong>{postCount}</strong> 게시물
                        </span>
                    </div>
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
                                    <FollowingName userId={id} />
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
                                    <FollowingName userId={id} />
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => setShowFollowing(false)}>닫기</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;