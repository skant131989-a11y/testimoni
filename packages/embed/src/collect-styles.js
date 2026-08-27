var FC_STYLES = `
:host {
  all: initial;
}

.fc-trigger {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 50px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}

.fc-trigger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5);
}

.fc-trigger svg {
  width: 18px;
  height: 18px;
  fill: #fff;
}

.fc-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483646;
  background: rgba(0, 0, 0, 0.5);
  animation: fc-fadeIn 0.2s ease;
}

.fc-modal {
  position: fixed;
  z-index: 2147483647;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 460px;
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  animation: fc-slideUp 0.3s ease;
}

.fc-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.fc-modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.fc-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #6b7280;
  font-size: 20px;
  line-height: 1;
  border-radius: 6px;
  transition: background 0.15s;
}

.fc-close:hover {
  background: #f3f4f6;
  color: #1a1a1a;
}

.fc-modal-desc {
  padding: 4px 24px 0;
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.fc-form {
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.fc-field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.fc-field input,
.fc-field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: #1a1a1a;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.fc-field input:focus,
.fc-field textarea:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.fc-field textarea {
  resize: vertical;
  min-height: 80px;
}

.fc-stars-row {
  display: flex;
  gap: 4px;
}

.fc-star {
  cursor: pointer;
  transition: transform 0.1s;
}

.fc-star:hover {
  transform: scale(1.15);
}

.fc-star svg {
  width: 28px;
  height: 28px;
  fill: #d1d5db;
  stroke: none;
  transition: fill 0.15s;
}

.fc-star.active svg,
.fc-star.hover svg {
  fill: #facc15;
}

.fc-submit {
  width: 100%;
  padding: 12px;
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}

.fc-submit:hover {
  background: #6d28d9;
}

.fc-submit:disabled {
  background: #a78bfa;
  cursor: not-allowed;
}

.fc-error {
  color: #dc2626;
  font-size: 13px;
  margin: 0;
}

.fc-success {
  padding: 40px 24px;
  text-align: center;
}

.fc-success-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  background: #dcfce7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fc-success-icon svg {
  width: 28px;
  height: 28px;
  fill: none;
  stroke: #16a34a;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.fc-success h3 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.fc-success p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.fc-powered {
  text-align: center;
  padding: 0 24px 16px;
  font-size: 11px;
  color: #9ca3af;
}

.fc-powered a {
  color: #7c3aed;
  text-decoration: none;
}

.fc-powered a:hover {
  text-decoration: underline;
}

@keyframes fc-fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fc-slideUp {
  from { opacity: 0; transform: translate(-50%, -45%); }
  to { opacity: 1; transform: translate(-50%, -50%); }
}
`;
