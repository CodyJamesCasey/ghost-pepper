/**
 * Figures out how far in every direction to shift the model in 3D space such
 * that the center of the model is at (0, 0, 0) in 3D space.
 *
 * @param  {BoundingBox} boundingBox The bounding box as calculated by three.js
 * @return {Array}             the amount to shift in every dimension [x,y,z]
 */
export function calculateCenteringVector(boundingBox) {
  // Get half of every dimension
  let halfX   = ((boundingBox.max.x - boundingBox.min.x) / 2);
  let halfY   = ((boundingBox.max.y - boundingBox.min.y) / 2);
  let halfZ   = ((boundingBox.max.z - boundingBox.min.z) / 2);
  // Get the amount that we need to shift
  let deltaX  = halfX - boundingBox.max.x;
  let deltaY  = halfY - boundingBox.max.y;
  let deltaZ  = halfZ - boundingBox.max.z;
  // Return the deltas
  return [ deltaX, deltaY, deltaZ ];
}
