import { Store } from '../state/store'
import config from '../front.config'

export default class Input extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: 'open' })
		const template = document.createElement('template')
		template.innerHTML = /*html*/ `
            <style>
                #hiddenInput {
					opacity: 0%;
                }
            </style>
            <div>
                <textarea id="hiddenInput" type="text" autocomplete="off" autocorrect="off" maxlength="${config.maxInputLength}"></textarea>
            </div>
        `
		this.shadowRoot.appendChild(template.content.cloneNode(true))
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

	focusInput() {
		this.shadowRoot.getElementById('hiddenInput').focus()
	}
}

customElements.define('input-el', Input)
