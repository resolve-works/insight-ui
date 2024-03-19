
import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';
import amqplib from 'amqplib';
import type { Connection, Channel as AMQPChannel } from 'amqplib';
import { refresh_tokens } from '$lib/auth';

function amqp_url(cookies: Cookies) {
    const access_token = cookies.get('access_token')
    if( access_token === undefined ) {
        throw new Error('No access token')
    }

    const password = `${encodeURIComponent(access_token)}`
    const ssl = env.RABBITMQ_SSL?.toLowerCase() == 'true' ? true : false
    return `amqp${ssl ? 's' : ''}://username:${password}@${env.RABBITMQ_HOST}`;
}

/**
 * Connect to AMQP broker, with retry of refreshing access_tokens
 */
export async function connect(cookies: Cookies) {
    try {
        const connection = await amqplib.connect(amqp_url(cookies));
        return connection
    } catch(e) {
        if(e instanceof Error && e.message.indexOf('ACCESS_REFUSED') !== -1) {
            await refresh_tokens(cookies)
            const connection = await amqplib.connect(amqp_url(cookies));
            return connection
        }

        throw e
    }
}

export class Channel {
    connection: Connection;
    channel: AMQPChannel;

    constructor(connection: Connection, channel: AMQPChannel) {
        this.connection = connection;
        this.channel = channel;
    }

    static async connect(cookies: Cookies) {
        const connection = await connect(cookies)
        const channel = await connection.createChannel()
        return new Channel(connection, channel)
    }

    async publish(routing_key: string, data: Record<string, any>) {
        this.channel.publish('insight', routing_key, Buffer.from(JSON.stringify(data)));
        return this
    }

    async close() {
        await this.channel.close()
        this.connection.close()
    }
}
