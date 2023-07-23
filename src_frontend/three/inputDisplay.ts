import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import * as THREE from 'three'
import {
	Text /*, getCaretAtPoint, getSelectionRects*/,
} from 'troika-three-text'
import TextCursor from './textCursor'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { screenToWorld, worldToPixel } from '../utils/threeUtil'

export default class InputDisplay extends SceneSubject {
	// Refs
	state: Store
	camera: THREE.OrthographicCamera
	// Props
	origin: THREE.Vector3
	textcursor: TextCursor
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	troika: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	caretPositions: any

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
		// this.setPixelWidth()
		this.caretPositions = new Float32Array(0)

		// Create Text Cursor
		this.textcursor = new TextCursor(this.origin)
		this.scene.add(this.textcursor.get())

		this.state.subscribe('input', () => this.syncDisplay())
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
		troika.overflowWrap = 'break-word'
		troika.whiteSpace = 'normal'
		troika.position.set(this.origin.x, this.origin.y, this.origin.z)
		return troika
	}

	buildDevUI(gui: GUI) {
		const folder = gui.addFolder('Input Display')
		folder.add(this.troika, 'fontSize', 0.01, 1).name('Font Size')
		folder.addColor(this.troika, 'color').name('Color')
	}

	update() {
		this.setCaretPos()
	}

	syncDisplay(): void {
		this.troika.text = this.state.input
		this.troika.sync(() => {
			this.caretPositions = structuredClone(
				this.troika.textRenderInfo.caretPositions
			)
		})
	}

	onWindowResize(): void {
		this.origin = screenToWorld(this.camera, -1, 1)
		this.textcursor.setAnchor(this.origin)
		this.troika.position.set(this.origin.x, this.origin.y, this.origin.z)
		this.troika.maxWidth = this.camera.right - this.camera.left
	}

	setCaretPos(): void {
		const currentPos = (this.state.cursorPos - 1) * 4
		// Float32Array contains n + 0: left, n + 1: right, n + 2: bottom, n + 3: top for each caret
		// they are relative to the text's anchor point, so we need to add the text's position to them
		const currentCaretPos = {
			left: this.caretPositions[currentPos],
			right: this.caretPositions[currentPos + 1],
			bottom: this.caretPositions[currentPos + 2],
			top: this.caretPositions[currentPos + 3],
		}
		this.textcursor.update(
			new THREE.Vector2(currentCaretPos.right, currentCaretPos.top)
		)
	}

	// async setFontSize(): Promise<void> {
	// 	const height =
	// 		this.troika.textRenderInfo.glyphBounds[0] -
	// 		this.troika.textRenderInfo.glyphBounds[1]
	// 	const pixelHeight = worldToPixel(
	// 		this.camera,
	// 		this.state.screenWidth,
	// 		this.state.screenHeight,
	// 		new THREE.Vector3(0, height, this.origin.z)
	// 	)
	// 	this.state.mutate({
	// 		fontSize: pixelHeight.y,
	// 	})
	// }

	// setPixelWidth(): void {
	// 	const width = this.troika.maxWidth
	// 	const pixelWidth = worldToPixel(
	// 		this.camera,
	// 		this.state.screenWidth,
	// 		this.state.screenHeight,
	// 		new THREE.Vector3(width, 0, this.origin.z)
	// 	)
	// 	this.state.mutate({
	// 		inputWidth: pixelWidth.y,
	// 	})
	// }
}
