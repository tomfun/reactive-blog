import React, {Component} from 'react';
import { Router, Route, Link, IndexRedirect, browserHistory } from 'react-router';

import Layout from './Layout/layout'
import PostForm from './PostForm/post-form';
import PostList from './PostList/post-list';

export default () => {
  return (
    <Router history={browserHistory}>
       <Route path="/" component={Layout}>
         <IndexRedirect to="post/form" />
         <Route path="post/form" component={PostForm}/>
         <Route path="post/list" component={PostList}/>
       </Route>
    </Router>
  )
};
