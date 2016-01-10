import Layout from './components/Layout/layout.js'
import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import $ from 'jquery';
import injectTapEventPlugin from 'react-tap-event-plugin';

injectTapEventPlugin();

$(document).ready(() =>
  ReactDOM.render(
    <Layout/>,
    document.getElementById('app')
  )
);
