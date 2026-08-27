function renderCarousel(testimonials, widget) {
  var html = '<div class="fw-carousel">';
  html += '<div class="fw-carousel-track">';
  testimonials.forEach(function (t) {
    html += renderCard(t, widget);
  });
  html += '</div>';
  html += '<div class="fw-carousel-nav">';
  html += '<button class="fw-carousel-btn fw-prev" aria-label="Previous">&#8249;</button>';
  html += '<button class="fw-carousel-btn fw-next" aria-label="Next">&#8250;</button>';
  html += '</div></div>';
  return html;
}

function initCarousel(container) {
  var track = container.querySelector('.fw-carousel-track');
  var prev = container.querySelector('.fw-prev');
  var next = container.querySelector('.fw-next');
  if (!track || !prev || !next) return;

  var scrollAmount = 336;

  prev.addEventListener('click', function () {
    track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });

  next.addEventListener('click', function () {
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });
}

function renderList(testimonials, widget) {
  var html = '<div class="fw-list">';
  testimonials.forEach(function (t) {
    html += renderCard(t, widget);
  });
  html += '</div>';
  return html;
}

function renderMarquee(testimonials, widget) {
  var html = '<div class="fw-marquee">';
  html += '<div class="fw-marquee-track">';
  // Duplicate items for seamless loop
  var items = testimonials.concat(testimonials);
  items.forEach(function (t) {
    html += renderCard(t, widget);
  });
  html += '</div></div>';
  return html;
}

function initMarquee(container) {
  var track = container.querySelector('.fw-marquee-track');
  if (!track) return;

  container.addEventListener('mouseenter', function () {
    track.style.animationPlayState = 'paused';
  });
  container.addEventListener('mouseleave', function () {
    track.style.animationPlayState = 'running';
  });
}
