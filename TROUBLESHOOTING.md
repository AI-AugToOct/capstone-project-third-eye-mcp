# 🔧 Third Eye Troubleshooting Guide

## Quick Fixes for Common Issues

### 🚨 "Model not available" errors
**Problem**: System fails to start with missing model errors
```
missing_model: llama-3.1-70b-versatile
```

**Solution**: Models have been updated in `config.yaml`. Just restart:
```bash
./start.sh restart
```

### 🔑 Admin Bootstrap Issues
**Problem**: Can't login, no admin account, or "password required" errors

**Solution**: The system now auto-generates credentials on first startup:
1. Run `./start.sh start`
2. Look for auto-generated credentials in the startup logs:
   ```
   🔑 GENERATED ADMIN PASSWORD: [your-password]
   🔐 GENERATED API KEY: [your-api-key]
   ```
3. Save these to your `.env` file for persistence

### 🤖 GROQ API Key Issues
**Problem**: "GROQ_API_KEY not found" or API key validation errors

**Solution**:
1. **Missing key**: Run `./start.sh configure` to add your key interactively
2. **Wrong format**: GROQ keys start with `gsk_` - check you copied it correctly
3. **No key yet**: Start in demo mode with `./start.sh start --non-interactive`
4. **Get a key**: Visit https://console.groq.com/keys (free tier available)

### 🐳 Database Connection Issues
**Problem**: `nodename nor servname provided, or not known` postgres errors

**Solution**: This is normal when running without Docker. Use the full Docker stack:
```bash
./start.sh start
```

If you need external database access, use port 5433:
```bash
# External connection (from host machine)
psql postgresql://third_eye:third_eye@localhost:5433/third_eye
```

### 🔌 Port Already in Use
**Problem**: `port 8000 already in use` or similar port conflicts

**Solution**:
1. Stop existing services: `./start.sh stop`
2. Or find what's using the port: `lsof -i :8000`
3. Kill the process or change ports in `docker-compose.yml`

### 🏗️ Docker Build Failures
**Problem**: Build fails or containers won't start

**Solution**:
1. **First try**: Clean rebuild: `./start.sh restart --rebuild`
2. **Still failing**: Full reset: `./start.sh cleanup` then `./start.sh start`
3. **Check Docker**: Ensure Docker Desktop is running and updated
4. **Memory issues**: Increase Docker memory limit in Docker Desktop settings

### 🌐 Can't Access Web Interfaces
**Problem**: Browser shows "connection refused" for dashboards

**Solution**: Wait for health checks to pass:
```bash
./start.sh logs
# Look for "Third Eye is fully operational!" message
# Or check specific service: ./start.sh logs third-eye-api
```

### ⚡ Demo Mode Limitations
**Problem**: "AI features will be limited without GROQ API key"

**This is expected behavior when running without a GROQ key:**
- Basic system functions work
- AI-powered features (Sharingan, etc.) are disabled
- Add GROQ key later: `./start.sh configure`

## 🔰 Complete Beginner Recovery

If nothing works and you're starting fresh:

```bash
# 1. Clean everything
./start.sh cleanup

# 2. Remove old .env if corrupted
rm .env

# 3. Check your environment
./start.sh doctor

# 4. Start fresh (will auto-setup everything)
./start.sh start
```

## 🩺 Environment Doctor

Run this anytime to check your setup:
```bash
./start.sh doctor
```

It checks:
- ✅ Docker Desktop running
- ✅ Required ports available
- ✅ API keys configured
- ✅ Config files valid

## 📞 Still Having Issues?

1. **Check logs**: `./start.sh logs` - this shows what's actually happening
2. **Verify environment**: `./start.sh doctor` - this checks your setup
3. **Clean restart**: `./start.sh cleanup && ./start.sh start` - nuclear option
4. **Review this guide**: Most issues are covered above

## 💡 Pro Tips

- **Save your credentials**: When the system auto-generates passwords/keys, immediately copy them to your `.env` file
- **Use the guided menu**: Just run `./start.sh` with no arguments for step-by-step guidance
- **Health checks**: The system waits for services to be healthy before showing "success"
- **Logs are your friend**: They show auto-generated credentials and error details