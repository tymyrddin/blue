# Behavioural detection

| Technique	              | Example	                         | Detection method                                      |
|-------------------------|----------------------------------|-------------------------------------------------------|
| Persistence mechanisms	 | LaunchAgents, cron jobs	         | `launchctl print system/`, `ls -la /Library/Launch*/` |
| Fileless Attacks	       | Python/Ruby in-memory execution	 | Monitor `execsnoop` or `opensnoop`                    |
| API Hook Detection	     | DYLD_INSERT_LIBRARIES abuse	     | `vmmap <PID>` + signature validation                  |

