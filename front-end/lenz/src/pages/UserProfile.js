import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './deco/UserProfile.css';


const UserProfile = () => {
  const { id } = useParams(); // URL에서 사용자 ID 추출
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ followerCount: 0, followingCount: 0 });
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState(null); // 팔로워/팔로잉 탭 관리
  const [followList, setFollowList] = useState([]); // 팔로워/팔로잉 목록
  const [loadingList, setLoadingList] = useState(false); // 목록 로딩 상태


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // 사용자 정보 가져오기
        const userResponse = await fetch(`/user/${id}`);
        if (!userResponse.ok) {
          throw new Error('사용자 정보를 가져오는 데 실패했습니다.');
        }
        const userData = await userResponse.json();
        setUser(userData);

        // 팔로우 통계 가져오기
        const statsResponse = await fetch(`/user/${id}/follow-stats`);
        if (!statsResponse.ok) {
          throw new Error('팔로우 통계를 가져오는 데 실패했습니다.');
        }
        const statsData = await statsResponse.json();
        setStats(statsData);

        // 게시물 가져오기
        const postsResponse = await fetch(`/user/${id}/posts`);
        if (!postsResponse.ok) {
          throw new Error('게시물을 가져오는 데 실패했습니다.');
        }
        const postsData = await postsResponse.json();
        setPosts(postsData);
      } catch (error) {
        console.error('데이터 로드 오류:', error);
      }
    };

    fetchUserData();
  }, [id]);

// 팔로워 및 팔로잉 목록 불러오기
const fetchFollowList = async (type) => {
  try {
    setLoadingList(true);
    const token = localStorage.getItem('token');
    const endpoint = type === 'followers' ? `/user/${id}/followers` : `/user/${id}/following`;
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`${type} 목록을 불러오는 데 실패했습니다.`);
    const data = await response.json();
    setFollowList(data[type]); // followers 또는 following
  } catch (error) {
    console.error('팔로우 목록 로드 오류:', error.message);
  } finally {
    setLoadingList(false);
  }
};

const handleTabChange = (type) => {
  setActiveTab(type);
  fetchFollowList(type);
};

  if (!user) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-picture">
          <img src={user.profileImage || '/default-profile.jpg'} alt={user.name} />
        </div>
        <div className="profile-info">
          <h1>{user.name}</h1>
          <p>{user.email}</p>
          <div className="stats">
          <span onClick={() => handleTabChange('followers')} style={{ cursor: 'pointer' }}>
              <strong>{stats.followerCount}</strong> 팔로워
            </span>
            <span onClick={() => handleTabChange('following')} style={{ cursor: 'pointer' }}>
              <strong>{stats.followingCount}</strong> 팔로잉
            </span>
            <span><strong>{posts.length}</strong> 게시물</span>
          </div>
        </div>
      </div>


      {/* 게시물 섹션 */}
      <div className="posts-section">
        {posts.length > 0 ? (
          <div className="posts-grid">
            {posts.map((post) => (
              <div key={post._id} className="post-item">
                {post.image ? (
                  <img src={post.image} alt="Post" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                ) : (
                  <p>{post.content}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>게시물이 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
