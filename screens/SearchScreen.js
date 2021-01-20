import React from 'react';
import { Text, View ,FlatList,StyleSheet,TextInput,TouchableOpacity} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler'
import db from "../config.js"

export default class Searchscreen extends React.Component {
  constructor(){
    super()
    this.state = {
      allTransaction:[],
      lastVisibleTransaction:null,
      search:''
      
    }
  }
  componentDidMount = async() => {
    const query = await db.collection('Transaction').get();
    query.docs.map((doc)=>{
    this.setState({
      allTransaction:[],
      lastVisibleTransaction:doc
    })
    })
  }

  searchTransaction = async(text) => {
    var enterText=text.split('');
    if(enterText[0].toUpperCase() === 'B'){
      const transaction =  await db.collection("Transaction").where('bookId','==',text).get()
      transaction.docs.map((doc)=>{
        this.setState({
          allTransaction:[...this.state.allTransaction,doc.data()],
          lastVisibleTransaction:doc
        })
      })
    }else if(enterText[0].toUpperCase() === 'S'){
      const transaction =  await db.collection("Transaction").where('studentId','==',text).get()
      transaction.docs.map((doc)=>{
        this.setState({
          allTransaction:[...this.state.allTransaction,doc.data()],
          lastVisibleTransaction:doc
        })
      })
    }
  }

  fetchMoreTransactions = async() => {
    var text = this.state.search.toUpperCase();
    var enteredText = text.split('');
    if (enteredText[0].toUpperCase() ==='B'){
      const query = await db.collection('Transaction').where("bookId",'==',text).startAfter(this.state.lastVisibleTransaction).limit(10).get()
      query.docs.map((doc)=>{
      this.setState({
        allTransaction:[...this.state.allTransaction,doc.data()],
        lastVisibleTransaction:doc
        })
      })
    }else if (enteredText[0].toUpperCase() ==='S'){
      const query = await db.collection('Transaction').where('studentId','==',text).startAfter(this.state.lastVisibleTransaction).limit(10).get()
    query.docs.map((doc)=>{
    this.setState({
      allTransaction:[...this.state.allTransaction,doc.data()],
      lastVisibleTransaction:doc
    })
})
    }

    
  } 
    render() {
      return (
        <View style={styles.container}>
          <View style={styles.searchBar}>
          <TextInput 
            style ={styles.bar}
            placeholder = "Enter Book Id or Student Id"
            onChangeText={(text)=>{this.setState({search:text})}}/>
          <TouchableOpacity
            style = {styles.searchButton}
            onPress={()=>{this.searchTransaction(this.state.search)}}
          >
            <Text>Search</Text>
          </TouchableOpacity>
          </View>
          <FlatList data={this.state.allTransaction}
          renderItem = {({item})=>(
            <View  style = {{
              borderBottomWidth:2
            }}>
              <Text>{"Book Id: "+ item.bookId}</Text>
              <Text>{"Student Id: "+ item.studentId}</Text>
              <Text>{"Transaction Type: "+item.transactionType}</Text>
              <Text>{"Date : "+item.date.toDate()}</Text>
            </View>
          )} 
            keyExtractor = {(item,index)=> index.toString()}
            onEndReached = {this.fetchMoreTransactions}
            onEndReachedThreshold = {0.7} />
        </View>  
      );
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      marginTop: 20
    },
    searchBar:{
      flexDirection:'row',
      height:40,
      width:'auto',
      borderWidth:0.5,
      alignItems:'center',
      backgroundColor:'grey',
  
    },
    bar:{
      borderWidth:2,
      height:30,
      width:300,
      paddingLeft:10,
    },
    searchButton:{
      borderWidth:1,
      height:30,
      width:50,
      alignItems:'center',
      justifyContent:'center',
      backgroundColor:'green'
    }
  })

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