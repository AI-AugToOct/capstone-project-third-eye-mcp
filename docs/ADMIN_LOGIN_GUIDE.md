# Admin Login Troubleshooting Guide

## Quick Access to Credentials

If you've started Third Eye and need to find your auto-generated admin credentials:

### Method 1: Run the credentials command
```bash
./start.sh credentials
```

### Method 2: Check the welcome banner
When you run `./start.sh start`, the credentials are displayed in a prominent box after services start.

### Method 3: View raw Docker logs
```bash
docker compose -p third-eye-mcp logs third-eye-api | grep -E "GENERATED.*PASSWORD|GENERATED.*API KEY|Admin Email"
```

## Common Login Issues

### Issue: "Invalid credentials" error

**Possible causes:**
1. **Using wrong password**: Make sure you're using the exact password from the logs, including special characters
2. **Password not copied correctly**: Copy-paste the password to avoid typos
3. **Using API key instead of password**: The login requires the admin PASSWORD, not the API key

**Solutions:**
```bash
# 1. Extract current password from logs
./start.sh credentials

# 2. If password is saved to .env, verify it matches the logs
grep ADMIN_BOOTSTRAP_PASSWORD .env

# 3. If needed, restart services to regenerate credentials
./start.sh restart
```

### Issue: Password not displayed after bootstrap

**Cause:** The credential extraction might fail if logs are in JSON format or incomplete.

**Solutions:**
```bash
# View last 200 lines of API logs
docker compose -p third-eye-mcp logs third-eye-api --tail=200

# Look for these log messages:
# - "GENERATED ADMIN PASSWORD: <password>"
# - "Admin Email: <email>"
# - "GENERATED API KEY: <key>"
```

### Issue: "Bootstrap required" message in login screen

**Cause:** No admin accounts exist in the database yet.

**Solutions:**
```bash
# 1. Check if API container is running
docker compose -p third-eye-mcp ps

# 2. Wait for bootstrap to complete (happens automatically on first start)
# Check logs for bootstrap completion:
docker compose -p third-eye-mcp logs third-eye-api | grep -i bootstrap

# 3. If bootstrap didn't run, set password in .env and restart:
echo "ADMIN_BOOTSTRAP_PASSWORD=YourSecurePassword123!" >> .env
./start.sh restart
```

## Login Flow

1. **Navigate to**: http://localhost:5174
2. **Email**: `admin@third-eye.local` (or check credentials output)
3. **Password**: Use the auto-generated password from logs
4. **First login**: You may be prompted to change password

## Saving Credentials

After successful login, save credentials to `.env` for persistence:

```bash
# Add to .env file
echo "ADMIN_BOOTSTRAP_PASSWORD=<your-password>" >> .env
echo "THIRD_EYE_API_KEY=<your-api-key>" >> .env
```

Or use the interactive prompts when running `./start.sh start`.

## Manual Password Reset

If you've lost access and need to reset the admin password:

```bash
# 1. Remove existing admin from database
docker compose -p third-eye-mcp exec third-eye-api python -c "
from third_eye.db import get_db_connection
conn = get_db_connection()
conn.execute('DELETE FROM admin_accounts WHERE email = ?', ('admin@third-eye.local',))
conn.commit()
"

# 2. Set new password in .env
echo "ADMIN_BOOTSTRAP_PASSWORD=NewPassword123!" > .env

# 3. Restart to trigger bootstrap
./start.sh restart

# 4. Check logs for new credentials
./start.sh credentials
```

## Security Best Practices

1. **Save credentials immediately**: Don't lose the auto-generated password
2. **Change default email**: Update `CONFIG.admin.email` in config files
3. **Use strong passwords**: If manually setting, use 16+ characters with mixed case, numbers, symbols
4. **Rotate API keys regularly**: Use the control panel to rotate keys
5. **Add to .gitignore**: Never commit `.env` file to version control

## Getting Help

If issues persist:

1. Run environment check: `./start.sh doctor`
2. View full logs: `./start.sh logs`
3. Check troubleshooting guide: `TROUBLESHOOTING.md`
4. Open an issue with logs and error messages
