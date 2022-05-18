// *****************************************************************************
// Notices:
//
// Copyright © 2019, 2021 United States Government as represented by the Administrator
// of the National Aeronautics and Space Administration. All Rights Reserved.
//
// Disclaimers
//
// No Warranty: THE SUBJECT SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY WARRANTY OF
// ANY KIND, EITHER EXPRESSED, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED
// TO, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL CONFORM TO SPECIFICATIONS,
// ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
// OR FREEDOM FROM INFRINGEMENT, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL BE
// ERROR FREE, OR ANY WARRANTY THAT DOCUMENTATION, IF PROVIDED, WILL CONFORM TO
// THE SUBJECT SOFTWARE. THIS AGREEMENT DOES NOT, IN ANY MANNER, CONSTITUTE AN
// ENDORSEMENT BY GOVERNMENT AGENCY OR ANY PRIOR RECIPIENT OF ANY RESULTS,
// RESULTING DESIGNS, HARDWARE, SOFTWARE PRODUCTS OR ANY OTHER APPLICATIONS
// RESULTING FROM USE OF THE SUBJECT SOFTWARE.  FURTHER, GOVERNMENT AGENCY
// DISCLAIMS ALL WARRANTIES AND LIABILITIES REGARDING THIRD-PARTY SOFTWARE, IF
// PRESENT IN THE ORIGINAL SOFTWARE, AND DISTRIBUTES IT ''AS IS.''
//
// Waiver and Indemnity:  RECIPIENT AGREES TO WAIVE ANY AND ALL CLAIMS AGAINST
// THE UNITED STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS
// ANY PRIOR RECIPIENT.  IF RECIPIENT'S USE OF THE SUBJECT SOFTWARE RESULTS IN
// ANY LIABILITIES, DEMANDS, DAMAGES, EXPENSES OR LOSSES ARISING FROM SUCH USE,
// INCLUDING ANY DAMAGES FROM PRODUCTS BASED ON, OR RESULTING FROM, RECIPIENT'S
// USE OF THE SUBJECT SOFTWARE, RECIPIENT SHALL INDEMNIFY AND HOLD HARMLESS THE
// UNITED STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY
// PRIOR RECIPIENT, TO THE EXTENT PERMITTED BY LAW.  RECIPIENT'S SOLE REMEDY FOR
// ANY SUCH MATTER SHALL BE THE IMMEDIATE, UNILATERAL TERMINATION OF THIS
// AGREEMENT.
// *****************************************************************************
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';

import ImageList from '@material-ui/core/ImageList';
import ImageListItem from '@material-ui/core/ImageListItem';
import Divider from '@material-ui/core/Divider';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import ChordDiagram from './ChordDiagram';

import DiagnosisRequirementsTable from './DiagnosisRequirementsTable';
import CircularProgress from '@material-ui/core/CircularProgress';
import DiagnosisProvider from './DiagnosisProvider';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import RemoveIcon from '@material-ui/icons/Remove';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import Paper from '@material-ui/core/Paper';
import Slide from '@material-ui/core/Slide';
import Fade from '@material-ui/core/Fade';

const fs = require('fs');

const styles = theme => ({
  root: {
    // flex: 1,
    backgroundColor: theme.palette.background.paper,
  },
  appbar: {
    display: 'flex',
  },
  tabRoot : {
    minHeight: 36,
  },
  tabsScrollable : {
    overflowX: 'hidden',
  }
});

function TabContainer(props) {
  return (
    <Typography component="div" style={{ padding: 8 * 3 }}>
      {props.children}
    </Typography>
  );
}

TabContainer.propTypes = {
  children: PropTypes.node.isRequired,
};

class DisplayConnectedComponents extends React.Component {
  state = {
    value: 0,
    status:''
  };


  handleChange = (event, value) => {
    this.setState({ value });
  };


  diagnoseSpec(event) {
    event.stopPropagation()
    this.setState({status : 'PROCESSING'});
    var filePath = './analysis/tmp/'+'Infusion_Manager.lus.json';
    console.log(filePath);
    if (fs.existsSync()) {
      this.setState({status : 'DONE'});
    } else {
      // let engine = new DiagnosisEngine(contract, 'realizability');
      // engine.main();
      this.setState({status : 'DONE'});
    }
  }

  render() {
    const {diagnosed, classes, selectedProject} = this.props;
    const {value, status} = this.state;
    return (
      <div>
        {/* try this to appbar below : style={{height: '36px'}}*/}
        <AppBar style={{height: '36px'}} position="static" color="default">
        {/* try this to div below : className={classes.appbar}*/}
          <div className={classes.appbar}>
            <Tabs              
              value={value}
              onChange={this.handleChange}
              variant="scrollable"
              scrollButtons="on"
              indicatorColor="secondary"
              textColor="primary"
              classes={{scrollable : classes.tabsScrollable}}                           
            >
              <Tab classes={{root : classes.tabRoot}} label={<div>CC 1 {/*<ClearIcon style={{verticalAlign: 'bottom'}} color='error'/>*/}</div>}/>            
            </Tabs>
          </div>
        </AppBar>
        {value === 0 &&
          <TabContainer>
            <DiagnosisProvider>
              <div>
                {diagnosed && 
                  <Fade in={diagnosed}>
                  <ChordDiagram selectedComponent = {"../analysis/Infusion_Manager.lus.json"}/>
                  </Fade>
                }
                {/*status === 'DONE' ? (
                  <ChordDiagram selectedComponent = {"../analysis/Infusion_Manager.lus.json"}/>) :
                  (status === 'PROCESSING' ? <CircularProgress size={22} /> : 
                    (<Button size="small" onClick={(event) => {this.diagnoseSpec(event)}} color="secondary" variant='contained'>
                      Diagnose
                      </Button>))*/}
                &nbsp;
                &nbsp;
                &nbsp;
                &nbsp;
                <DiagnosisRequirementsTable selectedProject={selectedProject} existingProjectNames={[selectedProject]}/>
              </div>
            </DiagnosisProvider>
          </TabContainer>
        }
        {/*{value === 1 && <TabContainer>Component Two</TabContainer>}
        {value === 2 && <TabContainer>Component Three</TabContainer>}*/}
      </div>
    );
  }
}

DisplayConnectedComponents.propTypes = {
  selectedProject: PropTypes.string.isRequired,
  diagnosed : PropTypes.bool.isRequired
  // selectedComponent: PropTypes.string.isRequired

  //TODO: add connectedComponent information
}

export default withStyles(styles)(DisplayConnectedComponents);
