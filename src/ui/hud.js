export class HUD {
  constructor() {
    this.createElements();
  }

  createElements() {
    // Crosshair
    this.crosshair = document.createElement('div');
    this.crosshair.id = 'crosshair';
    this.crosshair.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 4px;
      height: 4px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 10;
    `;
    document.body.appendChild(this.crosshair);

    // Interaction Prompt
    this.prompt = document.createElement('div');
    this.prompt.id = 'interaction-prompt';
    this.prompt.style.cssText = `
      position: absolute;
      top: 55%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-family: 'Courier New', Courier, monospace;
      font-size: 18px;
      text-align: center;
      text-shadow: 2px 2px 2px black;
      pointer-events: none;
      z-index: 10;
      display: none;
    `;
    document.body.appendChild(this.prompt);

    // Interaction Message
    this.message = document.createElement('div');
    this.message.id = 'interaction-message';
    this.message.style.cssText = `
      position: absolute;
      bottom: 20%;
      left: 50%;
      transform: translateX(-50%);
      color: #ccc;
      font-family: 'Courier New', Courier, monospace;
      font-size: 20px;
      text-align: center;
      text-shadow: 2px 2px 2px black;
      white-space: pre-line;
      line-height: 1.5;
      pointer-events: none;
      z-index: 10;
      opacity: 0;
      transition: opacity 0.5s ease;
    `;
    document.body.appendChild(this.message);
  }

  update(interactionTarget = null) {
    if (interactionTarget) {
      this.prompt.textContent = interactionTarget.prompt;
      this.prompt.style.display = 'block';
    } else {
      this.prompt.style.display = 'none';
    }
  }

  showMessage(text, duration = 3000) {
    this.message.textContent = text;
    this.message.style.opacity = '1';

    setTimeout(() => {
      this.message.style.opacity = '0';
    }, duration);
  }

  showPermanentMessage(text) {
    this.message.textContent = text;
    this.message.style.opacity = '1';
  }

  hideMessage() {
    this.message.style.opacity = '0';
  }

  showEnding(titleText, subtitleText, isGlitch = false) {
    this.crosshair.style.display = 'none';
    this.prompt.style.display = 'none';
    this.message.style.opacity = '0';
    this.message.style.display = 'none';
    const hint = document.getElementById('hint');
    if (hint) hint.style.display = 'none';

    const overlay = document.createElement('div');
    overlay.id = 'ending-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #000;
      z-index: 500;
      opacity: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: opacity 1.5s ease;
      font-family: 'Courier New', Courier, monospace;
      pointer-events: all;
      user-select: none;
    `;

    const title = document.createElement('h1');
    title.style.cssText = `
      font-size: 48px;
      letter-spacing: 14px;
      margin: 0 0 24px 0;
      opacity: 0;
      transition: opacity 1.2s ease;
      color: ${isGlitch ? '#d9383a' : '#e0e0e0'};
      text-shadow: 0 0 25px ${isGlitch ? 'rgba(217, 56, 58, 0.6)' : 'rgba(255, 255, 255, 0.25)'};
    `;
    title.textContent = titleText;
    overlay.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.style.cssText = `
      font-size: 18px;
      letter-spacing: 3px;
      color: #888;
      margin: 0;
      opacity: 0;
      transition: opacity 1.2s ease;
      text-align: center;
      line-height: 1.6;
    `;
    subtitle.textContent = `"${subtitleText}"`;
    overlay.appendChild(subtitle);

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });

    setTimeout(() => {
      title.style.opacity = '1';
    }, 1500);

    setTimeout(() => {
      subtitle.style.opacity = '1';
    }, 3200);
  }
}
