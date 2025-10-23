import '../css/index.scss';
import * as AsciinemaPlayer from 'asciinema-player';

function greeting() {
  const emoji = Date.now() % 2 ? '👀' : '👋';
  console.info(emoji);
}

greeting();

// Make AsciinemaPlayer available globally for shortcodes
window.AsciinemaPlayer = AsciinemaPlayer;
