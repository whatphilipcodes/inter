import * as THREE from 'three'
import { Text, getCaretAtPoint, getSelectionRects } from 'troika-three-text'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import Cursor from './dynamicCursor'

// Utils
import { screenToWorld } from '../utils/threeUtil'

export default class InputDisplay extends SceneSubject {
	// Refs
	state: Store
	camera: THREE.OrthographicCamera
	// Props
	origin: THREE.Vector3
	troika //: troika-three-text
	dynCor: Cursor

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
		this.buildTroika()
	}

	buildTroika() {
		this.troika = new Text()
		this.troika.font =
			'./assets/cascadiacode/ttf/static/CascadiaMono-Regular.ttf'
		this.troika.fontSize = 1

		this.troika.sdfGlyphSize = 64
		this.troika.color = 0xffffff
		this.troika.anchorX = 'left'
		this.troika.anchorY = 'top'
		this.troika.maxWidth = this.camera.right - this.camera.left
		this.troika.overflowWrap = 'normal'
		this.troika.whiteSpace = 'normal'

		// Add the troika to the scene
		this.troika.position.set(this.origin.x, this.origin.y, this.origin.z)
		this.scene.add(this.troika)
		this.troika.addEventListener('synccomplete', () => {
			this.onSyncComplete()
		})
	}

	buildDevUI(gui: GUI) {
		const folder = gui.addFolder('Input Display')
		folder.add(this.troika, 'fontSize', 0.01, 1).name('Font Size')
		folder.addColor(this.troika, 'color').name('Color')
		gui.open()
	}

	update() {
		this.troika.text = this.state?.input
		this.troika.sync()
		// this.dynCor.update()
	}

	onSyncComplete() {
		// TODO
		this.testCaretPos()
	}

	updateState(state: Store): void {
		this.state = state
	}

	onWindowResize(): void {
		this.origin = screenToWorld(this.camera, -1, 1)
		this.troika.position.set(this.origin.x, this.origin.y, this.origin.z)
	}

	testCaretPos(): void {
		const textRenderInfo = this.troika.textRenderInfo
		const caretPosition = getSelectionRects(
			textRenderInfo,
			0,
			this.troika.text.length
		)
		console.log(textRenderInfo)
		console.log(caretPosition)
	}
}
