# Segmentation and the rules that rot

Network segmentation limits how far an intruder can move from the first foothold. It works by saying
no to traffic, and every no is a rule somebody owns, reviews, and eventually has to change. The
protection is real; the cost is that a segmented network carries a standing maintenance burden that
never ends.

The burden is where the protection leaks. Each new application needs a path, each path is an
exception, and exceptions are easier to grant broadly than narrowly, because a broad rule does not
come back next week. After a few years the rule set has accreted its way toward permissiveness, and
the segment boundary that looks firm on the diagram is, in traffic, a sieve with good documentation.

The rule that does the most damage is usually the most reasonable one. An "allow any from the
management network" exists because the management network has to reach everything to manage it, and
an attacker who reaches that network inherits the same reach. The segmentation holds against the
lateral path nobody needed and folds along the one the administrators use every day.

Microsegmentation promises a tighter boundary and multiplies the maintenance to match: more segments,
more rules, more exceptions, more drift. It is among the strongest controls against lateral movement
and among the most expensive to keep honest, and the deployments that hold up tend to be the ones
that treated the rule review as the actual product.
