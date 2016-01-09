requirejs([
  'react',
  'react-dom',
  'components/Layout/layout',
  'domReady!'
], function (React, ReactDOM, Layout) {
  'use strict';

  ReactDOM.render(React.createElement(Layout.default, null), document.getElementById('app'));
});
