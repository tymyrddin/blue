# Process monitoring

| Technique	                        | Description	                                                | Tools/Commands                             |
|-----------------------------------|-------------------------------------------------------------|--------------------------------------------|
| ESF (Endpoint Security Framework) | Apple's official API for real-time process/event monitoring | `eslogger`, `EndpointSecurity` API         |
| XPC Service Analysis	             | Detect suspicious inter-process communication	              | `launchctl list`, `lsof -i`                |
| Mach-O Binary Inspection	         | Check for unsigned/hooked binaries                          | `codesign -dv --verbose=2 /path/to/binary` |