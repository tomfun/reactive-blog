import React, {Component} from 'react';
import { Router, Route, Link, IndexRedirect, browserHistory } from 'react-router';

import Layout from './Layout/layout'
import PostForm from './PostForm/post-form';
import PostList from './PostList/post-list';

import NotFound from './NotFound/not-found';

export default () => {
  return (
    <Router history={browserHistory}>
       <Route path="/" component={Layout}>
         <IndexRedirect to="post/form" />
         <Route path="post/form" component={PostForm} />
         <Route path="post/list" component={PostList} />
       </Route>
       <Route path="*" component={NotFound}/>
    </Router>
  )
};
