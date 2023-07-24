import * as THREE from 'three'
/**
 * Converts a point from normal device coordinates (NDC) to world space.
 *
 * For example, (-1, -1) is the bottom right of the screen, (1, 1) is the top left.
 * The z component positions the point relative to near plane (-1) and far plane (1).
 * The z component will be set to -1 if only the x and y components are provided.
 *
 * @param {THREE.Camera} camera - The camera to use for the conversion.
 * @param {number} x - NDC x coordinate.
 * @param {number} y - NDC y coordinate.
 * @param {number} z - NDC z coordinate.
 * @returns {THREE.Vector3} The world-space position corresponding to the NDC point.
 */
function screenToWorld(
	camera: THREE.Camera,
	x: number,
	y: number,
	z = -1
): THREE.Vector3 {
	const ndc = new THREE.Vector3(x, y, z)
	const worldPos = ndc.unproject(camera)
	return worldPos
}

/**
 * Converts a 3D world position to pixel coordinates on the canvas or screen.
 *
 * @param {THREE.Camera} camera - The camera used for rendering the Three.js scene.
 * @param {number} screenWidth - The width of the canvas or screen where the Three.js scene is rendered.
 * @param {number} screenHeight - The height of the canvas or screen where the Three.js scene is rendered.
 * @param {THREE.Vector3} x - The 3D world position to convert.
 *
 * @returns {THREE.Vector2} - A Vector2 representing the pixel coordinates (x, y) on the canvas or screen.
 */
function worldToPixel(
	camera: THREE.Camera,
	screenWidth: number,
	screenHeight: number,
	vector: THREE.Vector3
) {
	// Step 1: Get 3D world position
	const position = vector.clone()
	// Step 2: Project to screen space (normalized coordinates)
	position.project(camera)

	// Step 3: Convert normalized screen coordinates to pixel coordinates
	const x_coor = (position.x / 2) * (screenWidth / window.devicePixelRatio)

	const y_coor = (-position.y / 2) * (screenHeight / window.devicePixelRatio)

	// Return the pixel coordinates as a Vector2
	return new THREE.Vector2(x_coor, y_coor)
}

export { screenToWorld, worldToPixel }