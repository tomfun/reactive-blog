import React, {Component} from 'react';
import AppBar from 'material-ui/lib/app-bar';

import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import {SelectableContainerEnhance} from 'material-ui/lib/hoc/selectable-enhance';

import Paper from 'material-ui/lib/paper';

import PostForm from '../PostForm/post-form'
import PostList from '../PostList/post-list'

import _ from 'lodash';

import l from '../../translator';


let SelectableList = SelectableContainerEnhance(List);

class Layout extends Component {
  handleMenu(event, value){
    this.setState({menu: value})
  }
  componentWillMount(){
    this.setState({menu: 'form'})
  }
  render(){
    return (
      <div className="layout">
        <AppBar
          title={l('DASHBOARD->TITLE')}
          iconClassNameRight="muidocs-icon-navigation-expand-more"
        />
        <div style={{paddingTop: '1em'}}>
          <div style={{width: '20%', display: 'inline-block', marginRight: '1em'}}>
            <Paper zDepth={1}>
              <SelectableList valueLink={{value: this.state.menu, requestChange: _.bind(this.handleMenu, this)}}>
                <ListItem primaryText={l('DASHBOARD->MENU->POST->NEW')} value="form" />
                <ListItem primaryText={l('DASHBOARD->MENU->POST->LIST')} value="list" />
              </SelectableList>
            </Paper>
          </div>
          <div style={{width: '78%', display: 'inline-block', position: 'absolute'}}>
            <Paper zDepth={1} style={{padding: '1em'}}>
              {(() => {
                if(this.state.menu === 'list'){
                  return <PostList/>
                }
                return <PostForm />
              })()}
            </Paper>
          </div>
        </div>
      </div>
    );
  }
}

export default Layout;
