import React, { useState, useEffect } from 'react';
import './deco/Search.css';
import { useNavigate } from 'react-router-dom';

function SearchUser() {
  const [keyword, setKeyword] = useState('');
  const [userList, setUserList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate(); // 페이지 이동을 위한 useNavigate 설정

  useEffect(() => {
    if (keyword.trim() !== '') {
      handleSearch();
    }
  }, [keyword, page]);

  const handleSearch = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/search?keyword=${keyword}&page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('검색 실패');
        const data = await response.json();
      // 서버에서 반환된 사용자 데이터에 isFollowing을 반영
        const updatedUserList = data.users.map((user) => ({
          ...user,
          isFollowing: user.isFollowing || false, // isFollowing 필드 초기화
      }));

    setUserList(updatedUserList);
    setTotalPages(data.totalPages);

    } catch (error) {
      console.error(error);
      alert('검색 중 오류가 발생했습니다.');
    }
  };

  
  const handleFollow = async (followingId) => {
    try {
      // 이미 팔로우 여부 확인
      const isAlreadyFollowing = userList.some(
        (user) => user._id === followingId && user.isFollowing
      );
  
      if (isAlreadyFollowing) {
        alert('이미 팔로우 중입니다.');
        return;
      }
  
      const token = localStorage.getItem('token');
      const response = await fetch(`/follow/${followingId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json', // Content-Type 헤더 추가
        },
        body: JSON.stringify({ followingId }), // followingId를 서버로 전달
      });
  
      if (!response.ok) throw new Error('팔로우 실패');
  
      const result = await response.json(); // 서버에서 반환된 결과 처리
  
      // 팔로우 성공 시 userList 업데이트
      setUserList((prevList) => {
        const updatedList = prevList.map((user) =>
          user._id === followingId ? { ...user, isFollowing: true } : user
        );
        console.log('업데이트된 사용자 리스트:', updatedList);
        return updatedList;
      });
  
      console.log('팔로우 성공:', result);
    } catch (error) {
      console.error(error.message);
      alert('팔로우 요청 중 오류가 발생했습니다.');
    }
  };
  
  return (
    <div className="container">
      <div className="content">
        <div className="search-bar">
          <input
            type="text"
            placeholder="검색어 입력 (이름/이메일)"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
          />
          <button onClick={handleSearch}>검색</button>
        </div>

        <div className="user-list">
          {userList.map((user) => (
            <div className="user-item" key={user._id}>
              <img 
                src={user.profileImage || '/default.jpg'} 
                alt={user.name} className="profile-img" 
                onClick={() => navigate(`/profile/${user._id}`)} // 프로필 페이지로 이동
                style={{ cursor: 'pointer' }} // 클릭 가능 스타일
              />
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </div>
              <button
                className={`follow-button ${user.isFollowing ? 'following' : 'follow'}`}
                onClick={() => !user.isFollowing && handleFollow(user._id)}
                disabled={user.isFollowing} // 팔로우 중복 방지
              >
                {user.isFollowing ? '팔로잉' : '팔로우'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pagination">
        <button
          className="pagination-button"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page === 1}
        >
          이전
        </button>
        <span className="pagination-info">{page} / {totalPages}</span>
        <button
          className="pagination-button"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page === totalPages}
        >
          다음
        </button>
      </div>
    </div>
  );
}

export default SearchUser;