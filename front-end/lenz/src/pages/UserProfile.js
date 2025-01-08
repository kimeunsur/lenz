import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiHeart } from 'react-icons/fi'; // 하트 아이콘 추가
import './deco/UserProfile.css';

const UserProfile = () => {
  const { id } = useParams(); // URL에서 사용자 ID 추출
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ followerCount: 0, followingCount: 0 });
  const [posts, setPosts] = useState([]);
  const [likes, setLikes] = useState({}); // 좋아요 상태 관리
  const [selectedPost, setSelectedPost] = useState(null); // 선택된 게시물
  const [isPopupOpen, setIsPopupOpen] = useState(false); // 팝업 상태

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await fetch(`/user/${id}`);
        if (!userResponse.ok) throw new Error('사용자 정보를 가져오는 데 실패했습니다.');
        const userData = await userResponse.json();
        setUser(userData);

        const statsResponse = await fetch(`/user/${id}/follow-stats`);
        if (!statsResponse.ok) throw new Error('팔로우 통계를 가져오는 데 실패했습니다.');
        const statsData = await statsResponse.json();
        setStats(statsData);

        const postsResponse = await fetch(`/user/${id}/posts`);
        if (!postsResponse.ok) throw new Error('게시물을 가져오는 데 실패했습니다.');
        const postsData = await postsResponse.json();

        setPosts(postsData);

        // 초기 좋아요 상태 설정
        const initialLikes = {};
        postsData.forEach((post) => {
          initialLikes[post._id] = post.likes.includes(localStorage.getItem('userId'));
        });
        setLikes(initialLikes);
      } catch (error) {
        console.error('데이터 로드 오류:', error.message);
      }
    };

    fetchUserData();
  }, [id]);

  const toggleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/post/${postId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) throw new Error('좋아요 요청에 실패했습니다.');
  
      const userId = localStorage.getItem('userId'); // 현재 사용자 ID
  
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                likes: post.likes.includes(userId)
                  ? post.likes.filter((id) => id !== userId) // 좋아요 취소
                  : [...post.likes, userId], // 좋아요 추가
              }
            : post
        )
      );
  
      // 팝업에서 선택된 게시물의 좋아요 상태도 업데이트
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost((prevPost) => ({
          ...prevPost,
          likes: prevPost.likes.includes(userId)
            ? prevPost.likes.filter((id) => id !== userId)
            : [...prevPost.likes, userId],
        }));
      }
  
      setLikes((prevLikes) => ({
        ...prevLikes,
        [postId]: !prevLikes[postId],
      }));
    } catch (error) {
      console.error('좋아요 토글 오류:', error.message);
    }
  };

  const handlePostClick = (post) => {
    setSelectedPost(post); // 선택한 게시물 저장
    setIsPopupOpen(true);  // 팝업 열기
  };

  const handleClosePopup = () => {
    setSelectedPost(null); // 선택된 게시물 초기화
    setIsPopupOpen(false); // 팝업 닫기
  };

  if (!user) return <div>로딩 중...</div>;

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
            <span><strong>{stats.followerCount}</strong> 팔로워</span>
            <span><strong>{stats.followingCount}</strong> 팔로잉</span>
            <span><strong>{posts.length}</strong> 게시물</span>
          </div>
        </div>
      </div>

      {/* 게시물 섹션 */}
      <div className="posts-section">
        {posts.length > 0 ? (
          <div className="posts-grid">
            {posts.map((post) => (
              <div
                key={post._id}
                className="post-item"
                onClick={() => handlePostClick(post)} // 게시물 클릭 핸들러
                style={{ cursor: 'pointer' }}
              >
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
        ) : (
          <p>게시물이 없습니다.</p>
        )}
      </div>

      {/* 팝업 */}
      {isPopupOpen && selectedPost && (
        <div className="overlay" onClick={handleClosePopup}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            {selectedPost.image && (
              <img src={selectedPost.image} alt="Selected Post" style={{ width: '100%', borderRadius: '10px' }} />
            )}
            <p>{selectedPost.content || '내용이 없습니다.'}</p>
            <div
              className={`post-likes ${likes[selectedPost._id] ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(selectedPost._id);
              }}
              style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}
            >
              <FiHeart
                style={{
                  color: likes[selectedPost._id] ? 'red' : 'gray',
                  marginRight: '5px',
                  cursor: 'pointer',
                }}
              />
              {selectedPost.likes.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;