
import { connect } from '$lib/amqp.ts';

export async function GET({ cookies, locals }) {
    const connection = await connect(cookies)
    const channel = await connection.createChannel()

    // Make sure user queue exists
    const queue = `user-${locals.sub}`
    await channel.assertQueue(queue, { autoDelete: true });

    let interval: ReturnType<typeof setInterval>;

    // Forward rabbitmq messages for user
    const readable = new ReadableStream({
        start(controller) {
            // Pinging ensures that our connection stays alive
            interval = setInterval(() => controller.enqueue(JSON.stringify({ ping: true })), 30000)

            channel.consume(queue, (message) => {
                if (message !== null) {
                    controller.enqueue(message.content.toString())
                    channel.ack(message);
                } else {
                    console.log('Consumer cancelled by server');
                }
            });
        },
        cancel() {
            clearInterval(interval)
            connection.close()
        }
    });

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    });
}
