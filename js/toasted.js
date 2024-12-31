// Function to show toast notifications
function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
  
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
  
    setTimeout(() => {
      toast.classList.remove('show');
      document.body.removeChild(toast);
    }, 4000);
  }
  