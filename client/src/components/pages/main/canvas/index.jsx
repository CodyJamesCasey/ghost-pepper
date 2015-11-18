import React from 'react';
import { connect } from 'react-redux';

// How do we wait for there to me no more window resize events before we
// actually trigger changes to the DOM? WINDOW_RESIZE_WAIT_PERIOD is how long
// we wait in milliseconds.
const WINDOW_RESIZE_WAIT_PERIOD = 200;

// Load component styles
require('./canvas.scss');

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

  /************************** REACT LIFECYCLE HOOKS **************************/

  componentDidMount = () => {
    // Perform initial resize
    this.resizeCanvas();
    this.repositionCanvas();
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

  componentWillReceiveProps = (nextProps) => {
    let currProps = this.props;
    // Compare props to decide if an update is necessary
    if (currProps.width !== nextProps.width ||
      currProps.height !== nextProps.height) {
      this.resizeCanvas(nextProps);
      this.repositionCanvas(nextProps);
    }
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
    // TODO (Sandile): paint to the canvas using three.js

    // Resume the paint loop
    this.frameAnimationRef = requestAnimationFrame(this.onPaint);
  }

  /**************************** HELPER FUNCTIONS *****************************/

  resizeCanvas = (nextProps) => {
    let props = nextProps || this.props;
    // Variables
    let canvas  = this.refs.canvas;
    let ctx     = canvas.getContext('2d');
    // Resize the canvas
    this.refs.canvas.width  = props.width;
    this.refs.canvas.height = props.height;
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  repositionCanvas = (nextProps) => {
    let props = nextProps || this.props;
    // Variables
    let canvas    = this.refs.canvas;
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

  /**************************** RENDER FUNCTIONS *****************************/

  render() {
    // TODO (Sandile): real rendering logic here
    return (
      <div ref="container" className="canvas">
        <canvas ref="canvas" />
      </div>
    );
  }
}
