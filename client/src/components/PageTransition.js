import gsap from 'gsap';
import '../styles/page-transition.css';

export class PageTransition {
  static element = null;

  static init(container) {
    this.element = container;
    this.element.innerHTML = '<div class="transition-overlay"></div>';
  }

  static start() {
    if (!this.element) return;
    
    const overlay = this.element.querySelector('.transition-overlay');
    gsap.to(overlay, {
      opacity: 0.15,
      duration: 0.3,
      ease: 'power2.inOut'
    });
  }

  static end() {
    if (!this.element) return;
    
    const overlay = this.element.querySelector('.transition-overlay');
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.inOut',
      delay: 0.2
    });
  }
}
