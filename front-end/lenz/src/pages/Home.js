import React, { useEffect, useState, useRef } from 'react';
import "./deco/Home.css";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [likes, setLikes] = useState({}); // 좋아요 상태

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

  const toggleLike = (postId) => {
    setLikes((prevLikes) => ({
      ...prevLikes,
      [postId]: !prevLikes[postId], // 좋아요 상태 토글
    }));
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
          <div className="post-image">
            {post.image ? (
              <img src={post.image} alt="Post" />
            ) : (
              <div className="no-image">이미지가 없습니다</div>
            )}
          </div>
          <div className="post-content">
            <p>{post.content}</p>
          </div>
          <div
            className={"like-button" + (likes[post._id] ? ' active' : '')}
            onClick={() => toggleLike(post._id)}
          >
            ❤️
          </div>
        </div>
      ))}
      {loading && <div className="loading">로딩 중...</div>}
      {!hasMore && <div className="no-more">더 이상 게시글이 없습니다.</div>}
    </div>
  );
}
export default Home;