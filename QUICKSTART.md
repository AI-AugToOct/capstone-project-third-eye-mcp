# 🚀 Third Eye MCP - Quickstart Guide

## 🔰 Never used Docker or AI tools before? No problem!



### Step 1: Install Docker Desktop
1. Download from: https://www.docker.com/products/docker-desktop/
2. Install and start it (look for whale icon in system tray)
3. That's it! Docker includes everything you need.

### Step 2: Get a Free GROQ API Key (2 minutes)
1. Visit: https://console.groq.com/keys
2. Sign up (free tier available)
3. Click "Create API Key"
4. Copy the key (starts with `gsk_`)

### Step 3: Launch Third Eye
```bash
# Clone this repo (or download/extract ZIP)
cd capstone-project-third-eye-mcp

# Run the interactive launcher
./start.sh

# Choose option 1: Start services
# The system will guide you through adding your GROQ key
```

That's it! The system auto-generates admin credentials and sets everything up.

---

## 🎯 Quick Launch (if you have Docker + GROQ key)

```bash
# Method 1: Interactive (recommended for first time)
./start.sh start

# Method 2: Direct start (if .env already configured)
./start.sh start

# Method 3: Demo mode (no GROQ key needed)
./start.sh start --non-interactive
```

---

## 📋 What Gets Started

| Service | URL | Purpose |
|---------|-----|---------|
| **API Server** | http://localhost:8000 | Core Third Eye brain |
| **Overseer Dashboard** | http://localhost:5173 | User interface |
| **Admin Control Plane** | http://localhost:5174 | Admin management |
| **MCP Bridge** | tcp://localhost:7331 | Claude/AI integration |
| **Database** | localhost:5433 | Data storage |

---

## 🔑 Default Credentials

The system auto-generates these on first startup:

```
Admin Email: admin@third-eye.local
Admin Password: [auto-generated - shown in logs]
API Key: [auto-generated - shown in logs]
```

**💾 Important**: Copy these from the startup logs and save them to your `.env` file!

---

## 🚨 Common Issues & Solutions

### "Docker not found"
- Install Docker Desktop from the link above
- Make sure it's running (green whale icon)

### "GROQ API key not found"
- Run `./start.sh configure` to add your key
- Or start in demo mode: `./start.sh start --non-interactive`

### "Port already in use"
- Stop other services: `./start.sh stop`
- Or find what's using port 8000: `lsof -i :8000`

### "Can't access dashboards"
- Wait for startup to complete (look for "fully operational" message)
- Check logs: `./start.sh logs`

---

## 🆘 Need More Help?

- **Detailed troubleshooting**: Check `TROUBLESHOOTING.md`
- **Environment check**: Run `./start.sh doctor`
- **All options**: Run `./start.sh help`
- **Interactive menu**: Just run `./start.sh`

---

## 🔄 Useful Commands

```bash
./start.sh start      # Launch everything
./start.sh stop       # Stop all services
./start.sh restart    # Restart services
./start.sh logs       # View live logs
./start.sh status     # Check what's running
./start.sh configure  # Setup API keys
./start.sh cleanup    # Reset everything
```

## 🎉 You're Ready!

Once running, Third Eye provides:
- **Intelligent oversight** for AI workflows
- **Multi-step validation** pipelines
- **Integration** with Claude, VS Code, Cursor, and more
- **Admin dashboard** for monitoring and control

Check the main README.md for integration instructions with your favorite AI tools!