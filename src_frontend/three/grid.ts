import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import * as THREE from 'three'
import { screenToWorld, getHelper2DBox } from '../utils/threeUtil'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'

export default class Grid extends SceneSubject {
	// Screen dependent variables
	screenWidthWorld: number
	screenHeightWorld: number
	contentWidth: number
	contentHeight: number

	// Calculation dependent variables
	lineHeight: number
	rightOffset: number
	messageWidth: number
	leftBottom: THREE.Vector3

	// Debugging
	helperBox: THREE.BoxHelper

	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store
	) {
		super(name, scene, camera, state)
		this.propertiesChanged()
	}

	propertiesChanged(): void {
		this.leftBottom = screenToWorld(this.camera, -1, -1)
		this.calculateScreenDimensions()
		this.calculateMessageDimensions()
		this.state.mutate({
			contentWidth: this.contentWidth,
			contentHeight: this.contentHeight,
			lineHeight: this.lineHeight,
			rightOffset: this.rightOffset,
			messageWidth: this.messageWidth,
			leftBottom: this.leftBottom,
		})
	}

	calculateScreenDimensions(): void {
		this.screenWidthWorld = screenToWorld(this.camera, 1, 1).distanceTo(
			screenToWorld(this.camera, -1, 1)
		)
		this.screenHeightWorld = screenToWorld(this.camera, 1, 1).distanceTo(
			screenToWorld(this.camera, 1, -1)
		)
		this.contentWidth = this.screenWidthWorld - this.state.padding * 2
		this.contentHeight = this.screenHeightWorld - this.state.padding * 2
	}

	calculateMessageDimensions(): void {
		this.rightOffset = this.contentWidth * this.state.rightOffsetRatio
		this.messageWidth = this.contentWidth * this.state.messageWidthRatio
		this.lineHeight = this.contentHeight * (1 / this.state.numLines)
	}

	// Callback Implementations
	buildDevUI(gui: GUI): void {
		// on screen visualisation
		this.helperBox = getHelper2DBox(
			this.leftBottom
				.clone()
				.add(new THREE.Vector3(this.state.padding, this.state.padding)),
			this.contentWidth,
			this.contentHeight
		)
		this.scene.add(this.helperBox)

		// gui settings
		const gridFolder = gui.addFolder('Grid')
		gridFolder.add(this.state, 'padding', 0, 0.4, 0.01).onChange(() => {
			this.propertiesChanged()
		})
		gridFolder.add(this.state, 'numLines', 1, 36, 1).onChange(() => {
			this.propertiesChanged()
		})
		gridFolder.add(this.state, 'numLinesSpacing', 0, 10, 1).onChange(() => {
			this.propertiesChanged()
		})
		gridFolder.add(this.state, 'messageWidthRatio', 0, 1, 0.01).onChange(() => {
			this.propertiesChanged()
		})
		gridFolder.add(this.state, 'rightOffsetRatio', 0, 1, 0.01).onChange(() => {
			this.propertiesChanged()
		})
	}

	updateDevUI(): void {
		this.scene.remove(this.helperBox)
		this.helperBox.dispose()
		this.helperBox = getHelper2DBox(
			this.leftBottom
				.clone()
				.add(new THREE.Vector3(this.state.padding, this.state.padding)),
			this.contentWidth,
			this.contentHeight
		)
		this.scene.add(this.helperBox)
	}

	onWindowResize(): void {
		this.propertiesChanged()
	}
}
