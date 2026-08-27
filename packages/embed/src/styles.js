var FW_STYLES = `
.fw-root {
  --fw-bg: #ffffff;
  --fw-text: #1a1a1a;
  --fw-accent: #7c3aed;
  --fw-border: #e5e7eb;
  --fw-muted: #6b7280;
  --fw-radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--fw-text);
  line-height: 1.5;
  text-align: left;
  font-style: normal;
  font-weight: normal;
}

.fw-card {
  background: var(--fw-bg);
  border: 1px solid var(--fw-border);
  border-radius: var(--fw-radius);
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  transition: box-shadow 0.2s;
}

.fw-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.fw-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.fw-card-body {
  flex: 1;
  min-width: 0;
}

.fw-stars {
  display: flex;
  gap: 2px;
  margin-bottom: 4px;
}

.fw-star {
  fill: var(--fw-border);
  stroke: none;
  width: 13px;
  height: 13px;
}

.fw-star-filled {
  fill: #facc15;
}

.fw-content {
  margin: 0 0 6px;
  font-size: 14px;
  line-height: 1.45;
  color: var(--fw-text);
}

.fw-author {
  display: flex;
  flex-direction: column;
}

.fw-name {
  font-weight: 600;
  font-size: 13px;
}

.fw-title {
  font-size: 12px;
  color: var(--fw-muted);
}

.fw-empty {
  text-align: center;
  color: var(--fw-muted);
  padding: 48px 24px;
}

.fw-watermark {
  text-align: center;
  margin-top: 16px;
  padding: 8px;
}

.fw-watermark a {
  font-size: 12px;
  color: var(--fw-muted);
  text-decoration: none;
}

.fw-watermark a:hover {
  text-decoration: underline;
}

/* Grid Layout */
.fw-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

/* Masonry Layout */
.fw-masonry {
  columns: 3;
  column-gap: 12px;
}

.fw-masonry .fw-card {
  break-inside: avoid;
  margin-bottom: 12px;
  display: block;
}

@media (max-width: 768px) {
  .fw-masonry { columns: 2; }
  .fw-grid { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
}

@media (max-width: 480px) {
  .fw-masonry { columns: 1; }
  .fw-grid { grid-template-columns: 1fr; }
}

/* Carousel Layout */
.fw-carousel {
  position: relative;
  overflow: hidden;
}

.fw-carousel-track {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 4px;
}

.fw-carousel-track::-webkit-scrollbar {
  display: none;
}

.fw-carousel .fw-card {
  flex: 0 0 320px;
  scroll-snap-align: start;
}

.fw-carousel-nav {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.fw-carousel-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--fw-border);
  background: var(--fw-bg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.fw-carousel-btn:hover {
  background: var(--fw-border);
}

/* List Layout */
.fw-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Marquee Layout */
.fw-marquee {
  overflow: hidden;
  position: relative;
}

.fw-marquee-track {
  display: flex;
  gap: 16px;
  animation: fw-scroll 30s linear infinite;
  width: max-content;
}

.fw-marquee .fw-card {
  flex: 0 0 320px;
}

@keyframes fw-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
`;
