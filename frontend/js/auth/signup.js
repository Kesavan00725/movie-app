// signup.js - Frontend registration integration
import { signup as apiSignup } from "../utils/api.js";
import { showToast } from "../components/toast.js";

/**
 * Initialize signup page functionality.
 * Handles password visibility toggles, form validation, API call, and redirects.
 */
const initSignup = () => {
  // Password visibility toggle for all password fields
  const inputForms = document.querySelectorAll('.inputForm');
  inputForms.forEach(container => {
    const input = container.querySelector('input');
    const toggleBtn = container.querySelector('.password-toggle-btn');
    if (input && toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (input.type === 'password') {
          input.type = 'text';
          toggleBtn.style.color = 'var(--primary-color)';
        } else {
          input.type = 'password';
          toggleBtn.style.color = '';
        }
      });
    }
  });

  // Form submission – connect to backend signup endpoint
  const form = document.getElementById('signup-form');
  const nameInput = document.getElementById('full-name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirm-password');

  const nameError = document.getElementById('full-name-error');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');
  const confirmError = document.getElementById('confirm-password-error');
  const formError = document.getElementById('form-error');

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      // Clear previous errors
      if (nameError) nameError.textContent = '';
      if (emailError) emailError.textContent = '';
      if (passwordError) passwordError.textContent = '';
      if (confirmError) confirmError.textContent = '';
      if (formError) formError.textContent = '';

      let hasError = false;

      if (!nameInput.value.trim()) {
        if (nameError) nameError.textContent = 'Full name is required.';
        hasError = true;
      }
      if (!emailInput.value.trim()) {
        if (emailError) emailError.textContent = 'Email is required.';
        hasError = true;
      }
      if (!passwordInput.value.trim()) {
        if (passwordError) passwordError.textContent = 'Password is required.';
        hasError = true;
      } else if (passwordInput.value.length < 8) {
        if (passwordError) passwordError.textContent = 'Password must be at least 8 characters.';
        hasError = true;
      }
      if (!confirmInput.value.trim()) {
        if (confirmError) confirmError.textContent = 'Please confirm your password.';
        hasError = true;
      } else if (passwordInput.value !== confirmInput.value) {
        if (confirmError) confirmError.textContent = 'Passwords do not match.';
        hasError = true;
      }

      if (hasError) return;

      try {
        await apiSignup({
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          password: passwordInput.value,
        });
        showToast('Account created! Taking you to your profile...', 'success');
        setTimeout(() => {
          window.location.href = 'profile.html';
        }, 1200);
      } catch (err) {
        showToast(err.message || 'Signup failed', 'error');
        if (formError) formError.textContent = err.message;
      }
    });
  }
};

// Execute when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('auth_token')) {
      window.location.href = 'profile.html';
      return;
    }
    initSignup();
  });
} else {
  if (localStorage.getItem('auth_token')) {
    window.location.href = 'profile.html';
  } else {
    initSignup();
  }
}
