# Repo instructions

- Whenever a branch is merged into `main`, update `README.md` as part of that
  merge (e.g. a dated `## Changelog` entry summarizing what changed, and any
  other sections affected by the change).

## Szept (my one list for everything still to do)
Szept (the Szept connector, one page per project) holds every open decision, job of mine, job of yours, part to buy and reminder, across all projects. Szept project for this repo: "World Time".
- Add an item whenever something comes up (a finding, a follow-up, a command I need to run, a decision, a part to buy), in the same turn. Never leave it only in the chat or in a ROADMAP.
- kind: decide (fill suggest: what Yes means, what you then do, and the undo) | mine (my hands-on job: fill cmd + where = the exact command, where to run it, its side effects and the undo) | claude (yours) | shop (a part to buy) | todo | reminder (timed). Add detail (what and why, with the evidence), area, tags, est_minutes when known, blocked_by or waiting while blocked, and a short claude_prompt I can paste to pick the job up with you.
- priority: urgent (security, or a deadline where something breaks or expires) | important (matters, no rush) | normal (routine) | someday (ideas, maybe-laters). Never leave it empty.
- slot (how) + plan (roughly when): sat-day (hands-on, Saturday daytime) | evening (computer work, Saturday/Sunday evening) | work-gap (a short job from work by phone over Termux, RustDesk or SSH; only if it needs few windows) | claude (you do it alone) | waiting (blocked). Plan = the Saturday of the weekend to aim for (YYYY-MM-DD), or "later". Spread jobs over weekends, a few hours per slot, urgent first; a due time, if any, still rules. Dated weekend jobs go in my batched slots: hands-on Sat 10:00, computer Sat 19:00.
- At the start of each session: list_questions (answer each with add_comment_reply) and project_summary for this project; act on every decision I answered Yes; read my notes on the items you work on.
- When you finish something: complete_reminder with done, tested, not_tested and undo filled in. If a Yes turns out to need something from me: keep it open, add a mine item with the exact command, and set blocked_by. If I say No or want something kept: it's closed; don't suggest it again. If you were wrong about something, say so plainly in a reply on the item.
- Still ask before deleting files, installing packages or anything irreversible, unless the item's suggest described that exact action and I said Yes.
- ROADMAP.md: plans, context and ideas only; on my server Szept writes each project's open items into its "Open in Szept" block every night, so never hand-copy open items. No passwords, PINs or keys in Szept: every chat can read it.
- "Review Szept" (or "review the board") = do the session start and report: done, waiting for me, not started.
