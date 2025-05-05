# Secure coding

Secure coding rules and best practices are guidelines. They require the right secure coding tools to make them happen, and also the right approaches to make them more effective and efficient.

## Secure coding awareness training

Case studies or scenario-based vulnerable source code examples will have better training effects than simply secure coding rules.

* [OWASP Security Knowledge Framework](https://www.securityknowledgeframework.org/)
* [Android Application Secure Design and Secure Coding Guidebook](http://www.jssec.org/dl/android_securecoding_en.pdf)
* [Find Security Bugs Patterns for Java](https://find-sec-bugs.github.io/)
* [OWASP Teammentor](https://owasp.teammentor.net/angular/user/index)

## Tool evaluation

When the importance and the challenge of secure coding becomes apparent, people will look for some tools to make the secure coding easier. Some evaluation considerations that have proven useful to others:

| Considerations                             | Description                                                                                                                                                                                                                                                                                                                                                                                   |
|--------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Usability                                  | The target users of the code scanning tools are developers. The <br>usability includes the capability to scan parts of the source code, <br>differential scans, scanning reports, tracing back to original <br>source code, and so on.                                                                                                                                                        |
| Budget                                     | If it's an IDE plugin commercial tool, we need to consider how many <br>concurrent users' licenses it will need.                                                                                                                                                                                                                                                                              |
| Programming languages support              | Most tools support C/C++ and Java, but do not support script <br>languages, such as Python, JavaScript, or PHP. <br>Do a survey of the programming languages used by in-house<br>projects and prioritise the programming languages that are going<br>to be supported.                                                                                                                         |
| Detection rate and<br>false positive rates | It is common for any scanning tools to have false positive rates, <br>depending on the scanning engine and rules. A high false positive <br>is not a bad thing, and it can also mean the scanner takes a more <br>conservative approach. <br>Find the tool that best fits the projects instead of the most <br>well-known. To evaluate the detection rate, use known vulnerable <br>projects. |
| Scanning rules update                      | It is important that the tool is constantly updated with rules <br>and scanners.                                                                                                                                                                                                                                                                                                              |

After using the code scanning tools for a while, a security team may help to optimise the tools, processes, or rules based on user feedback.

## Secure compiling

Memory corruption and buffer overflow may result in [exploit code injection attacks](https://bof.tymyrddin.dev/). For the C/C++ programming language, these can be protected by compiler options:

* [SAFECode Development Practices](https://www.safecode.org/publication/SAFECode_Dev_Practices0211.pdf)
* [OWASP C-based ToolChain Hardening](https://www.owasp.org/index.php/C-Based_Toolchain_Hardening)
* [Linux Audit ASLR](https://linux-audit.com/linux-aslr-and-kernelrandomize_va_space-setting/)
* [MS Security Best Practice for C++](https://msdn.microsoft.com/en-us/library/k3a3hzw7.aspx)
* [Secure Compiler and linker flags for GCC](https://developers.redhat.com/blog/2018/03/21/compiler-and-linker-flags-gcc/)

To verify whether the application or the environment has been configured with secure options, these can be useful:

* [CheckSec](http://www.trapkit.de/tools/checksec.html)
* [BinScope](https://www.microsoft.com/en-us/download/details.aspx?id=44995)
