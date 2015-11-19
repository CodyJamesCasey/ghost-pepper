import React from 'react';
import { connect } from 'react-redux';
import {
  Color,
  Scene,
  AmbientLight,
  WebGLRenderer,
  DirectionalLight,
  PerspectiveCamera
} from 'three.js';

// How do we wait for there to me no more window resize events before we
// actually trigger changes to the DOM? WINDOW_RESIZE_WAIT_PERIOD is how long
// we wait in milliseconds.
const WINDOW_RESIZE_WAIT_PERIOD = 200;
// How wide the field of view of the camera is in radians
const FIELD_OF_VIEW             = 45;

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

  // Paint animation frame ref
  frameAnimationRef = null
  // How we wait until the resize is done
  windowResizeTimeoutRef = null
  // React component props
  props = {
    model:  null,
    width:  0,
    height: 0,
    thetaX: 0,
    thetaY: 0,
    thetaZ: 0
  }

  // The three.js scene
  scene               = null
  // The WebGL renderer
  renderer            = null
  // True if onPaint can do stuff now
  readyToPaint        = false
  // Last recorded dimensions of the renderer
  rendererDimensions  = null
  // The different perspectives to be rendered concurrently
  viewports           = [
    // Front
    {
      left:       0.25,
      bottom:     0,
      width:      0.5,
      height:     0.5,
      background: (new Color()).setRGB(255, 0, 0),
      eye:        [ 0, 0, 50 ],
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
      background: (new Color()).setRGB(0, 255, 0),
      eye:        [ 0, 0, 50 ],
      up:         [ 0, 1, 0 ],
      rotation:   [ 0, 0, -1 * (Math.PI / 2) ],
      camera:     null
    },
    // Back
    {
      left:       0.25,
      bottom:     0.5,
      width:      0.5,
      height:     0.5,
      background: (new Color()).setRGB(0, 0, 255),
      eye:        [ 0, 0, 50 ],
      rotation:   [ 0, 0, -1 * Math.PI ],
      fov:        45,
      camera:     null
    },
    // Left
    {
      left:       0,
      bottom:     0,
      width:      0.25,
      height:     1.0,
      background: (new Color()).setRGB(0, 0, 0),
      eye:        [ 0, 0, 50 ],
      rotation:   [ 0, 0, Math.PI / 2 ],
      fov:        45,
      camera:     null
    }
  ]

  /************************** REACT LIFECYCLE HOOKS **************************/

  componentDidMount = () => {
    // Setup WebGL
    this.initWebGL();
    // Subscribe to window resize events
    window.addEventListener('resize', this.onWindowResized);
    // Start the paint loop
    this.frameAnimationRef = requestAnimationFrame(this.onPaint);
  }

  componentWillUnmount = () => {
    // Unsubscribe from window resize events
    window.removeEventListener('resize', this.onWindowResized);
    // Cancel the next paint cycle
    if (this.frameAnimationRef) clearAnimationFrame(this.frameAnimationRef);
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
      this.repositionRenderCanvas.bind(this, null),
      WINDOW_RESIZE_WAIT_PERIOD
    );
  }

  onPaint = () => {
    // Only do anything if initialized
    if (this.readyToPaint) {
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
        // Update the render canvas position
        this.repositionRenderCanvas();
      }
      // Rotate the scene according to the rotation vector
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
        renderer.setClearColor(viewport.background);
        // F-f-f-f-fire yur layzar!!!
        renderer.render(this.scene, viewport.camera);
        renderer.enableScissorTest(false);
      }
    }
    // Resume the paint loop
    this.frameAnimationRef = requestAnimationFrame(this.onPaint);
    // TODO (Sandile): persist to the display canvas
  }

  /**************************** HELPER FUNCTIONS *****************************/

  /**
   * Sets up all the WebGL variables needed for painting.
   */
  initWebGL = () => {
    // Calculate canvas dimensions
    let renderCanvasWidth   = 2 * this.props.width;
    let renderCanvasHeight  = this.props.height;
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
      camera.position.x = viewport.eye[0];
      camera.position.y = viewport.eye[1];
      camera.position.z = viewport.eye[2];
      // Set the up vector
      camera.up.x = 0;
      camera.up.y = 1;
      camera.up.z = 0;
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
    // We are now ready to paint
    this.readyToPaint = true;
    // Perform initial positioning
    this.repositionRenderCanvas();
    // TODO (Sandile): Create the display canvas
  }

  /**
   * Centers the canvas in the canvas container.
   * @param  {object} nextProps the most up to date properties map
   */
  repositionRenderCanvas = (nextProps) => {
    // Only do anything if initialized
    if (this.readyToPaint) {
      let props = nextProps || this.props;
      // Variables
      let renderCanvas  = this.renderer.domElement;
      let container     = this.refs.container;
      // Calculate the aspect ratio of the canvas when compared to the container
      let containerWidth      = container.clientWidth;
      let containerHeight     = container.clientHeight;
      let renderCanvasWidth   = props.width * 2;
      let renderCanvasHeight  = props.height;
      let widthRatio          = containerWidth / renderCanvasWidth;
      let heightRatio         = containerHeight / renderCanvasHeight;
      // Figure out if we have to scale down the canvas
      let scale = 1;
      if (widthRatio < 1) {
        scale = widthRatio;
      }
      if (heightRatio < scale) {
        scale = heightRatio;
      }
      let scaledRenderCanvasWidth   = renderCanvasWidth * scale;
      let scaledRenderCanvasHeight  = renderCanvasHeight * scale;
      // Detect translation
      let translationX  = (containerWidth - scaledRenderCanvasWidth) / 2;
      let translationY  = (containerHeight - scaledRenderCanvasHeight) / 2;
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
      renderCanvas.style.transform = transform.join('');
    }
  }

  /**************************** RENDER FUNCTIONS *****************************/

  render() {
    return (
      <div ref="container" className="canvas-container"/>
    );
  }
}
