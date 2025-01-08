import React, { useEffect, useState, useRef } from 'react';
import "./deco/Home.css";
import { FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [likes, setLikes] = useState({}); // 좋아요 상태
  const navigate = useNavigate(); // 페이지 이동을 위한 useNavigate 설정

  const observer = useRef();

  useEffect(() => {
    const fetchPosts = async () => {
      if (!hasMore) return;
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/post/following?page=${page}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        if (!response.ok) {
          throw new Error('게시글을 불러오는 데 실패했습니다.');
        }
        const data = await response.json();
        setPosts((prevPosts) => [...prevPosts, ...data.posts]);

        // 초기 좋아요 상태 설정
        const newLikes = {};
        data.posts.forEach(post => {
          newLikes[post._id] = post.likes.includes(localStorage.getItem('userId')); // 현재 사용자가 좋아요를 눌렀는지 확인
        });
        setLikes((prevLikes) => ({ ...prevLikes, ...newLikes }));



        if (data.posts.length === 0) {
          setHasMore(false);
        }
      } catch (error) {
        console.error('게시글 로드 오류:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page]);

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

      const { message } = await response.json();
      console.log(message);

      setLikes((prevLikes) => ({
        ...prevLikes,
        [postId]: !prevLikes[postId], // 좋아요 상태 토글
      }));

      // 좋아요 상태를 posts에도 반영
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

  const lastPostRef = useRef();

  useEffect(() => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage((prevPage) => prevPage + 1);
      }
    });

    if (lastPostRef.current) observer.current.observe(lastPostRef.current);
  }, [loading, hasMore]);

  return (
    <div className="posts-page">
      {posts.map((post, index) => (
        <div
          key={post._id}
          className="post-card"
          ref={index === posts.length - 1 ? lastPostRef : null}
          style={{ width: '40%' }} 
        >
          <div className="post-header">
            <img 
              src={post.userId.profileImage || '/default-profile.png'} 
              alt={`${post.userId.name}의 프로필`} 
              className="profile-image" 
              onClick={() => navigate(`/profile/${post.userId._id}`)} // 프로필 페이지로 이동
              style={{ cursor: 'pointer' }} // 클릭 가능 스타일

            />
            <span className="user-name">{post.userId.name}</span>
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
      {!hasMore && <div className="no-more">더 이상 게시글이 없습니다.</div>}
    </div>
  );
}
export default Home;