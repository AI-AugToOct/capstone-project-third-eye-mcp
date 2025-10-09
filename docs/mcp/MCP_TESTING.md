# 🧿 Third Eye MCP - Testing Guide

## 🚨 CRITICAL: Third Eye is a STRICT VALIDATION OVERSEER

Third Eye **NEVER** generates content. It **ONLY** validates complete work packages against quality standards. **ALL FIELDS ARE MANDATORY** - incomplete submissions will be **REJECTED IMMEDIATELY**.

## Testing Your Integration

### 1. Basic Connection Test

First, verify your MCP connection is working:

```json
{
  "payload": {
    "intent": "Test Third Eye validation system",
    "work": {
      "code": "print('Hello, Third Eye!')"
    },
    "context_info": {
      "language": "python",
      "purpose": "testing"
    }
  },
  "reasoning_md": "Testing the Third Eye MCP integration to ensure validation pipeline is working correctly."
}
```

**Expected Response**: Validation results with `ok: true` and analysis of the simple code.

### 2. Incomplete Submission Tests

#### ❌ Test Missing Intent
```json
{
  "payload": {
    "work": {"code": "print('test')"},
    "context_info": {"language": "python"}
  },
  "reasoning_md": "This should fail"
}
```

**Expected Response**: `ok: false` with error "intent is required (minimum 5 characters)"

#### ❌ Test Empty Work
```json
{
  "payload": {
    "intent": "Validate this code",
    "work": {},
    "context_info": {"language": "python"}
  },
  "reasoning_md": "This should fail"
}
```

**Expected Response**: `ok: false` with error "work is required and must contain at least one property"

#### ❌ Test Missing Context
```json
{
  "payload": {
    "intent": "Validate this code",
    "work": {"code": "print('test')"}
  },
  "reasoning_md": "This should fail"
}
```

**Expected Response**: `ok: false` with error "context_info is required and must contain at least one property"

#### ❌ Test Short Reasoning
```json
{
  "payload": {
    "intent": "Validate this code",
    "work": {"code": "print('test')"},
    "context_info": {"language": "python"}
  },
  "reasoning_md": "Short"
}
```

**Expected Response**: `ok: false` with error "reasoning_md is required (minimum 10 characters)"

## Validation Type Tests

### 🔍 Code Validation

#### ✅ Secure Code Example
```json
{
  "payload": {
    "intent": "Validate this secure user authentication implementation",
    "work": {
      "code": "import bcrypt\nfrom flask import Flask, request, jsonify\nfrom werkzeug.security import check_password_hash\n\n@app.route('/login', methods=['POST'])\ndef login():\n    data = request.get_json()\n    username = data.get('username')\n    password = data.get('password')\n    \n    if not username or not password:\n        return jsonify({'error': 'Missing credentials'}), 400\n    \n    user = User.query.filter_by(username=username).first()\n    if user and check_password_hash(user.password_hash, password):\n        token = generate_jwt_token(user.id)\n        return jsonify({'token': token}), 200\n    \n    return jsonify({'error': 'Invalid credentials'}), 401"
    },
    "context_info": {
      "language": "python",
      "framework": "flask",
      "security_level": "high",
      "deployment": "production"
    }
  },
  "reasoning_md": "This login endpoint implements secure authentication with password hashing, input validation, and proper error handling. I need Third Eye to validate security practices and identify any potential vulnerabilities before production deployment."
}
```

#### ❌ Insecure Code Example
```json
{
  "payload": {
    "intent": "Validate this login implementation for security issues",
    "work": {
      "code": "@app.route('/login', methods=['POST'])\ndef login():\n    username = request.form['username']\n    password = request.form['password']\n    \n    # Direct SQL query - potential SQL injection\n    query = f\"SELECT * FROM users WHERE username='{username}' AND password='{password}'\"\n    user = db.execute(query).fetchone()\n    \n    if user:\n        session['user_id'] = user[0]\n        return 'Login successful'\n    return 'Login failed'"
    },
    "context_info": {
      "language": "python",
      "framework": "flask",
      "security_level": "high",
      "audit_type": "security_review"
    }
  },
  "reasoning_md": "This code implements basic login functionality but may have security vulnerabilities. I need Third Eye to identify security issues like SQL injection, password handling problems, and other security concerns before this goes to production."
}
```

**Expected Response**: Security issues identified with specific recommendations.

### 📋 Plan Review

#### ✅ Complete Architecture Plan
```json
{
  "payload": {
    "intent": "Review this microservices architecture for a high-traffic e-commerce platform",
    "work": {
      "plan": "# E-Commerce Microservices Architecture\n\n## Core Services\n\n### 1. User Service\n- **Purpose**: User registration, authentication, profile management\n- **Technology**: Node.js + Express + JWT\n- **Database**: PostgreSQL with read replicas\n- **Scaling**: Horizontal scaling behind load balancer\n\n### 2. Product Catalog Service\n- **Purpose**: Product information, search, categories\n- **Technology**: Python + FastAPI + Elasticsearch\n- **Database**: PostgreSQL + Redis cache\n- **Scaling**: CDN for static assets, search index sharding\n\n### 3. Order Service\n- **Purpose**: Order processing, workflow management\n- **Technology**: Java + Spring Boot\n- **Database**: PostgreSQL with ACID compliance\n- **Patterns**: Saga pattern for distributed transactions\n\n### 4. Payment Service\n- **Purpose**: Payment processing, PCI compliance\n- **Technology**: Node.js + Stripe API\n- **Security**: Vault for secrets, encrypted data at rest\n- **Compliance**: PCI DSS Level 1\n\n## Infrastructure\n\n### API Gateway\n- **Technology**: Kong\n- **Features**: Rate limiting, authentication, logging\n- **Load Balancing**: Round-robin with health checks\n\n### Message Queue\n- **Technology**: Apache Kafka\n- **Usage**: Event sourcing, service communication\n- **Partitioning**: By customer ID for ordering\n\n### Monitoring\n- **Metrics**: Prometheus + Grafana\n- **Logging**: ELK Stack\n- **Tracing**: Jaeger for distributed tracing\n\n## Scalability Considerations\n\n### Database Strategy\n- Read replicas for catalog service\n- Sharding for user data by geographic region\n- CQRS pattern for order service\n\n### Caching Strategy\n- Redis for session storage\n- CDN for product images and static content\n- Application-level caching for frequent queries\n\n### Security\n- OAuth 2.0 with PKCE for authentication\n- mTLS between services\n- Network segmentation with VPC\n- WAF for external traffic\n\n## Deployment\n- **Orchestration**: Kubernetes\n- **CI/CD**: GitLab CI with automated testing\n- **Blue-green deployments** for zero downtime\n- **Canary releases** for risk mitigation"
    },
    "context_info": {
      "project_type": "microservices",
      "expected_load": "100k_concurrent_users",
      "compliance_requirements": ["PCI_DSS", "GDPR", "SOC2"],
      "team_size": 15,
      "timeline": "6_months",
      "budget": "high"
    }
  },
  "reasoning_md": "This architecture is designed for a high-traffic e-commerce platform that needs to handle 100k concurrent users with strict compliance requirements. I've chosen battle-tested technologies and patterns like microservices, event sourcing, and CQRS. The plan includes detailed scalability strategies, security measures, and operational considerations. I need Third Eye to validate this architecture for potential bottlenecks, security gaps, over-engineering, or missing components before we start implementation."
}
```

### ✅ Fact-Checking Draft

```json
{
  "payload": {
    "intent": "Fact-check this technical article about Kubernetes performance optimizations",
    "work": {
      "draft": "# Kubernetes Performance Optimization in 2024\n\nKubernetes has evolved significantly in recent years, with version 1.28 introducing several performance improvements that can dramatically impact cluster efficiency.\n\n## Resource Management Improvements\n\nThe new **CPU Manager** policies in Kubernetes 1.28 can improve performance by up to 40% for CPU-intensive workloads. This is achieved through better CPU affinity and reduced context switching.\n\n## Memory Optimization\n\n**Memory QoS** improvements now allow for more precise memory allocation, reducing memory waste by approximately 25% in typical enterprise deployments. The enhanced cgroup v2 support provides better memory isolation.\n\n## Network Performance\n\n**CNI performance** has been significantly improved with the introduction of eBPF-based networking solutions. Cilium 1.14 shows 60% better throughput compared to traditional iptables-based solutions.\n\n## Storage Improvements\n\n**CSI drivers** in Kubernetes 1.28 support snapshot cloning, which can reduce backup times by 80% for large persistent volumes.\n\n## Autoscaling Enhancements\n\nThe **Vertical Pod Autoscaler (VPA)** now supports in-place resource updates, eliminating the need for pod restarts and reducing downtime by 95% during scaling operations.\n\n## Best Practices\n\n1. Use resource quotas to prevent resource contention\n2. Implement proper node affinity rules\n3. Enable cluster autoscaling with predictive scaling\n4. Use horizontal pod autoscaling with custom metrics\n5. Optimize container images to reduce startup time\n\n## Conclusion\n\nThese optimizations can result in significant cost savings, with enterprises reporting 30-50% reduction in infrastructure costs when properly implemented."
    },
    "context_info": {
      "target_audience": "senior_kubernetes_engineers",
      "publication": "technical_blog",
      "accuracy_level": "high",
      "fact_checking_required": true,
      "performance_claims": true
    }
  },
  "reasoning_md": "This article makes specific performance claims about Kubernetes 1.28 features and optimization techniques. All statistics cited come from official Kubernetes documentation, vendor benchmarks, and community testing. However, I need Third Eye to verify these claims are accurate and current, check that version numbers are correct, validate performance statistics, and ensure recommendations are still best practices as of 2024."
}
```

### 📝 Requirements Analysis

```json
{
  "payload": {
    "intent": "Analyze these product requirements for ambiguity and completeness before development",
    "work": {
      "requirements": "## User Management System Requirements\n\n### Core Features\n1. **User Registration**: Users should be able to create accounts with email verification\n2. **Authentication**: Secure login system with password requirements\n3. **Profile Management**: Users can update their personal information\n4. **Role-Based Access**: Different user types (admin, member, guest) with appropriate permissions\n\n### Technical Requirements\n- System must be **fast** and handle **lots of users**\n- Database should be **scalable**\n- Interface needs to be **user-friendly**\n- Security must be **enterprise-grade**\n\n### Business Requirements\n- Launch timeline: **ASAP**\n- Budget: **reasonable**\n- Must integrate with **existing systems**\n- Compliance with **relevant regulations**\n\n### Success Metrics\n- High user satisfaction\n- Good performance\n- Minimal downtime\n- Easy maintenance"
    },
    "context_info": {
      "project_type": "web_application",
      "timeline": "8_weeks",
      "team_experience": "intermediate",
      "business_critical": true,
      "stakeholder": "product_manager"
    }
  },
  "reasoning_md": "These requirements came from initial stakeholder meetings but contain many vague terms and undefined specifications. Terms like 'fast', 'lots of users', 'reasonable budget', and 'ASAP' lack concrete definitions. Before development starts, I need Third Eye to identify specific ambiguities, missing technical details, undefined acceptance criteria, and gaps that could lead to scope creep or failed expectations."
}
```

## Common Error Scenarios

### 🚨 Testing Error Responses

#### Connection Refused
**Scenario**: Third Eye stack not running
**Test**: Make any valid request
**Expected**: Connection error or timeout
**Fix**: Run `./start.sh start`

#### Invalid API Key
**Scenario**: Wrong or missing API key
**Test**: Configure wrong API key in MCP settings
**Expected**: 401 Unauthorized response
**Fix**: Get correct API key from startup logs

#### Malformed JSON
**Scenario**: Invalid JSON structure
**Test**: Send malformed JSON to tool
**Expected**: Parse error with clear message
**Fix**: Validate JSON syntax

## Performance Testing

### Load Testing Example
```json
{
  "payload": {
    "intent": "Validate this load testing strategy for a high-traffic API",
    "work": {
      "plan": "# Load Testing Strategy\n\n## Test Scenarios\n1. **Baseline**: 100 concurrent users\n2. **Peak Load**: 1000 concurrent users\n3. **Stress Test**: 2000 concurrent users\n4. **Spike Test**: 100 to 1000 users in 30 seconds\n\n## Metrics to Monitor\n- Response time (95th percentile < 200ms)\n- Throughput (>500 requests/second)\n- Error rate (<0.1%)\n- CPU/Memory utilization (<80%)\n\n## Tools\n- **k6** for load generation\n- **Prometheus** for metrics collection\n- **Grafana** for visualization"
    },
    "context_info": {
      "application_type": "rest_api",
      "expected_load": "1000_concurrent_users",
      "response_time_sla": "200ms_95th_percentile",
      "availability_target": "99.9%"
    }
  },
  "reasoning_md": "This load testing strategy is designed to validate our API can handle expected production traffic. The test scenarios progress from baseline to stress testing, and the metrics align with our SLA requirements. I need Third Eye to validate this approach is comprehensive and the targets are realistic for our infrastructure."
}
```

## Integration Verification

### Verify MCP Bridge is Working
1. Check logs: `./start.sh logs mcp-bridge`
2. Verify API connection: Check for successful requests in Third Eye API logs
3. Test tool availability: Ensure `third-eye/oversee` appears in your AI tool's available functions

### Troubleshooting Checklist

- [ ] Third Eye stack is running (`./start.sh status`)
- [ ] API key is correct and configured
- [ ] MCP bridge is connecting successfully
- [ ] All required fields are provided in requests
- [ ] Request structure matches the required schema
- [ ] Reasoning is at least 10 characters
- [ ] Intent is at least 5 characters
- [ ] Work object contains actual content
- [ ] Context info provides relevant project details

## Remember: STRICT OVERSEER

- Third Eye **VALIDATES**, never **GENERATES**
- Submit **COMPLETE** work packages only
- **ALL fields are REQUIRED** - no exceptions
- Incomplete submissions will be **REJECTED**
- Focus on **VALIDATION INTENT**, not creation requests