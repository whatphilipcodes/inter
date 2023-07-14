class Input extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: 'open' })
		const template = document.createElement('template')
		template.innerHTML = /*html*/ `
            <style>
                /*
                #hiddenImport {
                    display: none;
                }
                */
            </style>
            <div>
                <input id="hiddenImport" type="text" placeholder="Type your message..." />
            </div>
        `
		this.shadowRoot.appendChild(template.content.cloneNode(true))
		this.focusInput()
	}

	focusInput() {
		this.shadowRoot.getElementById('hiddenImport').focus()
	}
}

customElements.define('input-el', Input)
