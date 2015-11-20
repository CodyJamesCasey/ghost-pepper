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
// Indices of the viewports array
const VIEWPORT_FRONT              = 0;
const VIEWPORT_RIGHT              = 1;
const VIEWPORT_BACK               = 2;
const VIEWPORT_LEFT               = 3;

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
    model:  null,
    width:  0,
    height: 0,
    thetaX: 0,
    thetaY: 0,
    thetaZ: 0
  }

  // Paint animation frame ref
  renderCanvasPaintRequestId  = null
  displayCanvasPaintRequestId = null
  // How we wait until the resize is done
  windowResizeTimeoutRef      = null
  // The three.js scene
  scene                       = null
  // The WebGL renderer
  renderer                    = null
  // Last recorded dimensions of the renderer
  rendererDimensions          = null
  // True if the render canvas is in the DOM
  renderCanvasCreated         = false
  // The canvas streamed to the projector
  displayCanvas               = null
  // The dimensions of the canvas streamed to the projector
  displayCanvasDimensions     = null
  // True if the display canvas is in the DOM
  displayCanvasCreated        = false
  // The different perspectives to be rendered concurrently
  viewports                   = [
    // Front
    {
      left:       0.25,
      bottom:     0,
      width:      0.5,
      height:     0.5,
      eye:        [ 0, 0, 1 ],
      up:         [ 0, 1, 0 ],
      rotation:   [ 0, 0, 0 ],
      camera:     null
    },
    // Right
    {
      left:       0.75,
      bottom:     0,
      width:      0.25,
      height:     1.0,
      eye:        [ 1, 0, 0 ],
      up:         [ 0, 1, 0 ],
      rotation:   [ 0, (Math.PI / 2), -1 * (Math.PI / 2) ],
      camera:     null
    },
    // Back
    {
      left:       0.25,
      bottom:     0.5,
      width:      0.5,
      height:     0.5,
      eye:        [ 0, 0, -1 ],
      rotation:   [ 0, Math.PI, -1 * Math.PI ],
      fov:        45,
      camera:     null
    },
    // Left
    {
      left:       0,
      bottom:     0,
      width:      0.25,
      height:     1.0,
      eye:        [ -1, 0, 0 ],
      rotation:   [ 0, -1 * (Math.PI / 2), Math.PI / 2 ],
      fov:        45,
      camera:     null
    }
  ]

  /************************** REACT LIFECYCLE HOOKS **************************/

  componentDidMount = () => {
    // Setup the canvases
    this.createRenderCanvas();
    this.createDisplayCanvas();
    // Subscribe to window resize events
    window.addEventListener('resize', this.onWindowResized);
    // Start the paint loops
    this.renderCanvasPaintRequestId   = requestAnimationFrame(
      this.onRenderCanvasPaint
    );
    this.displayCanvasPaintRequestId  = requestAnimationFrame(
      this.onDisplayCanvasPaint
    );
  }

  componentWillUnmount = () => {
    // Unsubscribe from window resize events
    window.removeEventListener('resize', this.onWindowResized);
    // Cancel the next paint cycle
    if (this.renderCanvasPaintRequestId) {
      clearAnimationFrame(this.renderCanvasPaintRequestId);
    }
    if (this.displayCanvasPaintRequestId) {
      clearAnimationFrame(this.displayCanvasPaintRequestId);
    }
    // Cancel any pending window resize events
    if (this.windowResizeTimeoutRef) clearTimeout(this.windowResizeTimeoutRef);
  }

  shouldComponentUpdate = () => {
    // This component should never have to render more than once
    return false;
  }

  /***************************** EVENT HANDLERS ******************************/

  onWindowResized = () => {
    // Cancel the previous window resize timeout
    if (this.windowResizeTimeoutRef) clearTimeout(this.windowResizeTimeoutRef);
    // Schedule another resize
    this.windowResizeTimeoutRef = setTimeout(
      this.repositionDisplayCanvas.bind(this, null),
      WINDOW_RESIZE_WAIT_PERIOD
    );
  }

  onRenderCanvasPaint = () => {
    // Only do anything if initialized
    if (this.renderCanvasCreated) {
      // Calculate canvas dimensions
      let renderCanvasWidth   = 2 * this.props.width;
      let renderCanvasHeight  = this.props.height;
      // First, check to see if we need to resize
      let rendererDimensions = this.rendererDimensions;
      if (rendererDimensions.width !== renderCanvasWidth ||
        rendererDimensions.height !== renderCanvasHeight) {
        // Tell the render to fix itself
        this.renderer.setSize(renderCanvasWidth, renderCanvasHeight);
        // Update cameras
        let viewport, camera;
        for (let i = 0; i < 1; i++) {
          viewport = this.viewports[i];
          camera = viewport.camera;
          camera.aspect = (
            (renderCanvasWidth * viewport.width) /
            (renderCanvasHeight * viewportHeight)
          );
          // Update the projection matrix
          camera.updateProjectionMatrix();
        }
        // Update the dimensions object
        rendererDimensions.width  = renderCanvasWidth;
        rendererDimensions.height = renderCanvasHeight;
      }
      // Rotate the scene according to the rotation vector
      // rotateAboutAxis(this.props.model, 0, 0, 0.01);
      this.props.model.rotation.x += 0.01;
      // this.props.model.position.add(new Vector3(0.4, 0.2, 0));
      // TODO (Sandile): rotate the model according to given rotation vector
      // Render each viewport
      let renderer  = this.renderer;
      let viewports = this.viewports;
      let viewport, left, bottom, viewportWidth, viewportHeight;
      for (let i = 0; i < viewports.length; i++) {
        viewport        = viewports[i];
        left            = Math.floor(viewport.left    * renderCanvasWidth);
        bottom          = Math.floor(viewport.bottom  * renderCanvasHeight);
        viewportWidth   = Math.floor(viewport.width   * renderCanvasWidth);
        viewportHeight  = Math.floor(viewport.height  * renderCanvasHeight);
        // Configure the renderer
        renderer.setViewport(left, bottom, viewportWidth, viewportHeight);
        renderer.setScissor(left, bottom, viewportWidth, viewportHeight);
        renderer.enableScissorTest(true);
        renderer.setClearColor(BACKGROUND_COLOR);
        // F-f-f-f-fire yur layzar!!!
        renderer.render(this.scene, viewport.camera);
        renderer.enableScissorTest(false);
      }
    }
    // Resume the paint loop
    this.renderCanvasPaintRequestId = requestAnimationFrame(
      this.onRenderCanvasPaint
    );
  }

  onDisplayCanvasPaint = () => {
    // Only do anything if initialized
    if (this.displayCanvasCreated) {
      // Localize instance variables
      let viewports = this.viewports;
      let pixelDensity = window.devicePixelRatio;
      let displayCanvas = this.displayCanvas;
      let displayCanvasContext = this.displayCanvas.getContext('2d');
      let displayCanvasDimensions = this.displayCanvasDimensions;
      let renderCanvas = this.renderer.domElement;
      let displayCanvasWidth = this.props.width * pixelDensity;
      let displayCanvasHeight = this.props.height * pixelDensity;
      // Detect a resize
      if (displayCanvasWidth !== displayCanvasDimensions.width ||
        displayCanvasHeight !== displayCanvasDimensions.height) {
        // Update the canvas size in DOM
        displayCanvas.width = displayCanvasWidth;
        displayCanvas.height = displayCanvasHeight;
        // Update dimensions in memory
        displayCanvasDimensions.width = displayCanvasWidth;
        displayCanvasDimensions.height = displayCanvasHeight;
        // Update the display canvas position
        this.repositionDisplayCanvas();
      }
      // Reset the canvas for the new round of blitting
      displayCanvasContext.clearRect(
        0,
        0,
        displayCanvasWidth,
        displayCanvasHeight
      );
      // Loop through each view port, create a clipping mask, blit its contents,
      // then remove the clipping mask
      let viewport;
      let viewportWidth;
      let viewportHeight;
      let viewportDisplayCanvasOriginX;
      let viewportDisplayCanvasOriginY;
      for (let i = 0; i < viewports.length; i++) {
        viewport = viewports[i];
        // Bookmark the current matrix
        displayCanvasContext.save();
        displayCanvasContext.beginPath();
        // Choose start point for triangle
        switch (i) {
          case VIEWPORT_FRONT:
          displayCanvasContext.moveTo(0, displayCanvasHeight);
          break;
          case VIEWPORT_RIGHT:
          displayCanvasContext.moveTo(
            displayCanvasWidth,
            displayCanvasHeight
          );
          break;
          case VIEWPORT_BACK:
          displayCanvasContext.moveTo(displayCanvasWidth, 0);
          break;
          case VIEWPORT_LEFT:
          displayCanvasContext.moveTo(0, 0);
          break;
        }
        // All triangles point to the center
        displayCanvasContext.lineTo(
          displayCanvasWidth / 2,
          displayCanvasHeight / 2
        );
        // Choose end point for triangle
        switch (i) {
          case VIEWPORT_FRONT:
          displayCanvasContext.lineTo(
            displayCanvasWidth,
            displayCanvasHeight
          );
          break;
          case VIEWPORT_RIGHT:
          displayCanvasContext.lineTo(displayCanvasWidth, 0);
          break;
          case VIEWPORT_BACK:
          displayCanvasContext.lineTo(0, 0);
          break;
          case VIEWPORT_LEFT:
          displayCanvasContext.lineTo(0, displayCanvasHeight);
          break;
        }
        // Create the triangle & the clipping mask along with it
        displayCanvasContext.clip();
        // Calculate the rest of the viewport dimensions
        viewportWidth = viewport.width * 2 * displayCanvasWidth;
        viewportHeight = viewport.height * displayCanvasHeight;
        switch (i) {
          case VIEWPORT_FRONT:
          viewportDisplayCanvasOriginX = 0;
          viewportDisplayCanvasOriginY = displayCanvasHeight / 2;
          break;
          case VIEWPORT_RIGHT:
          viewportDisplayCanvasOriginX = displayCanvasWidth / 2;
          viewportDisplayCanvasOriginY = 0;
          break;
          case VIEWPORT_BACK:
          viewportDisplayCanvasOriginX = 0;
          viewportDisplayCanvasOriginY = 0;
          break;
          case VIEWPORT_LEFT:
          viewportDisplayCanvasOriginX = 0;
          viewportDisplayCanvasOriginY = 0;
          break;
        }
        // Blit the viewport from the render canvas on to the diplay canvas
        displayCanvasContext.drawImage(
          renderCanvas,
          viewport.left * 2 * displayCanvasWidth,
          viewportDisplayCanvasOriginY,
          viewportWidth,
          viewportHeight,
          viewportDisplayCanvasOriginX,
          viewportDisplayCanvasOriginY,
          viewportWidth,
          viewportHeight
        );
        // Return to the original matrix state
        displayCanvasContext.restore();
      }
    }
    // Resume the paint loop
    this.displayCanvasPaintRequestId = requestAnimationFrame(
      this.onDisplayCanvasPaint
    );
  }

  /**************************** HELPER FUNCTIONS *****************************/

  /**
   * Creates the WebGL context and the render canvas.
   */
  createRenderCanvas = () => {
    // Calculate canvas dimensions
    let renderCanvasWidth   = 2 * this.props.width;
    let renderCanvasHeight  = this.props.height;
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
    // Create a static reference to the origin
    let originVector = new Vector3(0, 0, 0);
    // Create a camera for each viewport
    let viewports = this.viewports;
    let viewport, camera;
    for (let i = 0; i < viewports.length; i++) {
      viewport  = viewports[i];
      camera    = new PerspectiveCamera(
        FIELD_OF_VIEW,
        (
          (renderCanvasWidth * viewport.width) /
          (renderCanvasHeight * viewport.height)
        ),
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
    let rendererDimensions = {
      width:  renderCanvasWidth,
      height: renderCanvasHeight
    };
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(renderCanvasWidth, renderCanvasHeight);
    // Add the renderer dom element to the canvas container
    renderer.domElement.className = 'canvas-container__render-canvas';
    this.refs.container.appendChild(renderer.domElement);
    // Update instance vars
    this.scene = scene;
    this.renderer = renderer;
    this.rendererDimensions = rendererDimensions;
    this.renderCanvasCreated = true;
  }

  /**
   * Creates the canvas designated for formatting the WebGL output for the projector.
   */
  createDisplayCanvas = () => {
    let pixelDensity = window.devicePixelRatio;
    let displayCanvas = document.createElement('canvas');
    let displayCanvasDimensions = {
      width:  this.props.width * pixelDensity,
      height: this.props.height * pixelDensity
    };
    displayCanvas.className = 'canvas-container__display-canvas';
    displayCanvas.width = displayCanvasDimensions.width;
    displayCanvas.height = displayCanvasDimensions.height;
    // Append the display canvas to the DOM
    this.refs.container.appendChild(displayCanvas);
    // Update instance vars
    this.displayCanvas = displayCanvas;
    this.displayCanvasDimensions = displayCanvasDimensions;
    this.displayCanvasCreated = true;
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
      // Variables
      let pixelDensity  = window.devicePixelRatio;
      let displayCanvas = this.displayCanvas;
      let container     = this.refs.container;
      // Calculate the aspect ratio of the canvas when compared to the container
      let containerWidth      = container.clientWidth;
      let containerHeight     = container.clientHeight;
      let displayCanvasWidth  = props.width * pixelDensity;
      let displayCanvasHeight = props.height * pixelDensity;
      let widthRatio          = containerWidth / displayCanvasWidth;
      let heightRatio         = containerHeight / displayCanvasHeight;
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
      <div ref="container" className="canvas-container"/>
    );
  }
}