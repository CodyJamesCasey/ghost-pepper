import React from 'react';
import { post } from 'superagent';
import Dropzone from 'react-dropzone';
import CircularProgress from 'material-ui/lib/circular-progress';
import { OBJLoader, OBJMTLLoader } from 'three.js';

const REGEX_OBJ = /^.+\.obj$/i;
const REGEX_MTX = /^.+\.mtl$/i;

require('./model-loader.scss');

export default class ModelLoader extends React.Component {
  state = {
    // True if we're in the process of uploading the .obj and .mtl files
    uploadingModelFiles:      false,
    // True if 3.js is turning the model files into a in-memory model objects
    composingModelObject:     false,
    // Tracks how far we've gotten during model composition
    modelCompositionProgress: 0
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
          if (!objUrl && REGEX_OBJ.test(url)) {
            objUrl = url;
          } else if (!mtlUrl && REGEX_MTX.test(url)) {
            mtlUrl = url;
          }
        });
        // Use loader conditionally depending on which urls exist
        if (objUrl) {
          // Resets the loading indicator from the last time we did composition
          this.setState({ modelCompositionProgress: 0 });
          // Figure out which loader to use
          if (mtlUrl) {
            OBJMTLLoader(
              objUrl,
              mtlUrl,
              this.onModelLoaded,
              this.onModelLoadingProgressed,
              this.onModelLoadingFailed
            );
          } else {
            OBJLoader(
              objUrl,
              this.onModelLoaded,
              this.onModelLoadingProgressed,
              this.onModelLoadingFailed
            );
          }
        }
      }
    });
  }

  onModelLoadingProgressed = (xhr) => {
    let { progress, total } = xhr;
    // Get the progress variables from the xhr; update state with them
    this.setState({
      loadingProgress: (((progress || 0) / (total || 1)) * 100)
    });
  }

  onModelLoaded = (model) => {
    // TODO (Sandile): hook up redux to function appropriately
    window.alert('the model loaded');
  }

  onModelLoadingFailed = (err) => {
    let errorText;
    // Compose the error text
    if (err && err.toString && err.toString()) {
      errorText = err.toString;
    } else {
      errorText = `Model file upload failed.
      Please check your network connection.`;
    }
    // Update the state accordingly
    this.setState({6
      uploadingModelFiles:  false,
      uploadError:          errorText
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
