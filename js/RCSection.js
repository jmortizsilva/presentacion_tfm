class RCSection extends HTMLElement {

	connectedCallback() {
		if (this.isDisabled()) return;
	}
	isDisabled() {
		if (this.hasAttribute('disabled')) {
			this.remove();
			return true;
		} else return false;
	}

}
customElements.define('rc-section', RCSection);
