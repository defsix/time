# Repo instructions

- Whenever a branch is merged into `main`, update `README.md` as part of that
  merge (e.g. a dated `## Changelog` entry summarizing what changed, and any
  other sections affected by the change).

## Szept (my one to-do and reminder list)
Szept holds everything still to do, across all projects. Use the Szept connector (add_reminder, edit_reminder, complete_reminder, cancel_reminder).
- Everything unfinished goes into Szept, dated or not: every open board card (any kind) and every open ROADMAP item. No date = a to-do (leave due empty); with a date = a timed reminder. Your own jobs go in as undated to-dos starting "Claude: ".
- Every entry gets a priority: urgent (security, or a deadline where something breaks or expires), important (matters, no rush), normal (routine), someday (ideas, maybe-laters). One left without a priority shows as "unsorted" and gets flagged.
- Every entry also gets a slot (how it gets done) and a plan (roughly when). Slots: sat-day (hands-on, Saturday daytime), evening (computer work, Saturday/Sunday evening), work-gap (a short remote job; only if it needs few windows), claude (you do it alone), waiting (blocked). Plan = the Saturday of the weekend to aim for (YYYY-MM-DD), or "later". Spread jobs over weekends, a few hours per slot, urgent first; a due time, if any, still rules.
- Set project to this project's name, put "board <ref>" in the text when it belongs to a board card, and add a short opening line (claude_prompt) I can paste to pick the job up with you.
- Add the entry in the same turn the card or ROADMAP line is created, and put the Szept id in the card's reply. When it's finished or dropped, complete or cancel the Szept entry in the same turn.
