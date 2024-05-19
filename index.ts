import { Ollama } from "@langchain/community/llms/ollama";
import { RetrievalQAChain } from "langchain/chains";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { OllamaEmbeddings } from "langchain/embeddings/ollama";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

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
  const res = await chain.call({
    query: "When did I apply passport renewal for Kaede?",
  });
  console.log("Answer:");
  console.log(res.text);
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
