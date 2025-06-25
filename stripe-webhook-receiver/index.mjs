import AWS from 'aws-sdk';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const sqs = new AWS.SQS();

export const handler = async (event) => {
    console.log('Received webhook from Stripe');
    
    const sig = event.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let stripeEvent;
    
    try {
        // Verify the webhook signature
        stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
        console.log(`Verified webhook event: ${stripeEvent.type} - ${stripeEvent.id}`);
    } catch (err) {
        console.log(`Webhook signature verification failed: ${err.message}`);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid signature' }),
        };
    }
    
    try {
        // Send the verified event to SQS
        const sqsParams = {
            QueueUrl: process.env.WEBHOOK_QUEUE_URL,
            MessageBody: JSON.stringify({
                eventId: stripeEvent.id,
                eventType: stripeEvent.type,
                eventData: stripeEvent.data.object,
                created: stripeEvent.created,
                livemode: stripeEvent.livemode
            }),
            MessageAttributes: {
                EventType: {
                    DataType: 'String',
                    StringValue: stripeEvent.type
                },
                EventId: {
                    DataType: 'String',
                    StringValue: stripeEvent.id
                }
            },
            // Use event ID as deduplication ID to prevent duplicate processing
            MessageDeduplicationId: stripeEvent.id,
            MessageGroupId: 'stripe-webhooks' // Required for FIFO queues
        };
        
        await sqs.sendMessage(sqsParams).promise();
        console.log(`Successfully queued event ${stripeEvent.id} for processing`);
        
        // Immediately respond to Stripe - this prevents retries
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                received: true,
                eventId: stripeEvent.id,
                queued: true 
            }),
        };
        
    } catch (error) {
        console.error('Failed to queue webhook event:', error);
        // Return 500 so Stripe will retry
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to queue event' }),
        };
    }
};
