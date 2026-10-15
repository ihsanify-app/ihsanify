# 0000 - Decision title

Template for recording a single technical decision. Copy this file to
`0001-short-title.md`, `0002-short-title.md`, etc. (zero-padded, incrementing,
short kebab-case title) for each real decision.

## Problem

What is the business or technical problem? State it plainly, before any
proposed fix.

## Baseline

How was "before" measured? Current behavior, risk, query count, latency, or
test results — whatever is relevant to this problem.

## Investigation

What evidence points to the root cause? Logs, query plans, reproduction
steps, anything that was actually checked.

## Options

What alternatives were considered, including "do nothing"? One line each is
fine.

## Decision

Which option was chosen, and why — in terms of the actual trade-offs, not
just "this one seemed best."

## Implementation

What actually changed? Link the relevant commit(s)/PR if applicable.

## Verification

What test or measurement proves the fix works? Link it if it lives in
`experiments/`.

## Trade-offs

What did this cost — in complexity, performance, risk, or anything given up
to get this benefit? What are the known limitations of this decision?

## Interview story

### 2-minute version

The short version: problem, decision, result. What would be said if asked
"tell me about a hard bug you fixed" with no follow-up time.

### 10-minute version

The long version: include the investigation path, the options considered and
why they were rejected, and what would be done differently next time.
