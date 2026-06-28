class RCSlide extends HTMLElement {

	#stepsQuery = 'li, step, .step';  // selector for steps (sub-slides) DOM nodes search
	#steps = []; // Stores all the step DOM nodes
	#stepHideClass = 'step--hide';  // class used to control the visibility of the steps
	#hiddenSteps;  // number of hidden steps awaiting to be shown
	#visibleSteps;  // number of steps that have been shown, if any

	connectedCallback() {
		if (this.isDisabled()) return;
		this.#setupSlide();
		document.addEventListener('set-step', this.#listenerSetStep);
	}
	disconnectedCallback() {
		document.removeEventListener('set-step', this.#listenerSetStep);
	}
	isDisabled() {
		if (this.hasAttribute('disabled')) {
			this.remove();
			return true;
		} else return false;
	}

	#setupSlide() {
		this.#steps = Array.from(this.querySelectorAll(this.#stepsQuery));
		this.#visibleSteps = this.#steps.length;
		this.#hiddenSteps = 0;
		if (this.#visibleSteps === 0) {
			this.setStep('title');
		} else if (this.getAttribute('data-enter') === 'end') {
			// Entered going backwards: reveal every step so the next 'prev'
			// peels back from the last one instead of skipping the whole slide.
			for (const step of this.#steps) {
				step.classList.remove(this.#stepHideClass);
			}
		} else {
			for (const step of this.#steps) {
				this.#hideStep(step);
			}
		}
	}

	#hideStep(step) {
		step.classList.add(this.#stepHideClass);
		this.#visibleSteps -= 1;
		this.#hiddenSteps += 1;
		if (this.#visibleSteps === 0) {
			this.setStep('title');
		}
	}
	#showStep(step) {
		step.classList.remove(this.#stepHideClass);
		let text = '';
		for (let node of step.childNodes) {
			if (node.nodeType === Node.TEXT_NODE) {
				text += node.textContent;
			} else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'UL' && node.tagName !== 'OL' && node.getAttribute('aria-hidden') !== 'true') {
				text += node.textContent;
			}
		}
		this.#emitEvent('notify-live', text);
		this.#emitEvent('changed-step', step.textContent);  // *** todo: emit step number instead
		this.#visibleSteps += 1;
		this.#hiddenSteps -= 1;
	}

	setStep(targetStep) {
		switch (targetStep) {
			case 'title':
				const firstHeading = this.querySelector('h1, h2, h3, h4, h5, h6');
				const slideTitle = (firstHeading?.textContent || this.firstElementChild?.textContent || '').trim() || 'untitled slide';
				this.#emitEvent('notify-live', slideTitle);
				break;
			case 'prev':
				if (this.#visibleSteps === 0) {
					// at the beginning of the slide: go to the previous slide
					// and land on its last step ('prev-end'), not its title
					this.#emitEvent('set-slide', 'prev-end');
				} else {
					const currentStep = this.#steps[this.#visibleSteps - 1];
					this.#hideStep(currentStep);
					if (this.#visibleSteps > 0) {
						this.#emitEvent('notify-live', this.#steps[this.#visibleSteps - 1].textContent);
					}
					// if no steps remain, #hideStep already announced the title
				}
				break;
			case 'next':
				if (this.#hiddenSteps === 0) {
					this.#emitEvent('set-slide', 'next');
				} else {
					const stepToShowIndex = this.#steps.length - this.#hiddenSteps;
					const stepToShow = this.#steps[stepToShowIndex];
					this.#showStep(stepToShow);
				}
				break;
			default:
				break;
		}

	}

	#listenerSetStep = (e) => {
		if (typeof e.detail !== 'string') return;
		if (['prev', 'next'].includes(e.detail)) {
			this.setStep(e.detail);
		}
	}

	#emitEvent(type, detail) {
		document.dispatchEvent(new CustomEvent(type, { detail }));
	}

}
customElements.define('rc-slide', RCSlide);

function extendRCSlide() {
	return class extends RCSlide { };
}
customElements.define('rc-slide-cover', extendRCSlide());
customElements.define('rc-slide-section', extendRCSlide());
customElements.define('rc-slide-bullet', extendRCSlide());
customElements.define('rc-slide-code', extendRCSlide());
customElements.define('rc-slide-image', extendRCSlide());
