import React from 'react';
import { connect } from 'react-redux';

// Load component styles
require('./canvas.scss');

@connect(state => ({
  model:  state.currentModel,
  width:  state.targetResolution.width,
  height: state.targetResolution.height,
  thetaX: state.rotationVector.x,
  thetaY: state.rotationVector.y,
  thetaZ: state.rotationVector.z
}))
export default class Canvas extends React.Component {
  // The DOM element for the canvas
  canvas = null

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
        <canvas ref="canvas"/>
      <div>
    );
  }
}
