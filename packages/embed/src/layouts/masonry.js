function renderMasonry(testimonials, widget) {
  var html = '<div class="fw-masonry">';
  testimonials.forEach(function (t) {
    html += renderCard(t, widget);
  });
  html += '</div>';
  return html;
}
