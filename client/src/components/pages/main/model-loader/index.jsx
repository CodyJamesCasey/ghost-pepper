import React from 'react';
import { post } from 'superagent';
import Dropzone from 'react-dropzone';
import CircularProgress from 'material-ui/lib/circular-progress';

require('./model-loader.scss');

export default class ModelLoader extends React.Component {
  state = {
    loading:  false,
    error:    null
  }

  onDrop = (files) => {
    console.log(files);
    // Start the loading animation
    this.setState({ loading: true });
    // Send the upload
    let request = post('/api/uploads');
    files.forEach(file => request.attach('assets', file, file.name));
    request.end((err, res) => {
      if (err || !res.ok) {
        this.setState({
          loading:  false,
          error:    err || res.text
        });
      } else {
        this.setState({ loading: false });
        // TODO (Sandile): call action that moves to the rendering canvas
      }
    });
  }

  render() {
    let content;
    if (this.state.loading) {
      content = (
        <div className="model-loader__loading">
          <CircularProgress mode="indeterminate" />
        </div>
      );
    } else {
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
