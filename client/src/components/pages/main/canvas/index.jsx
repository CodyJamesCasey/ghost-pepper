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
    model:  React.PropTypes.any.isRequired,
    // The desired width of the viewport
    width:  React.PropTypes.number.isRequired,
    // The desired height of the viewport
    height: React.PropTypes.number.isRequired,
    // The rotation vector (each dimension is in radians)
    thetaX: React.PropTypes.number.isRequired,
    thetaY: React.PropTypes.number.isRequired,
    thetaZ: React.PropTypes.number.isRequired,
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
      left:       0,
      bottom:     0,
      width:      1.0,
      height:     0.5,
      background: (new Color()).setRGB(0, 0, 0),
      eye:        [ 0, 300, 1800 ],
      up:         [ 0, 1, 0 ],
      fov:        45,
      camera:     null
    },
    // Right
    {
      left:       0.5,
      bottom:     0,
      width:      0.5,
      height:     1.0,
      background: (new Color()).setRGB(0, 0, 0),
      eye:        [ 0, 1800, 0 ],
      up:         [ 0, 1, 0 ],
      fov:        45,
      camera:     null
    },
    // Back
    {
      left:       0,
      bottom:     0.5,
      width:      1.0,
      height:     0.5,
      background: (new Color()).setRGB(0, 0, 0),
      eye:        [ 0, 1800, 0 ],
      up:         [ 0, 1, 0 ],
      fov:        45,
      camera:     null
    },
    // Left
    {
      left:       0,
      bottom:     0,
      width:      0.5,
      height:     1.0,
      background: (new Color()).setRGB(0, 0, 0),
      eye:        [ 0, 1800, 0 ],
      up:         [ 0, 1, 0 ],
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
      this.repositionCanvas.bind(this, null),
      WINDOW_RESIZE_WAIT_PERIOD
    );
  }

  onPaint = () => {
    // Only do anything if initialized
    if (this.readyToPaint) {
      let { width, height } = this.props;
      // First, check to see if we need to resize
      if (this.rendererDimensions.width !== width ||
        this.rendererDimensions.height !== height) {
        // Tell the render to fix itself
        renderer.setSize(width, height);
        // Update the dimensions object
        this.rendererDimensions.width  = width;
        this.rendererDimensions.height = height;
        // Update all the viewport cameras
        let camera;
        let aspectRatio = width / height;
        for (let i = 0; i < 4; i++) {
          camera = this.viewports[i].camera;
          camera.aspect = aspectRatio;
          camera.updateProjectionMatrix();
        }
        // Update the canvas position
        this.repositionCanvas();
      }
      // Rotate the scene according to the rotation vector
      // TODO (Sandile): rotate the model according to rotation matrix
      // Render each viewport
      let renderer = this.renderer;
      let viewport, left, bottom, viewportWidth, viewportHeight;
      for (let i = 0; i < 4; i++) {
        viewport        = this.viewports[i];
        left            = Math.floor(viewport.left    * width);
        bottom          = Math.floor(viewport.bottom  * height);
        viewportWidth   = Math.floor(viewport.width   * width);
        viewportHeight  = Math.floor(viewport.height  * height);
        // Configure the renderer
        renderer.setViewport(left, bottom, viewportWidth, viewportHeight);
        renderer.setScissor(left, bottom, viewportWidth, viewportHeight);
        renderer.enableScissorTest(true);
        renderer.setClearColor(viewport.background);
        // F-f-f-f-fire yur layzar!!!
        renderer.render(this.scene, viewport.camera);
      }
    }
    // Resume the paint loop
    this.frameAnimationRef = requestAnimationFrame(this.onPaint);
  }

  /**************************** HELPER FUNCTIONS *****************************/

  /**
   * Sets up all the WebGL variables needed for painting.
   */
  initWebGL = () => {
    // Calculate the aspect ratio
    let aspectRatio = this.props.width / this.props.height;
    // Create a camera for each viewport
    this.viewports.forEach(viewport => {
      let camera = new PerspectiveCamera(
        viewport.fov,
        aspectRatio,
        1,
        10000
      );
      // Place the camera in 3D space
      camera.position.x = viewport.eye[0];
      camera.position.y = viewport.eye[1];
      camera.position.z = viewport.eye[2];
      // Set the up vector
      camera.up.x = viewport.up[0];
      camera.up.y = viewport.up[1];
      camera.up.z = viewport.up[2];
      // Attach the camera to the view port
      viewport.camera = camera;
    });
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
      width:  this.props.width,
      height: this.props.height
    };
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(rendererDimensions.width, rendererDimensions.height);
    // Add the renderer dom element to the canvas container
    if (this.refs.container.firstChild) {
      // Remove the existing children
      this.refs.container.removeChild(this.refs.container.firstChild);
    }
    this.refs.container.appendChild(renderer.domElement);
    // Update instance vars
    this.scene = scene;
    this.renderer = renderer;
    this.rendererDimensions = rendererDimensions;
    // We are now ready to paint
    this.readyToPaint = true;
    // Perform initial positioning
    this.repositionCanvas();
  }

  /**
   * Centers the canvas in the canvas container.
   * @param  {object} nextProps the most up to date properties map
   */
  repositionCanvas = (nextProps) => {
    // Only do anything if initialized
    if (this.readyToPaint) {
      let props = nextProps || this.props;
      // Variables
      let canvas    = this.renderer.domElement;
      let container = this.refs.container;
      // Calculate the aspect ratio of the canvas when compared to the container
      let containerWidth  = container.clientWidth;
      let containerHeight = container.clientHeight;
      let widthRatio      = containerWidth / props.width;
      let heightRatio     = containerHeight / props.height;
      // Figure out if we have to scale down the canvas
      let scale = 1;
      if (widthRatio < 1) {
        scale = widthRatio;
      }
      if (heightRatio < scale) {
        scale = heightRatio;
      }
      let scaledWidth   = props.width * scale;
      let scaledHeight  = props.height * scale;
      // Detect translation
      let translationX  = (containerWidth - scaledWidth) / 2;
      let translationY  = (containerHeight - scaledHeight) / 2;
      // Calculate the transform
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
      canvas.style.transform = transform.join('');
    }
  }

  /**************************** RENDER FUNCTIONS *****************************/

  render() {
    return (
      <div ref="container" className="canvas-container"/>
    );
  }
}
