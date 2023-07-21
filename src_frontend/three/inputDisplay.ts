import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import * as THREE from 'three'
import {
	Text /*, getCaretAtPoint, getSelectionRects*/,
} from 'troika-three-text'
import TextCursor from './textCursor'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { screenToWorld } from '../utils/threeUtil'

export default class InputDisplay extends SceneSubject {
	// Refs
	state: Store
	camera: THREE.OrthographicCamera
	// Props
	origin: THREE.Vector3
	textcursor: TextCursor
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	troika: any

	constructor(
		name: string,
		scene: THREE.Scene,
		state: Store,
		camera: THREE.OrthographicCamera
	) {
		super(name, scene)

		// Get References
		this.state = state
		this.camera = camera
		this.origin = screenToWorld(camera, -1, 1)

		// Create Troika Text
		this.troika = this.buildTroika()
		this.scene.add(this.troika)

		// Create Text Cursor
		this.textcursor = new TextCursor(this.origin)
		this.scene.add(this.textcursor.get())

		this.state.subscribe('input', () => this.syncDisplay())
		this.state.subscribe('cursorPos', () => this.setCaretPos())
	}

	buildTroika() {
		const troika = new Text()
		troika.font = './assets/cascadiacode/ttf/static/CascadiaMono-Regular.ttf'
		troika.fontSize = 1
		troika.sdfGlyphSize = 64
		troika.color = 0xffffff
		troika.anchorX = 'left'
		troika.anchorY = 'top'
		troika.maxWidth = this.camera.right - this.camera.left
		troika.overflowWrap = 'normal'
		troika.whiteSpace = 'normal'
		troika.position.set(this.origin.x, this.origin.y, this.origin.z)
		return troika
	}

	buildDevUI(gui: GUI) {
		const folder = gui.addFolder('Input Display')
		folder.add(this.troika, 'fontSize', 0.01, 1).name('Font Size')
		folder.addColor(this.troika, 'color').name('Color')
		gui.open()
	}

	update() {
		//
	}

	syncDisplay(): void {
		this.troika.text = this.state?.input
		this.troika.sync()
	}

	onWindowResize(): void {
		this.origin = screenToWorld(this.camera, -1, 1)
		this.textcursor.setAnchor(this.origin)
		this.troika.position.set(this.origin.x, this.origin.y, this.origin.z)
		this.troika.maxWidth = this.camera.right - this.camera.left
	}

	setCaretPos(): void {
		if (this.state.cursorPos === 0) {
			this.textcursor.update(new THREE.Vector2(0, 0))
			return
		}
		// shift back by 1 since array index starts at 0
		const currentPos = (this.state.cursorPos - 1) * 4
		// console.log(this.troika.textRenderInfo.caretPositions)
		// Float32Array contains n + 0: left, n + 1: right, n + 2: bottom, n + 3: top for each caret
		// they are relative to the text's anchor point, so we need to add the text's position to them
		// console.log(currentPos)
		const currentCaretPos = {
			left: this.troika.textRenderInfo.caretPositions[currentPos],
			right: this.troika.textRenderInfo.caretPositions[currentPos + 1],
			bottom: this.troika.textRenderInfo.caretPositions[currentPos + 2],
			top: this.troika.textRenderInfo.caretPositions[currentPos + 3],
		}
		// console.log(currentCaretPos)
		this.textcursor.update(
			new THREE.Vector2(currentCaretPos.right, currentCaretPos.top)
		)
	}
}
