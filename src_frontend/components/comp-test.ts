const template = document.createElement('template');
template.innerHTML = /*html*/`
    <style>
        h1 { color: white; }
    </style>
    <h1>
        <slot></slot>
    </h1>
`;

class WebCompTest extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
}

customElements.define('web-comp-test', WebCompTest);