const functions = require('firebase-functions');
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
// Initialize Firebase Admin SDK
admin.initializeApp();

const firebaseAuth = admin.auth();
const firestore = admin.firestore();

exports.hello = functions.https.onRequest(
    async (req, res) => res.status(200).send("Hello world!")
)

// Firebase function to handle signin and return a custom token
exports.signInWithPhoneNumberAndPassword = functions.https.onRequest(
  async (req, res) => {
    // Ensure the request is a POST request
    if (req.method !== 'POST') {
      console.log("Method not allowed")
      return res.status(405).send('Method Not Allowed');
    }

    console.log("Data", req.body)
    const { phoneNumber, password } = req.body.data; // Expect phone number and password in the request body

    if (!phoneNumber || !password) {
      console.log("Phone number and password are required")
      return res.status(400).send('Phone number and password are required');
    }

    try {
      // Check if the user exists in Firestore based on the phone number
      const userSnapshot = await firestore
        .collection('users')
        .where('phoneNumber', '==', phoneNumber)
        .get();

      if (userSnapshot.empty) {
        console.log("User not found")
        return res.status(404).send('User not found');
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();

      // Verify the password (for simplicity, assume it’s hashed and stored in Firestore)
      // Here, you would implement a password verification mechanism (e.g., bcrypt or another hashing algorithm)
      const passwordIsValid = await verifyPassword(
        password,
        userData.hashedPassword
      );

      if (!passwordIsValid) {
        console.log("Invalid password")
        return res.status(401).send('Invalid password');
      }

      // If credentials are valid, create a custom token
      const customToken = await firebaseAuth.createCustomToken(userDoc.id);

      console.log("OK")
      // Send the custom token to the client
      return res.status(200).send({ data: {token: customToken} });
    } catch (error) {
      console.error('Error during signIn: ', error);
      return res.status(500).send('Internal Server Error');
    }
  }
);

function verifyPassword(enteredPassword, storedHash) {
  return bcrypt.compare(enteredPassword, storedHash);
}
