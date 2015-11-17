import React from 'react';
import { connect } from 'react-redux';

// Load component styles
require('./canvas.scss');

export default class Canvas extends React.Component {
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

  // The DOM element for the canvas
  canvas = null

  props = {
    model:  null,
    width:  0,
    height: 0,
    thetaX: 0,
    thetaY: 0,
    thetaZ: 0
  }

  componentWillReceiveProps = (nextProps) => {
    let currProps = this.props;
    // Compare props to decide if an update is necessary
    if (currProps.width !== nextProps.width || currProps.height !== nextProps.height) {
      this.onCanvasResized(nextProps.width, nextProps.height);
    }
  }

  shouldComponentUpdate() {
    // This component should never have to render more than once
    return false;
  }

  onCanvasResized = (newWidth, newHeight) => {
    // TODO (Sandile): handle canvas resize
  }

  render() {
    // TODO (Sandile): real rendering logic here
    return (
      <div className="canvas">
        <canvas ref="canvas" />
      </div>
    );
  }
}
