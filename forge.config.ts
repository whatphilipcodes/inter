import type { ForgeConfig } from '@electron-forge/shared-types'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives'
import { WebpackPlugin } from '@electron-forge/plugin-webpack'

import { mainConfig } from './webpack.main.config'
import { rendererConfig } from './webpack.renderer.config'

import dotenv from 'dotenv'
dotenv.config({ path: '.env.development.local' })

// Don't include backend resources on mac testbuilds
const extraResources: string[] = []
if (process.platform === 'win32' && process.env.INCLUDE_BACKEND === 'true') {
	extraResources.push('./dist/backend')
}

const config: ForgeConfig = {
	packagerConfig: {
		asar: true,
		extraResource: extraResources,
		icon: './assets/icon/inter',
	},
	rebuildConfig: {},
	makers: [new MakerSquirrel({}), new MakerZIP({})],
	publishers: [
		{
			name: '@electron-forge/publisher-github',
			config: {
				authToken: process.env.GITHUB_TOKEN,
				repository: {
					owner: 'whatphilipcodes',
					name: 'inter',
				},
				prerelease: true,
			},
		},
	],
	plugins: [
		new AutoUnpackNativesPlugin({}),
		new WebpackPlugin({
			mainConfig,
			renderer: {
				config: rendererConfig,
				entryPoints: [
					{
						html: './src_frontend/index.html',
						js: './src_frontend/renderer.ts',
						name: 'main_window',
						preload: {
							js: './src_frontend/preload.ts',
						},
					},
				],
			},
		}),
	],
}

export default config
