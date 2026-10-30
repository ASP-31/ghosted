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
}
