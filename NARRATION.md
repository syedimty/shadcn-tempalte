# PACE narration V3 — British male voice

Generated 2026-10-25; Sequences 9, 12 and 13 re-recorded 2026-10-26 with revised text with Qwen3-TTS 1.7B (VoiceDesign → VoiceClone) on the RTX 5090 ComfyUI
(`http://wakanda-server-mini:8191`). 14 sequences, one WAV each.

## Summary

| Item | Value |
|---|---|
| Total length | **6:19.9** (379.9 s) |
| Total words | 941 (about 149 words/min) |
| Files | `sequence1.wav` – `sequence14.wav` |
| Audio format | WAV, 16-bit PCM, 24 kHz, mono (converted from ComfyUI FLAC with `afconvert`) |
| Voice | British male, thirties, Received Pronunciation, warm and conversational |
| Voice design prompt | "A natural, warm adult British male voice in his thirties with a clear standard southern English (Received Pronunciation) accent, speaking in a relaxed, conversational tone like a friendly professional explaining something to a colleague. Unhurried, genuine and human, with natural rhythm, small pauses and varied, expressive intonation." |
| Voice reference | text "Welcome to the new workflow.", design seed 42 |
| Per-sequence clone | seed 42, instruct "Speak slowly, relaxed." |
| Model settings | 1.7B, bf16, SDPA, CUDA, temperature 0.9, top_p 1.0, top_k 50, repetition penalty 1.05 |
| Text tweaks | PACE spoken as "Pace"; acronym spoken forms (below). Script text below is as written. |
| Generator | `scripts/qwen3-tts/narration/narration.py` with `NARR_VOICE=male_uk NARR_SPOKEN=1 NARR_PACE_CASE=1` |
| Word check | Whisper `small.en` transcript of all 14 files: acronyms heard as spoken forms; sequences 9, 12, 13 match the new text word for word |

Spoken forms used for the TTS input: S2B0 → "S two B O", CRMx → "C R M X", SCI → "S C I",
KYC → "K Y C", FATCA → "Fatca", CRS → "C R S", eBBS → "e B B S", Release 2 → "Release two",
CLM → "C L M", CADM → "C A D M", Straight2Bank → "Straight to Bank", eOps → "e Ops",
eSigcap → "e Sigcap", AI → "A I" (so "AI factory" is spoken "A I factory").

## Lengths

| Seq | File | Length | Words |
|---|---|---|---|
| 1 | `sequence1.wav` | 0:15.8 (15.8 s) | 37 |
| 2 | `sequence2.wav` | 0:35.8 (35.8 s) | 93 |
| 3 | `sequence3.wav` | 0:37.1 (37.1 s) | 99 |
| 4 | `sequence4.wav` | 0:20.1 (20.1 s) | 50 |
| 5 | `sequence5.wav` | 0:45.2 (45.2 s) | 114 |
| 6 | `sequence6.wav` | 0:42.1 (42.1 s) | 104 |
| 7 | `sequence7.wav` | 0:18.5 (18.5 s) | 44 |
| 8 | `sequence8.wav` | 0:36.3 (36.3 s) | 88 |
| 9 | `sequence9.wav` | 0:19.8 (19.8 s) | 50 |
| 10 | `sequence10.wav` | 0:41.2 (41.2 s) | 114 |
| 11 | `sequence11.wav` | 0:22.4 (22.4 s) | 50 |
| 12 | `sequence12.wav` | 0:02.9 (2.9 s) | 5 |
| 13 | `sequence13.wav` | 0:17.3 (17.3 s) | 43 |
| 14 | `sequence14.wav` | 0:25.6 (25.6 s) | 50 |
| **Total** | | **6:19.9** (379.9 s) | **941** |

## Timeline per sentence

Times are seconds into each sequence file (from Whisper `small.en` word timestamps aligned to the script). "Timeline" is the position if the 14 files are placed back to back with no gaps; add your own gap/offset if you space them in the edit. Start = first word onset, End = last word end. Silence between sentences is the gap between one End and the next Start.

### Sequence 1 — `sequence1.wav` — 0:15.8 (timeline 0:00.0 – 0:15.8)

| # | Start | End | Timeline start | Sentence |
|---|---|---|---|---|
| 1 | 0.00 | 3.06 | 0:00.0 | Welcome to a glimpse of life before and after PACE. |
| 2 | 3.62 | 15.40 | 0:03.6 | A journey from paper-based, fragmented and manual processes to a digital, data-driven, integrated and automated experience, making onboarding simple, efficient and better for our clients and colleagues. |

### Sequence 2 — `sequence2.wav` — 0:35.8 (timeline 0:15.8 – 0:51.6)

| # | Start | End | Timeline start | Sentence |
|---|---|---|---|---|
| 1 | 0.00 | 4.48 | 0:15.8 | Let’s first look at what opening an account with Standard Chartered felt like before PACE. |
| 2 | 5.04 | 8.02 | 0:20.9 | We’ll start with the experience of our clients and Client Managers. |
| 3 | 8.98 | 14.16 | 0:24.8 | Before PACE, information entered by clients through the self-service onboarding portal was stored locally. |
| 4 | 15.06 | 24.84 | 0:30.9 | Client Managers then had to rekey the same data and documents into multiple applications, including Client Central and eOps, to kick-start the onboarding and account-opening process. |
| 5 | 24.84 | 30.66 | 0:40.7 | The process then moved through two steps in eOps, fragmenting the data lineage and flow of events. |
| 6 | 31.34 | 35.46 | 0:47.2 | This resulted in additional manual intervention, including providing progress updates. |

### Sequence 3 — `sequence3.wav` — 0:37.1 (timeline 0:51.6 – 1:28.7)

| # | Start | End | Timeline start | Sentence |
|---|---|---|---|---|
| 1 | 0.00 | 5.08 | 0:51.6 | The legacy eOps workflow was sequential and came with significant operational overhead. |
| 2 | 5.88 | 12.40 | 0:57.5 | Colleagues had to enter data that was not validated or used for straight-through processing, while retired fields still remained mandatory. |
| 3 | 13.14 | 21.38 | 1:04.8 | They also had to work through a cumbersome checklist, with no integration to verified internal data sources such as Client Central, CRMx or SCI. |
| 4 | 22.80 | 27.14 | 1:14.4 | There was also no upfront visibility of whether an application was eligible for account opening. |
| 5 | 27.14 | 36.86 | 1:18.8 | Without upfront data validation or a single view of completeness, typing errors or missing information could travel further into the process, increasing the chance of a refer-back later. |

### Sequence 4 — `sequence4.wav` — 0:20.1 (timeline 1:28.7 – 1:48.7)

| # | Start | End | Timeline start | Sentence |
|---|---|---|---|---|
| 1 | 0.00 | 5.08 | 1:28.7 | When the case reached Operations, priority was not always visible within the workflow. |
| 2 | 6.10 | 14.56 | 1:34.8 | Colleagues relied on offline information, such as reports, to decide what to process first, then consulted multiple sources to rebuild the full picture. |
| 3 | 15.18 | 19.80 | 1:43.9 | The work was less about judgement and more about finding, comparing and entering data. |

### Sequence 5 — `sequence5.wav` — 0:45.2 (timeline 1:48.7 – 2:33.9)

| # | Start | End | Timeline start | Sentence |
|---|---|---|---|---|
| 1 | 0.00 | 5.06 | 1:48.7 | Account creation was followed by separate signatory, mandate and channel activities. |
| 2 | 5.92 | 10.78 | 1:54.7 | The work moved sequentially across teams and systems, with repeated data entry and checks. |
| 3 | 11.72 | 16.82 | 2:00.5 | Manual account creation took about three hours, while channel enablement could take two to nine days. |
| 4 | 17.56 | 28.76 | 2:06.3 | At each step, users had to log in to the respective systems, such as eBBS, Sigcap and CADM, and perform Maker and Checker activities to set up accounts and enable channels. |
| 5 | 28.76 | 39.04 | 2:17.5 | Because data was entered manually across multiple systems, scenarios could arise where details had to be referred back to the Initiator for validation or correction before setup could continue. |
| 6 | 39.74 | 44.90 | 2:28.5 | Some notifications were also manual, including preparing the welcome email after Straight2Bank setup. |

### Sequence 6 — `sequence6.wav` — 0:42.1 (timeline 2:33.9 – 3:16.0)

| # | Start | End | Timeline start | Sentence |
|---|---|---|---|---|
| 1 | 0.00 | 4.32 | 2:33.9 | Let’s now take a quick look at how PACE is transforming the end-to-end experience. |
| 2 | 5.14 | 8.82 | 2:39.0 | PACE delivers faster, simpler and more streamlined onboarding. |
| 3 | 9.24 | 19.30 | 2:43.1 | Digital application data from clients flows directly into the PACE workflow for fulfilment, after the necessary upfront automated validations and the client’s e-signature or wet signature. |
| 4 | 19.78 | 28.18 | 2:53.7 | For exceptional cases where clients provide physical account-opening forms in person or by email, PACE provides a simpler way to initiate the account-opening journey. |
| 5 | 28.18 | 33.42 | 3:02.1 | The remaining verified information is brought directly from source systems instead of being rekeyed. |
| 6 | 34.28 | 41.84 | 3:08.2 | Operations verifies the case once, while PACE orchestrates downstream activities end-to-end and enables straight-through processing through automated services. |

### Sequence 7 — `sequence7.wav` — 0:18.5 (timeline 3:16.0 – 3:34.6)

| # | Start | End | Timeline start | Sentence |
|---|---|---|---|---|
| 1 | 0.00 | 5.14 | 3:16.0 | With PACE, the request arrives as data, not as a PDF that must be rebuilt. |
| 2 | 5.90 | 13.52 | 3:21.9 | Verified data flows in from S2B0, CRMx, Client Central and SCI into a single consolidated case. |
| 3 | 14.16 | 18.26 | 3:30.2 | The legacy checklist of about fifty questions is reduced to ten essential questions. |

### Sequence 8 — `sequence8.wav` — 0:36.3 (timeline 3:34.6 – 4:10.8)

| # | Start | End | Timeline start | Sentence |
|---|---|---|---|---|
| 1 | 0.00 | 10.96 | 3:34.6 | PACE enables parallel processing between CLM Operations and Channel Operations, eliminating the need to wait for account and mandate setup to be completed before checking readiness for Straight2Bank setup. |
| 2 | 11.92 | 15.02 | 3:46.5 | PACE also makes priority consistently visible across teams. |
| 3 | 16.00 | 20.48 | 3:50.6 | Processors work from a single case view instead of reconstructing information from multiple systems. |
| 4 | 21.48 | 28.06 | 3:56.0 | Release 2 introduces validations covering KYC, FATCA, CRS, product eligibility and name screening. |
| 5 | 28.66 | 36.08 | 4:03.2 | Stronger upfront controls help catch issues early, such as a missing second Security Administrator, so they can be corrected before the case moves forward. |

### Sequence 9 — `sequence9.wav` — 0:19.8 (timeline 4:10.8 – 4:30.7)

| # | Start | End | Timeline start | Sentence |
|---|---|---|---|---|
| 1 | 0.00 | 6.16 | 4:10.8 | After Operations verification, PACE initiates and orchestrates account creation in eBBS. |
| 2 | 7.04 | 10.74 | 4:17.9 | It gets more interesting and powerful when there are more number of accounts to be opened. |
| 3 | 11.48 | 12.50 | 4:22.3 | PACE does it in one go. |
| 4 | 13.14 | 19.60 | 4:24.0 | Responses return to the same workflow, and PACE decides automatically what starts next, preserving status and traceability. |

### Sequence 10 — `sequence10.wav` — 0:41.2 (timeline 4:30.7 – 5:11.8)

| # | Start | End | Timeline start | Sentence |
|---|---|---|---|---|
| 1 | 0.00 | 5.48 | 4:30.7 | This year, PACE initiates mandate and signatory setup and channel enablement activities in parallel. |
| 2 | 6.04 | 14.40 | 4:36.7 | Traditionally, users had to log into Sigcap and manually set up each account and signatory, entering data and uploading specimen signatures one by one. |
| 3 | 14.72 | 18.70 | 4:45.4 | With PACE, all accounts and signatories can be set up in bulk in one go. |
| 4 | 19.26 | 25.34 | 4:49.9 | While this processing takes place, users can focus on the next case and return only when an exception requires attention. |
| 5 | 26.10 | 31.48 | 4:56.8 | Manual review, exception resolution and selected non-integrated services still remain part of the journey. |
| 6 | 32.40 | 36.90 | 5:03.1 | Imagine the power of this automation when a client has multiple accounts and multiple signatories. |
| 7 | 37.44 | 40.84 | 5:08.1 | This is a significant step towards enabling channels faster for our clients. |

### Sequence 11 — `sequence11.wav` — 0:22.4 (timeline 5:11.8 – 5:34.2)

| # | Start | End | Timeline start | Sentence |
|---|---|---|---|---|
| 1 | 0.00 | 7.62 | 5:11.8 | For clients and Client Managers, automated status updates reduce the need for chasing progress through emails and phone calls. |
| 2 | 8.28 | 11.10 | 5:20.1 | The journey has fewer handoffs and becomes more predictable. |
| 3 | 11.92 | 15.80 | 5:23.7 | For colleagues, there is less rekeying and less searching across systems. |
| 4 | 16.84 | 21.92 | 5:28.6 | Controls verify information before execution, while one workflow provides end-to-end visibility. |

### Sequence 12 — `sequence12.wav` — 0:02.9 (timeline 5:34.2 – 5:37.1)

| # | Start | End | Timeline start | Sentence |
|---|---|---|---|---|
| 1 | 0.00 | 2.68 | 5:34.2 | Release 2 delivers faster onboarding. |

### Sequence 13 — `sequence13.wav` — 0:17.3 (timeline 5:37.1 – 5:54.3)

| # | Start | End | Timeline start | Sentence |
|---|---|---|---|---|
| 1 | 0.00 | 1.04 | 5:37.1 | So what is next? |
| 2 | 1.90 | 17.12 | 5:39.0 | Further enhancements are planned to roll out to remaining markets, integrate additional systems, enable mass account opening through bulk upload, augmenting AI to support user judgements through AI factory, thereby enhancing client and colleagues experience to the next level. |

### Sequence 14 — `sequence14.wav` — 0:25.6 (timeline 5:54.3 – 6:19.9)

| # | Start | End | Timeline start | Sentence |
|---|---|---|---|---|
| 1 | 0.00 | 7.14 | 5:54.3 | PACE brings together digital applications, verified data and downstream execution into one controlled workflow. |
| 2 | 8.02 | 8.54 | 6:02.3 | Capture once. |
| 3 | 9.36 | 10.20 | 6:03.7 | Verify once. |
| 4 | 11.02 | 11.46 | 6:05.3 | Orchestrate. |
| 5 | 12.08 | 15.36 | 6:06.4 | For clients, that means a faster and more predictable onboarding journey. |
| 6 | 15.98 | 21.60 | 6:10.3 | For colleagues, it means less rekeying, fewer handoffs and more time spent on value-added decisions. |
| 7 | 22.30 | 22.54 | 6:16.6 | Faster. |
| 8 | 23.20 | 23.54 | 6:17.5 | Simpler. |
| 9 | 24.16 | 25.54 | 6:18.5 | More controlled onboarding. |

## Notes

- Sequences 9, 12, 13 were re-recorded on 2026-10-26 (old takes kept in `previous/`). The other 11 were checked and keep their spoken forms; no re-recording needed.
- Compared with the earlier female voice A (v2 script, 548 words, 3:58), this voice runs about 7% faster per word.
- Tried and not adopted: faster-pace instructs (only ~12% shorter on Sequence 1) and three alternative British voice designs (rejected as worse than this one).
- On the Mac use `/usr/bin/python3` to run the generator; the miniconda Python gets "No route to host" to wakanda-server-mini.
- Regenerate settings and commands: `docs/qwen3-tts-narration.md`.
