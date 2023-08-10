import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import * as THREE from 'three'
import { screenToWorld, getHelper2DBox } from '../utils/threeUtil'

import config from '../front.config'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'

export default class Grid extends SceneSubject {
	// Input Props
	padding: number
	numLines: number
	spacing: number

	// Screen dependent variables
	screenWidthWorld: number
	screenHeightWorld: number
	contentWidth: number
	contentHeight: number

	// Calculation dependent variables
	lineHeight: number
	responseOffset: number // 1/3 of screen width - margin
	messageWidth: number // 2/3 of screen width - margin
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

		this.padding = config.padding
		this.numLines = config.numLines
		this.spacing = config.spacingLines

		// left bottom corner of the screen as grid origin
		this.leftBottom = screenToWorld(this.camera, -1, -1)

		this.updateScreenDimensions()
		this.updateMessageDimensions()
	}

	buildDevUI(gui: GUI): void {
		// on screen visualisation
		this.helperBox = getHelper2DBox(
			this.leftBottom
				.clone()
				.add(new THREE.Vector3(this.padding, this.padding)),
			this.contentWidth,
			this.contentHeight
		)
		this.scene.add(this.helperBox)

		// gui settings
		const gridFolder = gui.addFolder('Grid')
		gridFolder.add(this, 'padding', 0, 0.4, 0.01).onChange(() => {
			this.propertiesChanged()
		})
		gridFolder.add(this, 'numLines', 1, 36, 1).onChange(() => {
			this.propertiesChanged()
		})
		gridFolder.add(this, 'spacing', 0, 10, 1).onChange(() => {
			this.propertiesChanged()
		})
	}

	propertiesChanged(): void {
		this.updateScreenDimensions()
		this.updateMessageDimensions()
	}

	updateScreenDimensions(): void {
		this.screenWidthWorld = screenToWorld(this.camera, 1, 1).distanceTo(
			screenToWorld(this.camera, -1, 1)
		)
		this.screenHeightWorld = screenToWorld(this.camera, 1, 1).distanceTo(
			screenToWorld(this.camera, 1, -1)
		)
		this.contentWidth = this.screenWidthWorld - this.padding * 2
		this.contentHeight = this.screenHeightWorld - this.padding * 2
	}

	updateMessageDimensions(): void {
		this.responseOffset = this.contentWidth / 3
		this.messageWidth = this.contentWidth * (2 / 3)
		this.lineHeight = this.contentHeight / 18 // devide the content height by the number of lines
	}

	// CALLBACKS
	update(): void {
		// needs to pass down the update call
	}

	updateDevUI(): void {
		this.scene.remove(this.helperBox)
		this.helperBox.dispose()
		this.helperBox = getHelper2DBox(
			this.leftBottom
				.clone()
				.add(new THREE.Vector3(this.padding, this.padding)),
			this.contentWidth,
			this.contentHeight
		)
		this.scene.add(this.helperBox)
	}

	onWindowResize(): void {
		this.propertiesChanged()
	}
}
