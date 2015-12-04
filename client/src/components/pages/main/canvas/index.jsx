import React from 'react';
import { connect } from 'react-redux';
import {
  Color,
  Scene,
  Vector3,
  AmbientLight,
  WebGLRenderer,
  DirectionalLight,
  PerspectiveCamera
} from 'three.js';

import { sendFrameToProjector } from 'flux/action-creators';
import { calculateCameraDistance, rotateAboutAxis } from 'util/model';

// How do we wait for there to me no more window resize events before we
// actually trigger changes to the DOM? WINDOW_RESIZE_WAIT_PERIOD is how long
// we wait in milliseconds.
const WINDOW_RESIZE_WAIT_PERIOD   = 200;
// How wide the field of view of the camera is in degrees
const FIELD_OF_VIEW               = 45;
// The background color of the canvas
const BACKGROUND_COLOR            = (new Color()).setRGB(0, 0, 0);
// What percent space to leave between the viewport boundary and the model
const VERTICAL_VIEWPORT_PADDING   = 0.1;
const HORIZONTAL_VIEWPORT_PADDING = 0.15;
// Indices of the perspectiveViewports array
const VIEWPORT_FRONT              = 0;
const VIEWPORT_RIGHT              = 1;
const VIEWPORT_BACK               = 2;
const VIEWPORT_LEFT               = 3;
// Target frame transmission period
const DEFAULT_FRAME_TRANS_PERIOD  = 1000 / 25; // 25 frames per second

// Load component styles
require('./canvas.scss');

/**
 * The workhorse of Ghostpepper.
 *
 * Multiple views is based on:
 * http://mrdoob.github.io/three.js/examples/webgl_multiple_views.html
 *
 * Model rendering is based on:
 * http://threejs.org/examples/webgl_loader_obj_mtl.html
 */
export default class Canvas extends React.Component {
  /**************************** STATIC VARIABLES *****************************/

  static propTypes = {
    // The redux store dispatch function
    dispatch:     React.PropTypes.func.isRequired,
    // The model to be rendered
    model:        React.PropTypes.any.isRequired,
    // The bounding box of the model
    boundingBox:  React.PropTypes.any.isRequired,
    // The desired width of the viewport
    width:        React.PropTypes.number.isRequired,
    // The desired height of the viewport
    height:       React.PropTypes.number.isRequired,
    // The rotation vector (each dimension is in radians)
    thetaX:       React.PropTypes.number.isRequired,
    thetaY:       React.PropTypes.number.isRequired,
    thetaZ:       React.PropTypes.number.isRequired,
  }

  /*************************** INSTANCE VARIABLES ****************************/

  // React component props
  props = {
    dispatch: () => {},
    model:    null,
    width:    0,
    height:   0,
    thetaX:   0,
    thetaY:   0,
    thetaZ:   0
  }

  // Paint animation frame ref
  renderCanvasPaintRequestId    = null
  displayCanvasPaintRequestId   = null
  // How we wait until the resize is done
  windowResizeTimeoutRef        = null
  transmitFrameTimeoutRef       = null
  // The three.js scene
  scene                         = null
  // The WebGL renderer
  renderer                      = null
  // Last recorded dimensions of the renderer
  rendererDimensions            = null
  // True if the render canvas is in the DOM
  renderCanvasCreated           = false
  // The canvas streamed to the projector
  displayCanvas                 = null
  // The dimensions of the canvas streamed to the projector
  displayCanvasDimensions       = null
  // True if the display canvas is in the DOM
  displayCanvasCreated          = false
  //
  frameTransmissionPeriod       = DEFAULT_FRAME_TRANS_PERIOD
  // The different perspectives to be rendered concurrently
  perspectiveViewports          = [
    // Front
    {
      eye:        [ 0, 0, 1 ],
      up:         [ 0, 1, 0 ],
      rotation:   [ 0, 0, 0 ],
      camera:     null
    },
    // Right
    {
      eye:        [ 1, 0, 0 ],
      up:         [ 0, 1, 0 ],
      rotation:   [ 0, (Math.PI / 2), 0 ],
      camera:     null
    },
    // Back
    {
      eye:        [ 0, 0, -1 ],
      rotation:   [ 0, Math.PI, 0 ],
      fov:        45,
      camera:     null
    },
    // Left
    {
      eye:        [ -1, 0, 0 ],
      rotation:   [ 0, -1 * (Math.PI / 2), 0 ],
      fov:        45,
      camera:     null
    }
  ]

  middleOffset                    = 0

  /************************** REACT LIFECYCLE HOOKS **************************/

  componentDidMount = () => {
    // Setup the canvases
    this.createRenderCanvas();
    this.createDisplayCanvas();
    // Subscribe to window resize events
    window.addEventListener('resize', this.onWindowResized);
    // Subscribe to key up events
    document.body.addEventListener('keyup', this.handleKeyUp);
    // Start the paint loops
    this.renderCanvasPaintRequestId   = requestAnimationFrame(
      this.onRenderCanvasPaint
    );
    this.displayCanvasPaintRequestId  = requestAnimationFrame(
      this.onDisplayCanvasPaint
    );
    // Start the frame transmission loop
    this.onTransmitFrame();
  }

  componentWillUnmount = () => {
    // Unsubscribe from window resize events
    window.removeEventListener('resize', this.onWindowResized);
    // Unsubscribe to key up events
    document.body.removeEventListener('keyup', this.handleKeyUp);
    // Cancel the next paint cycle
    if (this.renderCanvasPaintRequestId) {
      cancelAnimationFrame(this.renderCanvasPaintRequestId);
    }
    if (this.displayCanvasPaintRequestId) {
      cancelAnimationFrame(this.displayCanvasPaintRequestId);
    }
    // Cancel any pending window resize events
    if (this.windowResizeTimeoutRef) clearTimeout(this.windowResizeTimeoutRef);
    // Cancel frame transmission
    if (this.transmitFrameTimeoutRef) clearTimeout(this.transmitFrameTimeoutRef);
  }

  shouldComponentUpdate = () => {
    // This component should never have to render more than once
    return false;
  }

  /***************************** EVENT HANDLERS ******************************/

  /**
   * Called whenever the window resizes.
   */
  onWindowResized = () => {
    // Cancel the previous window resize timeout
    if (this.windowResizeTimeoutRef) clearTimeout(this.windowResizeTimeoutRef);
    // Schedule another resize
    this.windowResizeTimeoutRef = setTimeout(
      this.repositionDisplayCanvas.bind(this, null),
      WINDOW_RESIZE_WAIT_PERIOD
    );
  }

  /**
   * Called on key up.
   */
   handleKeyUp = (e) => {
    if (e.which === 38) {
      this.middleOffset++;
    } else if (e.which === 40) {
      this.middleOffset--;
    }
    console.log(this.middleOffset);
   }

  /**
   * Called whenever its time for the render canvas to update. Uses
   * `requestAnimationFrame` to call itself indefinitely.
   */
  onRenderCanvasPaint = () => {
    // Only do anything if initialized
    if (this.renderCanvasCreated) {
      let {
        renderCanvasWidth,
        renderCanvasHeight
      } = this.calculateRenderCanvasDimensions();
      // First, check to see if we need to resize
      let rendererDimensions = this.rendererDimensions;
      if (rendererDimensions.renderCanvasWidth !== renderCanvasWidth ||
        rendererDimensions.renderCanvasHeight !== renderCanvasHeight) {
        // Tell the render to fix itself
        this.renderer.setSize(renderCanvasWidth, renderCanvasHeight);
        // Update the dimensions object
        rendererDimensions.renderCanvasWidth  = renderCanvasWidth;
        rendererDimensions.renderCanvasHeight = renderCanvasHeight;
      }
      // Rotate the scene according to the rotation vector
      let modelRotation = this.props.model.rotation;
      let { thetaX, thetaY, thetaZ } = this.props;
      modelRotation.x = thetaX || 0;
      modelRotation.y = thetaY || 0;
      modelRotation.z = thetaZ || 0;
      // Render each viewport
      let renderer              = this.renderer;
      let perspectiveViewports  = this.perspectiveViewports;
      let viewportWidth         = renderCanvasWidth / 4;
      let viewportHeight        = renderCanvasHeight;
      let viewport, left;
      for (let i = 0; i < perspectiveViewports.length; i++) {
        viewport        = perspectiveViewports[i];
        left            = i * viewportWidth;
        // Configure the renderer
        renderer.setViewport(left, 0, viewportWidth, viewportHeight);
        renderer.setScissor(left, 0, viewportWidth, viewportHeight);
        renderer.enableScissorTest(true);
        renderer.setClearColor(BACKGROUND_COLOR);
        renderer.render(this.scene, viewport.camera);
        renderer.enableScissorTest(false);
      }
    }

    // Resume the paint loop
    this.renderCanvasPaintRequestId = requestAnimationFrame(
      this.onRenderCanvasPaint
    );
  }

  /**
   * Called whenever its time for the display canvas to update. Uses
   * `requestAnimationFrame` to call itself indefinitely.
   */
  onDisplayCanvasPaint = () => {
    // Only do anything if initialized
    if (this.displayCanvasCreated) {
      // Localize instance variables
      let {
        displayCanvasWidth,
        displayCanvasHeight
      } = this.calculateDisplayCanvasDimensions();
      let pixelRatio = window.devicePixelRatio || 1;
      let renderCanvas = this.renderer.domElement;
      let displayCanvas = this.displayCanvas;
      let displayCanvasContext = this.displayCanvas.getContext('2d');
      let perspectiveViewports = this.perspectiveViewports;
      let halfDisplayCanvasWidth = displayCanvasWidth / 2;
      let halfDisplayCanvasHeight = displayCanvasHeight / 2;
      let displayCanvasDimensions = this.displayCanvasDimensions;
      // Detect a resize
      if (displayCanvasWidth !== displayCanvasDimensions.displayCanvasWidth ||
        displayCanvasHeight !== displayCanvasDimensions.displayCanvasHeight) {
        // Update the canvas size in DOM
        displayCanvas.width = displayCanvasWidth;
        displayCanvas.height = displayCanvasHeight;
        // Update dimensions in memory
        displayCanvasDimensions.displayCanvasWidth = displayCanvasWidth;
        displayCanvasDimensions.displayCanvasHeight = displayCanvasHeight;
        // Update the display canvas position
        setTimeout(() => this.repositionDisplayCanvas(), 0);
      }
      // Reset the canvas before new paints
      displayCanvasContext.clearRect(
        0,
        0,
        displayCanvasWidth,
        displayCanvasHeight
      );
      // Record the initial canvas state so we can return
      displayCanvasContext.save();
      // Center the canvas
      displayCanvasContext.translate(
        halfDisplayCanvasWidth,
        halfDisplayCanvasHeight
      );
      // Loop through each view port, create a clipping mask, blit its contents,
      // then remove the clipping mask
      let viewport;
      let viewportWidth = displayCanvasWidth;
      let viewportHeight = viewportWidth / 2;
      for (let i = 0; i < perspectiveViewports.length; i++) {
        viewport = perspectiveViewports[i];
        // Bookmark the current matrix
        displayCanvasContext.save();
        // Create the triangle & the clipping mask along with it
        this.clipForPerspectiveViewport(
          displayCanvasContext,
          i,
          halfDisplayCanvasWidth,
          halfDisplayCanvasHeight
        );
        // Rotate the canvas projection matrix
        this.rotateForPerspectiveViewport(
          displayCanvasContext,
          i
        );
        let dx = (-1 * halfDisplayCanvasWidth),
              dy = this.middleOffset,
              dWidth = viewportWidth,
              dHeight = viewportHeight - this.middleOffset;

        // Blit the viewport from the render canvas on to the diplay canvas
        displayCanvasContext.drawImage(
          renderCanvas,
          i * displayCanvasWidth * pixelRatio,
          0,
          viewportWidth * pixelRatio,
          viewportHeight * pixelRatio,
          dx,
          dy,
          dWidth,
          dHeight
        );
        // Return to the original matrix state
        displayCanvasContext.restore();
      }
      // Undo the translation
      displayCanvasContext.restore();
    }
    // Resume the paint loop
    this.displayCanvasPaintRequestId = requestAnimationFrame(
      this.onDisplayCanvasPaint
    );
  }

  /**
   * Called whenever a snapshot of the display canvas needs to be sent to the
   * projector over WebRTC. This function invokes itself kind of like a loop.
   */
  onTransmitFrame = () => {
    let beginTime = Date.now();
    this.displayCanvas.toBlob(
      blob => {
        this.props.dispatch(
          sendFrameToProjector(URL.createObjectURL(blob))
        );
        let elapsedTime = Date.now() - beginTime;
        let timeTillNextTransmission = (
          this.frameTransmissionPeriod - elapsedTime
        );
        if (timeTillNextTransmission < 0) {
          // Adjust the transmission period to be longer
          this.frameTransmissionPeriod -= timeTillNextTransmission / 2;
          // Run the next transmission ASAP
          timeTillNextTransmission = 0;
        } else {
          // Adjust the transmission period to be shorter
          this.frameTransmissionPeriod -= timeTillNextTransmission / 2;
        }
        this.transmitFrameTimeoutRef = setTimeout(
          this.onTransmitFrame,
          timeTillNextTransmission
        );
      },
      'image/jpeg', // frame encoding
      0.5 // frame quality
    );
  }

  /**************************** HELPER FUNCTIONS *****************************/

  /**
   * Figures out how big each perspective viewport should be.
   *
   * @return {Object} Object with width and height properties
   */
  calculatePerspectiveViewportDimensions = () => {
    let projectorViewportWidth = this.props.width;
    let projectorViewportHeight = this.props.height;
    // Calculate the perspective viewport dimensions
    let perspectiveViewportWidth;
    let perspectiveViewportHeight;
    if (projectorViewportWidth < projectorViewportHeight) {
      perspectiveViewportWidth = projectorViewportWidth;
      perspectiveViewportHeight = perspectiveViewportWidth / 2;
    } else {
      perspectiveViewportWidth = projectorViewportHeight;
      perspectiveViewportHeight = perspectiveViewportWidth / 2;
    }

    return { perspectiveViewportWidth, perspectiveViewportHeight };
  }

  /**
   * Calculates how big the render canvas should be.
   *
   * @return {Object} Object specifying the width and height of render canvas
   */
  calculateRenderCanvasDimensions = () => {
    let {
      perspectiveViewportWidth,
      perspectiveViewportHeight
    } = this.calculatePerspectiveViewportDimensions();
    return {
      renderCanvasWidth: 4 * perspectiveViewportWidth,
      renderCanvasHeight: perspectiveViewportHeight,
    };
  }

  /**
   * Calculates how big the display canvas should be.
   *
   * @return {Object} Object specifying the width and height of display canvas
   */
  calculateDisplayCanvasDimensions = () => {
    let {
      perspectiveViewportWidth,
      perspectiveViewportHeight
    } = this.calculatePerspectiveViewportDimensions();
    return {
      displayCanvasWidth: perspectiveViewportWidth,
      displayCanvasHeight: perspectiveViewportWidth
    };
  }

  /**
   * Creates a triangular clipping region for the specified viewport.
   * @param  {Canvas2DRenderingContext} ctx
   * @param  {Number} viewportIndex           the index of the viewport
   * @param  {Number} halfDisplayCanvasWidth  the width of the display canvas / 2
   * @param  {Number} halfDisplayCanvasHeight the height of the display canvas / 2
   */
  clipForPerspectiveViewport = (
    ctx,
    viewportIndex,
    halfDisplayCanvasWidth,
    halfDisplayCanvasHeight
  ) => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    switch (viewportIndex) {
      case VIEWPORT_FRONT:
        ctx.lineTo(
          halfDisplayCanvasWidth,
          halfDisplayCanvasHeight
        );
        ctx.lineTo(
          (-1 * halfDisplayCanvasWidth),
          halfDisplayCanvasHeight
        );
        break;
      case VIEWPORT_RIGHT:
        ctx.lineTo(
          halfDisplayCanvasWidth,
          (-1 * halfDisplayCanvasHeight)
        );
        ctx.lineTo(
          halfDisplayCanvasWidth,
          halfDisplayCanvasHeight
        );
        break;
      case VIEWPORT_BACK:
        ctx.lineTo(
          halfDisplayCanvasWidth,
          (-1 * halfDisplayCanvasHeight)
        );
        ctx.lineTo(
          (-1 * halfDisplayCanvasWidth),
          (-1 * halfDisplayCanvasHeight)
        );
        break;
      case VIEWPORT_LEFT:
        ctx.lineTo(
          (-1 * halfDisplayCanvasWidth),
          (-1 * halfDisplayCanvasWidth)
        );
        ctx.lineTo(
          (-1 * halfDisplayCanvasWidth),
          halfDisplayCanvasHeight
        );
        break;
    }
    ctx.clip();
  }

  /**
   * Rotates the display canvas for specified viewport.
   *
   * @param  {Canvas2DRenderingContext} ctx
   * @param  {Number} viewportIndex the index of the viewport being rendered
   */
  rotateForPerspectiveViewport = (
    ctx,
    viewportIndex
  ) => {
    switch (viewportIndex) {
      case VIEWPORT_RIGHT:
        ctx.rotate(-1 * Math.PI / 2);
        break;
      case VIEWPORT_BACK:
        ctx.rotate(-1 * Math.PI);
        break;
      case VIEWPORT_LEFT:
        ctx.rotate(Math.PI / 2);
        break;
    }
  }

  /**
   * Creates the WebGL context and the render canvas.
   * Renders each of the four perspectives in sequence. Each perspective
   * viewport is a rectangle with a width twice that of its height. Its width
   * is half the shortest side of the projector viewport.
   *
   * +---+---+---+---+
   * | F | R | B | L |
   * +---+---+---+---+
   *
   * F = Front Perspective
   * R = Right Perspective
   * B = Back Perspective
   * L = Left Perspective
   */
  createRenderCanvas = () => {
    let perspectiveViewports = this.perspectiveViewports;
    let {
      renderCanvasWidth,
      renderCanvasHeight
    } = this.calculateRenderCanvasDimensions();
    // Calculate the camera distance
    let cameraDistance = calculateCameraDistance(
      FIELD_OF_VIEW,
      (
        (1 + (HORIZONTAL_VIEWPORT_PADDING * 2)) *
        (this.props.boundingBox.max.x - this.props.boundingBox.min.x)
      ),
      (
        (1 + (VERTICAL_VIEWPORT_PADDING * 2)) *
        (this.props.boundingBox.max.y - this.props.boundingBox.min.y)
      )
    );
    // Create a static reference to the origin & the aspect ratio
    let originVector            = new Vector3(0, 0, 0);
    let perspectiveAspectRatio  = 2; // 2 * height : 1 * height
    // Create a camera for each viewport
    let viewport, camera;
    for (let i = 0; i < perspectiveViewports.length; i++) {
      viewport  = perspectiveViewports[i];
      camera    = new PerspectiveCamera(
        FIELD_OF_VIEW,
        perspectiveAspectRatio,
        1,
        10000
      );
      // Place the camera in 3D space
      camera.position.x = viewport.eye[0] * cameraDistance;
      camera.position.y = viewport.eye[1] * cameraDistance;
      camera.position.z = viewport.eye[2] * cameraDistance;
      // Set the up vector
      camera.up.x = 0;
      camera.up.y = 1;
      camera.up.z = 0;
      // Re-focus on the origin
      camera.lookAt(originVector);
      // Set the camera rotation up
      camera.rotation.set(
        viewport.rotation[0],
        viewport.rotation[1],
        viewport.rotation[2],
        'XYZ'
      );
      // Attach the camera to the viewport
      viewport.camera = camera;
    }
    // Create the scene
    let scene = new Scene();
    // Let there be light
    scene.add(new AmbientLight(0x444444));
    let spotlight = new DirectionalLight(0xffeedd);
    spotlight.position.set(0, 0, 1).normalize(); // Make sure the vector is in z
    scene.add(spotlight);
    // Add the model to the scene
    scene.add(this.props.model);
    // Init the renderer
    let renderer = new WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(renderCanvasWidth, renderCanvasHeight);
    // Add the renderer dom element to the canvas container
    renderer.domElement.className = 'canvas-container__render-canvas';
    this.refs.container.appendChild(renderer.domElement);
    // Update instance vars
    this.scene = scene;
    this.renderer = renderer;
    this.rendererDimensions = { renderCanvasWidth, renderCanvasHeight };
    this.renderCanvasCreated = true;
  }

  /**
   * Creates the canvas designated for formatting the WebGL output for the projector.
   */
  createDisplayCanvas = () => {
    let {
      displayCanvasWidth,
      displayCanvasHeight
    } = this.calculateDisplayCanvasDimensions();

    let displayCanvas = document.createElement('canvas');
    displayCanvas.className = 'canvas-container__display-canvas';
    displayCanvas.width = displayCanvasWidth;
    displayCanvas.height = displayCanvasHeight;
    // Append the display canvas to the DOM
    this.refs.container.appendChild(displayCanvas);
    // Update instance vars
    this.displayCanvas = displayCanvas;
    this.displayCanvasCreated = true;
    this.displayCanvasDimensions = {
      displayCanvasWidth,
      displayCanvasHeight
    };
    // Perform initial positioning
    this.repositionDisplayCanvas();
  }

  /**
   * Centers the canvas in the canvas container.
   * @param  {object} nextProps the most up to date properties map
   */
  repositionDisplayCanvas = (nextProps) => {
    // Only do anything if initialized
    if (this.displayCanvasCreated) {
      let props = nextProps || this.props;
      let {
        displayCanvasWidth,
        displayCanvasHeight
      } = this.calculateDisplayCanvasDimensions();
      // Variables
      let displayCanvas           = this.displayCanvas;
      let container               = this.refs.container;
      // Calculate the aspect ratio of the canvas when compared to the container
      let containerWidth  = container.clientWidth;
      let containerHeight = container.clientHeight;
      let widthRatio      = containerWidth / displayCanvasWidth;
      let heightRatio     = containerHeight / displayCanvasHeight;
      // Figure out if we have to scale down the canvas
      let scale = 1;
      if (widthRatio < 1) {
        scale = widthRatio;
      }
      if (heightRatio < scale) {
        scale = heightRatio;
      }
      let scaledDisplayCanvasWidth  = displayCanvasWidth * scale;
      let scaledDisplayCanvasHeight = displayCanvasHeight * scale;
      // Detect translation
      let translationX  = (containerWidth - scaledDisplayCanvasWidth) / 2;
      let translationY  = (containerHeight - scaledDisplayCanvasHeight) / 2;
      // Assemble the transform
      let transform = [];
      if (translationX > 0) {
        transform.push('translateX(');
        transform.push(translationX.toString());
        transform.push('px) ');
      }
      if (translationY > 0) {
        transform.push('translateY(');
        transform.push(translationY.toString());
        transform.push('px) ');
      }
      if (scale !== 1) {
        transform.push('scale(');
        transform.push(scale.toString());
        transform.push(')');
      }
      // Apply the transform to canvas
      displayCanvas.style.transform = transform.join('');
    }
  }

  /**************************** RENDER FUNCTIONS *****************************/

  render() {
    return (
      <div ref="container" className="canvas-container" />
    );
  }
}
