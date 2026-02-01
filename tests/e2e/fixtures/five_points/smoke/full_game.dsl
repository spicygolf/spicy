# Five Points - Full 18-Hole E2E Test
# Progressive complexity: basic scoring → junk → multipliers → stacking

name: Five Points Full Game
desc: Comprehensive E2E test covering scoring, junk, and multipliers
spec: five_points
priority: smoke
tags: scoring junk multipliers full-game

players: p1 Brad 10, p2 Scott 12, p3 Tim 8, p4 Eric 14

course: E2E Test Course | Blue | 71.5/128

# Hole definitions: hole-par-handicap
holes: 1-4-5, 2-5-11, 3-3-15, 4-4-3, 5-4-7, 6-5-13, 7-3-17, 8-4-1, 9-4-9, 10-4-6, 11-5-12, 12-3-16, 13-4-4, 14-4-8, 15-5-14, 16-3-18, 17-4-2, 18-5-10

# ============================================
# FRONT NINE - Basic Scoring & Junk
# ============================================

# Hole 1: Basic scoring - Team 1 wins low ball and low total
h1: (p1 p2) vs (p3 p4) | 4 5 5 6

# Hole 2: Team 2 wins - birdie by Tim
h2: | 5 6 3 5 | birdie:p3

# Hole 3: Par 3 with prox - Brad closest
h3: | 3 4 3 4 | prox:p1

# Hole 4: Double multiplier - Team 1 presses
h4: | 4 5 5 5 | | t1:double

# Hole 5: Double back - Team 2 responds
h5: | 5 5 4 5 | | t1:double t2:double_back

# Hole 6: Multiple junk - birdie + prox same player
h6: | 5 6 4 6 | birdie:p3 prox:p3

# Hole 7: Par 3 tie - no low ball awarded
h7: | 3 4 3 4

# Hole 8: All pars - Team 1 wins on low total tiebreaker
h8: | 4 4 4 5

# Hole 9: Front nine finish - double stacking
h9: | 4 5 4 5 | | t1:double t2:double

# ============================================
# BACK NINE - Advanced Scenarios
# ============================================

# Hole 10: Back nine start - clean scoring
h10: | 5 5 4 5

# Hole 11: Eagle opportunity (par 5) - not scored though
h11: | 5 6 5 6

# Hole 12: Par 3 - another prox
h12: | 3 3 4 4 | prox:p2

# Hole 13: Team 2 presses
h13: | 5 5 4 4 | | t2:double

# Hole 14: Both teams press
h14: | 4 5 5 4 | | t1:double t2:double

# Hole 15: Birdie on par 5
h15: | 4 6 5 6 | birdie:p1

# Hole 16: Par 3 - prox and birdie different players
h16: | 2 4 3 4 | birdie:p1 prox:p3

# Hole 17: Second hardest hole - high scores
h17: | 5 6 5 6

# Hole 18: Finishing hole - everything
h18: | 4 5 4 5 | birdie:p1 birdie:p3 | t1:double t2:double_back
