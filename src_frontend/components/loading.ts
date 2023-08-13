export default class Loading extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: 'open' })
		const template = document.createElement('template')
		template.innerHTML = /*html*/ `
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                :host {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: black;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999; // To ensure it overlays everything
                }

                .spinner {
                    width: 50px;
                    height: 50px;
                    background-color: white;
                    animation: spin 2s linear infinite;
                }
            </style>
            <div>
                <div class="spinner"></div>
            </div>
        `

		this.shadowRoot.appendChild(template.content.cloneNode(true))
	}
}

customElements.define('loading-el', Loading)
