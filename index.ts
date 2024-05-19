import { RetrievalQAChain } from "langchain/chains";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { OllamaEmbeddings } from "langchain/embeddings/ollama";
import { Ollama } from "langchain/llms/ollama";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import ora from "ora";
import readline from "readline";

const LOGSEQ_JOURNAL_PATH = "./journals";

async function main() {
  const stage0 = ora("Loading Journals").start();
  const docs = await importJournals();
  stage0.succeed();

  /** Prepare LLM model with tools */
  const stage1 = ora("Loading LLM model").start();
  const model = new Ollama({
    baseUrl: "http://127.0.0.1:11434",
    model: "llama3",
    temperature: 0.001,
  });
  stage1.succeed();

  /** Create a MemoryVectorStore from docs for local ollama */
  const stage2 = ora("Creating MemoryVectorStore").start();
  const store = await MemoryVectorStore.fromDocuments(
    docs,
    new OllamaEmbeddings({ model: "llama3" })
  );
  stage2.succeed();

  /** QA Chain */
  const stage3 = ora("Creating QAChain").start();
  const chain = RetrievalQAChain.fromLLM(model, store.asRetriever());
  stage3.succeed();

  /** Interactive prompt */
  for (;;) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const query = await new Promise((resolve) => {
      rl.question('🤖 Enter your query (or "exit" to quit): ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });

    if (query === "exit") {
      break;
    }

    const spinner = ora("Thinking...").start();
    const res = await chain.invoke({ query });
    spinner.stop();
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
