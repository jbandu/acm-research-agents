# Ollama Local LLM Setup Guide

## What is Ollama?

Ollama is the easiest way to run powerful LLMs (like Llama 3.1, Mistral, etc.) locally on your Mac. It's:
- ✅ Free and open source
- ✅ Privacy-focused (all data stays on your machine)
- ✅ Fast and efficient
- ✅ Easy to use
- ✅ No API costs!

---

## Step 1: Install Ollama

### macOS (Easiest)

1. **Download Ollama:**
   - Go to: https://ollama.ai/download
   - Click "Download for macOS"
   - Open the downloaded DMG file
   - Drag Ollama to your Applications folder

2. **Launch Ollama:**
   - Open Ollama from Applications
   - You'll see the Ollama icon in your menu bar

3. **Verify Installation:**
   ```bash
   ollama --version
   ```

---

## Step 2: Pull a Model

Choose and download a model (Llama 3.1 8B recommended to start):

### Llama 3.1 8B (Recommended - Fastest)
```bash
ollama pull llama3.1:8b
```
**Size:** ~4.7GB  
**RAM:** 8GB minimum  
**Speed:** Very fast on M1/M2/M3 Macs

### Llama 3.1 70B (Most Powerful)
```bash
ollama pull llama3.1:70b
```
**Size:** ~39GB  
**RAM:** 64GB recommended  
**Speed:** Slower but much more capable

### Other Popular Models

**Mistral 7B** (Fast and efficient):
```bash
ollama pull mistral:7b
```

**DeepSeek Coder** (Great for scientific/technical content):
```bash
ollama pull deepseek-coder:6.7b
```

**See all models:** https://ollama.ai/library

---

## Step 3: Test Ollama

Once you've pulled a model, test it:

```bash
ollama run llama3.1:8b
```

You should see a prompt where you can chat with the model:
```
>>> Tell me about cancer immunotherapy
...
```

Type `/bye` to exit.

---

## Step 4: Start Ollama Server

For the ACM app to use Ollama, it needs to be running as a server:

```bash
ollama serve
```

This starts the Ollama API server at `http://localhost:11434`

**Pro Tip:** Ollama usually runs automatically in the background after installation. Check if it's running:
```bash
curl http://localhost:11434/api/tags
```

If you see a JSON response, it's running! ✅

---

## Step 5: Configure ACM App

### Option A: Use Default Settings (Recommended)

The app is already configured to use:
- **Model:** `llama3.1:8b`
- **Endpoint:** `http://localhost:11434`
- **Enabled:** By default

Just make sure Ollama is running and you've pulled the model!

### Option B: Customize (Optional)

Add to your `.env.local`:

```bash
# Enable/disable Ollama
ENABLE_OLLAMA=true

# Change model
OLLAMA_MODEL=llama3.1:70b

# Change endpoint (if running on another machine)
OLLAMA_BASE_URL=http://192.168.1.100:11434
```

---

## Step 6: Test in ACM App

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Go to:** http://localhost:3000/query

3. **Run a test query:**
   - "What are the latest advances in TLR9 agonists?"

4. **Look for the Llama response:**
   - You should see 5 LLM responses now (Claude, GPT-4, Gemini, Grok, **Llama**)
   - Llama responses will have a 🦙 icon and indigo/violet color scheme

---

## Performance Tips

### Speed Up Responses

1. **Use GPU Acceleration:**
   - Ollama automatically uses Metal (GPU) on Macs
   - No configuration needed on M1/M2/M3

2. **Choose Right Model Size:**
   - 8B models: ~2-5 seconds per response
   - 70B models: ~10-30 seconds per response

3. **Keep Model in Memory:**
   ```bash
   ollama run llama3.1:8b
   # Then Ctrl+D to exit but keep loaded
   ```

### Save RAM

If Ollama is using too much RAM:

```bash
# Unload model from memory
ollama stop llama3.1:8b

# Or disable Ollama in .env.local
ENABLE_OLLAMA=false
```

---

## Troubleshooting

### Error: "Ollama not available at http://localhost:11434"

**Solution:**
```bash
# Start Ollama server
ollama serve

# Or check if it's running
ps aux | grep ollama
```

### Error: "model 'llama3.1:8b' not found"

**Solution:**
```bash
# Pull the model first
ollama pull llama3.1:8b

# List installed models
ollama list
```

### Ollama is Slow

**Check:**
1. Are you using the right model size? (8B is faster than 70B)
2. Do you have enough RAM? (8GB minimum for 8B models)
3. Is your Mac using GPU acceleration? (M1/M2/M3 are fastest)

**Optimize:**
```bash
# Use quantized version (faster, slightly lower quality)
ollama pull llama3.1:8b-instruct-q4_0
```

### Port Already in Use

**Solution:**
```bash
# Change port in .env.local
OLLAMA_BASE_URL=http://localhost:11435

# Start Ollama on custom port
OLLAMA_HOST=0.0.0.0:11435 ollama serve
```

---

## Advanced: Run on Separate Machine

If you have a powerful Linux server or GPU rig:

### On Server:
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start server (accessible from network)
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

### On Your Mac (in .env.local):
```bash
OLLAMA_BASE_URL=http://192.168.1.100:11434
```

Replace `192.168.1.100` with your server's IP address.

---

## Cost Comparison

### Running Queries with APIs Only (4 LLMs)
- Claude: $0.015 per query
- GPT-4: $0.03 per query
- Gemini: $0.005 per query
- Grok: $0.01 per query
**Total:** ~$0.06 per query = $60 for 1,000 queries

### With Ollama (5 LLMs)
- Claude: $0.015 per query
- GPT-4: $0.03 per query
- Gemini: $0.005 per query
- Grok: $0.01 per query
- **Llama (Local): $0** 🎉
**Total:** ~$0.06 per query BUT you get an extra high-quality response for free!

**Annual Savings:** Thousands of dollars if you run many queries.

---

## Why Use Ollama?

1. **Privacy:** All data stays on your machine (great for sensitive research)
2. **Cost:** No API charges for the local LLM
3. **Speed:** No network latency, instant responses
4. **Offline:** Works without internet connection
5. **Control:** Choose any model, customize behavior
6. **Quality:** Llama 3.1 70B rivals GPT-4 on many tasks

---

## Recommended Models by Use Case

### Cancer Research (Your Use Case)
**Best:** `llama3.1:70b` or `llama3.1:8b`
- Excellent at scientific reasoning
- Good at understanding complex biology
- Can cite literature (if trained on it)

### General Biotech Queries
**Best:** `llama3.1:8b` (fast) or `mistral:7b` (efficient)

### Technical/Scientific Writing
**Best:** `deepseek-coder:6.7b`
- Specialized for technical content
- Great at structured responses

### Quick Testing
**Best:** `llama3.1:8b` or `mistral:7b`
- Fast responses
- Low resource usage

---

## Next Steps

Once you have Ollama running:

1. ✅ Pull your preferred model
2. ✅ Test it with `ollama run`
3. ✅ Start the server with `ollama serve`
4. ✅ Run a query in ACM app
5. ✅ See the beautiful 🦙 Llama response!

For more help:
- **Ollama Docs:** https://github.com/ollama/ollama
- **Model Library:** https://ollama.ai/library
- **Community:** https://discord.gg/ollama

