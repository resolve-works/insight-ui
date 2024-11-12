import { error } from '@sveltejs/kit';
import { connect } from '$lib/amqp.ts';
import { AuthError } from '$lib/auth';

export async function GET({ cookies, locals }) {
	try {
		const connection = await connect(cookies);
		const channel = await connection.createChannel();

		// Make sure user queue exists
		const queue = `user-${locals.sub}`;
		await channel.assertQueue(queue, { autoDelete: true });

		// Bind to the user topic exchange
		await channel.bindQueue(queue, 'user', queue);
		await channel.bindQueue(queue, 'user', 'public');

		let interval: ReturnType<typeof setInterval>;

		// Forward rabbitmq messages for user
		const readable = new ReadableStream({
			async start(controller) {
				// Pinging ensures that our connection stays alive
				interval = setInterval(
					() => controller.enqueue(`data: ${JSON.stringify({ ping: true })}\n\n`),
					30000
				);

				await channel.consume(queue, (message) => {
					if (message !== null) {
						controller.enqueue(`data: ${message.content.toString()}\n\n`);
						channel.ack(message);
					} else {
						console.log('Consumer cancelled by server');
					}
				});
			},
			async cancel() {
				clearInterval(interval);
				await connection.close();
			}
		});

		return new Response(readable, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'X-Accel-Buffering': 'no'
			}
		});
	} catch (err) {
		if (err instanceof AuthError) {
			return error(401, err.message);
		}
		throw err;
	}
}
