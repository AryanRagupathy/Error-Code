import React from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Alert,
  ToastAndroid,
} from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import firebase from 'firebase';
import db from '../config';

export default class TransactionScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      hasCameraPermissions: null,
      scanned: false,
      scannedBookId: '',
      scannedStudentId: '',
      buttonState: 'normal',
      transactionMessage: '',
    };
  }

  getCameraPermissions = async (id) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      /*status === "granted" is true when user has granted permission
        status === "granted" is false when user has not granted the permission
      */
      hasCameraPermissions: status === 'granted',
      buttonState: id,
      scanned: false,
    });
  };

  handleBarCodeScanned = async ({ type, data }) => {
    const { buttonState } = this.state;

    if (buttonState === 'BookId') {
      this.setState({
        scanned: true,
        scannedBookId: data,
        buttonState: 'normal',
      });
    } else if (buttonState === 'StudentId') {
      this.setState({
        scanned: true,
        scannedStudentId: data,
        buttonState: 'normal',
      });
    }
  };

  initiateBookIssue = async () => {
    //add a transaction
    db.collection('Transaction').add({
      studentId: this.state.scannedStudentId,
      bookId: this.state.scannedBookId,
      date: firebase.firestore.Timestamp.now().toDate(),
      transactionType: 'Issue',
    });
console.log(this.state.scannedBookId)
    //change book status
    db.collection('Books').doc(this.state.scannedBookId).update({
      BookAvailability: false,
    });
    console.log(this.state.scannedBookId)
    //change number of issued books for student
    db.collection('Students')
      .doc(this.state.scannedStudentId)
      .update({
        NumberOfBooksIssued: firebase.firestore.FieldValue.increment(1),
      });

    this.setState({
      scannedStudentId: '',
      scannedBookId: '',
    });
  };

  initiateBookReturn = async () => {
    //add a transaction
    db.collection('Transaction').add({
      studentId: this.state.scannedStudentId,
      bookId: this.state.scannedBookId,
      date: firebase.firestore.Timestamp.now().toDate(),
      transactionType: 'Return',
    });

    //change book status
    db.collection('Books').doc(this.state.scannedBookId).update({
      BookAvailability: true,
    });

    //change book status
    db.collection('Students')
      .doc(this.state.scannedStudentId)
      .update({
        NumberOfBooksIssued: firebase.firestore.FieldValue.increment(-1),
      });

    this.setState({
      scannedStudentId: '',
      scannedBookId: '',
    });
  };

  checkBookEligibilty = async () => {
    const bookRef = await db
      .collection('Books')
      .where('BookID', '==', this.state.scannedBookId)
      .get();
    var transactionType = '';
    if (bookRef.docs.length == 0) {
      transactionType = false;
    } else {
      bookRef.docs.map((doc) => {
        var book = doc.data();
        if (book.BookAvailability) {
          transactionType = 'Issue';
        } else {
          transactionType = 'Return';
        }
      });
    }
    return transactionType;
  };

  checkStudentEligibilityForBookIssue = async () => {
    const studentRef = await db
      .collection('Students')
      .where('StudentID', '==', this.state.scannedStudentId)
      .get();
    var isStudentEligible = '';
    if (studentRef.docs.length == 0) {
      this.setState({
        scannedBookId: '',
        scannedStudentId: '',
      });
      isStudentEligible = false;
      Alert.alert('This Student ID Doesnt exist in the database');
    } else {
      studentRef.docs.map((doc) => {
        var student = doc.data();
        if (student.NumberOfBooksIssued < 2) {
          isStudentEligible = true;
        } else {
          isStudentEligible = false;
          Alert.alert('The student has already issued two books');
          this.setState({
            scannedStudentId: '',
            scannedBookId: '',
          });
        }
      });
    }
    return isStudentEligible;
  };

  checkStudentEligibilityForBookReturn = async () => {
    const transactionRef = await db
      .collection('Transaction')
      .where('bookId', '==', this.state.scannedBookId)
      .limit(1)
      .get();
    var isStudentEligible = '';
    transactionRef.docs.map((doc) => {
      var lastBookTransaction = doc.data;
      if (lastBookTransaction.studentId === this.state.scannedStudentId) {
        isStudentEligible = true;
      } else {
        isStudentEligible = false;
        Alert.alert('The book wasnt issued by the student');
        this.setState({
          scannedBookId: '',
          scannedStudentId: '',
        });
      }
    });
    return isStudentEligible;
  };
handleTransaction = async () => {
    //console.log("Inside handleTransaction");
    var transactionType = await this.checkBookEligibilty();
    //console.log("***"+transactionType+"***");
    if (!transactionType) {
      Alert.alert('The book doesnt exist in the library database');
      this.setState({
        scannedBookId: '',
        scannedStudentId: '',
      });
    } else if (transactionType === 'Issue') {
      var isStudentEligible = await this.checkStudentEligibilityForBookIssue;
      if (isStudentEligible) {
        this.initiateBookIssue();
        Alert.alert('The book is issued to the student');
      }
    } else {
      var isStudentEligible1 = await this.checkStudentEligibilityForBookIssue;
      if (isStudentEligible1) {
        this.initiateBookReturn();
        Alert.alert('The book is issued to the student');
      }
    }
   
  };

  render() {
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;

    if (buttonState !== 'normal' && hasCameraPermissions) {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    } else if (buttonState === 'normal') {
      return (
        <KeyboardAvoidingView
          style={styles.container}
          behavior="padding"
          enabled>
          <View>
            <Image
              source={require('../assets/booklogo.jpg')}
              style={{ width: 200, height: 200 }}
            />
            <Text style={{ textAlign: 'center', fontSize: 30 }}>Wily</Text>
          </View>
          <View style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              placeholder="Book Id"
              value={this.state.scannedBookId}
              onChangeText={(text) =>
                this.setState({
                  scannedBookId: text,
                })
              }
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                this.getCameraPermissions('BookId');
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              placeholder="Student Id"
              value={this.state.scannedStudentId}
              onChangeText={(text) =>
                this.setState({
                  scannedStudentId: text,
                })
              }
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                this.getCameraPermissions('StudentId');
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.transactionAlert}>
            {this.state.transactionMessage}
          </Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={async () => {
              var transactionMessage = await this.handleTransaction();
              this.setState({
                scannedBookId: '',
                scannedStudentId: '',
              });
            }}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  buttonText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
  },
  inputView: {
    flexDirection: 'row',
    margin: 20,
  },
  inputBox: {
    width: 200,
    height: 40,
    borderWidth: 1.5,
    borderRightWidth: 0,
    fontSize: 20,
  },
  scanButton: {
    backgroundColor: '#66BB6A',
    width: 50,
    borderWidth: 1.5,
    borderLeftWidth: 0,
  },
  submitButton: {
    backgroundColor: '#FBC02D',
    width: 100,
    height: 50,
  },
  submitButtonText: {
    padding: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
});
