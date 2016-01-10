import Layout from './components/Layout/layout.js'
import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import $ from 'jquery';
import injectTapEventPlugin from 'react-tap-event-plugin';
import Router from './components/router'

injectTapEventPlugin();

$(document).ready(() =>
  ReactDOM.render(
    Router(),
    document.getElementById('app')
  )
);
