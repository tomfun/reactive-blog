import React, {Component} from 'react';

import TextField from 'material-ui/lib/text-field';
import Tabs from 'material-ui/lib/tabs/tabs';
import Tab from 'material-ui/lib/tabs/tab';
import RaisedButton from 'material-ui/lib/raised-button';

import _ from 'lodash';

class PostForm extends Component {
  render(){
    return (
      <Tabs>
        <Tab label="Редактирование" >
          <div className="form" style={{padding: '1em'}}>
            <div>
              <TextField
                style={{width: '100%'}}
                floatingLabelText="Тема"
                />
            </div>
            <div>
              <TextField
                style={{width: '100%'}}
                floatingLabelText="Текст"
                multiLine={true}
                rows={10}
                />
            </div>
            <div>
              <RaisedButton label="Сохранить" primary={true} />
            </div>
          </div>
        </Tab>
        <Tab label="Предпросмотр" >
          <div style={{padding: '1em'}}>
            Тут предпросмотр.
          </div>
        </Tab>
      </Tabs>
    );
  }
}

export default PostForm;
