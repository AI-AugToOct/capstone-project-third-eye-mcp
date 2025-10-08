#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
PROJECT_NAME="third-eye-mcp"
COMPOSE=(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE")
ENV_FILE="$PROJECT_ROOT/.env"
PORTAL_PREF_FILE="$PROJECT_ROOT/.portal-pref"

USE_COLOR=false
TERM_WIDTH=80
COLOR_BLUE=""
COLOR_GREEN=""
COLOR_YELLOW=""
COLOR_RED=""
COLOR_MAGENTA=""
COLOR_CYAN=""
COLOR_DIM=""
COLOR_BOLD=""
COLOR_RESET=""

ICON_CHECK='✅'
ICON_WARN='⚠️'
ICON_CROSS='❌'
ICON_INFO='ℹ️'
ICON_DOCKER='🐳'
ICON_GEAR='⚙️'
ICON_ROCKET='🚀'
ICON_KEY='🔑'
ICON_BOOK='📘'
ICON_STOP='🛑'
ICON_BROOM='🧹'

JQ_AVAILABLE=false

update_width() {
  if [[ -t 1 ]] && command -v tput >/dev/null 2>&1; then
    local cols
    cols=$(tput cols 2>/dev/null || true)
    if [[ -n "$cols" && "$cols" =~ ^[0-9]+$ ]] && (( cols > 0 )); then
      TERM_WIDTH=$cols
    else
      TERM_WIDTH=80
    fi
  else
    TERM_WIDTH=80
  fi
}

init_colors() {
  if [[ -t 1 ]]; then
    USE_COLOR=true
  fi

  if $USE_COLOR && command -v tput >/dev/null 2>&1; then
    COLOR_BLUE="$(tput setaf 4)"
    COLOR_GREEN="$(tput setaf 2)"
    COLOR_YELLOW="$(tput setaf 3)"
    COLOR_RED="$(tput setaf 1)"
    COLOR_MAGENTA="$(tput setaf 5)"
    COLOR_CYAN="$(tput setaf 6)"
    COLOR_DIM="$(tput dim)"
    COLOR_BOLD="$(tput bold)"
    COLOR_RESET="$(tput sgr0)"
  else
    COLOR_BLUE='\033[0;34m'
    COLOR_GREEN='\033[0;32m'
    COLOR_YELLOW='\033[1;33m'
    COLOR_RED='\033[0;31m'
    COLOR_MAGENTA='\033[0;35m'
    COLOR_CYAN='\033[0;36m'
    COLOR_DIM='\033[2m'
    COLOR_BOLD='\033[1m'
    COLOR_RESET='\033[0m'
  fi

  if ! command -v jq >/dev/null 2>&1; then
    JQ_AVAILABLE=false
  else
    JQ_AVAILABLE=true
  fi

  update_width
}

load_portal_pref() {
  if [[ -f "$PORTAL_PREF_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$PORTAL_PREF_FILE"
  fi
}

save_portal_pref() {
  local value=$1
  printf 'AUTO_OPEN_PORTAL=%s\n' "$value" >"$PORTAL_PREF_FILE"
}

launch_portal_cli() {
  local session_id=${1:-}
  local launcher=""
  local args=()
  if command -v uv >/dev/null 2>&1; then
    launcher="uv"
    args=(run third_eye.cli portal)
  elif command -v python >/dev/null 2>&1; then
    launcher="python"
    args=(-m third_eye.cli portal)
  else
    log_warn "Neither uv nor python were found in PATH; unable to auto-launch the portal."
    return
  fi
  if [[ -n "$session_id" ]]; then
    args+=(--session-id "$session_id")
  fi
  if [[ -n "${AUTO_OPEN_PORTAL:-}" && "$AUTO_OPEN_PORTAL" != "true" ]]; then
    args+=(--no-auto)
  fi
  nohup "$launcher" "${args[@]}" >/dev/null 2>&1 &
}

ensure_portal_pref() {
  if [[ "${AUTO_OPEN_PORTAL:-unset}" == "unset" ]]; then
    if prompt_yes_no "Automatically launch the Overseer portal when the stack starts?"; then
      AUTO_OPEN_PORTAL=true
    else
      AUTO_OPEN_PORTAL=false
    fi
    save_portal_pref "$AUTO_OPEN_PORTAL"
  fi
}

color_text() {
  local name=$1
  local text=$2
  local code=""
  case "$name" in
    blue) code=$COLOR_BLUE ;;
    green) code=$COLOR_GREEN ;;
    yellow) code=$COLOR_YELLOW ;;
    red) code=$COLOR_RED ;;
    magenta) code=$COLOR_MAGENTA ;;
    cyan) code=$COLOR_CYAN ;;
    dim) code=$COLOR_DIM ;;
    bold) code=$COLOR_BOLD ;;
    *) code="" ;;
  esac

  if $USE_COLOR && [[ -n "$code" ]]; then
    printf '%b%s%b' "$code" "$text" "$COLOR_RESET"
  else
    printf '%s' "$text"
  fi
}

service_tag() {
  local raw=$1
  local service=${raw%%|*}
  service=${service// /}
  local label color
  case "$service" in
    third-eye-api*)
      label="API"
      color=cyan
      ;;
    mcp-bridge*)
      label="MCP"
      color=magenta
      ;;
    redis*)
      label="REDIS"
      color=green
      ;;
    *)
      label="$service"
      color=dim
      ;;
  esac
  if [[ -z "$label" ]]; then
    printf ''
  else
    color_text "$color" "[$label]"
  fi
}

format_log_line() {
  local line=$1
  local use_jq=${2:-false}
  local prefix=""
  local payload="$line"
  if [[ "$line" == *'|'* ]]; then
    prefix=${line%%|*}
    payload=${line#*| }
  fi
  local tag=""
  if [[ -n "$prefix" ]]; then
    tag="$(service_tag "$prefix") "
  fi
  if [[ "$use_jq" == true ]]; then
    local formatted
    if formatted=$(printf '%s' "$payload" | jq -C . 2>/dev/null); then
      printf '%s%s\n' "$tag" "$formatted"
      return
    fi
  fi
  printf '%s%s\n' "$tag" "$payload"
}

print_line() {
  update_width
  local width=$TERM_WIDTH
  local line
  printf -v line '%*s' "$width" ""
  line=${line// /-}
  if $USE_COLOR; then
    printf '%b%s%b\n' "$COLOR_DIM" "$line" "$COLOR_RESET"
  else
    printf '%s\n' "$line"
  fi
}

center_text() {
  local text=$1
  update_width
  local width=$TERM_WIDTH
  local len=${#text}
  if (( len >= width )); then
    printf '%s' "$text"
    return
  fi
  local pad=$(((width - len) / 2))
  printf '%*s%s' "$pad" "" "$text"
}

print_centered_line() {
  local text=$1
  local color=${2:-}
  local line
  line=$(center_text "$text")
  if [[ -n "$color" ]]; then
    color_text "$color" "$line"
    printf '\n'
  else
    printf '%s\n' "$line"
  fi
}

log() {
  local level=$1
  local message=$2
  local icon=$ICON_INFO
  local color=blue

  case "$level" in
    check) icon=$ICON_CHECK; color=green ;;
    warn) icon=$ICON_WARN; color=yellow ;;
    cross) icon=$ICON_CROSS; color=red ;;
    info) icon=$ICON_INFO; color=cyan ;;
    docker) icon=$ICON_DOCKER; color=blue ;;
    gear) icon=$ICON_GEAR; color=magenta ;;
    rocket) icon=$ICON_ROCKET; color=green ;;
    key) icon=$ICON_KEY; color=cyan ;;
    book) icon=$ICON_BOOK; color=blue ;;
  esac

  if [[ -z "$message" ]]; then
    return
  fi

  printf '%s ' "$icon"
  color_text "$color" "$message"
  printf '\n'
}

log_success() { log check "$1"; }
log_warn() { log warn "$1"; }
log_error() { log cross "$1"; }
log_info() { log info "$1"; }
log_docker() { log docker "$1"; }
log_action() { log gear "$1"; }
log_hint() { log book "$1"; }
log_key() { log key "$1"; }

pause() {
  if [[ -t 0 ]]; then
    printf '\n'
    read -r -p "Press Enter to return to the menu..." _ || true
  fi
}

ensure_env_file() {
  if [[ ! -f "$ENV_FILE" ]]; then
    touch "$ENV_FILE"
  fi
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE" 2>/dev/null || true
  set +a
}

update_env_var() {
  local key=$1
  local value=$2
  local temp
  temp=$(mktemp)
  if grep -qE "^${key}=" "$ENV_FILE" 2>/dev/null; then
    awk -v k="$key" -v v="$value" 'BEGIN{FS="=";OFS="="} $1==k {$2=v; print k"="v; next} {print}' "$ENV_FILE" >"$temp"
  else
    cat "$ENV_FILE" >"$temp"
    printf '%s=%s\n' "$key" "$value" >>"$temp"
  fi
  mv "$temp" "$ENV_FILE"
  export "$key=$value"
}

detect_os() {
  local kernel
  kernel=$(uname -s 2>/dev/null || echo "unknown")
  case "$kernel" in
    Darwin) echo "macOS" ;;
    Linux) echo "Linux" ;;
    *) echo "$kernel" ;;
  esac
}

print_banner() {
  local os
  os=$(detect_os)
  local first_run=false

  # Detect first run
  if [[ ! -f "$ENV_FILE" ]] || [[ ! -s "$ENV_FILE" ]]; then
    first_run=true
  fi

  print_line
  print_centered_line "╭────────────────────────────────────────────╮" cyan
  print_centered_line "│          👁️  THIRD EYE CONTROL ROOM          │" cyan
  if [[ "$first_run" == true ]]; then
    print_centered_line "│        🔰 First-Time Setup Guide 🔰         │" cyan
  else
    print_centered_line "│     Unified Launchpad for MCP Explorers     │" cyan
  fi
  print_centered_line "╰────────────────────────────────────────────╯" cyan
  printf '\n'

  if [[ "$first_run" == true ]]; then
    print_centered_line "🎉 Welcome to Third Eye! Let's get you started..." green
    printf '\n'
    print_centered_line "📋 Quick setup checklist:" dim
    print_centered_line "   1. Get a free GROQ API key (takes 2 minutes)" dim
    print_centered_line "   2. Run './start.sh start' - we'll guide you!" dim
    print_centered_line "   3. System auto-generates admin credentials" dim
    printf '\n'
  fi

  print_centered_line "Workspace: $PROJECT_ROOT" dim
  print_centered_line "Host OS: $os" dim
  if [[ -n "${GROQ_API_KEY:-}" ]]; then
    print_centered_line "GROQ key: ✅ configured" green
  else
    print_centered_line "GROQ key: ⚠️  missing" yellow
  fi
  printf '\n'

  if [[ "$first_run" == true ]]; then
    print_centered_line "🚀 Ready to launch? Choose option 1 to start!" cyan
  else
    print_centered_line "Welcome back! This guided launcher manages your Third Eye stack." cyan
  fi
  printf '\n'
  print_centered_line "Legend:" dim
  print_centered_line "$ICON_CHECK  Success   $ICON_WARN  Needs attention" dim
  print_centered_line "$ICON_CROSS  Error     $ICON_DOCKER  Docker action" dim
  print_centered_line "$ICON_KEY  Credentials" dim
  printf '\n'
}

prompt_yes_no() {
  local prompt=$1
  local default=${2:-N}
  local answer
  while true; do
    read -r -p "$prompt [y/N]: " answer || return 1
    answer=${answer:-$default}
    case "$answer" in
      [Yy]*) return 0 ;;
      [Nn]*) return 1 ;;
      *) log_warn "Please respond with y or n." ;;
    esac
  done
}

verify_prereqs() {
  local ok=true

  if ! command -v docker >/dev/null 2>&1; then
    log_error "Docker is not installed."
    printf '\n'
    log_info "📥 Install Docker Desktop from: https://www.docker.com/products/docker-desktop/"
    log_info "💡 Tip: Docker Desktop includes everything you need (Docker + Compose)"
    ok=false
  fi

  if $ok && ! docker info >/dev/null 2>&1; then
    log_error "Docker daemon is not running."
    printf '\n'
    log_info "🚀 Please start Docker Desktop and wait for it to be ready"
    log_info "💡 Look for the green whale icon in your system tray/menu bar"
    ok=false
  fi

  if $ok && ! docker compose version >/dev/null 2>&1; then
    log_error "Docker Compose plugin is missing."
    printf '\n'
    log_info "🔄 Update Docker Desktop to get the latest Compose plugin"
    log_info "💡 Older Docker installations may need manual Compose installation"
    ok=false
  fi

  if ! $ok; then
    printf '\n'
    log_hint "🩺 Run './start.sh doctor' for detailed installation guidance"
    log_hint "📚 Check TROUBLESHOOTING.md for step-by-step help"
    return 1
  fi
  return 0
}

doctor_section() {
  local title=$1
  printf '\n'
  color_text bold "$title"
  printf '\n'
  print_line
}

doctor() {
  doctor_section "Environment Doctor"

  local os
  os=$(detect_os)
  log_info "Detected host: $os"

  printf '\n'
  color_text bold "Prerequisites"
  printf '\n'

  local status message

  if command -v docker >/dev/null 2>&1; then
    log_success "Docker CLI detected ($(docker --version 2>/dev/null | head -n1))."

    if docker info >/dev/null 2>&1; then
      log_success "Docker daemon responding."
    else
      log_warn "Docker daemon not reachable. Start Docker Desktop before continuing."
    fi

    if docker compose version >/dev/null 2>&1; then
      log_success "Docker Compose plugin available."
    else
      log_error "Docker Compose plugin missing. Update Docker Desktop (v2.10+) or install compose manually."
    fi
  else
    log_error "Docker not found. Install Docker Desktop from https://www.docker.com/products/docker-desktop/."
  fi

  if command -v python3 >/dev/null 2>&1; then
    log_success "Python $(python3 --version 2>/dev/null | head -n1) detected."
  else
    log_warn "Python3 not found. Recommended for local tooling."
  fi

  if command -v uv >/dev/null 2>&1; then
    log_success "uv package manager detected ($(uv --version 2>/dev/null | head -n1))."
  else
    log_warn "uv not installed. Install with 'pip install uv' or see https://github.com/astral-sh/uv."
  fi

  if $JQ_AVAILABLE; then
    log_success "jq available for log prettification."
  else
    log_warn "jq not found. Logs will stream without JSON formatting. Install with 'brew install jq' or 'sudo apt install jq'."
  fi

  printf '\n'
  color_text bold "Project configuration"
  printf '\n'

  if [[ -f "$ENV_FILE" ]]; then
    log_success "Found .env file at $ENV_FILE."
  else
    log_warn ".env file not found. It will be created when configuring secrets."
  fi

  if [[ -n "${GROQ_API_KEY:-}" ]]; then
    log_success "GROQ_API_KEY is set."
  else
    log_warn "GROQ_API_KEY missing. Choose Configure secrets from the menu to add it."
  fi

  if grep -qE '^version:' "$COMPOSE_FILE"; then
    log_warn "docker-compose.yml uses the legacy 'version' field. Consider removing it to silence Docker warnings."
  else
    log_success "docker-compose.yml looks modern (no legacy version field)."
  fi

  printf '\n'
  color_text dim "Need help installing something?"
  printf '\n'
  printf '  • macOS: install Homebrew (https://brew.sh) then run the suggested brew commands.\n'
  printf '  • Windows: use WSL2 with Ubuntu and follow the Linux commands.\n'
  printf '  • Linux: install via apt/yum/pacman based on your distribution.\n'
  printf '\n'
  pause
}

ensure_secret() {
  local var_name=$1
  local prompt_label=$2
  local hint_url=${3:-}
  local non_interactive=${4:-false}

  local current_value=${!var_name:-}

  if [[ -n "$current_value" ]]; then
    return 0
  fi

  # Check if we're in non-interactive mode
  if [[ "$non_interactive" == true ]] || [[ ! -t 0 ]] || [[ ! -t 1 ]]; then
    log_warn "$prompt_label not found. Run './start.sh configure' to set it up."
    return 1
  fi

  log_warn "Missing $prompt_label."
  printf '\n'

  # Enhanced guidance for GROQ API key
  if [[ "$var_name" == "GROQ_API_KEY" ]]; then
    log_info "🤖 GROQ provides fast AI models for Third Eye's intelligence"
    log_info "📝 Getting your key takes 2 minutes:"
    log_info "   1. Visit https://console.groq.com/keys"
    log_info "   2. Sign up/login (free tier available)"
    log_info "   3. Click 'Create API Key'"
    log_info "   4. Copy the key (starts with 'gsk_')"
    printf '\n'
  fi

  if ! prompt_yes_no "Do you want to add it now?"; then
    return 1
  fi

  local key verify
  while true; do
    printf '\n'
    if [[ -n "$hint_url" ]]; then
      log_info "Get your key at: $hint_url"
    fi

    if [[ "$var_name" == "GROQ_API_KEY" ]]; then
      read -r -p "Paste your GROQ API key (gsk_...): " key || return 1
    else
      read -r -p "Enter $prompt_label: " key || return 1
    fi

    if [[ -z "$key" ]]; then
      log_warn "The value cannot be empty."
      continue
    fi

    # Validate GROQ API key format
    if [[ "$var_name" == "GROQ_API_KEY" ]] && [[ ! "$key" =~ ^gsk_ ]]; then
      log_warn "GROQ API keys start with 'gsk_'. Please check your key."
      continue
    fi

    read -r -p "Re-enter to confirm: " verify || return 1
    if [[ "$key" != "$verify" ]]; then
      log_warn "Entries do not match. Let's try again."
      continue
    fi
    break
  done

  update_env_var "$var_name" "$key"
  log_success "$prompt_label saved to .env."
}

ensure_groq_key() {
  ensure_secret "GROQ_API_KEY" "GROQ API key" "https://console.groq.com/keys"
}

ensure_platform_api_key() {
  ensure_secret "THIRD_EYE_API_KEY" "Third Eye API key" "Generate via ./start.sh configure → Admin Control Plane"
}

compose() {
  ensure_env_file
  "${COMPOSE[@]}" "$@"
}

start_services() {
  local rebuild=${1:-false}
  local with_mcp=${2:-true}
  local non_interactive=${3:-false}

  if ! verify_prereqs; then
    return 1
  fi

  # Auto-setup mode for beginners - detect missing credentials
  local missing_groq=false
  local has_demo_mode=false

  if [[ -z "${GROQ_API_KEY:-}" ]]; then
    missing_groq=true
    if [[ "$non_interactive" == true ]]; then
      log_warn "GROQ_API_KEY not found. Starting in demo mode (limited functionality)."
      has_demo_mode=true
    else
      log_warn "GROQ_API_KEY not found - required for AI model operations."
    fi
  fi

  # THIRD_EYE_API_KEY is always auto-generated, never prompt for it during start
  if [[ -z "${THIRD_EYE_API_KEY:-}" ]]; then
    log_info "THIRD_EYE_API_KEY will be auto-generated during bootstrap."
  fi

  # For complete beginners, guide them through GROQ setup (but not in non-interactive mode)
  if [[ "$missing_groq" == true ]] && [[ "$non_interactive" == false ]]; then
    log_action "🎯 Beginner setup mode: Let's get your GROQ API key configured..."
    if ! ensure_secret "GROQ_API_KEY" "GROQ API key" "https://console.groq.com/keys" "$non_interactive"; then
      log_info "No problem! Starting in demo mode without GROQ key."
      log_info "🔄 You can add your GROQ key later with: ./start.sh configure"
      has_demo_mode=true
    fi
  fi

  if [[ "$has_demo_mode" == true ]]; then
    log_warn "⚡ Demo mode: AI features will be limited without GROQ API key"
  fi

  log_docker "Preparing containers..."

  if [[ "$rebuild" == true ]]; then
    log_action "Rebuilding images (this may take a few minutes)..."
    if ! compose build; then
      log_error "Docker build failed. Review the output above for details."
      return 1
    fi
  fi

  local services=(postgres redis third-eye-api overseer-ui control-plane-ui prometheus)
  if [[ "$with_mcp" == true ]]; then
    services+=(mcp-bridge)
  fi

  log_action "Launching Docker services: ${services[*]}"
  if ! compose up -d "${services[@]}"; then
    log_error "Failed to start one or more services."
    return 1
  fi

  if [[ "$with_mcp" != true ]]; then
    log_warn "MCP bridge skipped by request (--no-mcp). Launch it later with './start.sh start' or 'docker compose up mcp-bridge'."
  fi

  log_success "Services running!"

  # Wait for services to be healthy before showing success
  log_action "Waiting for services to be ready..."
  local max_wait=120
  local waited=0
  local health_ok=false

  while [[ $waited -lt $max_wait ]]; do
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
      health_ok=true
      break
    fi
    sleep 2
    waited=$((waited + 2))
    printf "."
  done
  printf "\n"

  if [[ "$health_ok" == true ]]; then
    log_success "✨ Third Eye is fully operational!"

    # Show beginner-friendly status with emojis
    log_info "🌐 API available at http://localhost:8000"
    log_info "👁️  Overseer dashboard at http://localhost:5173"
    log_info "⚙️  Control plane at http://localhost:5174"
    if [[ "$with_mcp" == true ]]; then
      log_info "🔗 MCP bridge at tcp://localhost:7331"
    fi

    # Auto-extract credentials from logs if they were generated
    log_action "Checking for auto-generated credentials..."
    local logs_output
    logs_output=$(compose logs third-eye-api 2>/dev/null | tail -200)

    if echo "$logs_output" | grep -q "GENERATED ADMIN PASSWORD\|GENERATED API KEY"; then
      # Extract password and API key from JSON logs
      local admin_password
      local admin_api_key
      local admin_email

      admin_email=$(echo "$logs_output" | grep -o 'Admin Email: [^"]*' | head -1 | sed 's/Admin Email: //' || echo "admin@third-eye.local")
      admin_password=$(echo "$logs_output" | grep -o 'GENERATED ADMIN PASSWORD: [^"]*' | head -1 | sed 's/GENERATED ADMIN PASSWORD: //' | tr -d ',' || echo "")
      admin_api_key=$(echo "$logs_output" | grep -o 'GENERATED API KEY: [^"]*' | head -1 | sed 's/GENERATED API KEY: //' | tr -d ',' || echo "")

      # Alternative: try extracting from JSON message field
      if [[ -z "$admin_password" ]]; then
        admin_password=$(echo "$logs_output" | grep '"message":.*GENERATED ADMIN PASSWORD' | sed -E 's/.*GENERATED ADMIN PASSWORD: ([^"]+).*/\1/' | head -1 || echo "")
      fi
      if [[ -z "$admin_api_key" ]]; then
        admin_api_key=$(echo "$logs_output" | grep '"message":.*GENERATED API KEY' | sed -E 's/.*GENERATED API KEY: ([^"]+).*/\1/' | head -1 || echo "")
      fi

      printf '\n'
      print_line
      print_centered_line "🔐 AUTO-GENERATED ADMIN CREDENTIALS" bold
      print_line
      printf '\n'
      if [[ -n "$admin_email" ]]; then
        log_key "Admin Email:    $admin_email"
      fi
      if [[ -n "$admin_password" ]]; then
        log_key "Admin Password: $admin_password"
      else
        log_warn "Password not found in logs"
        log_hint "Run './start.sh debug' or './scripts/debug-login.sh' for detailed diagnostics"
      fi
      if [[ -n "$admin_api_key" ]]; then
        log_key "API Key:        $admin_api_key"
      else
        log_info "Waiting for API key generation..."
        sleep 2
        admin_api_key=$(docker compose logs third-eye-api 2>&1 | grep -o 'GENERATED API KEY: [^"]*' | head -1 | sed 's/GENERATED API KEY: //' | tr -d ',' || echo "")
        if [[ -n "$admin_api_key" ]]; then
          log_key "API Key:        $admin_api_key"
        else
          log_warn "API key still not found - it will be generated on first API use"
      fi
      printf '\n'
      # Auto-save API key to .env if found
      if [[ -n "$admin_api_key" ]]; then
        if [[ ! -f "$ENV_FILE" ]] || ! grep -q "^THIRD_EYE_API_KEY=" "$ENV_FILE" 2>/dev/null; then
          update_env_var "THIRD_EYE_API_KEY" "$admin_api_key"
          log_success "✅ API key saved to .env"
          log_info "🔄 Restarting MCP bridge to apply API key..."
          docker compose restart mcp-bridge >/dev/null 2>&1 &
        fi
      fi

      printf '\n'
      log_success "✅ All credentials saved to .env automatically"
      log_success "✅ MCP bridge configured and ready"
      log_success "✅ No password reset required"
      printf '\n'
      print_line
      print_centered_line "🌐 ACCESS URLs" bold
      print_line
      printf '\n'
      log_info "Control Plane: http://localhost:5174"
      log_info "Overseer:      http://localhost:5173"
      log_info "API:           http://localhost:8000"
      log_info "MCP Bridge:    tcp://localhost:7331"
      printf '\n'
      log_hint "💾 Credentials saved to .env"
      log_hint "📝 Login at Control Plane: http://localhost:5174"

      # Auto-save credentials to .env (no prompt in non-interactive mode)
      if [[ -n "$admin_password" ]]; then
        if [[ ! -f "$ENV_FILE" ]] || ! grep -q "^ADMIN_BOOTSTRAP_PASSWORD=" "$ENV_FILE" 2>/dev/null; then
          update_env_var "ADMIN_BOOTSTRAP_PASSWORD" "$admin_password"
          log_success "✅ Password saved to .env"
          fi
        fi
      fi

      if [[ -n "$admin_api_key" ]]; then
        if [[ ! -f "$ENV_FILE" ]] || ! grep -q "^THIRD_EYE_API_KEY=" "$ENV_FILE" 2>/dev/null; then
          if prompt_yes_no "Save API key to .env file for persistence?"; then
            update_env_var "THIRD_EYE_API_KEY" "$admin_api_key"
            log_success "✅ API key saved to .env"
          fi
        fi
      fi

      printf '\n'
      print_line
    else
      # No credentials in logs - admin already exists
      log_info "ℹ️  Admin account already exists (bootstrap skipped)"
      log_hint "💡 Use './start.sh credentials' to view saved credentials"
      log_hint "🔄 For a fresh start: './start.sh stop && docker compose -p third-eye-mcp down -v && ./start.sh start'"
    fi

  else
    log_warn "Services started but health check timed out. Check logs with './start.sh logs'"
  fi

  if [[ "${AUTO_OPEN_PORTAL:-false}" == true ]]; then
    log_info "Launching Overseer portal..."
    launch_portal_cli
  fi
  return 0
}

stop_services() {
  if ! verify_prereqs; then
    return 1
  fi
  log_docker "Stopping containers..."
  if compose down; then
    log_success "All services stopped."
  else
    log_warn "Could not stop all services cleanly."
  fi
}

restart_services() {
  local rebuild=${1:-false}
  local with_mcp=${2:-true}
  if ! verify_prereqs; then
    return 1
  fi
  stop_services
  printf '\n'
  start_services "$rebuild" "$with_mcp"
}

status_services() {
  if ! verify_prereqs; then
    return 1
  fi
  log_docker "Checking container status..."
  if compose ps; then
    log_hint "Use option 5 to stream live logs."
  else
    log_warn "Unable to read docker compose status."
  fi
  pause
}

tail_logs() {
  if ! verify_prereqs; then
    return 1
  fi

  local service=${1:-}
  if [[ -z "$service" ]]; then
    printf '\n'
    read -r -p "Enter a service name (third-eye-api, mcp-bridge, redis, postgres, overseer-ui, control-plane-ui) or leave blank for all: " service || true
  else
    printf '\n'
    log_info "Streaming logs for $service"
  fi

  log_action "Streaming live logs (tail -f). Press Ctrl+C to stop."
  log_hint "Service tags: [API], [MCP], [REDIS], etc."

  local args=(--tail=200 -f)
  if [[ -n "$service" ]]; then
    args+=("$service")
  fi

  set +e
  local exit_code
  if $JQ_AVAILABLE; then
    local line
    compose logs "${args[@]}" 2>&1 |
      while IFS= read -r line; do
        format_log_line "$line" true
      done
    exit_code=$?
  else
    compose logs "${args[@]}" 2>&1 |
      while IFS= read -r line; do
        format_log_line "$line" false
      done
    exit_code=$?
  fi
  set -e
  if [[ $exit_code -ne 0 && $exit_code -ne 130 ]]; then
    log_warn "Log streaming ended with status $exit_code."
  else
    log_info "Log streaming stopped."
  fi
}

configure_secrets() {
  ensure_env_file
  printf '\n'
  color_text bold "Secrets & configuration"
  printf '\n'
  print_line

  if [[ -n "${GROQ_API_KEY:-}" ]]; then
    log_success "Existing GROQ_API_KEY detected."
    if prompt_yes_no "Do you want to update it?"; then
      unset GROQ_API_KEY
      ensure_groq_key
    else
      log_info "Keeping existing key."
    fi
  else
    ensure_groq_key
  fi

  if [[ -n "${THIRD_EYE_API_KEY:-}" ]]; then
    log_success "Existing THIRD_EYE_API_KEY detected."
    if prompt_yes_no "Do you want to update it?"; then
      unset THIRD_EYE_API_KEY
      ensure_platform_api_key
    else
      log_info "Keeping existing Third Eye API key."
    fi
  else
    ensure_platform_api_key
  fi

  log_hint "Credentials saved in $ENV_FILE."
  ensure_portal_pref
  if prompt_yes_no "Open the Overseer portal now?"; then
    launch_portal_cli
  fi
  pause
}

cleanup() {
  printf '\n'
  color_text bold "Cleanup"
  printf '\n'
  print_line
  log_warn "This will remove containers, networks, and cached images for this project."
  if prompt_yes_no "Proceed with docker compose down --volumes?"; then
    if verify_prereqs && compose down --volumes; then
      log_success "Environment cleaned."
    else
      log_warn "Cleanup did not complete."
    fi
  else
    log_info "Cleanup aborted."
  fi
  pause
}

print_integration_section() {
  local title=$1
  local body=$2
  print_centered_line "┈ $title ┈" magenta
  local old_ifs=$IFS
  IFS=$'\n'
  for line in $body; do
    if [[ -z "$line" ]]; then
      printf '\n'
    else
      print_centered_line "$line"
    fi
  done
  IFS=$old_ifs
  printf '\n'
}

integration_panel() {
  update_width
  local repo_path="$PROJECT_ROOT"
  local bun_command="bun run --cwd '$repo_path/mcp-bridge' start"
  local docker_shell="${SHELL:-/bin/bash}"
  local docker_run_cmd="cd '$repo_path' && docker compose run --rm mcp-bridge"

  local claude_body=$(cat <<EOF
1. Start the stack: `./start.sh start` (keeps Redis/API ready for every tool).
2. Register the bridge with Claude’s CLI:
   claude mcp add third-eye -- bun run --cwd "<repo>/mcp-bridge" start
   (If you prefer Docker, run: claude mcp add third-eye -- $docker_shell -lc "$docker_run_cmd")
3. Approve the trust prompt in Claude Desktop/Code.
4. Press Cmd/Ctrl+Shift+M → Tools and confirm the Third Eye suite appears.
5. Rerun the same command to refresh; remove with `claude mcp remove third-eye`.
EOF
)
  local codex_body=$(cat <<EOF
1. Start services: `./start.sh start`.
2. Edit ~/.codex/config.toml and add:

   [mcp_servers.third-eye]
   command = "bun"
   args = ["run", "--cwd", "<repo>/mcp-bridge", "start"]
   env = { }

   (Docker alternative: set command to `$docker_shell` and args to ["-lc", "$docker_run_cmd"].)
3. Save and restart Codex CLI; run `/tools list` to confirm Third Eye is active.
EOF
)
  local gemini_body=$(cat <<EOF
1. Install Gemini CLI if needed (`npm install -g @google/gemini-cli`).
2. Run `./start.sh start`.
3. Merge into ~/.gemini/settings.json:

   {
     "mcpServers": {
       "third-eye": {
         "command": "bun",
         "args": ["run", "--cwd", "<repo>/mcp-bridge", "start"],
         "env": {}
       }
     }
   }

   (Use `$docker_shell`, `$docker_run_cmd` if you prefer Docker.)
4. Run `gemini configure mcp` or restart `gemini chat`.
5. Use `@third-eye` to call the tools.
EOF
)
  local opencode_body=$(cat <<EOF
1. Ensure OpenCode CLI is installed (`npm install -g opencode`).
2. Combine with Third Eye, e.g. in Claude Code:
     claude mcp add opencode -- npx -y opencode-mcp-tool -- --model gemma2-9b-it
     claude mcp add third-eye -- bun run --cwd "<repo>/mcp-bridge" start
3. Inside Claude, run `/mcp list` and enable both servers.
4. Use OpenCode’s planner alongside Third Eye evidence/review loops.
EOF
)
  local zed_body=$(cat <<EOF
1. Start services: `./start.sh start`.
2. Zed → Settings → JSON (Cmd/Ctrl+,) and add:

   {
     "context_servers": {
       "third-eye": {
         "source": "custom",
         "command": "bun",
         "args": ["run", "--cwd", "<repo>/mcp-bridge", "start"],
         "env": {}
       }
     }
   }

   (Docker fallback: command `/bin/bash`, args `-lc`, `$docker_run_cmd`.)
3. Command Palette → “AI: Restart MCP Servers”.
4. Open Agent Panel and verify “third-eye” shows under MCP servers.
EOF
)
  local vscode_body=$(cat <<EOF
1. Run `./start.sh start`.
2. VS Code 1.102+ → Command Palette → “MCP: Open User Configuration”.
3. Insert:
   {
     "servers": {
       "third-eye": {
         "type": "stdio",
         "command": "bun",
         "args": ["run", "--cwd", "<repo>/mcp-bridge", "start"],
         "env": {}
       }
     }
   }

   (Swap in `$docker_shell`/`$docker_run_cmd` if you want Docker.)
4. Save, choose **Trust**, then in Copilot agent mode run `/mcp list`.
EOF
)
  local cursor_body=$(cat <<EOF
1. Start services: `./start.sh start`.
2. Cursor → Settings → MCP → “Add CLI Server”.
3. Command: `bun`
   Args: `run`, `--cwd`, `"<repo>/mcp-bridge"`, `start`
   (Or use `/bin/bash`, `-lc`, `$docker_run_cmd`.)
4. Toggle the server ON; Composer now lists Third Eye tools.
5. Use `@third-eye` to trigger Sharingan or the review/refine cycle.
EOF
)
  local warp_body=$(cat <<EOF
1. `./start.sh start` brings API/Redis online.
2. Warp → Settings → AI → Manage MCP Servers → “Add CLI server”.
3. Command: `bun`
   Args: `run`, `--cwd`, `"<repo>/mcp-bridge"`, `start`
   (Docker alternative: `/bin/bash`, `-lc`, `$docker_run_cmd`.)
4. Click **Start**; optionally enable **Autostart**.
5. In Warp AI prompt run `tools` to confirm Third Eye is reachable.
EOF
)

  print_centered_line "Integration Playbook" bold
  printf '\n'
  print_line
  printf '\n'
  print_centered_line "Prereqs: Docker Desktop running, ./start.sh start" dim
  print_centered_line "Use Bun-based commands by default; Docker alternatives shown inline" dim
  printf '\n'
  print_centered_line "Use <repo> as shorthand for $PROJECT_ROOT" dim
  print_centered_line "Command root: $PROJECT_ROOT/mcp-bridge" dim
  printf '\n'
  print_integration_section "Claude Code" "$claude_body"
  print_integration_section "Codex CLI" "$codex_body"
  print_integration_section "Gemini CLI" "$gemini_body"
  print_integration_section "OpenCode" "$opencode_body"
  print_integration_section "Zed" "$zed_body"
  print_integration_section "VS Code" "$vscode_body"
  print_integration_section "Cursor" "$cursor_body"
  print_integration_section "Warp" "$warp_body"
}

main_menu() {
  while true; do
    clear_screen
    print_banner
    printf '\n'
    print_centered_line "Main menu" bold
    printf '\n'
    print_line
    print_centered_line "1. $ICON_ROCKET  Start / resume services"
    print_centered_line "2. $ICON_GEAR    Start with rebuild"
    print_centered_line "3. $ICON_STOP    Stop services"
    print_centered_line "4. $ICON_GEAR    Restart services"
    print_centered_line "5. $ICON_INFO    Show status"
    print_centered_line "6. $ICON_DOCKER  Tail logs"
    print_centered_line "7. $ICON_KEY     Configure secrets"
    print_centered_line "8. 🔐  Show admin credentials"
    print_centered_line "9. $ICON_BOOK    Environment doctor"
    print_centered_line "10. $ICON_BROOM   Cleanup environment"
    print_centered_line "11. 📡  Integration playbook"
    print_centered_line "0. Exit"
    print_line
    printf '\n'
    read -r -p "Select an option: " choice || exit 0

    case "$choice" in
      1)
        printf '\n'
        start_services false true
        pause
        ;;
      2)
        printf '\n'
        start_services true true
        pause
        ;;
      3)
        printf '\n'
        stop_services
        pause
        ;;
      4)
        printf '\n'
        restart_services false true
        pause
        ;;
      5)
        printf '\n'
        status_services
        ;;
      6)
        printf '\n'
        tail_logs
        pause
        ;;
      7)
        configure_secrets
        ;;
      8)
        printf '\n'
        if [[ -f "$PROJECT_ROOT/scripts/show-credentials.sh" ]]; then
          "$PROJECT_ROOT/scripts/show-credentials.sh"
        else
          log_error "Credentials script not found"
        fi
        pause
        ;;
      9)
        doctor
        ;;
      10)
        cleanup
        ;;
      11)
        printf '\n'
        integration_panel
        pause
        ;;
      0|q|Q|exit)
        log_info "Goodbye!"
        exit 0
        ;;
      *)
        log_warn "Unknown option. Please choose between 0-11."
        pause
        ;;
    esac
  done
}

clear_screen() {
  if [[ -t 1 ]]; then
    if command -v clear >/dev/null 2>&1; then
      clear
    fi
  fi
}

cli_dispatch() {
  local command=${1:-menu}
  shift || true

  case "$command" in
    start)
      local rebuild=false with_mcp=true non_interactive=false
      while [[ $# -gt 0 ]]; do
        case "$1" in
          --rebuild) rebuild=true ;;
          --no-mcp) with_mcp=false ;;
          --non-interactive|--ci) non_interactive=true ;;
        esac
        shift
      done
      start_services "$rebuild" "$with_mcp" "$non_interactive"
      ;;
    stop)
      stop_services
      ;;
    restart)
      local rebuild=false with_mcp=true
      while [[ $# -gt 0 ]]; do
        case "$1" in
          --rebuild) rebuild=true ;;
          --no-mcp) with_mcp=false ;;
        esac
        shift
      done
      restart_services "$rebuild" "$with_mcp"
      ;;
    status)
      status_services
      ;;
    logs)
      tail_logs "$@"
      ;;
    docker)
      if verify_prereqs; then
        compose "$@"
      fi
      ;;
    doctor)
      doctor
      ;;
    configure)
      configure_secrets
      ;;
    integrations|integration|guide)
      integration_panel
      ;;
    cleanup)
      cleanup
      ;;
    credentials|creds)
      if [[ -f "$PROJECT_ROOT/scripts/show-credentials.sh" ]]; then
        "$PROJECT_ROOT/scripts/show-credentials.sh"
      else
        log_error "Credentials script not found at $PROJECT_ROOT/scripts/show-credentials.sh"
      fi
      ;;
    debug)
      if [[ -f "$PROJECT_ROOT/scripts/debug-login.sh" ]]; then
        "$PROJECT_ROOT/scripts/debug-login.sh"
      else
        log_error "Debug script not found at $PROJECT_ROOT/scripts/debug-login.sh"
      fi
      ;;
    portal)
      if [[ $# -gt 0 ]]; then
        launch_portal_cli "$1"
      else
        launch_portal_cli
      fi
      ;;
    menu|interactive)
      main_menu
      ;;
    help|-h|--help)
      show_usage
      ;;
    *)
      show_usage
      exit 1
      ;;
  esac
}

show_usage() {
  cat <<USAGE
Usage: ./start.sh [command]

🔰 NEW TO THIRD EYE? Just run: ./start.sh
   This opens the interactive menu that guides you through everything!

🎯 Quick commands:
  start                    🚀 Auto-setup and launch (guides you through missing credentials)
  start --non-interactive  🤖 CI/CD mode (no prompts, starts in demo mode if needed)
  menu                     📋 Interactive guided menu (default)
  doctor                   🩺 Check if your environment is ready
  configure                🔑 Setup API keys and credentials
  credentials              🔐 Show auto-generated admin credentials from logs
  debug                    🔍 Diagnose login issues (password mismatches, DB state)

⚙️  Advanced commands:
  start [--rebuild] [--no-mcp] [--non-interactive]
                           Build (optional) and launch services
  stop                     Stop running containers
  restart [--rebuild] [--no-mcp] [--non-interactive]
                           Restart services
  status                   Show docker compose status
  logs                     Tail logs (interactive prompt)
  docker <args...>         Pass-through to docker compose
  portal [session-id]      Open the Overseer portal
  integrations             Show the integration playbook
  cleanup                  Remove containers, networks, volumes

🆘 Need help?
  - First time? Copy .env.example to .env and add your GROQ API key
  - Problems? Check TROUBLESHOOTING.md or run './start.sh doctor'
  - Demo mode? Run './start.sh start --non-interactive' (works without API keys)
USAGE
}

main() {
  init_colors
  load_portal_pref
  ensure_env_file

  if [[ $# -eq 0 ]]; then
    if [[ -t 0 && -t 1 ]]; then
      main_menu
    else
      show_usage
      exit 1
    fi
  else
    cli_dispatch "$@"
  fi
}

main "$@"
