import React, {useState} from 'react';
import { Table, TableWrapper, Row, Rows, Col, Cols, Cell } from 'react-native-table-component';
import { Picker } from '@react-native-picker/picker';

import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    Button,
    useColorScheme,
    View,
    TouchableOpacity,
  } from 'react-native';

  const dateRegex = new RegExp('^\\d\\d\\d\\d-\\d\\d-\\d\\d');

  function jsonDateReviver(key, value) {
    if (typeof value === 'string' && dateRegex.test(value)) {
      const dateValue = new Date(value);
      return isNaN(dateValue) ? value : dateValue;
    }
    return value;
  }

  async function graphQLFetch(query, variables = {}) {
    try {
        const response = await fetch('http://10.0.2.2:3000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({ query, variables })
      });
      const body = await response.text();
      const result = JSON.parse(body, jsonDateReviver);
      console.log('GraphQL Response:', result); 

      if (result.errors) {
        const error = result.errors[0];
        const details = error?.extensions?.exception?.errors?.join('\n ') || 'Unknown error details';
        alert(`Error: ${error?.message || 'Unknown error'}\nDetails: ${details}`);
        return null;
      }
      return result.data || null;
    } catch (e) {
      alert(`Network Error: ${e.message}`);
      console.error(e);
      return null;
    }
  }

class IssueFilter extends React.Component {
    render() {
      return (
        <>
        <TextInput
            placeholder="Filter by title"
            style={styles.input}
            onChangeText={(text) => {
                this.props.onFilterChange({ title: text });  
            }}
        />
        </>
      );
    }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 30, backgroundColor: '#fff' },
  header: { height: 50, backgroundColor: '#537791' },
  text: { textAlign: 'center' },
  dataWrapper: { marginTop: -1 },
  row: { height: 40, backgroundColor: '#E7E6E1' },
  topHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },  
  subHeader: { fontWeight: 'bold', marginBottom: 15, fontSize: 16 },  
  horizontalLine: { borderBottomColor: '#ccc', borderBottomWidth: 1, marginVertical: 15 }, 

  buttonRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-evenly',
    marginBottom: 20 
  },
  button: { 
    flex: 1, 
    paddingVertical: 12, 
    marginHorizontal: 5, 
    backgroundColor: '#28a745', 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  formLabel: { marginRight: 12, fontWeight: 'bold', fontSize: 14, width: 60 }, 
  formRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 }, 
  picker: { width: 180, backgroundColor: '#f8f8f8', borderRadius: 5 }, 
  pickerItem: { fontSize: 16, paddingVertical: 8 }, 
  });

const width= [40,60,60,60,80,80,200];

function IssueRow(props) {
  const issue = props.issue;
  const rowData = [
    issue.id || 'N/A',
    issue.title || 'No Title',
    issue.status || 'No Status',
    issue.owner || 'Unassigned',
    issue.created ? new Date(issue.created).toLocaleString() : 'No Date',
    issue.effort || '0',
    issue.due ? new Date(issue.due).toLocaleString() : 'No Due Date',
  ];
  return (
    <>
      <Row data={rowData} style={styles.row} textStyle={styles.text} widthArr={width} />
    </>
  );
}

function IssueTable(props) {
  const issueRows = props.issues.map(issue =>
    <IssueRow key={issue.id} issue={issue} />
  );
  const tableHeader = ['ID', 'Title', 'Status', 'Owner', 'Created', 'Effort', 'Due'];
  return (
    <>
      <Text style={styles.subHeader}>Issue Table</Text>
      <IssueFilter
        onFilterChange={(filter) => {
          let originIssues = props.originIssues;
          if (!originIssues || props.issues.length > originIssues.length) {
            originIssues = props.issues;
          }
          const filteredIssues = originIssues.filter(
            (issue) => (!filter.title || issue.title.includes(filter.title))
          );
          props.onUpdateIssues(filteredIssues, originIssues);
        }}
      />
      <ScrollView horizontal={true}> 
        <View style={[styles.container, { minWidth: 1000 }]}> 
          <Table borderStyle={{ borderWidth: 1, borderColor: '#c8e1ff' }}>
            <Row 
              data={tableHeader} 
              style={styles.header} 
              textStyle={styles.text} 
              widthArr={width} 
            />
            <ScrollView style={styles.dataWrapper}>
              {issueRows}
            </ScrollView>
          </Table>
        </View>
      </ScrollView>
    </>
  );
}

  
class IssueAdd extends React.Component {
  constructor() {
    super();
    this.handleSubmit = this.handleSubmit.bind(this);
    this.state = {
      title: '',
      status: 'New',
      owner: '',
      effort: '',
      due: '',
    };
  }
  handleChange = (field, value) => {
    this.setState({ [field]: value });
  };
  validateInputs = () => {
    const { title, status, due } = this.state;
    if (!title.trim()) {
      alert('Title is required.');
      return false;
    }
    if (!status.trim()) {
      alert('Status is required.');
      return false;
    }
    if (due && isNaN(Date.parse(due))) {
      alert('Invalid due date. Please use YYYY-MM-DD format.');
      return false;
    }
    return true;
  };

  handleSubmit() {
    if (!this.validateInputs()) return;
    const { title, status, owner, effort, due } = this.state;
    const issue = {
      title,
      status,
      owner,
      effort: isNaN(parseInt(effort, 10)) ? null : parseInt(effort, 10),
      due: due ? new Date(due).toISOString() : null, 
    };
    console.log('Submitting issue:', issue); 
    this.props.onAddIssue(issue);
    this.setState({ title: '', status: 'New', owner: '', effort: '', due: '' }); 
  }

  render() {
    return (
        <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Add New Issue</Text>
        <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Title</Text>
            <TextInput
                placeholder="Enter title"
                value={this.state.title}
                onChangeText={(value) => this.handleChange('title', value)}
            />
        </View>
        <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Owner</Text>
            <TextInput
                placeholder="Enter owner"
                value={this.state.owner}
                onChangeText={(value) => this.handleChange('owner', value)}
            />
        </View>
        <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Effort</Text>
            <TextInput
                placeholder="Enter effort"
                keyboardType="numeric"
                value={this.state.effort}
                onChangeText={(value) => this.handleChange('effort', value)}
            />
        </View>
        <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Due Date</Text>
            <TextInput
                placeholder="YYYY-MM-DD"
                value={this.state.due}
                onChangeText={(value) => this.handleChange('due', value)}
            />
        </View>
        <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Status</Text>
            <Picker
                selectedValue={this.state.status || 'New'}
                onValueChange={(value) => this.handleChange('status', value)}
                style={styles.picker}
            >
                <Picker.Item label="New" value="New" />
                <Picker.Item label="Assigned" value="Assigned" />
                <Picker.Item label="Fixed" value="Fixed" />
                <Picker.Item label="Closed" value="Closed" />
            </Picker>
        </View>
        <Button title="Add Issue" color="#28a745" onPress={this.handleSubmit} />
        </View>
    );
  }
}


class BlackList extends React.Component {
    constructor()
    {   super();
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state = { nameInput: '' };
    }
    handleChange = (value) => {
      this.setState({ nameInput: value });
    };
    async handleSubmit() {
    const { nameInput } = this.state;
    const query = `mutation addToBlacklist($nameInput: String!) {
        addToBlacklist(nameInput: $nameInput)
    }`;
    const data = await graphQLFetch(query, { nameInput });
    if (data) {
        alert('Name added to blacklist');
    }
    this.setState({ nameInput: '' }); 
    }
    render() {
    return (
        <View>
        <TextInput
                    placeholder="Enter name"
                    value={this.state.nameInput}
                    onChangeText={this.handleChange}
        />
        <Button title="Add to Blacklist" onPress={this.handleSubmit} />
        </View>
    );
    }
}

export default class IssueList extends React.Component {
  constructor() {
      super();
      this.state = { issues: [], display: 1 }; 
      this.createIssue = this.createIssue.bind(this);
      this.setDisplay = this.setDisplay.bind(this);
  }
  setDisplay(value) {
      this.setState({ display: value }); 
  }
  componentDidMount() {
      this.loadData();
  }
  async loadData() {
      const query = `query {
          issueList {
              id title status owner
              created effort due
          }
      }`;
      const data = await graphQLFetch(query);
      if (data) {
          this.setState({ issues: data.issueList });
      }
  }
  async createIssue(issue) {
      console.log('Adding issue:', issue); 
      const query = `mutation issueAdd($issue: IssueInputs!) {
          issueAdd(issue: $issue) {
              id
          }
      }`;
      console.log("Submitting issue:", issue);
      const data = await graphQLFetch(query, { issue });
      console.log('GraphQL Response:', data); 
      if (data) {
          this.loadData(); 
      } else {
        alert('Failed to add issue. Please check the input or try again.');
      }
  }

  render() {
      return (
          <>
              <Text style={styles.topHeader}>Issue Tracker</Text>
              <View style={styles.buttonRow}>
                  <TouchableOpacity onPress={() => this.setDisplay(2)} style={styles.button}>
                  <Text style={styles.buttonText}>Issue Table</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => this.setDisplay(3)} style={styles.button}>
                  <Text style={styles.buttonText}>Issue Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => this.setDisplay(4)} style={styles.button}>
                  <Text style={styles.buttonText}>Blacklist</Text>
                  </TouchableOpacity>
              </View>
              {this.state.display === 2 && (
                <IssueTable
                  issues={this.state.issues}
                  originIssues={this.state.originIssues}
                  onUpdateIssues={(filteredIssues, originIssues) => {
                    this.setState({ issues: filteredIssues, originIssues });
                  }}
                />
              )}
              {this.state.display === 3 && <IssueAdd onAddIssue={this.createIssue} />}
              {this.state.display === 4 && <BlackList />}
          </>
      );
  }
}