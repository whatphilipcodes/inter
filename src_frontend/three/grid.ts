import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'

import SceneSubject from './_sceneSubject'
import { Store } from '../state/store'
import {
	screenToWorld,
	getHelper2DBox,
	getHelperLine,
} from '../utils/threeUtil'

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

	ctpOffset: number
	msgWidth: number
	ctpWidth: number

	msgIndicator: number
	loaIndicator: number
	ctpIndicator: number

	// Debugging
	helperBox: THREE.BoxHelper
	helperSpacingLeft: THREE.Line
	helperSpacingRight: THREE.Line
	helperCtpOffset: THREE.Line
	helperMsgWidth: THREE.Line
	helperMsgIndicator: THREE.Line
	helperLoaIndicator: THREE.Line
	helperCtpIndicator: THREE.Line

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
			origin: this.origin,
			leftBottom: this.leftBottom,
			contentWidth: this.contentWidth,
			contentHeight: this.contentHeight,
			lineHeight: this.lineHeight,
			spacing: this.spacing,
			msgWidth: this.msgWidth,
			ctpWidth: this.ctpWidth,
			ctpOffset: this.ctpOffset,
			msgIndicator: this.msgIndicator,
			loaIndicator: this.loaIndicator,
			ctpIndicator: this.ctpIndicator,
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
		this.msgWidth =
			(this.contentWidth - 2 * this.spacing) * this.state.msgWidthRatio
		this.ctpOffset =
			(this.contentWidth - 2 * this.spacing) * this.state.ctpOffsetRatio
		this.ctpWidth = Math.min(
			this.contentWidth - 2 * this.spacing - this.ctpOffset,
			this.msgWidth
		)
		this.loaIndicator = this.ctpOffset - this.spacing
		this.ctpIndicator =
			this.spacing +
			this.ctpOffset +
			this.ctpWidth +
			this.spacing * (1 - this.state.cursorWidthRatio)
	}

	buildGridHelper(): void {
		// bounding box
		this.helperBox = getHelper2DBox(
			this.state.leftBottom,
			this.state.contentWidth,
			this.state.contentHeight,
			new THREE.Color(0xff0000)
		)
		this.scene.add(this.helperBox)

		// msgIndicator
		const msgIndicatorStart = this.state.leftBottom.clone()
		const msgIndicatorEnd = msgIndicatorStart
			.clone()
			.add(new THREE.Vector3(0, this.state.contentHeight, 0))
		this.helperMsgIndicator = getHelperLine(
			msgIndicatorStart,
			msgIndicatorEnd,
			new THREE.Color(0x0000ff)
		)
		this.scene.add(this.helperMsgIndicator)

		// helperSpacingLeft
		const helperSpacingLeftStart = this.state.leftBottom
			.clone()
			.add(new THREE.Vector3(this.state.spacing, 0, 0))
		const helperSpacingLeftEnd = helperSpacingLeftStart
			.clone()
			.add(new THREE.Vector3(0, this.state.contentHeight, 0))
		this.helperSpacingLeft = getHelperLine(
			helperSpacingLeftStart,
			helperSpacingLeftEnd
		)
		this.scene.add(this.helperSpacingLeft)

		// helperCtpOffset
		const ctpOffsetStart = this.state.leftBottom
			.clone()
			.add(new THREE.Vector3(this.state.spacing + this.state.ctpOffset, 0, 0))
		const ctpOffsetEnd = ctpOffsetStart
			.clone()
			.add(new THREE.Vector3(0, this.state.contentHeight, 0))
		this.helperCtpOffset = getHelperLine(ctpOffsetStart, ctpOffsetEnd)
		this.scene.add(this.helperCtpOffset)

		// helperMsgWidth
		const helperMsgWidthStart = this.state.leftBottom
			.clone()
			.add(new THREE.Vector3(this.state.spacing + this.state.msgWidth, 0, 0))
		const helperMsgWidthEnd = helperMsgWidthStart
			.clone()
			.add(new THREE.Vector3(0, this.state.contentHeight, 0))
		this.helperMsgWidth = getHelperLine(helperMsgWidthStart, helperMsgWidthEnd)
		this.scene.add(this.helperMsgWidth)

		// helperLoaIndicator
		const loaIndicatorStart = this.state.leftBottom
			.clone()
			.add(
				new THREE.Vector3(this.state.spacing + this.state.loaIndicator, 0, 0)
			)
		const loaIndicatorEnd = loaIndicatorStart
			.clone()
			.add(new THREE.Vector3(0, this.state.contentHeight, 0))
		this.helperLoaIndicator = getHelperLine(
			loaIndicatorStart,
			loaIndicatorEnd,
			new THREE.Color(0x0000ff)
		)
		this.scene.add(this.helperLoaIndicator)

		// helperSpacingRight
		const offsetInRStart = this.state.leftBottom
			.clone()
			.add(
				new THREE.Vector3(
					this.state.spacing + this.state.ctpOffset + this.state.ctpWidth,
					0,
					0
				)
			)
		const offsetInREnd = offsetInRStart
			.clone()
			.add(new THREE.Vector3(0, this.state.contentHeight, 0))
		this.helperSpacingRight = getHelperLine(offsetInRStart, offsetInREnd)
		this.scene.add(this.helperSpacingRight)

		// helperCtpIndicator
		const offsetIndicatorRStart = this.state.leftBottom
			.clone()
			.add(new THREE.Vector3(this.state.ctpIndicator, 0, 0))
		const offsetIndicatorREnd = offsetIndicatorRStart
			.clone()
			.add(new THREE.Vector3(0, this.state.contentHeight, 0))
		this.helperCtpIndicator = getHelperLine(
			offsetIndicatorRStart,
			offsetIndicatorREnd,
			new THREE.Color(0x0000ff)
		)
		this.scene.add(this.helperCtpIndicator)
	}

	clearGridHelper(): void {
		this.scene.remove(this.helperBox)
		this.scene.remove(this.helperSpacingLeft)
		this.scene.remove(this.helperSpacingRight)
		this.scene.remove(this.helperMsgWidth)
		this.scene.remove(this.helperCtpOffset)
		this.scene.remove(this.helperMsgIndicator)
		this.scene.remove(this.helperLoaIndicator)
		this.scene.remove(this.helperCtpIndicator)
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
			.add(this.state, 'numLinesSpacing', 0, 5, 1)
			.onChange((value: number) => {
				this.state.mutate({ numLinesSpacing: value })
				this.propertiesChanged()
			})
		gridFolder
			.add(this.state, 'msgWidthRatio', 0, 1, 0.01)
			.onChange((value: number) => {
				this.state.mutate({ msgWidthRatio: value })
				this.propertiesChanged()
			})
		gridFolder
			.add(this.state, 'ctpOffsetRatio', 0, 1, 0.01)
			.onChange((value: number) => {
				this.state.mutate({ ctpOffsetRatio: value })
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
