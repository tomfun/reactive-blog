import React, {Component} from 'react';

import l from '../../translator';

class NotFound extends Component {
  render(){
    return (
      <div className="not-found">
        {l('NOT_FOUND->TITLE')}
      </div>
    );
  }
}

export default NotFound;
