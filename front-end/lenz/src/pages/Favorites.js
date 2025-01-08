import React, { useEffect, useState, useRef } from 'react';
import "./deco/Favorites.css";
import { FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Favorites = () => {
  const [posts, setPosts] = useState([]);
  const [likes, setLikes] = useState({}); 
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate(); // 페이지 이동을 위한 useNavigate 추가
  const observer = useRef();

  useEffect(() => {
    const fetchPosts = async () => {
      if (!hasMore) return;
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/post/recommendations`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        if (!response.ok) {
          throw new Error('추천 게시글을 불러오는 데 실패했습니다.');
        }
        const data = await response.json();
        setPosts(data.posts);

        // 초기 좋아요 상태 설정
        const newLikes = {};
        data.posts.forEach(post => {
          newLikes[post._id] = post.likes.includes(localStorage.getItem('userId'));
        });
        setLikes(newLikes);

        setHasMore(false);
      } catch (error) {
        console.error('추천 게시글 로드 오류:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const toggleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/post/${postId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('좋아요 요청에 실패했습니다.');
      }

      setLikes((prevLikes) => ({
        ...prevLikes,
        [postId]: !prevLikes[postId],
      }));

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                likes: !likes[postId]
                  ? [...post.likes, localStorage.getItem('userId')]
                  : post.likes.filter((id) => id !== localStorage.getItem('userId')),
              }
            : post
        )
      );
    } catch (error) {
      console.error('좋아요 토글 오류:', error.message);
    }
  };

  return (
    <div className="posts-page">
      {posts.map((post) => (
        <div key={post._id} className="post-card" style={{ width: '40%' }}>
          <div className="post-header">
            <img 
              src={post.userId?.profileImage || '/default-profile.png'} 
              alt={`${post.userId?.name || '알 수 없는 사용자'}의 프로필`} 
              className="profile-image" 
              onClick={() => post.userId && navigate(`/profile/${post.userId._id}`)} 
              style={{ cursor: 'pointer' }}
            />
            <span className="user-name">{post.userId?.name || '알 수 없는 사용자'}</span>
          </div>

          <div className="post-image">
            {post.image ? (
              <img src={post.image} alt="Post" />
            ) : (
              <div className="no-image">이미지가 없습니다</div>
            )}
          </div>
          <div
            className={`like-icon${likes[post._id] ? ' active' : ''}`}
            onClick={() => toggleLike(post._id)}
          >
            {likes[post._id] ? (
              <FaHeart style={{ color: 'red', marginLeft: '15px', cursor: 'pointer' }} />
            ) : (
              <FiHeart style={{ marginLeft: '15px', cursor: 'pointer' }} />
            )}
            {post.likes.length}
          </div>
          <div className="post-content">
            <p>{post.content}</p>
          </div>
        </div>
      ))}
      {loading && <div className="loading">로딩 중...</div>}
      {!hasMore && <div className="no-more">추천 게시물을 모두 불러왔습니다.</div>}
    </div>
  );
};

export default Favorites;