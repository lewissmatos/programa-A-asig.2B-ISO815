import { Pool } from "pg";
export class DBClient {
	pool = new Pool();
	constructor() {
		this.pool = new Pool({
			host: process.env.PG_HOST || "localhost",
			user: process.env.PG_USER || "postgres",
			password: process.env.PG_PASSWORD || "",
			database: process.env.PG_DATABASE,
			port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
		});
	}

	async query(text, params) {
		const client = await this.pool.connect();
		try {
			const res = await client.query(text, params || []);
			return res;
		} finally {
			client.release();
		}
	}

	async close() {
		await this.pool.end();
	}
}
