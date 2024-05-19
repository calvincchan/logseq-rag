import { Ollama } from "@langchain/community/llms/ollama";
import { RetrievalQAChain } from "langchain/chains";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { OllamaEmbeddings } from "langchain/embeddings/ollama";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import readline from "readline";

const LOGSEQ_JOURNAL_PATH = "./journals";

async function main() {
  const docs = await importJournals();

  /** Prepare LLM model with tools */
  console.log("Loading LLM model...");
  const model = new Ollama({
    baseUrl: "http://127.0.0.1:11434",
    model: "llama3",
    temperature: 0.001,
  });

  /** Create a MemoryVectorStore from docs for local ollama */
  console.log("Creating MemoryVectorStore...");
  const store = await MemoryVectorStore.fromDocuments(
    docs,
    new OllamaEmbeddings({ model: "llama3" })
  );

  /** QA Chain */
  console.log("Creating QAChain...");
  const chain = RetrievalQAChain.fromLLM(model, store.asRetriever());

  /** Interactive prompt */
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  while (true) {
    const query = await new Promise((resolve) => {
      rl.question('🤖 Enter your query (or "exit" to quit): ', (answer) =>
        resolve(answer)
      );
    });

    if (query === "exit") {
      break;
    }

    console.log("🤖 Thinking...");
    const res = await chain.invoke({ query });
    console.log("✨ Answer:");
    console.log(res.text);
  }
}

/** Import all md files into documents */
async function importJournals() {
  const loader = new DirectoryLoader(LOGSEQ_JOURNAL_PATH, {
    ".md": (path) => new TextLoader(path),
  });
  const docs = await loader.load();
  return docs;
}

main().catch(console.error);
