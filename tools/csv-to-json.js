const fs = require("fs");

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
    console.error("Usage: node csv-to-json.js input.csv output.json");
    process.exit(1);
}

function parseCSV(content) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];

        if (char === '"') {
            if (inQuotes && content[i + 1] === '"') {
                field += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === "," && !inQuotes) {
            row.push(field.trim());
            field = "";
        } else if ((char === "\n" || char === "\r") && !inQuotes) {
            if (char === "\r" && content[i + 1] === "\n") i++;
            row.push(field.trim());

            if (row.some(value => value !== "")) {
                rows.push(row);
            }

            row = [];
            field = "";
        } else {
            field += char;
        }
    }

    if (inQuotes) {
        throw new Error("CSV contains an unclosed quoted field.");
    }

    if (field !== "" || row.length > 0) {
        row.push(field.trim());
        if (row.some(value => value !== "")) rows.push(row);
    }

    if (rows.length < 2) {
        throw new Error("CSV must contain headers and at least one data row.");
    }

    const headers = rows[0].map(header => header.replace(/^\uFEFF/, ""));

    if (headers.some(header => !header)) {
        throw new Error("CSV contains an empty column name.");
    }

    if (new Set(headers).size !== headers.length) {
        throw new Error("CSV contains duplicate column names.");
    }

    return rows.slice(1).map((values, index) => {
        if (values.length !== headers.length) {
            throw new Error(`Invalid column count on CSV row ${index + 2}.`);
        }

        return Object.fromEntries(
            headers.map((header, i) => [header, values[i]])
        );
    });
}

try {
    const csvContent = fs.readFileSync(inputFile, "utf8");
    const records = parseCSV(csvContent);

    fs.writeFileSync(
        outputFile,
        JSON.stringify(records, null, 2),
        "utf8"
    );

    console.log(`Conversion successful: ${records.length} records`);
    console.log(`JSON saved to: ${outputFile}`);
} catch (error) {
    console.error("Conversion failed:", error.message);
    process.exit(1);
}
