import React, {Component} from 'react';

import Table from 'material-ui/lib/table/table';
import TableBody from 'material-ui/lib/table/table-body';
import TableFooter from 'material-ui/lib/table/table-footer';
import TableHeader from 'material-ui/lib/table/table-header';
import TableHeaderColumn from 'material-ui/lib/table/table-header-column';
import TableRow from 'material-ui/lib/table/table-row';
import TableRowColumn from 'material-ui/lib/table/table-row-column';

import _ from 'lodash';

import l from '../../translator';

class PostForm extends Component {
  render(){
    return (
      <div className="list">
            <Table height="300px" fixedHeader={true} selectable={false}>
            <TableHeader displaySelectAll={false}>
              <TableRow>
                <TableHeaderColumn colSpan="2" tooltip={l('DASHBOARD->POST->LIST->HEADER->TOOLTIP')} style={{textAlign: 'center'}}>
                  {l('DASHBOARD->POST->LIST->HEADER->TITLE')}
                </TableHeaderColumn>
              </TableRow>
              <TableRow>
                <TableHeaderColumn tooltip={l('DASHBOARD->POST->LIST->HEADER->POST_ID->TOOLTIP')}>
                  {l('DASHBOARD->POST->LIST->HEADER->POST_ID->TITLE')}
                </TableHeaderColumn>
                <TableHeaderColumn tooltip={l('DASHBOARD->POST->LIST->HEADER->POST_TITLE->TOOLTIP')}>
                  {l('DASHBOARD->POST->LIST->HEADER->POST_TITLE->TITLE')}
                </TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody>
              {
                _.map(
                  _.range(1, 10), (index) => (
                    <TableRow key={index}>
                      <TableRowColumn>{index}</TableRowColumn>
                      <TableRowColumn>Lorem ipsum dolor sit amet.</TableRowColumn>
                    </TableRow>
                  )
                )
              }
            </TableBody>
          </Table>
      </div>
    );
  }
}

export default PostForm;
