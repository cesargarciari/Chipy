---
description: Scaffold the next numbered ADR in docs/adr/ (Nygard format)
argument-hint: <short title of the decision>
---

Create the next Architecture Decision Record for: $ARGUMENTS

1. List `docs/adr/`, take the highest number, add one, zero-pad to four digits
   (next is likely `0008`). Read one recent ADR to match its tone: short,
   concrete, plain sentences, no em dashes.
2. Filename: `docs/adr/<NNNN>-<kebab-title>.md`.
3. Body:

   ```
   # <N>. <Title>

   Date: <today, YYYY-MM-DD>

   ## Status

   Proposed

   ## Context

   <Why this is on the table now. The forces in play. 2 to 5 sentences.>

   ## Decision

   <What we are doing, stated plainly.>

   ## Consequences

   - <What follows, good and bad.>
   - <What gets easier, what gets harder.>
   ```

4. Fill each section from the task and the codebase. Mark anything you cannot
   determine as `(open question: ...)` rather than guessing.
5. Print the path and the full draft. Do not commit.
