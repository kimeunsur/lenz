import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "./deco/Add.css";


function Add() {
  const [previewImage, setPreviewImage] = useState('');
  const [file, setFile] = useState(null);
  const [content, setContent] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target.result);
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
      const base64Image = await convertToBase64(file);
      const token = localStorage.getItem('token');

      const requestData = {
        content,
        image: base64Image,
      };

      const response = await fetch('/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '업로드 실패');
      }

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
        <input type="file" accept="image/*" onChange={handleFileChange} />
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
