import * as THREE from 'three'
// import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'
import { Text } from 'troika-three-text'

import config from '../front.config'
import { getPointsVisu, hasNaN } from '../utils/threeUtil'
import { ConvoText, ConvoType } from '../utils/types'
import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import Cursor from './cursor'

export default class Message extends SceneSubject {
	// Props
	text: ConvoText
	height: number
	senderInd: Cursor
	indicatorPos: THREE.Vector3
	offset: number
	scroll: number
	visible: boolean
	scrollable: boolean

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	troika: any

	// Debugging
	boxHelper: THREE.BoxHelper
	positionHelper: THREE.Points

	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store,
		text: ConvoText
	) {
		super(name, scene, camera, state)

		this.visible = true
		this.text = text
		this.indicatorPos = this.position.clone()
		this.scroll = 0
		this.scrollable = false

		// Create Text
		this.troika = new Text()
		this.setTextSettings()
		this.setHorizontalPosition()
		this.syncText()

		// Create Role Indicator
		this.senderInd = new Cursor()

		// add to scene
		this.scene.add(this.troika)
		this.scene.add(this.senderInd.get())

		// Listen to troika Syncs
		this.troika.addEventListener('synccomplete', () => {
			this.setHeight()
		})
	}

	unbuild(): void {
		this.scene.remove(this.troika)
		this.scene.remove(this.senderInd.get())
		this.troika.dispose()
		this.senderInd.unbuild()
		if (this.boxHelper) {
			this.scene.remove(this.boxHelper)
		}
		if (this.positionHelper) {
			this.scene.remove(this.positionHelper)
		}
	}

	// Methods
	private setHorizontalPosition(): void {
		switch (this.text.type) {
			case ConvoType.input:
				this.position.setX(this.state.leftBottom.x + this.state.spacing)
				this.indicatorPos.setX(this.state.leftBottom.x)
				break
			case ConvoType.response:
				this.position.setX(
					this.state.leftBottom.x + this.state.spacing + this.state.ctpOffset
				)
				if (config.truthScore) {
					this.position.setX(
						this.position.x - this.state.ctpOffset * this.text.trust
					)
				}
				this.indicatorPos.setX(
					this.state.leftBottom.x + this.state.ctpIndicator
				)
				break
			default:
				throw new Error('Invalid sender')
		}
	}

	setVerticalPosition(): void {
		this.position.setY(this.offset + this.scroll)
		this.indicatorPos.setY(this.position.y)
	}

	updateVisibility(): void {
		if (this.position.y + this.height < this.state.leftBottom.y) {
			this.visible = false
		}
	}

	private setTextSettings(): void {
		this.troika.font = './assets/cascadiacode/CascadiaMono-Regular.ttf'
		this.troika.fontSize =
			this.state.lineHeight / this.state.fontLineHeightRatio
		this.troika.lineHeight = this.state.fontLineHeightRatio
		this.troika.sdfGlyphSize = this.state.sdfGlyphSize
		this.troika.color = 0xffffff
		this.troika.anchorX = 'left'
		this.troika.anchorY = 'bottom'
		this.troika.maxWidth = this.state.msgWidth
		this.troika.overflowWrap = 'break-word'
		this.troika.whiteSpace = 'normal'
	}

	private syncText(): void {
		this.troika.position.copy(this.position)
		this.troika.text = this.text.text
		this.troika.sync()
	}

	async setHeight(): Promise<void> {
		// This is necessary because because troika syncs can happen before the geometry is ready
		while (!this.troika.textRenderInfo) {
			await new Promise((resolve) => setTimeout(resolve, 1))
		}
		return new Promise((resolve) => {
			this.height =
				this.troika.geometry.boundingBox.max.y -
				this.troika.geometry.boundingBox.min.y

			this.senderInd.setDimensions(
				this.state.lineHeight * this.state.cursorWidthRatio,
				this.height
			)
			//this.scrollable = true
			resolve()
		})
	}

	// Callback Implementations
	update(): void {
		this.setTextSettings()
		this.setHorizontalPosition()
		this.setVerticalPosition()
		this.senderInd.update(this.indicatorPos)
		this.syncText()
	}

	buildDevUI(): void {
		this.boxHelper = new THREE.BoxHelper(this.troika)
		this.scene.add(this.boxHelper)
		this.positionHelper = getPointsVisu(
			this.position.clone(),
			new THREE.Color(0xff0000)
		)
		this.scene.add(this.positionHelper)
	}

	updateDevUI(): void {
		this.senderInd.setDimensions(
			this.state.lineHeight * this.state.cursorWidthRatio,
			this.height
		)

		if (!hasNaN(this.troika.position)) {
			this.boxHelper?.update()
		}
		this.scene.remove(this.positionHelper)
		this.positionHelper = getPointsVisu(
			this.position.clone(),
			new THREE.Color(0xff00ff)
		)
		this.scene.add(this.positionHelper)
	}

	onWindowResize(): void {
		//
	}
}
