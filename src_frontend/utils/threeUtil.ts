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

export { screenToWorld }
