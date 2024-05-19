import fs from "fs/promises";

const LOGSEQ_JOURNAL_PATH = "./journals";

async function main() {
  await importJournals();
}

async function importJournals() {
  const result = [];
  const journalFiles = await fs.readdir(LOGSEQ_JOURNAL_PATH);
  for (const journalFile of journalFiles) {
    const journalContent = await fs.readFile(
      `${LOGSEQ_JOURNAL_PATH}/${journalFile}`,
      "utf8"
    );
    result.push(journalContent);
  }
  console.log(result);
}

main().catch(console.error);
