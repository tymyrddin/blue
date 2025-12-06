Linux EDR techniques
=======================

Linux EDR is that stoic, bearded sysadmin who seems chill until you try to run curl | bash. Then? Total meltdown.

* Techniques it loves: Staring into `/proc` like a psychic reading `/dev/random`, and treating `sudo` escalations like a personal betrayal.
* False positives: When it freaks out over a cron job ("Why is root running something at 3 AM??" …Oh, it’s just log rotation. Again.).
* Real-world translation: "I don’t always detect threats, but when I do, they’re either 1) actually harmless or 2) already root."


.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: Bottom line: Linux EDR believes in tough love, and logging everything in JSON, just to watch you suffer.

   README.md
   kernel.md
   fs.md
   container.md
   hunting.md
