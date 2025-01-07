import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "./deco/Add.css";


function Add() {
  const [previewImage, setPreviewImage] = useState('');
  const [file, setFile] = useState(null);
  const [content, setContent] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB 제한
        alert('파일 크기가 10MB를 초과할 수 없습니다.');
        return;
      }
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target.result); // 미리보기 이미지 설정
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  
  const handleUpload = async () => {
    if (!file || !content) {
      alert('사진과 글 내용을 입력하세요.');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const formData = new FormData();
      formData.append('content', content);
      formData.append('image', file);

      const response = await fetch('/post/me', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`, // 인증 토큰
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '업로드 실패');
      }

      const responseData = await response.json();
      console.log('응답 데이터:', responseData);

      alert('글이 성공적으로 작성되었습니다!');
      navigate('/profile');
    } catch (error) {
      console.error('업로드 실패:', error.message);
      alert('업로드 중 문제가 발생했습니다: ' + error.message);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('popup-open');
    } else {
      document.body.classList.remove('popup-open');
    }
    return () => document.body.classList.remove('popup-open');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="overlay" onClick={handleClose}></div>
      <div className="popup">
        <h2>글 쓰기</h2>
        <textarea
          placeholder="글 내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="file-input-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <input
            type="file"
            id="fileUpload"
            accept="image/*"
            onChange={handleFileChange}
          /> 
          <label htmlFor="fileUpload" className="custom-file-label">
            사진 찾기
          </label>
        </div>
        {previewImage && (
          <div className="preview">
            <img src={previewImage} alt="미리보기" />
          </div>
        )}
        <button onClick={handleUpload}>게시하기</button>
      </div>
    </>
  );
}

export default Add;