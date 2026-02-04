// Sidebar toggle for mobile navigation
// Progressive enhancement: button is hidden by default, shown when JS loads
(function() {
  var toggle = document.querySelector('.sidebar-toggle');
  var sidebar = document.getElementById('sidebar');
  var pageLayout = document.querySelector('.page-layout');
  if (!toggle || !sidebar || !pageLayout) return;

  toggle.hidden = false;

  function setOpen(isOpen) {
    toggle.setAttribute('aria-expanded', String(isOpen));
    sidebar.classList.toggle('sidebar-open', isOpen);
    pageLayout.classList.toggle('page-layout--sidebar-open', isOpen);
  }

  toggle.addEventListener('click', function() {
    var expanded = toggle.getAttribute('aria-expanded') === 'true';
    setOpen(!expanded);
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', function(e) {
    if (!sidebar.contains(e.target) && !toggle.contains(e.target) && sidebar.classList.contains('sidebar-open')) {
      setOpen(false);
    }
  });
})();
