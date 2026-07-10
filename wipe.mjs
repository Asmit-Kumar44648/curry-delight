import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function wipeOrders() {
  console.log("Fetching all orders...");
  const snapshot = await getDocs(collection(db, 'orders'));
  console.log(`Found ${snapshot.size} orders to delete.`);
  let deleted = 0;
  for (const document of snapshot.docs) {
    await deleteDoc(doc(db, 'orders', document.id));
    deleted++;
  }
  console.log(`Deleted ${deleted} orders successfully.`);
  process.exit(0);
}

wipeOrders().catch(err => {
  console.error("Error wiping orders:", err);
  process.exit(1);
});
