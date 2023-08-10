import * as THREE from 'three'
import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import {
	screenToWorld,
	getHelper2DBox,
	getHelperLine,
} from '../utils/threeUtil'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'

export default class Grid extends SceneSubject {
	// Screen dependent variables
	screenWidthWorld: number
	screenHeightWorld: number
	contentWidth: number
	contentHeight: number
	origin: THREE.Vector3

	// Calculation dependent variables
	leftBottom: THREE.Vector3
	lineHeight: number
	spacing: number
	counterpartMsgOffset: number
	counterpartIndOffset: number
	messageWidth: number

	// Debugging
	helperBox: THREE.BoxHelper
	helperIndicatorL: THREE.Line
	helperTextSpacerL: THREE.Line
	helperCounterpartOffset: THREE.Line
	helperMsgWidthOffset: THREE.Line
	helperIndicatorR: THREE.Line
	helperTextSpacerR: THREE.Line

	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store
	) {
		super(name, scene, camera, state)
		this.propertiesChanged()
		this.state.subscribe('cursorWidthRatio', () => {
			this.propertiesChanged()
		})
	}

	propertiesChanged(): void {
		this.calculateOrigin()
		this.calculateScreenDimensions()
		this.calculateTextDimensions()
		this.state.mutate({
			contentWidth: this.contentWidth,
			contentHeight: this.contentHeight,
			lineHeight: this.lineHeight,
			spacing: this.spacing,
			counterpartMsgOffset: this.counterpartMsgOffset,
			counterpartIndOffset: this.counterpartIndOffset,
			messageWidth: this.messageWidth,
			leftBottom: this.leftBottom,
			origin: this.origin,
		})
	}

	calculateOrigin(): void {
		this.origin = screenToWorld(this.camera, -1, -1)
		this.leftBottom = this.origin
			.clone()
			.add(new THREE.Vector3(this.state.padding, this.state.padding))
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

	calculateTextDimensions(): void {
		this.lineHeight = this.contentHeight * (1 / this.state.numLines)
		this.spacing = this.lineHeight * this.state.numLinesSpacing
		this.messageWidth =
			(this.contentWidth - 2 * this.spacing) * this.state.messageWidthRatio
		this.counterpartMsgOffset =
			(this.contentWidth - 2 * this.spacing) * this.state.counterpartOffsetRatio
		this.counterpartIndOffset =
			this.contentWidth - this.state.cursorWidthRatio * this.spacing
	}

	buildGridHelper(): void {
		// bounding box
		this.helperBox = getHelper2DBox(
			this.state.leftBottom,
			this.state.contentWidth,
			this.state.contentHeight
		)
		this.scene.add(this.helperBox)

		// offsetIndicatorL
		const offsetIndicatorLStart = this.state.leftBottom.clone()
		const offsetIndicatorLEnd = offsetIndicatorLStart
			.clone()
			.add(new THREE.Vector3(0, this.state.contentHeight, 0))
		this.helperIndicatorL = getHelperLine(
			offsetIndicatorLStart,
			offsetIndicatorLEnd,
			new THREE.Color(0x0000ff)
		)
		this.scene.add(this.helperIndicatorL)

		// helperTextSpacerL
		const offsetSpacerLStart = this.state.leftBottom
			.clone()
			.add(new THREE.Vector3(this.state.spacing, 0, 0))
		const offsetSpacerLEnd = offsetSpacerLStart
			.clone()
			.add(new THREE.Vector3(0, this.state.contentHeight, 0))
		this.helperTextSpacerL = getHelperLine(offsetSpacerLStart, offsetSpacerLEnd)
		this.scene.add(this.helperTextSpacerL)

		// helperCounterpartOffset
		const offsetRightStart = this.state.leftBottom
			.clone()
			.add(
				new THREE.Vector3(
					this.state.spacing + this.state.counterpartMsgOffset,
					0,
					0
				)
			)
		const offsetRightEnd = offsetRightStart
			.clone()
			.add(new THREE.Vector3(0, this.state.contentHeight, 0))
		this.helperCounterpartOffset = getHelperLine(
			offsetRightStart,
			offsetRightEnd
		)
		this.scene.add(this.helperCounterpartOffset)

		// helperMsgWidthOffset
		const offsetMsgWidthStart = this.state.leftBottom
			.clone()
			.add(
				new THREE.Vector3(this.state.messageWidth + this.state.spacing, 0, 0)
			)
		const offsetMsgWidthEnd = offsetMsgWidthStart
			.clone()
			.add(new THREE.Vector3(0, this.state.contentHeight, 0))
		this.helperMsgWidthOffset = getHelperLine(
			offsetMsgWidthStart,
			offsetMsgWidthEnd
		)
		this.scene.add(this.helperMsgWidthOffset)

		// helperTextSpacerR
		const offsetInRStart = this.state.leftBottom
			.clone()
			.add(
				new THREE.Vector3(this.state.contentWidth - this.state.spacing, 0, 0)
			)
		const offsetInREnd = offsetInRStart
			.clone()
			.add(new THREE.Vector3(0, this.state.contentHeight, 0))
		this.helperTextSpacerR = getHelperLine(offsetInRStart, offsetInREnd)
		this.scene.add(this.helperTextSpacerR)

		// offsetIndicatorR
		const offsetIndicatorRStart = this.state.leftBottom
			.clone()
			.add(new THREE.Vector3(this.state.counterpartIndOffset, 0, 0))
		const offsetIndicatorREnd = offsetIndicatorRStart
			.clone()
			.add(new THREE.Vector3(0, this.state.contentHeight, 0))
		this.helperIndicatorR = getHelperLine(
			offsetIndicatorRStart,
			offsetIndicatorREnd,
			new THREE.Color(0x0000ff)
		)
		this.scene.add(this.helperIndicatorR)
	}

	clearGridHelper(): void {
		this.scene.remove(this.helperBox)
		this.scene.remove(this.helperIndicatorL)
		this.scene.remove(this.helperTextSpacerL)
		this.scene.remove(this.helperTextSpacerR)
		this.scene.remove(this.helperCounterpartOffset)
		this.scene.remove(this.helperMsgWidthOffset)
		this.scene.remove(this.helperIndicatorR)
		this.helperBox.dispose()
	}

	// Callback Implementations
	buildDevUI(gui: GUI): void {
		this.buildGridHelper()
		// gui settings
		const gridFolder = gui.addFolder('Grid')
		gridFolder
			.add(this.state, 'padding', 0, 0.4, 0.01)
			.onChange((value: number) => {
				this.state.mutate({ padding: value })
				this.propertiesChanged()
			})
		gridFolder
			.add(this.state, 'numLines', 10, 36, 1)
			.onChange((value: number) => {
				this.state.mutate({ numLines: value })
				this.propertiesChanged()
			})
		gridFolder
			.add(this.state, 'numLinesSpacing', 0, 10, 1)
			.onChange((value: number) => {
				this.state.mutate({ numLinesSpacing: value })
				this.propertiesChanged()
			})
		gridFolder
			.add(this.state, 'messageWidthRatio', 0, 1, 0.01)
			.onChange((value: number) => {
				this.state.mutate({ messageWidthRatio: value })
				this.propertiesChanged()
			})
		gridFolder
			.add(this.state, 'counterpartOffsetRatio', 0, 1, 0.01)
			.onChange((value: number) => {
				this.state.mutate({ counterpartOffsetRatio: value })
				this.propertiesChanged()
			})
	}

	updateDevUI(): void {
		this.clearGridHelper()
		this.buildGridHelper()
	}

	onWindowResize(): void {
		this.propertiesChanged()
	}
}
