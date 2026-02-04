(function() {
  var toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  function getEffectiveTheme() {
    var saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateIcon(theme);
  }

  function updateIcon(theme) {
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    // Show sun icon in dark mode (to indicate clicking switches to light), moon in light mode
    var lightIcon = toggle.querySelector('.theme-icon-light');
    var darkIcon = toggle.querySelector('.theme-icon-dark');
    if (lightIcon && darkIcon) {
      lightIcon.style.display = theme === 'dark' ? 'block' : 'none';
      darkIcon.style.display = theme === 'dark' ? 'none' : 'block';
    }
  }

  // Initialize icon state
  updateIcon(getEffectiveTheme());

  toggle.addEventListener('click', function() {
    var current = getEffectiveTheme();
    apply(current === 'dark' ? 'light' : 'dark');
  });
})();
