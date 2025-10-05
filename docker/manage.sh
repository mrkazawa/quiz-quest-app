#!/bin/bash

# Quiz Quest Docker Management Script
# Interactive menu for all Docker operations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to print colored output
print_color() {
    color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Function to print header
print_header() {
    echo ""
    print_color "$CYAN" "=========================================="
    print_color "$CYAN" "$1"
    print_color "$CYAN" "=========================================="
    echo ""
}

# Function to show main menu
show_main_menu() {
    print_header "🚀 Quiz Quest Docker Manager"
    
    echo "Choose an action:"
    echo ""
    print_color "$GREEN" "BUILD & PUSH:"
    echo "  1) Build Docker image"
    echo "  2) Push to Docker Hub"
    echo "  3) Build + Push (full cycle)"
    echo ""
    print_color "$GREEN" "RUN DEPLOYMENTS:"
    echo "  4) Run Native (Direct access)"
    echo "  5) Run with localhost.run (Tunneling)"
    echo "  6) Run with Serveo.net (Tunneling)"
    echo ""
    print_color "$GREEN" "MANAGEMENT:"
    echo "  7) Stop all deployments"
    echo "  8) View logs"
    echo "  9) Check status"
    echo "  10) Clean up (remove containers and volumes)"
    echo ""
    print_color "$GREEN" "UTILITIES:"
    echo "  11) Generate SESSION_SECRET"
    echo "  12) Create .env file"
    echo "  13) Test deployment"
    echo ""
    echo "  0) Exit"
    echo ""
}

# Function to build image
build_image() {
    print_header "🐳 Building Docker Image"
    cd "$SCRIPT_DIR"
    ./build.sh
}

# Function to push image
push_image() {
    print_header "📤 Pushing to Docker Hub"
    cd "$SCRIPT_DIR"
    ./push.sh
}

# Function to run native deployment
run_native() {
    print_header "🏠 Running Native Deployment"
    cd "$SCRIPT_DIR"
    ./run-native.sh
}

# Function to run localhost.run
run_localhost_run() {
    print_header "🌐 Running localhost.run Deployment"
    cd "$SCRIPT_DIR"
    ./run-localhost-run.sh
}

# Function to run serveo
run_serveo() {
    print_header "🌐 Running Serveo.net Deployment"
    cd "$SCRIPT_DIR"
    ./run-serveo.sh
}

# Function to stop all deployments
stop_all() {
    print_header "🛑 Stopping All Deployments"
    cd "$SCRIPT_DIR"
    
    echo "Stopping Native deployment (with all profiles)..."
    docker compose -f docker-compose-native.yml --profile with-nginx down 2>/dev/null || true
    
    echo "Stopping localhost.run deployment..."
    docker compose -f docker-compose-localhost-run.yml down 2>/dev/null || true
    
    echo "Stopping Serveo deployment..."
    docker compose -f docker-compose-serveo.yml down 2>/dev/null || true
    
    echo ""
    echo "Checking for any remaining Quiz Quest containers..."
    REMAINING=$(docker ps -a --filter "name=quiz-quest" --format "{{.Names}}" 2>/dev/null || true)
    if [ -n "$REMAINING" ]; then
        echo "Found remaining containers:"
        echo "$REMAINING"
        echo ""
        read -p "Stop these containers too? (y/N): " stop_remaining
        if [[ $stop_remaining =~ ^[Yy]$ ]]; then
            docker ps -a --filter "name=quiz-quest" --format "{{.Names}}" | xargs -r docker stop 2>/dev/null || true
            docker ps -a --filter "name=quiz-quest" --format "{{.Names}}" | xargs -r docker rm 2>/dev/null || true
            print_color "$GREEN" "✅ Stopped and removed remaining containers"
        fi
    fi
    
    echo ""
    print_color "$GREEN" "✅ All deployments stopped"
}

# Function to view logs
view_logs() {
    print_header "📋 View Logs"
    cd "$SCRIPT_DIR"
    
    echo "Select deployment:"
    echo "  1) Native"
    echo "  2) localhost.run"
    echo "  3) Serveo.net"
    echo ""
    read -p "Choice (1-3): " log_choice
    
    case $log_choice in
        1)
            echo ""
            print_color "$BLUE" "Viewing Native deployment logs (Ctrl+C to exit)..."
            docker compose -f docker-compose-native.yml logs -f
            ;;
        2)
            echo ""
            print_color "$BLUE" "Viewing localhost.run deployment logs (Ctrl+C to exit)..."
            docker compose -f docker-compose-localhost-run.yml logs -f
            ;;
        3)
            echo ""
            print_color "$BLUE" "Viewing Serveo deployment logs (Ctrl+C to exit)..."
            docker compose -f docker-compose-serveo.yml logs -f
            ;;
        *)
            print_color "$RED" "Invalid choice"
            ;;
    esac
}

# Function to check status
check_status() {
    print_header "📊 Checking Status"
    cd "$SCRIPT_DIR"
    
    echo "Native deployment (app only):"
    docker compose -f docker-compose-native.yml ps 2>/dev/null || echo "  Not running"
    echo ""
    
    echo "Native deployment (with Nginx):"
    docker compose -f docker-compose-native.yml --profile with-nginx ps 2>/dev/null | grep nginx || echo "  Nginx not running"
    echo ""
    
    echo "localhost.run deployment:"
    docker compose -f docker-compose-localhost-run.yml ps 2>/dev/null || echo "  Not running"
    echo ""
    
    echo "Serveo.net deployment:"
    docker compose -f docker-compose-serveo.yml ps 2>/dev/null || echo "  Not running"
    echo ""
    
    echo "All Quiz Quest containers:"
    docker ps -a --filter "name=quiz-quest" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "  None found"
    echo ""
}

# Function to clean up
cleanup() {
    print_header "🧹 Cleanup"
    cd "$SCRIPT_DIR"
    
    echo "This will:"
    echo "  - Stop all containers"
    echo "  - Remove containers"
    echo "  - Remove volumes"
    echo ""
    read -p "Are you sure? (y/N): " confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        echo "Removing Native deployment (with all profiles)..."
        docker compose -f docker-compose-native.yml --profile with-nginx down -v 2>/dev/null || true
        
        echo "Removing localhost.run deployment..."
        docker compose -f docker-compose-localhost-run.yml down -v 2>/dev/null || true
        
        echo "Removing Serveo deployment..."
        docker compose -f docker-compose-serveo.yml down -v 2>/dev/null || true
        
        echo ""
        echo "Removing any remaining Quiz Quest containers..."
        docker ps -a --filter "name=quiz-quest" --format "{{.Names}}" | xargs -r docker stop 2>/dev/null || true
        docker ps -a --filter "name=quiz-quest" --format "{{.Names}}" | xargs -r docker rm -v 2>/dev/null || true
        
        echo ""
        echo "Removing dangling volumes..."
        docker volume ls -qf "dangling=true" | grep -i "quiz" | xargs -r docker volume rm 2>/dev/null || true
        
        echo ""
        echo "Removing Docker networks..."
        docker network ls --filter "name=quiz-quest" --format "{{.Name}}" | xargs -r docker network rm 2>/dev/null || true
        docker network ls --filter "name=docker_quiz-quest" --format "{{.Name}}" | xargs -r docker network rm 2>/dev/null || true
        
        echo ""
        echo "Pruning unused networks..."
        docker network prune -f 2>/dev/null || true
        
        echo ""
        print_color "$GREEN" "✅ Cleanup complete"
    else
        print_color "$YELLOW" "Cancelled"
    fi
}

# Function to generate SESSION_SECRET
generate_secret() {
    print_header "🔑 Generate SESSION_SECRET"
    
    if command -v node &> /dev/null; then
        SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    elif command -v openssl &> /dev/null; then
        SECRET=$(openssl rand -hex 64)
    else
        print_color "$RED" "❌ Error: Neither node nor openssl found"
        return 1
    fi
    
    echo "Your SESSION_SECRET:"
    echo ""
    print_color "$GREEN" "$SECRET"
    echo ""
    echo "Add this to your .env file:"
    echo "SESSION_SECRET=$SECRET"
    echo ""
}

# Function to create .env file
create_env_file() {
    print_header "📝 Create .env File"
    
    ENV_FILE="$SCRIPT_DIR/../.env"
    
    if [ -f "$ENV_FILE" ]; then
        print_color "$YELLOW" "⚠️  .env file already exists"
        read -p "Overwrite? (y/N): " overwrite
        if [[ ! $overwrite =~ ^[Yy]$ ]]; then
            print_color "$YELLOW" "Cancelled"
            return
        fi
    fi
    
    # Copy from example
    if [ -f "$SCRIPT_DIR/../.env.example" ]; then
        cp "$SCRIPT_DIR/../.env.example" "$ENV_FILE"
        print_color "$GREEN" "✅ Created .env from .env.example"
    else
        # Create minimal .env
        cat > "$ENV_FILE" << 'EOF'
# Quiz Quest Environment Variables
NODE_ENV=production
TEACHER_PASSWORD=admin
SESSION_SECRET=
CORS_ORIGINS=http://localhost:3000
BEHIND_PROXY=false
EOF
        print_color "$GREEN" "✅ Created .env file"
    fi
    
    echo ""
    echo "📝 Please edit .env and set:"
    echo "  - TEACHER_PASSWORD (change from default)"
    echo "  - SESSION_SECRET (generate with option 11)"
    echo ""
}

# Function to test deployment
test_deployment() {
    print_header "🧪 Test Deployment"
    
    echo "Testing health endpoint..."
    
    # Try localhost:3000
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        print_color "$GREEN" "✅ Native deployment is healthy (http://localhost:3000)"
        curl -s http://localhost:3000/health | jq . 2>/dev/null || curl -s http://localhost:3000/health
    else
        print_color "$YELLOW" "⚠️  Native deployment not accessible on localhost:3000"
    fi
    
    echo ""
    
    # Try localhost:80
    if curl -s http://localhost:80/health > /dev/null 2>&1; then
        print_color "$GREEN" "✅ Nginx proxy is healthy (http://localhost)"
        curl -s http://localhost/health | jq . 2>/dev/null || curl -s http://localhost/health
    else
        print_color "$YELLOW" "⚠️  Nginx not accessible on localhost:80"
    fi
    
    echo ""
}

# Main loop
while true; do
    show_main_menu
    read -p "Enter choice [0-13]: " choice
    
    case $choice in
        1)
            build_image
            ;;
        2)
            push_image
            ;;
        3)
            build_image
            push_image
            ;;
        4)
            run_native
            ;;
        5)
            run_localhost_run
            ;;
        6)
            run_serveo
            ;;
        7)
            stop_all
            ;;
        8)
            view_logs
            ;;
        9)
            check_status
            ;;
        10)
            cleanup
            ;;
        11)
            generate_secret
            ;;
        12)
            create_env_file
            ;;
        13)
            test_deployment
            ;;
        0)
            echo ""
            print_color "$CYAN" "👋 Goodbye!"
            echo ""
            exit 0
            ;;
        *)
            print_color "$RED" "Invalid choice. Please try again."
            sleep 2
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done
