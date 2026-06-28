class NotifierLive extends HTMLElement {

	id = 'live-status';
	validModes = ['status', 'alert', 'off', 'silent'];
	mode;
	lastMessageRead = '';  // holds the last message read, to allow repeating
	#showTimer;  // pending timer that writes the message
	#clearTimer;  // pending timer that clears the message

	connectedCallback() {
		if (this.isDisabled()) return;
		this.#setupLiveRegion();
		this.#setStyles();
		document.addEventListener('notify-live', this.#listenerNotifyLive);
	}
	disconnectedCallback() {
		document.removeEventListener('notify-live', this.#listenerNotifyLive);
	}
	isDisabled() {
		if (this.hasAttribute('disabled')) {
			this.remove();
			return true;
		} else return false;
	}

	#setupLiveRegion() {
		this.id = this.getAttribute('id') || this.id;

		const modeAttr = this.getAttribute('mode');
		this.mode = (this.validModes.includes(modeAttr)) ? modeAttr : this.validModes[0];
		if (this.mode === 'status') {
			this.setAttribute('aria-live', 'polite');
			this.setAttribute('role', 'status');
		} else if (this.mode === 'alert') {
			this.setAttribute('aria-live', 'assertive');
			this.setAttribute('role', 'region');
		} else {
			this.setAttribute('aria-live', 'off');
		}
	}
	#setStyles() {
		if (this.hasAttribute('hide') || this.hasAttribute('invisible')) {
			const styles = {
				display: 'block',
				position: 'absolute',
				width: '1px',
				height: '1px',
				overflow: 'hidden',
				opacity: '0',
			};
			for (const styleProperty in styles) {
				this.style[styleProperty] = styles[styleProperty];
			}
		}
	}

	#processSpecialCommands(message) {
		switch (message) {
			case '_repeat_':
				message = this.lastMessageRead; break;
			case '_time_':
				message = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); break;
			default:
				break;
		}
		return message;
	}

	#listenerNotifyLive = (e) => {
		if (e.detail?.destination && e.detail.destination !== this.id) return;
		let message = typeof e.detail === 'string' ? e.detail : e.detail?.message;
		const delay = e.detail?.delay || 0;
		message = this.#processSpecialCommands(message);
		this.say(message, delay);
	}

	say(message, delay = 0) {
		// Cancel any pending timers from a previous message so a stale clear
		// cannot wipe this message before the screen reader announces it.
		clearTimeout(this.#showTimer);
		clearTimeout(this.#clearTimer);
		this.textContent = '';
		this.#showTimer = setTimeout(() => { this.textContent = message; }, delay);
		this.#clearTimer = setTimeout(() => { this.textContent = ''; }, delay + 2000);
		this.lastMessageRead = message;
	}

}
customElements.define('notifier-live', NotifierLive);
