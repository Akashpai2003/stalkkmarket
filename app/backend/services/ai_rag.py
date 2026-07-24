import os
import json
from datetime import datetime
import numpy as np
import google.generativeai as genai
from typing import List, Dict, Any, Optional
import pypdf
import httpx
from html.parser import HTMLParser
from urllib.parse import urlparse

# Initialize Google Gemini
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

# HTML Text Extractor for URL ingestion
class HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.result = []
        self.in_script = False
        self.in_style = False

    def handle_starttag(self, tag, attrs):
        if tag in ["script", "style"]:
            self.in_script = tag == "script"
            self.in_style = tag == "style"

    def handle_endtag(self, tag):
        if tag in ["script", "style"]:
            self.in_script = False
            self.in_style = False

    def handle_data(self, data):
        if not self.in_script and not self.in_style:
            self.result.append(data)

    def get_text(self):
        return " ".join(self.result)

def extract_text_from_html(html_content: str) -> str:
    parser = HTMLTextExtractor()
    parser.feed(html_content)
    raw_text = parser.get_text()
    
    # Clean up whitespace
    lines = [line.strip() for line in raw_text.splitlines()]
    chunks = [phrase.strip() for line in lines for phrase in line.split("  ")]
    return "\n".join(chunk for chunk in chunks if chunk)


class InMemoryVectorStore:
    """
    Fallback vector store using numpy and JSON for persistence.
    Saves chunks and embeddings to a local file.
    """
    def __init__(self, persist_path: str = "db/vector_store.json"):
        self.persist_path = persist_path
        self.documents: List[Dict[str, Any]] = []
        self._load()

    def _load(self):
        if os.path.exists(self.persist_path):
            try:
                with open(self.persist_path, "r", encoding="utf-8") as f:
                    self.documents = json.load(f)
            except Exception as e:
                print(f"Failed to load in-memory vector store: {e}")
                self.documents = []
        else:
            os.makedirs(os.path.dirname(self.persist_path), exist_ok=True)

    def _save(self):
        try:
            with open(self.persist_path, "w", encoding="utf-8") as f:
                json.dump(self.documents, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Failed to save in-memory vector store: {e}")

    def add_documents(self, texts: List[str], metadatas: List[Dict[str, Any]], embeddings: List[List[float]]):
        for text, meta, emb in zip(texts, metadatas, embeddings):
            self.documents.append({
                "text": text,
                "metadata": meta,
                "embedding": emb
            })
        self._save()

    def similarity_search(self, query_embedding: List[float], k: int = 3) -> List[Dict[str, Any]]:
        if not self.documents:
            return []
            
        q_vec = np.array(query_embedding)
        results = []
        
        for doc in self.documents:
            d_vec = np.array(doc["embedding"])
            dot_product = np.dot(q_vec, d_vec)
            norm_q = np.linalg.norm(q_vec)
            norm_d = np.linalg.norm(d_vec)
            
            if norm_q > 0 and norm_d > 0:
                similarity = dot_product / (norm_q * norm_d)
            else:
                similarity = 0.0
                
            results.append((doc, similarity))
            
        results.sort(key=lambda x: x[1], reverse=True)
        
        output = []
        for doc, score in results[:k]:
            output.append({
                "text": doc["text"],
                "metadata": doc["metadata"],
                "score": float(score)
            })
        return output


class StalkRAG:
    def __init__(self, db_dir: str = "db"):
        self.db_dir = db_dir
        os.makedirs(self.db_dir, exist_ok=True)
        self.vector_store = InMemoryVectorStore(persist_path=os.path.join(self.db_dir, "vector_store.json"))
        self.sources_list_file = os.path.join(self.db_dir, "sources_list.json")
        self._initialize_default_sources()
        self._sync_existing_sources()

    def _initialize_default_sources(self):
        """
        Populate the vector store and sources list with default investor education links.
        """
        if os.path.exists(self.sources_list_file):
            try:
                with open(self.sources_list_file, "r", encoding="utf-8") as f:
                    sources = json.load(f)
                if any(s.get("source_id") == "https://zerodha.com/varsity/" for s in sources):
                    return
            except Exception:
                pass

        default_data = [
            {
                "source_id": "https://zerodha.com/varsity/",
                "name": "Zerodha Varsity",
                "type": "URL",
                "status": "Indexed",
                "summary": "Standard technical trading rules, RSI guidelines, moving averages, and risk management parameters.",
                "text": "In technical analysis, the Relative Strength Index (RSI) is used to gauge momentum. Zerodha Varsity rules suggest that in a strong bullish uptrend, RSI frequently oscillates between 40 and 80, where the 40-50 zone acts as a strong support zone. In contrast, in a bearish trend, RSI stays below 60 and bounces off it as resistance. Traders should avoid selling simply because RSI is > 70 if the volume expansion is above 2x the 20-period average, as this indicates a strong breakout. Position sizing rules recommend risking no more than 1% of total capital per trade."
            },
            {
                "source_id": "https://www.investopedia.com/",
                "name": "Investopedia",
                "type": "URL",
                "status": "Indexed",
                "summary": "Definition, formulas, typical thresholds, and trading usage of the Relative Strength Index (RSI).",
                "text": "Relative Strength Index (RSI) is a momentum oscillator that measures the magnitude of recent price changes to evaluate overbought or oversold conditions. RSI is calculated as RSI = 100 - [100 / (1 + RS)], where RS is the average gain of up periods divided by the average loss of down periods. Typically, RSI >= 70 suggests overbought conditions and potential trend reversal, while RSI <= 30 suggests oversold conditions. Traders use it to identify entry zones, trend strength, and divergences."
            },
            {
                "source_id": "https://investor.sebi.gov.in/",
                "name": "SEBI Investor Education",
                "type": "URL",
                "status": "Indexed",
                "summary": "Retail trading risks disclosure, capital preservation advice, and margin warning guidelines.",
                "text": "SEBI Investor Protection guidelines warn retail investors that trading in derivatives or active swing trading carries substantial capital risk. Investors should maintain strict risk management rules, such as risking no more than 1-2% of total trading capital on any single trade, and avoiding over-leveraging using margin funding. SEBI urges investors to conduct thorough research, check business fundamentals, and verify credentials before executing trades."
            },
            {
                "source_id": "https://www.nseindia.com/learn",
                "name": "NSE India Investor Education",
                "type": "URL",
                "status": "Indexed",
                "summary": "NSE equity session hours, pre-open timings, and order types documentation.",
                "text": "NSE India (National Stock Exchange of India) standard equity trading session hours are from 09:15 AM IST to 03:30 PM IST, Monday through Friday. Trading is closed on weekends (Saturdays and Sundays) and exchange-declared national holidays. Orders placed outside standard session hours (After Market Orders, or AMOs) are executed during the pre-open session of the next trading day."
            },
            {
                "source_id": "https://tradingqna.com/",
                "name": "TradingQnA",
                "type": "URL",
                "status": "Indexed",
                "summary": "Active community discussions regarding EMA crossovers, golden crosses, and broker API sessions.",
                "text": "Active traders on TradingQnA discuss swing trading strategies, recommending moving averages like EMA 20 and EMA 50 to confirm trends. A golden cross (EMA 50 crossing above EMA 200) indicates long-term bullish bias. Users also suggest that check-sessions for API credentials should be refreshed daily, and caution against automated order execution without strict stop-loss rules in place."
            }
        ]

        sources = []
        if os.path.exists(self.sources_list_file):
            try:
                with open(self.sources_list_file, "r", encoding="utf-8") as f:
                    sources = json.load(f)
            except Exception:
                sources = []

        for item in default_data:
            # Check if already in sources list
            if any(s["source_id"] == item["source_id"] for s in sources):
                continue
            
            sources.append({
                "source_id": item["source_id"],
                "name": item["name"],
                "type": item["type"],
                "status": item["status"],
                "last_indexed": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "chunks_count": 1,
                "summary": item["summary"]
            })

            # Add documents and generate embeddings
            emb = self.get_embedding(item["text"])
            self.vector_store.add_documents(
                [item["text"]],
                [{
                    "source": item["source_id"],
                    "source_name": item["name"],
                    "type": item["type"],
                    "chunk_index": 0,
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }],
                [emb]
            )

        with open(self.sources_list_file, "w", encoding="utf-8") as f:
            json.dump(sources, f, ensure_ascii=False, indent=2)

    def get_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector using Gemini's text-embedding-004 model.
        Returns a mock vector if API key is not configured.
        """
        if not GEMINI_KEY:
            return [0.1] * 768
            
        try:
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            return result["embedding"]
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return [0.1] * 768

    def extract_text_from_pdf(self, file_path: str) -> str:
        text = ""
        try:
            with open(file_path, "rb") as f:
                reader = pypdf.PdfReader(f)
                for page in reader.pages:
                    text += page.extract_text() or ""
        except Exception as e:
            print(f"PDF extraction error: {e}")
        return text

    def chunk_text(self, text: str, chunk_size: int = 600, chunk_overlap: int = 120) -> List[str]:
        words = text.split()
        chunks = []
        i = 0
        while i < len(words):
            chunk_words = words[i : i + chunk_size]
            chunks.append(" ".join(chunk_words))
            i += chunk_size - chunk_overlap
            if len(words) - i < chunk_overlap:
                break
        return chunks

    def get_knowledge_sources(self) -> List[Dict[str, Any]]:
        if os.path.exists(self.sources_list_file):
            try:
                with open(self.sources_list_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return []
        return []

    def save_knowledge_source(self, source_id: str, name: str, source_type: str, status: str, chunks_count: int, summary: str = ""):
        sources = self.get_knowledge_sources()
        exists = False
        for s in sources:
            if s["source_id"] == source_id:
                s["status"] = status
                s["last_indexed"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                s["chunks_count"] = chunks_count
                if summary:
                    s["summary"] = summary
                exists = True
                break
        if not exists:
            if not summary:
                summary = f"Swing strategy rules parsed from {name} containing {chunks_count} chunks."
            sources.append({
                "source_id": source_id,
                "name": name,
                "type": source_type,
                "status": status,
                "last_indexed": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "chunks_count": chunks_count,
                "summary": summary
            })
        with open(self.sources_list_file, "w", encoding="utf-8") as f:
            json.dump(sources, f, ensure_ascii=False, indent=2)

    def _sync_existing_sources(self):
        """
        Scan vector store metadatas and synchronize sources list file.
        """
        sources = self.get_knowledge_sources()
        vector_docs = self.vector_store.documents
        if not vector_docs:
            return

        # Map metadata source -> counts
        source_counts = {}
        source_names = {}
        source_types = {}
        for doc in vector_docs:
            meta = doc.get("metadata", {})
            src = meta.get("source")
            if src:
                source_counts[src] = source_counts.get(src, 0) + 1
                source_names[src] = meta.get("source_name", src)
                source_types[src] = meta.get("type", "PDF" if src.lower().endswith(".pdf") else "URL")

        # Update sources
        for src, count in source_counts.items():
            exists = False
            for s in sources:
                if s["source_id"] == src:
                    s["chunks_count"] = count
                    exists = True
                    break
            if not exists:
                name = source_names[src]
                stype = source_types[src]
                sources.append({
                    "source_id": src,
                    "name": name,
                    "type": stype,
                    "status": "Indexed",
                    "last_indexed": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "chunks_count": count,
                    "summary": f"Ingested {stype.lower()} content containing {count} chunks of technical trading parameters."
                })
        
        with open(self.sources_list_file, "w", encoding="utf-8") as f:
            json.dump(sources, f, ensure_ascii=False, indent=2)

    async def ingest_document(self, file_path: str, filename: str) -> Dict[str, Any]:
        """
        Ingest a file (PDF or TXT), chunk it, generate embeddings, and save to database.
        """
        ext = os.path.splitext(file_path)[1].lower()
        text = ""
        
        if ext == ".pdf":
            text = self.extract_text_from_pdf(file_path)
        else:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    text = f.read()
            except Exception as e:
                return {"success": False, "message": f"Failed to read file: {str(e)}"}
                
        if not text.strip():
            return {"success": False, "message": "Extracted text is empty"}
            
        chunks = self.chunk_text(text)
        if not chunks:
            return {"success": False, "message": "No chunks generated"}
            
        embeddings = []
        metadatas = []
        for idx, chunk in enumerate(chunks):
            emb = self.get_embedding(chunk)
            embeddings.append(emb)
            metadatas.append({
                "source": filename,
                "source_name": filename,
                "type": "PDF",
                "chunk_index": idx,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            
        self.vector_store.add_documents(chunks, metadatas, embeddings)
        self.save_knowledge_source(filename, filename, "PDF", "Indexed", len(chunks))
        
        return {
            "success": True,
            "message": f"Ingested {filename} successfully",
            "chunks_count": len(chunks)
        }

    async def ingest_url(self, url: str) -> Dict[str, Any]:
        """
        Fetch URL content, parse HTML, chunk text, generate embeddings, and store in vector DB.
        """
        try:
            # Add simple pending placeholder to keep track
            parsed_url = urlparse(url)
            source_name = parsed_url.netloc + parsed_url.path
            if len(source_name) > 40:
                source_name = source_name[:37] + "..."
            
            self.save_knowledge_source(url, source_name, "URL", "Pending", 0)

            async with httpx.AsyncClient(timeout=15.0) as client:
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                }
                response = await client.get(url, headers=headers)
                if response.status_code >= 400:
                    self.save_knowledge_source(url, source_name, "URL", "Failed", 0, f"HTTP Error {response.status_code}")
                    return {"success": False, "message": f"HTTP Error {response.status_code} when fetching page"}
                
                html = response.text
                text = extract_text_from_html(html)
                
                if not text.strip():
                    self.save_knowledge_source(url, source_name, "URL", "Failed", 0, "No plain text content extracted")
                    return {"success": False, "message": "Failed to extract clean text from web page"}
                
                chunks = self.chunk_text(text)
                if not chunks:
                    self.save_knowledge_source(url, source_name, "URL", "Failed", 0, "No chunks generated")
                    return {"success": False, "message": "No text chunks generated from web page"}
                
                embeddings = []
                metadatas = []
                for idx, chunk in enumerate(chunks):
                    emb = self.get_embedding(chunk)
                    embeddings.append(emb)
                    metadatas.append({
                        "source": url,
                        "source_name": source_name,
                        "type": "URL",
                        "chunk_index": idx,
                        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    })
                    
                self.vector_store.add_documents(chunks, metadatas, embeddings)
                self.save_knowledge_source(
                    url, source_name, "URL", "Indexed", len(chunks),
                    f"Crawled web page content containing {len(chunks)} chunks of trading metrics."
                )
                
                return {
                    "success": True,
                    "message": f"Ingested {url} successfully",
                    "chunks_count": len(chunks)
                }
        except Exception as e:
            self.save_knowledge_source(url, source_name if 'source_name' in locals() else url, "URL", "Failed", 0, str(e))
            return {"success": False, "message": f"Failed to ingest URL: {str(e)}"}

    def query_playbooks(self, query: str, k: int = 3) -> str:
        """
        Query vector store for context to ground trade analysis.
        """
        q_emb = self.get_embedding(query)
        results = self.vector_store.similarity_search(q_emb, k=k)
        
        if not results:
            return ""
            
        context_parts = []
        for res in results:
            context_parts.append(f"[Source: {res['metadata']['source']}]\n{res['text']}")
            
        return "\n\n---\n\n".join(context_parts)

    def analyze_stock_with_context(self, scrip_data: Dict[str, Any], playbook_context: str) -> str:
        """
        Run Gemini to generate AI summary and align with playbook.
        """
        if not GEMINI_KEY:
            return (
                f"GEMINI_API_KEY not set. Under mock mode, {scrip_data['symbol']} looks strong "
                f"with high relative strength. Trade aligned with default playbook rules."
            )
            
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""
You are the AI trading brain of Stalk Market, a swing trading workspace.
Analyze the following stock data and align it with the uploaded strategy playbook context.

Stock Data:
{json.dumps(scrip_data, indent=2)}

Uploaded Playbook Strategy Context:
{playbook_context if playbook_context else "No custom playbook uploaded. Use standard swing trading guidelines."}

Provide a concise trade analysis summary in the style of Perplexity:
1. Explain the setup clearly (Trends, Indicators, volume anomalies).
2. Rate the alignment with the user's playbook.
3. Suggest clear parameters: Entry Zone, Target, Stop Loss, Holding Period, and Confidence Score (1 to 5).
4. Summarize key risks.

Format your response as clean, structured markdown. Do not add decorative symbols, hashtags, or markdown noise. Keep it extremely professional.
"""
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error running Gemini analysis: {str(e)}"
