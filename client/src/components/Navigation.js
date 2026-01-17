import '../styles/navigation.css';

export class Navigation {
  static render(container) {
    container.innerHTML = `
      <div class="nav-container">
        <a href="/" class="nav-logo" data-link>
          <span class="logo-icon">◆</span>
          <span class="logo-text">Urban Risk</span>
        </a>

        <button class="nav-toggle" id="nav-toggle">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul class="nav-menu" id="nav-menu">
          <li><a href="/" class="nav-link active" data-link>Home</a></li>
          <li><a href="/platform" class="nav-link" data-link>Platform</a></li>
          <li><a href="/trends" class="nav-link" data-link>Trends</a></li>
          <li><a href="/map" class="nav-link" data-link>Map</a></li>
          <li><a href="/cascade" class="nav-link" data-link>Cascade</a></li>
          <li><a href="/scenarios" class="nav-link" data-link>Scenarios</a></li>
          <li><a href="/about" class="nav-link" data-link>About</a></li>
        </ul>
      </div>
    `;

    // Mobile menu toggle
    const toggle = container.querySelector('#nav-toggle');
    const menu = container.querySelector('#nav-menu');

    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      menu.classList.toggle('active');
    });

    // Close menu on link click
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        menu.classList.remove('active');
      });
    });
  }
}
