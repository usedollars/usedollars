document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('.sidebar nav a');
  const sections = document.querySelectorAll('.section');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const target = link.dataset.section;
      sections.forEach(s => {
        if (s.id === target) {
          s.classList.add('visible');
        } else {
          s.classList.remove('visible');
        }
      });
    });
  });
});

