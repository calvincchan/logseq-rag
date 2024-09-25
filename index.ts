import assert from "assert";
import "dotenv/config";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { OllamaEmbeddings } from "langchain/embeddings/ollama";
import { Ollama } from "langchain/llms/ollama";
import { ChatPromptTemplate } from "langchain/prompts";
import { BaseMessage, ChatMessage } from "langchain/schema";
import { QdrantVectorStore } from "langchain/vectorstores/qdrant";
import ora from "ora";
import readline from "readline";
import { LogseqLoader } from "./LogseqLoader";

const LLM_MODEL = "llama3";

async function main() {
  assert(process.env.QDRANT_URL, "QDRANT_URL is required");
  assert(process.env.OLLAMA_URL, "OLLAMA_URL is required");
  const stage0 = ora("Loading Journals").start();
  const docs = await importJournals();
  stage0.succeed();

  /** Prepare LLM model with tools */
  const stage1 = ora("Loading LLM Model").start();
  const llm = new Ollama({
    baseUrl: process.env.OLLAMA_URL,
    model: LLM_MODEL,
    temperature: 0.1,
  });
  stage1.succeed();

  /** Create a MemoryVectorStore from docs for local ollama */
  const stage2 = ora("Creating Vector Store").start();
  const store = await QdrantVectorStore.fromDocuments(
    docs,
    new OllamaEmbeddings({ model: LLM_MODEL }),
    {
      url: process.env.QDRANT_URL,
      // apiKey: "api-key",
    }
  );
  stage2.succeed();

  /** QA Chain */
  const stage3 = ora("Creating QAChain").start();
  const prompt = ChatPromptTemplate.fromTemplate(
    `Context:\n{context}.\n\nBased on the context above, answer the user's question: {input}`
  );
  const combineDocsChain = await createStuffDocumentsChain({
    llm,
    prompt,
  });
  const retriever = store.asRetriever();
  const chain = await createRetrievalChain({
    combineDocsChain,
    retriever,
  });
  stage3.succeed();

  /** Interactive prompt */
  const chatHistory: BaseMessage[] = [];
  for (;;) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const query = await new Promise<string>((resolve) => {
      rl.question('🤖 Enter your query (or "exit" to quit): ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });

    if (query === "exit") {
      break;
    }

    if (!query) {
      continue;
    }

    const spinner = ora("Thinking...").start();
    const res = await chain.invoke({ input: query, chat_history: chatHistory });
    spinner.stop();
    chatHistory.push(new ChatMessage("Question: " + query, "user"));
    chatHistory.push(new ChatMessage("Answer: " + res.answer, "bot"));
    console.log("✨ Answer: " + res.answer);
  }
}

/** Import all md files into documents */
async function importJournals() {
  const loader = new DirectoryLoader(
    process.env.LOGSEQ_JOURNALS_PATH || "journals/",
    {
      ".md": (path) => new LogseqLoader(path),
    }
  );
  const docs = await loader.load();
  return docs;
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
