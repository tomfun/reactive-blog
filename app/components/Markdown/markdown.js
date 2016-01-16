import React, {Component} from 'react';

import markdown from '../../markdown';
import _ from 'lodash';

class Markdown extends Component {
  convertMarkdown() {
    return {__html: markdown(this.props.children || this.props.source, {sanitize: true})};
  }

  render() {
    return (
      <div dangerouslySetInnerHTML={this.convertMarkdown()}/>
    );
  }
}

export default Markdown;
