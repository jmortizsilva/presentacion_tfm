class RCPresentation extends HTMLElement {

	#slidesQuery = 'rc-slide, rc-slide-cover, rc-slide-section, rc-slide-bullet, rc-slide-code, rc-slide-image';  // Defines the selector for slide nodes search
	#slides = []; // Stores all slide DOM nodes
	currentSlideNumber = 1;  // Holds currently displayed slide number

	validColors = [
		'normal',
		'high-contrast',
		'inverted',
		't3chfest'
	];
	#currentColorIndex;
	color;

	connectedCallback() {
		//console.log('cargando presentación...');
		if (this.isDisabled()) return;
		document.addEventListener('DOMContentLoaded', this.#setupPresentation);  // read slides only when fully loaded
		document.addEventListener('set-slide', this.#listenerSetSlide);
		document.addEventListener('set-color', this.#listenerSetColor);
	}
	disconnectedCallback() {
		document.removeEventListener('set-slide', this.#listenerSetSlide);
		document.removeEventListener('set-color', this.#listenerSetColor);
	}
	isDisabled() {
		if (this.hasAttribute('disabled')) {
			this.remove();
			return true;
		} else return false;
	}

	#setupPresentation = () => {
		this.#showLoadedImages();
		this.#slides = Array.from(this.querySelectorAll(this.#slidesQuery));
		if (!this.#slides) return;

		this.setColor(this.getAttribute('color'));
		this.setSlide(this.getAttribute('start') || this.currentSlideNumber);
	}

	#showLoadedImages() {
		const images = this.querySelectorAll('img');
		if (!images.length) return;

		const handleLoad = (img) => {
			img.classList.remove('loading', 'load-error');
		};

		const handleError = (img) => {
			img.classList.remove('loading');
			img.classList.add('load-error');
		};

		images.forEach((img) => {
			// Start hidden unless the image has already loaded successfully.
			img.classList.add('loading');

			if (img.complete) {
				if (img.naturalWidth > 0) {
					handleLoad(img);
				} else {
					handleError(img);
				}
				return;
			}

			img.addEventListener('load', () => handleLoad(img), { once: true });
			img.addEventListener('error', () => handleError(img), { once: true });
		});
	}

	setSlide(targetSlide) {
		let enterAtEnd = false;
		switch (targetSlide) {
			case 'prev':
				this.currentSlideNumber--; break;
			case 'prev-end':
				// stepping backwards past the start of a slide: open the
				// previous slide with all its steps already revealed
				this.currentSlideNumber--; enterAtEnd = true; break;
			case 'next':
				this.currentSlideNumber++; break;
			case 'first':
				this.currentSlideNumber = 1; break;
			case 'last':
				this.currentSlideNumber = this.#slides.length; break;
			default:
				this.currentSlideNumber = parseInt(targetSlide) || this.currentSlideNumber; break;
		}
		// Ensure current slide number is between 1 and total slide count.
		this.currentSlideNumber = Math.max(1, Math.min(this.currentSlideNumber, this.#slides.length));
		//console.log(`${this.currentSlideNumber} of ${this.#slides.length}`);

		const currentSlideNode = this.#slides[this.currentSlideNumber - 1];
		// Tell the slide how to set itself up (read in RCSlide #setupSlide)
		// before it is connected to the DOM.
		if (enterAtEnd) {
			currentSlideNode.setAttribute('data-enter', 'end');
		} else {
			currentSlideNode.removeAttribute('data-enter');
		}
		this.innerHTML = '';
		this.appendChild(currentSlideNode);
		const slideHeading = currentSlideNode?.querySelector('h1, h2, h3, h4, h5, h6');
		const slideTitle = (slideHeading?.textContent || currentSlideNode?.firstElementChild?.textContent || '').trim();
		const slideMessage = slideTitle
			? `Diapositiva ${this.currentSlideNumber} de ${this.#slides.length}: ${slideTitle}`
			: `Diapositiva ${this.currentSlideNumber} de ${this.#slides.length}`;
		this.#emitEvent('notify-live', slideMessage);
		this.#emitEvent('changed-slide', this.currentSlideNumber);
	}
	setColor(targetColor) {
		switch (targetColor) {
			case 'prev':
				this.#currentColorIndex--; break;
			case 'next':
				this.#currentColorIndex++; break;
			case 'first':
				this.#currentColorIndex = 0; break;
			case 'last':
				this.#currentColorIndex = this.validColors.length - 1; break;
			default:
				this.#currentColorIndex = this.validColors.includes(targetColor)
					? this.validColors.indexOf(targetColor)
					: this.#currentColorIndex || 0;
				break;
		}
		// Ensures value stays within range, cycles if bounds are exceeded
		this.#currentColorIndex = (this.#currentColorIndex + this.validColors.length) % this.validColors.length;
		const newColor = this.validColors[this.#currentColorIndex];
		if (newColor !== this.color) {
			this.color = newColor;
			if (this.color === 'normal') {
				document.documentElement.removeAttribute('class');
			} else {
				document.documentElement.setAttribute('class', this.color);
			}
			this.#emitEvent('notify-live', `Color cambiado a ${this.color}`);
			this.#emitEvent('changed-color', this.color);
		}
	}

	#listenerSetSlide = (e) => {
		if (typeof e.detail !== 'string') return;
		this.setSlide(e.detail);
	}
	#listenerSetColor = (e) => {
		if (typeof e.detail !== 'string') return;
		this.setColor(e.detail);
	}

	#emitEvent(type, detail) {
		document.dispatchEvent(new CustomEvent(type, { detail }));
	}

}
customElements.define('rc-presentation', RCPresentation);
