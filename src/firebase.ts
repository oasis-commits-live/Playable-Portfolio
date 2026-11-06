import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Connection test as per Firebase skill guidelines
async function testConnection() {
  try {
    // Attempt to fetch a non-existent doc to verify connectivity to the specific databaseId
    await getDocFromServer(doc(db, '_healthcheck', 'connection'));
    console.log(`Firestore connection established to database: ${firebaseConfig.firestoreDatabaseId}`);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline')) {
        console.error("Firestore connection failed: Client is offline or database is unreachable.");
      } else {
        console.error("Firestore initialization error:", error.message);
      }
    }
  }
}
testConnection();
