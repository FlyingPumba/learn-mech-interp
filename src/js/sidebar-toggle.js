// Sidebar toggle for mobile navigation
// Progressive enhancement: button is hidden by default, shown when JS loads
(function() {
  var toggle = document.querySelector('.sidebar-toggle');
  var sidebar = document.getElementById('sidebar');
  if (!toggle || !sidebar) return;

  toggle.hidden = false;

  toggle.addEventListener('click', function() {
    var expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    sidebar.classList.toggle('sidebar-open');
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', function(e) {
    if (!sidebar.contains(e.target) && !toggle.contains(e.target) && sidebar.classList.contains('sidebar-open')) {
      toggle.setAttribute('aria-expanded', 'false');
      sidebar.classList.remove('sidebar-open');
    }
  });
})();
