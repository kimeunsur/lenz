import React, { useEffect, useState, useRef } from 'react';
import "./deco/Favorites.css"; // 필요하면 CSS 파일 이름도 수정

const Favorites = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
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
        setHasMore(false);
      } catch (error) {
        console.error('추천 게시글 로드 오류:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="posts-page">
      {posts.map((post) => (
        <div key={post._id} className="post-card">
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
        </div>
      ))}
      {loading && <div className="loading">로딩 중...</div>}
      {!hasMore && <div className="no-more">추천 게시물을 모두 불러왔습니다.</div>}
    </div>
  );
};

export default Favorites;