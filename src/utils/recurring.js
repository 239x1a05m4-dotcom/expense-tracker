import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";

import { db } from "../firebase/config";

/*
  Advances a YYYY-MM-DD date string forward
  by one period of the given frequency.
*/
export function advanceDate(dateStr, frequency) {
  const parts = dateStr.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);

  if (frequency === "daily") {
    d.setDate(d.getDate() + 1);
  } else if (frequency === "weekly") {
    d.setDate(d.getDate() + 7);
  } else {
    // default: monthly
    d.setMonth(d.getMonth() + 1);
  }

  return d.toISOString().split("T")[0];
}

/*
  Looks at every recurring transaction template for the
  logged-in user and, if its next due date has arrived,
  creates a real transaction instance for it and advances
  the template's next due date. Capped so a long-neglected
  recurring item can't create unlimited documents at once.
*/
export async function processRecurringTransactions(uid) {
  if (!uid) return;

  const transactionsRef = collection(
    db,
    "users",
    uid,
    "transactions"
  );

  const recurringQuery = query(
    transactionsRef,
    where("recurring", "==", true)
  );

  const snapshot = await getDocs(recurringQuery);

  const today = new Date().toISOString().split("T")[0];

  for (const templateDoc of snapshot.docs) {
    const data = templateDoc.data();

    let nextDate = data.nextDate || data.date;
    let created = 0;

    while (nextDate && nextDate <= today && created < 24) {
      await addDoc(transactionsRef, {
        type: data.type,
        description: data.description,
        amount: data.amount,
        category: data.category,
        date: nextDate,
        recurring: false,
        generatedFrom: templateDoc.id,
        createdAt: serverTimestamp()
      });

      nextDate = advanceDate(nextDate, data.frequency);
      created += 1;
    }

    if (created > 0) {
      await updateDoc(
        doc(db, "users", uid, "transactions", templateDoc.id),
        { nextDate }
      );
    }
  }
}
