import React, { useEffect, useState, useRef } from 'react';
import "./deco/Home.css";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1); // 현재 페이지
  const [hasMore, setHasMore] = useState(true); // 추가 데이터 여부
  const observer = useRef(); // Intersection Observer를 위한 ref

  useEffect(() => {
    const fetchPosts = async () => {
      if (!hasMore) return; // 더 불러올 데이터가 없으면 종료
      setLoading(true);
      try {
        const token = localStorage.getItem('token'); // 로컬 스토리지에서 토큰 가져오기
        const response = await fetch(`/post/following?page=${page}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        if (!response.ok) {
          throw new Error('게시글을 불러오는 데 실패했습니다.');
        }
        const data = await response.json();
        setPosts((prevPosts) => [...prevPosts, ...data.posts]); // 기존 게시글에 추가
        if (data.posts.length === 0) {
          setHasMore(false); // 추가 데이터가 없음을 설정
        }
      } catch (error) {
        console.error('게시글 로드 오류:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page]); // page 변경 시 API 호출

  const lastPostRef = useRef(); // 마지막 게시글 감지를 위한 ref

  // Intersection Observer 설정
  useEffect(() => {
    if (loading) return; // 로딩 중일 때는 감지 비활성화
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage((prevPage) => prevPage + 1); // 페이지 증가
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
          ref={index === posts.length - 1 ? lastPostRef : null} // 마지막 게시글에 ref 연결
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
        </div>
      ))}
      {loading && <div className="loading">로딩 중...</div>}
      {!hasMore && <div className="no-more">더 이상 게시글이 없습니다.</div>}
    </div>
  );
};

export default Home;
