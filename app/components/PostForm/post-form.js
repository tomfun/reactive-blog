import React, {Component} from 'react';

import TextField from 'material-ui/lib/text-field';
import Tabs from 'material-ui/lib/tabs/tabs';
import Tab from 'material-ui/lib/tabs/tab';
import RaisedButton from 'material-ui/lib/raised-button';
import l from '../../translator';

import Markdown from '../Markdown/markdown'

import _ from 'lodash';

class PostForm extends Component {
  databind(property) {
    return (event) => {
      this.setState(_.extend({}, this.state, {
        [property]: event.target.value
      }));
    }
  }

  componentWillMount() {
    this.setState({title: '', body: ''})
  }

  render() {
    return (
      <Tabs>
        <Tab label={l('DASHBOARD->POST->FORM->EDIT->TITLE')}>
          <div className="form" style={{padding: '1em'}}>
            <div>
              <TextField
                style={{width: '100%'}}
                floatingLabelText={l('DASHBOARD->POST->FORM->FIELD->TITLE')}
                value={this.state.title}
                onChange={this.databind('title')}
                />
            </div>
            <div>
              <TextField
                style={{width: '100%'}}
                floatingLabelText={l('DASHBOARD->POST->FORM->FIELD->BODY')}
                multiLine={true}
                rows={10}
                value={this.state.body}
                onChange={this.databind('body')}
                />
            </div>
            <div>
              <RaisedButton label={l('DASHBOARD->POST->FORM->SAVE')} primary={true}/>
            </div>
          </div>
        </Tab>
        <Tab label={l('DASHBOARD->POST->FORM->PREVIEW->TITLE')}>
          {(() => {
            if(!this.state.body) {
              return (
                <div style={{padding: '1em'}}>
                  {l('DASHBOARD->POST->FORM->PREVIEW->NO_CONTENT')}
                </div>
              );
            }
            return (
              <div style={{padding: '1em'}}>
                <Markdown>
                  {this.state.body}
                </Markdown>
              </div>
            );
          })()}
        </Tab>
      </Tabs>
    );
  }
}

export default PostForm;
