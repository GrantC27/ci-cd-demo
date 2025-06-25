import admin from 'firebase-admin';

// Parse the service account credentials from an environment variable
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    throw error;
  }
}

const db = admin.firestore();

export const handler = async (event) => {
  console.log(`Processing ${event.Records.length} SQS messages`);

  for (const record of event.Records) {
    try {
      const webhookData = JSON.parse(record.body);
      console.log(`Processing webhook: ${webhookData.eventType} - ${webhookData.eventId}`);

      const alreadyProcessed = await checkIfAlreadyProcessed(webhookData.eventId);
      if (alreadyProcessed) {
        console.log(`Event ${webhookData.eventId} already processed, skipping`);
        continue;
      }

      switch (webhookData.eventType) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(webhookData.eventData, webhookData.eventId);
          break;
        case 'payment_intent.succeeded':
          await handlePaymentSucceeded(webhookData.eventData, webhookData.eventId);
          break;
        default:
          console.log(`Unhandled event type: ${webhookData.eventType}`);
      }

      await markAsProcessed(webhookData.eventId, webhookData.eventType);
      console.log(`Successfully processed event ${webhookData.eventId}`);

    } catch (error) {
      console.error(`Error processing SQS record:`, error);
      console.error('Record data:', record.body);
      await logProcessingError(record, error);
    }
  }

  return { statusCode: 200 };
};

// Idempotency check
async function checkIfAlreadyProcessed(eventId) {
  try {
    const doc = await db.collection('processed_webhooks').doc(eventId).get();
    return doc.exists;
  } catch (error) {
    console.error('Error checking if event already processed:', error);
    return false;
  }
}

// Mark event as processed
async function markAsProcessed(eventId, eventType) {
  try {
    await db.collection('processed_webhooks').doc(eventId).set({
      eventId,
      eventType,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      processedBy: 'stripe-webhook-processor'
    });
  } catch (error) {
    console.error('Error marking event as processed:', error);
  }
}

async function handleCheckoutCompleted(session, eventId) {
  const firebaseUid = session?.client_reference_id;

  if (!firebaseUid) {
    throw new Error('No Firebase UID found in session metadata');
  }

  const amountPaid = session.amount_total;
  const creditsToAdd = calculateCredits(amountPaid);

  await updateUserCredits(firebaseUid, creditsToAdd, eventId, 'checkout_session');
  console.log(`Added ${creditsToAdd} credits to user ${firebaseUid} from checkout ${session.id}`);
}

async function handlePaymentSucceeded(paymentIntent, eventId) {
  const firebaseUid = paymentIntent?.client_reference_id;

  if (!firebaseUid) {
    throw new Error('No Firebase UID found in payment intent metadata');
  }

  const amountPaid = paymentIntent.amount;
  const creditsToAdd = calculateCredits(amountPaid);

  await updateUserCredits(firebaseUid, creditsToAdd, eventId, 'payment_intent');
  console.log(`Added ${creditsToAdd} credits to user ${firebaseUid} from payment ${paymentIntent.id}`);
}

function calculateCredits(amountInCents) {
  return Math.floor(amountInCents / 100);
}

async function updateUserCredits(firebaseUid, creditsToAdd, transactionId, transactionType) {
  const userRef = db.collection('users').doc(firebaseUid);

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    const now = new Date(); // Use regular timestamp instead of serverTimestamp
    
    if (!userDoc.exists) {
      transaction.set(userRef, {
        credits: creditsToAdd,
        totalCredits: creditsToAdd,
        transactions: [{  // This should be an array, not a single object
          id: transactionId,
          credits: creditsToAdd,
          timestamp: now, // Use regular Date instead of serverTimestamp
          type: transactionType
        }],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      const currentData = userDoc.data();
      const currentCredits = currentData.credits || 0;
      const totalCredits = (currentData.totalCredits || 0) + creditsToAdd;
      const transactions = currentData.transactions || [];

      transactions.push({
        id: transactionId,
        credits: creditsToAdd,
        timestamp: now, // Use regular Date instead of serverTimestamp
        type: transactionType
      });

      transaction.update(userRef, {
        credits: currentCredits + creditsToAdd,
        totalCredits,
        transactions,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
}

async function logProcessingError(record, error) {
  try {
    console.error('WEBHOOK_PROCESSING_ERROR', {
      messageId: record.messageId,
      body: record.body,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  } catch (logError) {
    console.error('Failed to log processing error:', logError);
  }
}
