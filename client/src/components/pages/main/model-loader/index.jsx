import React from 'react';
import { post } from 'superagent';
import Dropzone from 'react-dropzone';
import { Mesh } from 'three.js';
import CircularProgress from 'material-ui/lib/circular-progress';

import { dispatch } from 'flux/store';
import { set3DModel } from 'flux/action-creators';
import { OBJLoader, OBJMTLLoader } from 'loaders';
import { calculateCenteringVector } from 'util/model';

const REGEX_OBJ = /^.+\.obj$/i;
const REGEX_MTX = /^.+\.mtl$/i;

// Load component styles
require('./model-loader.scss');

export default class ModelLoader extends React.Component {
  state = {
    // True if we're in the process of uploading the .obj and .mtl files
    uploadingModelFiles:      false,
    // True if 3.js is turning the model files into a in-memory model objects
    composingModelObject:     false,
    // Tracks how far we've gotten during model composition
    modelCompositionProgress: 0,
    // Truthy if we bumped into any file uploading errors
    uploadError:              null,
    // Truthy if we had problems while composing the model object
    compositionError:         null
  }

  onDrop = (files) => {
    // Start the loading animation
    this.setState({ uploadingModelFiles: true });
    // Send the upload
    let request = post('/api/uploads');
    files.forEach(file => request.attach('assets', file, file.name));
    request.end((err, res) => {
      if (err || !res.ok) {
        this.setState({
          uploadingModelFiles:  false,
          uploadError:          (err || res.text)
        });
      } else {
        // Start the composition process
        this.setState({
          uploadingModelFiles:  false,
          composingModelObject: true,
          // We can get rid of the upload error since we know that the
          // upload finished this time
          uploadError:          null
        });
        // Response comes back as an array of URLs
        let urls = res.body;
        let objUrl = null, mtlUrl = null;
        // Loop through the urls looking for .obj and .mtl
        urls.forEach(url => {
          if (!objUrl && REGEX_OBJ.test(url.fileName)) {
            objUrl = url.path;
          } else if (!mtlUrl && REGEX_MTX.test(url.fileName)) {
            mtlUrl = url.path;
          }
        });
        // Use loader conditionally depending on which urls exist
        if (objUrl) {
          // Resets the loading indicator from the last time we did composition
          this.setState({ modelCompositionProgress: 0 });
          // Figure out which loader to use
          if (mtlUrl) {
            let loader = new OBJMTLLoader();
            loader.load(
              objUrl,
              mtlUrl,
              this.onModelLoaded,
              this.onModelLoadingProgressed,
              this.onModelLoadingFailed
            );
          } else {
            let loader = new OBJLoader();
            loader.load(
              objUrl,
              this.onModelLoaded,
              this.onModelLoadingProgressed,
              this.onModelLoadingFailed
            );
          }
        } else {
          // Means that none of the uploaded stuff is what we're looking for
          let errorText = `Uploaded files must contain at least a .obj file.`;
          // Update the state accordingly
          this.setState({
            composingModelObject:      false,
            modelCompositionProgress:  0,
            compositionError:          errorText
          });
        }
      }
    });
  }

  onModelLoadingProgressed = (xhr) => {
    let { loaded, total } = xhr;
    // Get the progress variables from the xhr; update state with them
    this.setState({
      modelCompositionProgress: (((loaded || 0) / (total || 1)) * 100)
    });
  }

  onModelLoaded = (model) => {
    // True if we end up setting the model correctly
    let isModelSet = false;
    // First calculate the bounding box of the model
    model.traverse(child => {
      if (!isModelSet && (child instanceof Mesh)) {
        // Calculate the bounding box
        child.geometry.computeBoundingBox();
        // Figure out how far we need to translate in every direction for it
        // to be centered
        let centeringVector = calculateCenteringVector(
          child.geometry.boundingBox
        );
        // Apply the translation in every direction
        child.geometry.translate(
          centeringVector[0],
          centeringVector[1],
          centeringVector[2]
        );
        // Update the store now that we have the bounding box
        dispatch(set3DModel(model, child.geometry.boundingBox));
        // Declare that the model has been set
        isModelSet = true;
      }
    });
    // Check if it worked
    if (!isModelSet) {
      // TODO (Sandile) handle this case with an error
      debugger;
      alert('Uh oh! Can\'t load this thing...sorry.');
    }
  }

  onModelLoadingFailed = (err) => {
    let errorText;
    // Compose the error text
    if (err && err.toString && err.toString()) {
      errorText = err.toString;
    } else {
      errorText = `Model files could not be processed.
      Please ensure that your models are formatted correctly.`;
    }
    // Update the state accordingly
    this.setState({
      composingModelObject:      false,
      modelCompositionProgress:  0,
      compositionError:          errorText
    });
  }

  render() {
    let content;
    // Content is whatever we render in the card popup
    if (this.state.uploadingModelFiles) {
      // Show a spinning loader if uploading
      content = (
        <div className="model-loader__loading">
          <CircularProgress mode="indeterminate" />
        </div>
      );
    } else if (this.state.composingModelObject) {
      // Show a progressive loader if composing
      content = (
        <div className="model-loader__loading">
          <CircularProgress
            mode="determinate"
            value={this.state.modelCompositionProgress} />
        </div>
      );
    } else {
      // Show a dropzone if nothing else is happening
      content = (
        <Dropzone
          onDrop={this.onDrop}
          className="model-loader__dropzone">
          <div className="model-loader__dropzone-prompt">
            Drop your model files here,
            or click to select files from your filesystem.
          </div>
        </Dropzone>
      );
    }

    return (
      <div className="model-loader">{content}</div>
    );
  }
}
