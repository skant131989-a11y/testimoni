function renderGrid(testimonials, widget) {
  var html = '<div class="fw-grid">';
  testimonials.forEach(function (t) {
    html += renderCard(t, widget);
  });
  html += '</div>';
  return html;
}
