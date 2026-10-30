export class PhoneUI {
  constructor() {
    this.createElements();
    this.messages = [];
  }

  createElements() {
    // Main Phone Container
    this.container = document.createElement('div');
    this.container.id = 'phone-container';
    this.container.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 300px;
      height: 600px;
      background: rgba(15, 15, 20, 0.95);
      border: 4px solid #222;
      border-radius: 30px;
      box-shadow: 0 0 50px rgba(0,0,0,0.8);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 100;
      font-family: 'Courier New', Courier, monospace;
      color: white;
    `;
    document.body.appendChild(this.container);

    // Close Button
    this.closeBtn = document.createElement('div');
    this.closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 15px;
      cursor: pointer;
      font-size: 20px;
      color: #666;
      z-index: 110;
    `;
    this.closeBtn.textContent = '✕';
    this.closeBtn.onclick = (e) => {
      e.stopPropagation();
      this.hide();
      if (this.onFirstConversationFinished) {
        this.onFirstConversationFinished();
        this.onFirstConversationFinished = null;
      }
    };
    this.container.appendChild(this.closeBtn);

    // Header
    this.header = document.createElement('div');
    this.header.style.cssText = `
      padding: 20px;
      background: #1a1a24;
      text-align: center;
      font-weight: bold;
      border-bottom: 1px solid #333;
      font-size: 18px;
    `;
    this.header.textContent = 'Alex';
    this.container.appendChild(this.header);

    // Message Area
    this.messageArea = document.createElement('div');
    this.messageArea.style.cssText = `
      flex: 1;
      padding: 15px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    this.container.appendChild(this.messageArea);

    // Choice Area
    this.choiceArea = document.createElement('div');
    this.choiceArea.style.cssText = `
      padding: 20px;
      background: #1a1a24;
      display: none;
      flex-direction: column;
      gap: 10px;
      border-top: 1px solid #333;
    `;
    this.container.appendChild(this.choiceArea);
  }

  hide() {
    this.container.style.display = 'none';
    const hint = document.getElementById('hint');
    if (hint) hint.style.display = document.pointerLockElement ? 'none' : 'block';
    try {
      document.body.requestPointerLock();
    } catch (_) {}
  }

  async show(contactName = 'Alex') {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    const hint = document.getElementById('hint');
    if (hint) hint.style.display = 'none';
    this.header.textContent = contactName;
    this.container.style.display = 'flex';
    this.messageArea.innerHTML = '';
    this.choiceArea.style.display = 'none';
  }

  startFirstConversation() {
    return new Promise(async (resolve) => {
      this.onFirstConversationFinished = resolve;
      await this.show('Alex');
      await this.addMessage('you still remember me?', 'alex');
      await this.sleep(1500);
      await this.addMessage("I've been trying to reach you.", 'alex');
      await this.sleep(1500);
      await this.addMessage("Don't trust whoever is in that photograph.", 'alex');
      this.showChoices();
    });
  }

  async startUnknownConversation() {
    await this.show('UNKNOWN');
    await this.addMessage("Don't listen to him.", 'unknown');
    await this.sleep(1500);
    await this.addMessage("He's not Alex.", 'unknown');
    await this.sleep(1500);
    await this.addMessage("I know you don't remember me.", 'unknown');
    await this.sleep(1500);
    await this.addMessage("But I was there that night.", 'unknown');
    await this.sleep(1500);
    await this.addMessage("Look behind the photograph.", 'unknown');
    await this.sleep(3000);
    this.hide();
  }

  async startWarningConversation() {
    await this.show('Alex');
    await this.addMessage("Why did you turn it over?", 'alex');
    await this.sleep(1500);
    await this.addMessage("I told you not to.", 'alex');
    await this.sleep(1500);
    await this.addMessage("Don't look at the door.", 'alex');

    // Automatically close phone after final warning
    await this.sleep(3000);
    this.hide();
  }

  async startFinalConversation(onChoice) {
    if (this.closeBtn) this.closeBtn.style.display = 'none';
    await this.show('UNKNOWN');
    await this.addMessage(' You finally opened it. ', 'unknown');
    await this.sleep(1000);
    await this.addMessage('Now look behind you.', 'unknown');
    await this.sleep(1500);

    this.showFinalChoices(onChoice);
  }

  showFinalChoices(onChoice) {
    this.choiceArea.innerHTML = '';
    this.choiceArea.style.display = 'flex';

    const btn1 = this.createChoiceButton('Trust Alex', async () => {
      this.choiceArea.style.display = 'none';
      await this.addMessage('Trust Alex', 'player');
      await this.sleep(800);
      await this.addMessage("You still don't understand.", 'unknown');
      await this.sleep(1000);
      await this.addMessage('Look behind you.', 'unknown');
      await this.sleep(1200);
      this.hide();
      if (this.closeBtn) this.closeBtn.style.display = 'block';
      if (onChoice) onChoice('alex');
    });

    const btn2 = this.createChoiceButton('Trust UNKNOWN', async () => {
      this.choiceArea.style.display = 'none';
      await this.addMessage('Trust UNKNOWN', 'player');
      await this.sleep(800);
      await this.addMessage('Good.', 'unknown');
      await this.sleep(1000);
      await this.addMessage('Now forget this night.', 'unknown');
      await this.sleep(1200);
      this.hide();
      if (this.closeBtn) this.closeBtn.style.display = 'block';
      if (onChoice) onChoice('unknown');
    });

    this.choiceArea.appendChild(btn1);
    this.choiceArea.appendChild(btn2);
  }

  async addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.style.cssText = `
      max-width: 80%;
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 14px;
      line-height: 1.4;
      ${sender === 'alex' || sender === 'unknown' ? 'align-self: flex-start; background: #333; color: #eee;' : 'align-self: flex-end; background: #4a6da7; color: white;'}
    `;
    msg.textContent = text;
    this.messageArea.appendChild(msg);
    this.messageArea.scrollTop = this.messageArea.scrollHeight;
    return this.sleep(500);
  }

  showChoices() {
    this.choiceArea.innerHTML = '';
    this.choiceArea.style.display = 'flex';

    const btn1 = this.createChoiceButton('Who is this?', () => this.handleChoice('who'));
    const btn2 = this.createChoiceButton('Alex is dead.', () => this.handleChoice('dead'));

    this.choiceArea.appendChild(btn1);
    this.choiceArea.appendChild(btn2);
  }

  createChoiceButton(text, onClick) {
    const btn = document.createElement('button');
    btn.style.cssText = `
      padding: 10px;
      background: #2a2a3a;
      border: 1px solid #444;
      color: white;
      cursor: pointer;
      font-family: inherit;
      border-radius: 5px;
      transition: background 0.2s;
    `;
    btn.textContent = text;
    btn.onmouseover = () => btn.style.background = '#3a3a4a';
    btn.onmouseout = () => btn.style.background = '#2a2a3a';
    btn.onclick = (e) => {
      e.stopPropagation();
      onClick(e);
    };
    return btn;
  }

  async handleChoice(choice) {
    this.choiceArea.style.display = 'none';

    if (choice === 'who') {
      await this.addMessage('Who is this?', 'player');
      await this.sleep(1000);
      await this.addMessage("You know exactly who I am.", 'alex');
      await this.sleep(1500);
      await this.addMessage("Look at the photograph again.", 'alex');
    } else {
      await this.addMessage('Alex is dead.', 'player');
      await this.sleep(1000);
      await this.addMessage("Then why did you just hear your phone ring?", 'alex');
      this.flicker();
    }

    await this.sleep(2500);
    this.hide();

    if (this.onFirstConversationFinished) {
      this.onFirstConversationFinished();
      this.onFirstConversationFinished = null;
    }
  }

  flicker() {
    const originalOpacity = this.container.style.opacity;
    this.container.style.opacity = '0.5';
    setTimeout(() => {
      this.container.style.opacity = '1';
      setTimeout(() => {
        this.container.style.opacity = '0.7';
        setTimeout(() => {
          this.container.style.opacity = originalOpacity;
        }, 50);
      }, 50);
    }, 50);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
