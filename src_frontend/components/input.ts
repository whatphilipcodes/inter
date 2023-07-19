import { Store } from '../state/store'
import config from '../front.config'

export default class Input extends HTMLElement {
	textarea: HTMLTextAreaElement
	constructor() {
		super()
		this.attachShadow({ mode: 'open' })
		const template = document.createElement('template')
		template.innerHTML = /*html*/ `
            <style>
                #hiddenInput {
					opacity: ${config.showHiddenInput ? 100 : 0};
					position: absolute;
					bottom: 0;
					left: 0;
					pointer-events: none;
                }
            </style>
            <div>
                <textarea id="hiddenInput" type="text" autocomplete="off" autocorrect="off" maxlength="${
									config.maxInputLength
								}"></textarea>
            </div>
        `
		this.shadowRoot.appendChild(template.content.cloneNode(true))
		this.textarea = this.shadowRoot.getElementById(
			'hiddenInput'
		) as HTMLTextAreaElement
		this.textarea.addEventListener('blur', () => {
			this.textarea.focus()
		})
		this.textarea.focus()
	}

	// connect input to global state
	initInput(state: Store) {
		this.shadowRoot
			.getElementById('hiddenInput')
			.addEventListener('input', (e: Event) => {
				const target = e.target as HTMLInputElement
				state.mutate({ input: target.value })
			})
	}
}

customElements.define('input-el', Input)
