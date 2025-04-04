document.addEventListener('DOMContentLoaded', function() {
  // 다크 모드 토글 기능 (나중에 구현 가능)
  const toggleDarkMode = () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
  };

  // 알림 메시지 자동 닫기
  const alerts = document.querySelectorAll('.alert');
  if (alerts.length > 0) {
    setTimeout(() => {
      alerts.forEach(alert => {
        alert.style.opacity = '0';
        setTimeout(() => {
          alert.style.display = 'none';
        }, 500);
      });
    }, 5000);
  }

  // 폼 유효성 검사
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(event) {
      const requiredFields = form.querySelectorAll('[required]');
      let isValid = true;

      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.classList.add('invalid');
          
          // 에러 메시지 표시
          let errorMessage = field.nextElementSibling;
          if (!errorMessage || !errorMessage.classList.contains('error-message')) {
            errorMessage = document.createElement('div');
            errorMessage.classList.add('error-message');
            field.parentNode.insertBefore(errorMessage, field.nextSibling);
          }
          errorMessage.textContent = '이 필드는 필수입니다.';
        }
      });

      if (!isValid) {
        event.preventDefault();
      }
    });

    // 입력 필드 포커스시 에러 메시지 제거
    const inputFields = form.querySelectorAll('input, select, textarea');
    inputFields.forEach(field => {
      field.addEventListener('focus', function() {
        field.classList.remove('invalid');
        const errorMessage = field.nextElementSibling;
        if (errorMessage && errorMessage.classList.contains('error-message')) {
          errorMessage.textContent = '';
        }
      });
    });
  });

  // 삭제 확인 다이얼로그
  const deleteForms = document.querySelectorAll('form[onsubmit*="confirm"]');
  deleteForms.forEach(form => {
    form.addEventListener('submit', function(event) {
      const confirmed = confirm('정말 삭제하시겠습니까?');
      if (!confirmed) {
        event.preventDefault();
      }
    });
  });

  // 테이블 행 하이라이트
  const tableRows = document.querySelectorAll('tbody tr');
  tableRows.forEach(row => {
    row.addEventListener('mouseenter', function() {
      this.classList.add('highlight');
    });
    row.addEventListener('mouseleave', function() {
      this.classList.remove('highlight');
    });
  });

  // 이미지 로딩 오류 처리
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    img.addEventListener('error', function() {
      this.src = '/images/default-book-cover.jpg';
    });
  });
});
