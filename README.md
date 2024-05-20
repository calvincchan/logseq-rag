# logseq-rag

This project, is a system that integrates the RAG (Retrieval-Augmented Generation) model with Logseq journals and a local Language Model (LLM) via Open Llama.

## Description

The `logseq-rag` system is designed to provide enhanced capabilities for interacting with Logseq journals using the power of advanced language models. It leverages the `langchain` library for language model operations.

## Installation

To install the dependencies of this project, navigate to the project's root directory and run:

```bash
bun install
```

## Usage

1. To start the application, first copy `.example.env` to `.example`
2. Start `ollama serve` and make sure the `llama3` model is loaded
3. then use the following bun script:

```bash
bun start
```

## Author

This project is authored by Calvin C Chan. https://calvinchan.com

## License

This project is licensed under the MIT License.
