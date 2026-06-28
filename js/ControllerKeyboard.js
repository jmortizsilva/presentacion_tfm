class ControllerKeyboard extends HTMLElement {

	#key;  // Holds the key associated with the current event
	gestureEventMappings = {};  // Dictionary of gestures (seq+key) triggering actions upon user completion
	lastGesture = '';  // Stores last gesture, even if not in gesture event mappings

	connectedCallback() {
		if (this.isDisabled()) return;
		this.style.position = 'absolute';
		this.style.visibility = 'hidden';
		document.body.setAttribute('role', 'application');  // prevent screenreader from capturing keyboard (non-standard!)
		setTimeout(this.#registerGestureEventMappings, 0);
		document.addEventListener('keyup', this.#listenerKeyUp);
	}
	disconnectedCallback() {
		document.removeEventListener('keyup', this.#listenerKeyUp);
	}
	isDisabled() {
		if (this.hasAttribute('disabled')) {
			this.remove();
			return true;
		} else return false;
	}

	#registerGestureEventMappings = () => {
		const lines = this.textContent.split('\n');
		for (let line of lines) {
			line = line.replace(/\s/g, "").toLowerCase();
			if (line === '') continue; // Skip empty lines

			const [gesture, eventInfo] = line.split('|');
			const [eventType, ...eventDetailArray] = eventInfo.split(':');
			const eventDetailString = eventDetailArray.join(':');
			let eventDetail;
			if (eventDetailString.startsWith('{') && eventDetailString.trim().endsWith('}')) {
				try {
					eventDetail = JSON.parse(eventDetailString);
				} catch {
					eventDetail = eventDetailString;
				}
			} else {
				eventDetail = eventDetailString;
			}
			this.gestureEventMappings[gesture] = { eventType, eventDetail };
		}
	}

	#listenerKeyUp = (e) => {
		this.#key = (e.key === ' ') ? 'space' : e.key;
		let gesture = this.#key.toLowerCase();
		if (e.shiftKey && gesture !== 'shift') gesture = 'shift+' + gesture;
		this.lastGesture = gesture;
		if (this.gestureEventMappings.hasOwnProperty(this.lastGesture)) {
			const { eventType, eventDetail } = this.gestureEventMappings[this.lastGesture];
			this.#emitEvent(eventType, eventDetail);
		}
	}

	#emitEvent(type, detail) {
		document.dispatchEvent(new CustomEvent(type, { detail }));
	}

}
customElements.define('controller-keyboard', ControllerKeyboard);
