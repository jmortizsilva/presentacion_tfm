class FullScreen extends HTMLElement {

	validCommands = ['on', 'off', 'toggle'];
	#initialRootFontSize;
	#currentDevicePixelRatio;
	#jsFullscreen;  // Holds the fullscreen state that is programmatically controllable via JavaScript

	connectedCallback() {
		if (this.isDisabled()) return;
		this.#initialRootFontSize = this.#getRootFontSize();
		this.#currentDevicePixelRatio = window.devicePixelRatio;
		this.#jsFullscreen = document.fullscreenElement || false;
		document.addEventListener('set-fullscreen', this.#listenerSetFullscreen);
		window.addEventListener('resize', this.#listenerResize);
		window.addEventListener('keyup', this.#listenerKeyUp);
	}
	disconnectedCallback() {
		document.removeEventListener('set-fullscreen', this.#listenerSetFullscreen);
		window.removeEventListener('resize', this.#listenerResize);
		window.removeEventListener('keyup', this.#listenerKeyUp);
	}
	isDisabled() {
		if (this.hasAttribute('disabled')) {
			this.remove();
			return true;
		} else return false;
	}

	#getRootFontSize() {
		return getComputedStyle(document.documentElement).getPropertyValue('font-size');
	}

	isFullscreen() {
		return window.innerWidth === screen.width && window.innerHeight === screen.height;
	}

	#listenerResize = () => {
		this.#initialRootFontSize = this.#getRootFontSize();
		const zoomChanged = (this.#currentDevicePixelRatio !== window.devicePixelRatio);
		this.#currentDevicePixelRatio = window.devicePixelRatio;

		let message;
		if (this.isFullscreen()) {
			message = `fullscreen enabled. ${this.#jsFullscreen ? 'Use Escape to disable it.' : 'Use F11 to disable it.'}`;
			document.documentElement.style.overflow = "hidden";
		} else {
			this.#jsFullscreen = false;
			message = 'Fullscreen is disabled.';
		}
		if (!zoomChanged) this.#notifyState(message);
	}
	#listenerKeyUp = () => {
		const textZoomChanged = (this.#getRootFontSize() !== this.#initialRootFontSize);
		document.documentElement.style.overflow = textZoomChanged ? "auto" : "hidden";
	}


	#listenerSetFullscreen = (e) => {
		if (!e.detail || !this.validCommands.includes(e.detail)) return;

		if (!this.isFullscreen() && e.detail !== 'off') {
			document.documentElement.requestFullscreen();
			this.#jsFullscreen = true;
		} else if (this.#jsFullscreen && e.detail !== 'on' && document.exitFullscreen) {
			document.exitFullscreen();
		} else {
			this.#notifyState('Use F11 to disable fullscreen mode.');
		}
	}

	#notifyState(message) {
		this.#emitEvent('is-fullscreen', this.isFullscreen());
		this.#emitEvent('notify-live', message);
		//this.#emitEvent('notify-live', { message, destination: 'live-other' });
		//console.log(message);
	}

	#emitEvent(type, detail) {
		document.dispatchEvent(new CustomEvent(type, { detail }));
	}

}
customElements.define('full-screen', FullScreen);
