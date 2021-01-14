import React from 'react';
import { Text, View ,FlatList} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler'
import db from "../config.js"

export default class Searchscreen extends React.Component {
  constructor(){
    super()
    this.state = {
      allTransaction = []
    }
  }
  componentDidMount = async() => {
    const query = await db.collection('Transaction').get();
    query.docs.map((doc)=>{
this.setState({
  allTransaction:[this.state.allTransaction,doc.data()]
})
    })
  }
    render() {
      return (
        <FlatList data={this.state.allTransaction}
        renderItem = {({item})=>{
          <View key={index} style = {{
            borderBottomWidth:2
          }}>
            <Text>{"Book Id: "+transaction.bookId}</Text>
            <Text>{"Student Id: "+transaction.studentId}</Text>
            <Text>{"Transaction Type: "+transaction.transactionType}</Text>
            <Text>{"Date : "+transaction.date.toDate()}</Text>
          </View>
        }}/>
        
      );
    }
  }

  /* 
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
           <ScrollView>
             {this.state.allTransaction.map((transaction,index)=>{
              return(
              <View key={index} style = {{
                borderBottomWidth:2
              }}>
                <Text>{"Book Id: "+transaction.bookId}</Text>
                <Text>{"Student Id: "+transaction.studentId}</Text>
                <Text>{"Transaction Type: "+transaction.transactionType}</Text>
                <Text>{"Date : "+transaction.date.toDate()}</Text>
              </View>
              )
             })}
           </ScrollView>
          <Text>Search</Text>
        </View>
         */