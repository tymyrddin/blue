# Integration patterns

## Getting simulator output into Wazuh

The [Red Lantern simulator](https://github.com/ninabarzh/red-lantern-sim) generates events. Wazuh needs to receive those events. How you connect them depends on your environment and testing goals. The Department has tried several approaches, some more successful than others.

The fundamental question is whether you want real-time event streaming or batch file ingestion. Real-time feels more production-like but requires network connectivity and proper syslog configuration. Batch ingestion is simpler for initial testing but does not test your actual log pipeline.

There is no universally correct choice. Pick the approach that matches your testing requirements and available infrastructure.

## Forwarding simulator output to Wazuh

### Direct syslog forwarding

The simplest approach sends simulator output directly to Wazuh's syslog port:

```bash
python -m simulator.cli simulator/scenarios/easy/fat_finger_hijack/scenario.yaml | nc wazuh-server 514
```

This pipes JSON events to netcat which forwards them to Wazuh on port 514 (standard syslog port). Wazuh receives events in real-time as the simulator generates them.

**Advantages:**
- Simple to set up
- Tests your actual syslog ingestion
- Real-time event processing

**Disadvantages:**
- Requires network access to Wazuh
- No persistence if connection drops
- Cannot replay events easily

### Syslog with socat for reliability

Netcat is fire-and-forget. If the connection fails, events disappear. Socat provides more robust forwarding:

```bash
python -m simulator.cli simulator/scenarios/easy/fat_finger_hijack/scenario.yaml | socat - TCP:wazuh-server:514
```

Socat handles connection errors more gracefully and supports TLS for encrypted transport:

```bash
python -m simulator.cli simulator/scenarios/easy/fat_finger_hijack/scenario.yaml | socat - OPENSSL:wazuh-server:6514,verify=0
```

This uses port 6514 with TLS encryption. The `verify=0` disables certificate validation, which is acceptable for testing but not production. For production, use proper certificates and remove that option.

### File-based ingestion

Write simulator output to a file and configure Wazuh to monitor it:

```bash
python -m simulator.cli simulator/scenarios/easy/fat_finger_hijack/scenario.yaml --output json --json-file /var/log/simulator/hijack.json
```

Configure Wazuh to monitor this file in `/var/ossec/etc/ossec.conf`:

```xml
<ossec_config>
  <localfile>
    <log_format>json</log_format>
    <location>/var/log/simulator/*.json</location>
  </localfile>
</ossec_config>
```

Restart Wazuh after configuration changes:

```bash
systemctl restart wazuh-manager
```

**Advantages:**
- No network dependencies
- Events persist on disk for replay
- Can test file ingestion pipeline
- Easy to debug (just read the file)

**Disadvantages:**
- Does not test syslog ingestion
- Requires filesystem access to Wazuh server
- File permissions can cause problems

### Using the Wazuh agent

Install Wazuh agent on the simulator host and configure log forwarding:

```xml
<ossec_config>
  <localfile>
    <log_format>json</log_format>
    <location>/var/log/simulator/output.json</location>
  </localfile>
</ossec_config>
```

The agent forwards events to the Wazuh manager automatically.

**Advantages:**
- Tests agent-based log collection
- Handles connection problems gracefully
- Includes agent metadata in events

**Disadvantages:**
- Requires agent installation and configuration
- More complex setup than direct syslog
- Agent overhead might affect simulator timing

### Remote execution with SSH

Run the simulator on a remote host and forward output via SSH:

```bash
ssh simulator-host "python -m simulator.cli /path/to/scenario.yaml" | nc wazuh-server 514
```

Or directly pipe to a file on the Wazuh server:

```bash
ssh simulator-host "python -m simulator.cli /path/to/scenario.yaml" | ssh wazuh-server "cat > /var/log/simulator/output.json"
```

This separates simulator execution from Wazuh, which is useful when testing distributed architectures or when the simulator and Wazuh cannot run on the same host.

## Setting up test environments

Production Wazuh environments should not be used for detection testing. A misconfigured rule that pages your entire security team at 3am because you were testing something is a good way to become unpopular. The Department maintains separate test environments specifically for rule development.

### Minimal test environment

The simplest test setup is Wazuh running in a container:

```bash
docker run -d --name wazuh-test -p 514:514 -p 55000:55000 wazuh/wazuh-manager:latest
```

This provides a disposable Wazuh instance for testing. When you break something (and you will), throw it away and start fresh:

```bash
docker rm -f wazuh-test
docker run -d --name wazuh-test -p 514:514 -p 55000:55000 wazuh/wazuh-manager:latest
```

**Advantages:**
- Quick to set up
- Disposable
- Isolated from production

**Disadvantages:**
- No persistence across restarts
- Limited to single-node testing
- Container overhead might affect timing

### Persistent test environment

For ongoing rule development, use a VM or dedicated server:

```bash
# Install Wazuh manager
curl -sO https://packages.wazuh.com/4.x/wazuh-install.sh
bash wazuh-install.sh --wazuh-server wazuh-test-server
```

Mount your rules and decoders from a development directory:

```bash
# Symlink rules for easy editing
ln -s /home/analyst/wazuh-rules/local_rules.xml /var/ossec/etc/rules/local_rules.xml
ln -s /home/analyst/wazuh-decoders/local_decoder.xml /var/ossec/etc/decoders/local_decoder.xml
```

Now you can edit rules in your development environment and restart Wazuh to test changes without copying files around.

### Infrastructure as code for test environments

The Department uses [Terraform](https://www.terraform.io/) to provision test Wazuh instances on demand:

```hcl
# test-wazuh.tf
resource "aws_instance" "wazuh_test" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.medium"
  
  tags = {
    Name = "wazuh-test-${var.analyst_name}"
    Purpose = "detection-testing"
    Auto-shutdown = "true"
  }
  
  user_data = <<-EOF
    #!/bin/bash
    curl -sO https://packages.wazuh.com/4.x/wazuh-install.sh
    bash wazuh-install.sh --wazuh-server $(hostname)
  EOF
}
```

This creates a fresh Wazuh instance for each analyst, automatically shut down overnight to save costs. When you finish testing, destroy the instance:

```bash
terraform destroy
```

**Advantages:**
- Repeatable
- Isolated per analyst
- Easy to provision and destroy
- Cost-effective (only pay when testing)

**Disadvantages:**
- Requires cloud infrastructure
- More complex initial setup
- Network latency if testing from local simulator

### Version control for test configurations

Keep test environment configurations in Git:

```
wazuh-test/
├── docker-compose.yml
├── terraform/
│   └── test-wazuh.tf
├── rules/
│   └── local_rules.xml
├── decoders/
│   └── local_decoder.xml
└── scenarios/
    └── test-scenarios.txt
```

Now other analysts can reproduce your test environment:

```bash
git clone https://git.department.local/wazuh-test.git
cd wazuh-test
docker-compose up -d
```

## Automating rule validation

Manual testing catches obvious problems but does not scale. Automated validation ensures rules continue working as scenarios evolve.

### Basic validation script

```bash
#!/bin/bash
# validate_rules.sh

set -e

SCENARIOS_DIR="simulator/scenarios/easy"
WAZUH_ALERTS="/var/ossec/logs/alerts/alerts.json"
RESULTS_FILE="validation_results.txt"

echo "Rule Validation Results - $(date)" > "$RESULTS_FILE"
echo "=======================================" >> "$RESULTS_FILE"

# Clear old alerts
> "$WAZUH_ALERTS"

# Test each scenario
for scenario in "$SCENARIOS_DIR"/*/scenario.yaml; do
    scenario_name=$(basename $(dirname "$scenario"))
    echo -n "Testing $scenario_name... "
    
    # Run scenario
    python -m simulator.cli "$scenario" | nc localhost 514
    
    # Wait for Wazuh to process
    sleep 5
    
    # Check for expected alerts
    if grep -q "BGP" "$WAZUH_ALERTS"; then
        echo "PASS" | tee -a "$RESULTS_FILE"
    else
        echo "FAIL" | tee -a "$RESULTS_FILE"
    fi
done

# Summary
passes=$(grep -c "PASS" "$RESULTS_FILE")
fails=$(grep -c "FAIL" "$RESULTS_FILE")
echo "" >> "$RESULTS_FILE"
echo "Summary: $passes passed, $fails failed" >> "$RESULTS_FILE"

# Exit with error if any tests failed
if [ "$fails" -gt 0 ]; then
    exit 1
fi
```

Run this script after changing rules:

```bash
./validate_rules.sh
```

If it exits with status 0, all tests passed. If it exits with status 1, something broke.

### Detailed validation with expected alerts

The basic script only checks if any alert fired. Better validation checks for specific expected alerts:

```bash
#!/bin/bash
# validate_rules_detailed.sh

declare -A expected_rules
expected_rules["fat_finger_hijack"]="100100"
expected_rules["unauthorised_peer"]="100101"
expected_rules["rpki_invalid"]="100102"

for scenario in "${!expected_rules[@]}"; do
    expected_rule="${expected_rules[$scenario]}"
    
    echo -n "Testing $scenario (expecting rule $expected_rule)... "
    
    # Clear alerts
    > "$WAZUH_ALERTS"
    
    # Run scenario
    python -m simulator.cli "simulator/scenarios/easy/$scenario/scenario.yaml" | nc localhost 514
    sleep 5
    
    # Check for specific rule
    if grep -q "\"id\": \"$expected_rule\"" "$WAZUH_ALERTS"; then
        echo "PASS"
    else
        echo "FAIL (rule $expected_rule did not fire)"
        echo "Alerts that did fire:"
        jq -r '.rule.id' "$WAZUH_ALERTS" | sort | uniq
    fi
done
```

This validates not just that alerts fired but that the correct rules fired.

### Performance regression testing

Track rule performance over time to catch degradation:

```bash
#!/bin/bash
# performance_test.sh

ITERATIONS=100
SCENARIO="simulator/scenarios/easy/fat_finger_hijack/scenario.yaml"

echo "Running performance test ($ITERATIONS iterations)..."

start_time=$(date +%s)

for i in $(seq 1 $ITERATIONS); do
    python -m simulator.cli "$SCENARIO" | nc localhost 514 > /dev/null 2>&1
done

end_time=$(date +%s)
duration=$((end_time - start_time))
average=$((duration / ITERATIONS))

echo "Total time: ${duration}s"
echo "Average per scenario: ${average}s"
echo "Events per second: $((ITERATIONS / duration))"

# Compare against baseline
BASELINE=2  # seconds per scenario
if [ "$average" -gt "$BASELINE" ]; then
    echo "WARNING: Performance regression detected (baseline: ${BASELINE}s)"
    exit 1
fi
```

Run this regularly to ensure rule changes do not degrade performance.

### JSON output for integration

Format validation results as JSON for consumption by other tools:

```bash
#!/bin/bash
# validate_rules_json.sh

results="["

for scenario in simulator/scenarios/easy/*/scenario.yaml; do
    scenario_name=$(basename $(dirname "$scenario"))
    
    # Run scenario
    python -m simulator.cli "$scenario" | nc localhost 514
    sleep 5
    
    # Check result
    if grep -q "BGP" "$WAZUH_ALERTS"; then
        result="pass"
    else
        result="fail"
    fi
    
    # Append to JSON
    results+="{\"scenario\": \"$scenario_name\", \"result\": \"$result\"},"
done

# Close JSON array
results="${results%,}]"

# Write results
echo "$results" | jq '.' > validation_results.json

# Exit status based on failures
if echo "$results" | jq -e 'map(select(.result == "fail")) | length > 0' > /dev/null; then
    exit 1
fi
```

This outputs `validation_results.json`:

```json
[
  {
    "scenario": "fat_finger_hijack",
    "result": "pass"
  },
  {
    "scenario": "unauthorised_peer",
    "result": "fail"
  }
]
```

Other tools can parse this for reporting or further processing.

## CI/CD for detection rules

Treating detection rules as code enables continuous integration and deployment. Every rule change goes through automated testing before reaching production.

### Git workflow

```
feature/new-hijack-detection
  ↓
  Pull request
  ↓
  Automated tests run
  ↓
  Code review
  ↓
  Merge to main
  ↓
  Automated deployment to test environment
  ↓
  Manual testing
  ↓
  Manual deployment to production
```

### GitLab CI pipeline

```yaml
# .gitlab-ci.yml

stages:
  - validate
  - test
  - deploy-test
  - deploy-prod

validate_syntax:
  stage: validate
  script:
    - xmllint --noout rules/local_rules.xml
    - xmllint --noout decoders/local_decoder.xml
  only:
    - merge_requests
    - main

test_rules:
  stage: test
  script:
    - ./scripts/validate_rules.sh
  artifacts:
    reports:
      junit: validation_results.xml
    paths:
      - validation_results.json
  only:
    - merge_requests
    - main

deploy_to_test:
  stage: deploy-test
  script:
    - scp rules/local_rules.xml wazuh-test:/var/ossec/etc/rules/
    - scp decoders/local_decoder.xml wazuh-test:/var/ossec/etc/decoders/
    - ssh wazuh-test "systemctl restart wazuh-manager"
  only:
    - main
  environment:
    name: test

deploy_to_production:
  stage: deploy-prod
  script:
    - scp rules/local_rules.xml wazuh-prod:/var/ossec/etc/rules/
    - scp decoders/local_decoder.xml wazuh-prod:/var/ossec/etc/decoders/
    - ssh wazuh-prod "systemctl restart wazuh-manager"
  only:
    - main
  when: manual
  environment:
    name: production
```

This pipeline:
1. Validates XML syntax
2. Runs automated tests
3. Deploys to test environment automatically
4. Requires manual approval for production deployment

### GitHub Actions pipeline

```yaml
# .github/workflows/detection-rules.yml

name: Detection Rules CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Validate XML syntax
        run: |
          sudo apt-get install -y libxml2-utils
          xmllint --noout rules/local_rules.xml
          xmllint --noout decoders/local_decoder.xml
  
  test:
    runs-on: ubuntu-latest
    needs: validate
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.12'
      
      - name: Install simulator
        run: |
          git clone https://github.com/ninabarzh/red-lantern-sim.git
          cd red-lantern-sim
          pip install -r requirements.txt
      
      - name: Start Wazuh test instance
        run: |
          docker run -d --name wazuh-test -p 514:514 wazuh/wazuh-manager:latest
          sleep 30  # Wait for Wazuh to start
      
      - name: Run tests
        run: ./scripts/validate_rules.sh
      
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: validation-results
          path: validation_results.json
  
  deploy-test:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to test environment
        run: |
          scp rules/local_rules.xml wazuh-test:/var/ossec/etc/rules/
          ssh wazuh-test "systemctl restart wazuh-manager"
```

### Pre-commit hooks

Prevent committing invalid rules:

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Validating rules before commit..."

# Check XML syntax
xmllint --noout rules/local_rules.xml
if [ $? -ne 0 ]; then
    echo "ERROR: Invalid XML in local_rules.xml"
    exit 1
fi

xmllint --noout decoders/local_decoder.xml
if [ $? -ne 0 ]; then
    echo "ERROR: Invalid XML in local_decoder.xml"
    exit 1
fi

# Run quick tests
./scripts/validate_rules.sh
if [ $? -ne 0 ]; then
    echo "ERROR: Rule validation failed"
    exit 1
fi

echo "Validation passed. Proceeding with commit."
```

Make the hook executable:

```bash
chmod +x .git/hooks/pre-commit
```

Now commits fail if rules do not pass validation.

### Rollback procedures

Deployments sometimes break things. Have a rollback plan:

```bash
#!/bin/bash
# rollback.sh

ENVIRONMENT=$1  # test or prod

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: ./rollback.sh [test|prod]"
    exit 1
fi

echo "Rolling back $ENVIRONMENT environment..."

# Get previous version from Git
git checkout HEAD~1 rules/local_rules.xml
git checkout HEAD~1 decoders/local_decoder.xml

# Deploy previous version
scp rules/local_rules.xml wazuh-$ENVIRONMENT:/var/ossec/etc/rules/
scp decoders/local_decoder.xml wazuh-$ENVIRONMENT:/var/ossec/etc/decoders/
ssh wazuh-$ENVIRONMENT "systemctl restart wazuh-manager"

echo "Rollback complete."
```

Use this when a deployment causes problems:

```bash
./rollback.sh prod
```

### Monitoring deployments

After deploying rules to production, monitor for problems:

```bash
#!/bin/bash
# monitor_deployment.sh

DURATION=3600  # Monitor for 1 hour
START_TIME=$(date +%s)

echo "Monitoring deployment for $((DURATION / 60)) minutes..."

while [ $(($(date +%s) - START_TIME)) -lt $DURATION ]; do
    # Check alert volume
    current_alerts=$(grep -c "\"rule\"" /var/ossec/logs/alerts/alerts.json)
    
    # Check error rate
    errors=$(grep -c "ERROR" /var/ossec/logs/ossec.log)
    
    # Check CPU usage
    cpu=$(top -b -n1 | grep wazuh-analysisd | awk '{print $9}')
    
    echo "$(date): Alerts: $current_alerts, Errors: $errors, CPU: $cpu%"
    
    # Alert if anomalies detected
    if [ "$errors" -gt 10 ]; then
        echo "WARNING: High error rate detected!"
    fi
    
    if (( $(echo "$cpu > 80" | bc -l) )); then
        echo "WARNING: High CPU usage detected!"
    fi
    
    sleep 60
done

echo "Monitoring complete. No critical issues detected."
```

Run this after production deployment to catch problems early.

## Best practices for integration

### Version everything

- Rules
- Decoders
- Test scenarios
- Validation scripts
- Environment configurations

All of these belong in version control. The Department uses Git for everything.

### Test in isolation

Do not test new rules in production. Even if you set them to level 0 (no alerts), they still consume CPU. Test in dedicated environments.

### Automate the boring parts

Syntax validation, basic functional tests, deployment to test environments. These should all be automated. Save human time for complex analysis and judgement calls.

### Document your pipeline

Future you will forget how the CI/CD pipeline works. Document:
- What each stage does
- How to trigger manual deployments
- Rollback procedures
- Where logs are stored

### Monitor continuously

Deployment is not the end. Monitor alert volumes, false positive rates, CPU usage, and rule performance. Catch degradation early.

### Keep test data realistic

Test with scenarios that resemble actual attacks your organisation faces. Generic test data produces generic results.

## Next steps

You have now completed the Wazuh detection engineering section. You understand decoders, rules, testing, and integration. 
If you use a different SIEM, proceed to [Other SIEM platforms](other-siems.md) for platform-specific guidance.

If Wazuh is your platform, you are ready to start building production detection rules. Begin with easy scenarios, 
test thoroughly, and deploy incrementally. The Scarlet Semaphore will not wait for you to achieve perfection, so start 
with good enough and iterate from there.

Remember that integration is not just technical plumbing. It is the difference between rules that rot in a Git 
repository and rules that actively protect your infrastructure. Invest time in solid integration patterns and your 
detection programme will benefit long after the initial setup effort is forgotten.
