import React, {Component} from 'react';

import TextField from 'material-ui/lib/text-field';
import Tabs from 'material-ui/lib/tabs/tabs';
import Tab from 'material-ui/lib/tabs/tab';
import RaisedButton from 'material-ui/lib/raised-button';
import markdown from '../../markdown';

import _ from 'lodash';

class PostForm extends Component {
  databind(property){
    return (event) => {
       this.setState(_.extend({}, this.state, {
         [property]: event.target.value
       }));
    }
  }
  convertMarkdown(){
    return { __html: markdown(this.state.body, {sanitize: true}) };
  }
  componentWillMount(){
    this.setState({title: '', body: ''})
  }
  render(){
    return (
      <Tabs>
        <Tab label="Редактирование">
          <div className="form" style={{padding: '1em'}}>
            <div>
              <TextField
                value={this.state.title}
                style={{width: '100%'}}
                floatingLabelText="Тема"
                onChange={this.databind('title')}
                />
            </div>
            <div>
              <TextField
                style={{width: '100%'}}
                floatingLabelText="Текст"
                multiLine={true}
                rows={10}
                value={this.state.body}
                onChange={this.databind('body')}
                />
            </div>
            <div>
              <RaisedButton label="Сохранить" primary={true} />
            </div>
          </div>
        </Tab>
        <Tab label="Предпросмотр">
            {(() => {
              if(!this.state.body){
                return (
                  <div style={{padding: '1em'}}>
                    Контента нет. :(
                  </div>
                );
              }
              return (
                <div style={{padding: '1em'}} dangerouslySetInnerHTML={this.convertMarkdown()}>
                </div>
              );
            })()}
        </Tab>
      </Tabs>
    );
  }
}

export default PostForm;
