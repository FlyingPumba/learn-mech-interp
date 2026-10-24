// Switch between the guided curriculum and a newest-first article list.
(function() {
  var control = document.querySelector('.topics-sort');
  var buttons = control ? control.querySelectorAll('[data-sort-mode]') : [];
  var title = document.querySelector('#topics-list-title');
  var description = document.querySelector('#topics-list-description');
  var views = document.querySelectorAll('[data-topics-view]');

  if (!control || !buttons.length || !title || !description || !views.length) return;

  var copy = {
    curriculum: {
      title: 'Curriculum Map',
      description: 'Browse every block and topic in the recommended sequence.'
    },
    recent: {
      title: 'Recently Added',
      description: 'Catch up on the newest articles, ordered by the date they were first added.'
    }
  };

  function modeFromUrl() {
    return new URL(window.location.href).searchParams.get('sort') === 'recent'
      ? 'recent'
      : 'curriculum';
  }

  function show(mode, updateUrl) {
    title.textContent = copy[mode].title;
    description.textContent = copy[mode].description;

    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute(
        'aria-pressed',
        String(buttons[i].getAttribute('data-sort-mode') === mode)
      );
    }

    for (var j = 0; j < views.length; j++) {
      views[j].hidden = views[j].getAttribute('data-topics-view') !== mode;
    }

    if (updateUrl) {
      var url = new URL(window.location.href);
      if (mode === 'recent') {
        url.searchParams.set('sort', 'recent');
      } else {
        url.searchParams.delete('sort');
      }
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }
  }

  show(modeFromUrl(), false);
  control.hidden = false;

  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function() {
      show(this.getAttribute('data-sort-mode'), true);
    });
  }

  window.addEventListener('popstate', function() {
    show(modeFromUrl(), false);
  });
})();
