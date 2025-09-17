import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { DBClient } from "./db/dbClient.js";

dotenv.config();
import {
	TABLE_NAME,
	HEADER_IDENTIFIER,
	DETAIL_IDENTIFIER,
	SUMMARY_IDENTIFIER,
	FOLDER_PATH,
} from "./constants.js";

const db = new DBClient();

function formatAmount(value) {
	return Number(value).toFixed(2);
}

const generarArchivo = async () => {
	findOrCreateFolder();
	try {
		const res = await db.query(
			`SELECT cedula, email, account, salary FROM ${TABLE_NAME} ORDER BY id`
		);
		const { rows } = res;

		if (rows.length === 0) {
			console.log("No hay datos para procesar.");
			return;
		}
		// Ultimo día del mes
		const dateOfPayment = new Date(
			new Date().getFullYear(),
			new Date().getMonth() + 1,
			0
		).toLocaleDateString("es-DO");

		const totalAmount = rows.reduce((s, r) => s + Number(r.salary), 0);

		const header =
			[
				HEADER_IDENTIFIER,
				process.env.UNAPEC_RNC,
				process.env.BANCO_DESTINO,
				dateOfPayment,
				formatAmount(totalAmount),
				process.env.CUENTA_ORIGEN,
			].join("|") + "\n";

		const details =
			rows
				.map((r) =>
					[
						DETAIL_IDENTIFIER,
						r.cedula,
						r.email || "",
						r.account,
						formatAmount(r.salary),
					].join("|")
				)
				.join("\n") + "\n";

		const summary = `${SUMMARY_IDENTIFIER}|${rows.length}\n`;
		const monthName = new Date().toLocaleDateString("es-ES", { month: "long" });

		const outDir = path.resolve(process.cwd(), FOLDER_PATH);
		const outPath = path.resolve(outDir, `Nómina (${monthName}).txt`);

		if (!fs.existsSync(outDir)) {
			fs.mkdirSync(outDir, { recursive: true });
		}

		fs.writeFileSync(outPath, header + details + summary, "utf8");

		console.log("Archivo generado en:", outPath);
		console.log("Contenido:\n", header + details + summary);
	} catch (err) {
		console.error("Error generando archivo:", err);
	} finally {
		await db.close();
	}
};

const findOrCreateFolder = () => {
	const outDir = path.resolve(process.cwd(), FOLDER_PATH);
	if (!fs.existsSync(outDir)) {
		fs.mkdirSync(outDir, { recursive: true });
	}
};

generarArchivo();
