import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Modal.css';
function Modal({ children }) {
  const navigate = useNavigate();

  const handleClose = () => {
    // 모달 뒤로가기(이전 라우트로)
    navigate(-1);
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()} // 내부 클릭 시 닫히지 않음
      >
        {children}
      </div>
    </div>
  );
}

export default Modal;
