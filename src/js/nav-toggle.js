// Nav toggle for mobile header menu
// Progressive enhancement: button is hidden by default, shown when JS loads
(function() {
  var toggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');
  if (!toggle || !navLinks) return;

  toggle.hidden = false;

  toggle.addEventListener('click', function() {
    var expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    navLinks.classList.toggle('nav-open', !expanded);
  });

  // Close menu when clicking outside
  document.addEventListener('click', function(e) {
    if (!toggle.contains(e.target) && !navLinks.contains(e.target) && navLinks.classList.contains('nav-open')) {
      toggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('nav-open');
    }
  });

  // Close menu when a nav link is clicked
  navLinks.addEventListener('click', function(e) {
    if (e.target.tagName === 'A') {
      toggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('nav-open');
    }
  });
})();
