# Five Points - Full Game E2E Test
# Comprehensive test covering scoring, junk, and multipliers at Druid Hills

name: Five Points Full Game
desc: Comprehensive E2E test covering scoring, junk, and multipliers
spec: five_points
priority: smoke
tags: scoring junk multipliers full-game

# Players: name handicap [override]
# Plus handicaps use + prefix (e.g., +0.9)
players: Brad 5.1 [5.1], Scott 4.1, Tim +0.9, Eric 12.9

# Course: name | tee | rating/slope
course: Druid Hills Golf Club | Blue | 71.8/134

# Junk definitions: name points (for assertion lookups)
junk: prox 1 | low_ball 2 | low_total 2

# Multiplier definitions: name value (for future use)
mults: double 2 | pre_double 2 | double_back 2

# Hole definitions: hole-par-handicap-yards
holes: 1-4-3-444, 2-4-7-392, 3-4-15-320, 4-4-1-413, 5-4-5-380, 6-3-17-122, 7-5-11-485, 8-3-9-193, 9-5-13-485, 10-4-2-432, 11-4-6-416, 12-4-12-333, 13-3-18-160, 14-5-10-493, 15-4-4-352, 16-4-16-319, 17-3-14-192, 18-5-8-509

# ============================================
# FRONT NINE
# ============================================

# Hole 1: establish teams, only prox, 1pt
h1: (Brad Scott) vs (Tim Eric) | 5 5 4 5 | prox:Brad | | => 1 0 | 1 -1

# Hole 2: prox, low ball, 3pts
h2: | 6 5 4 7 | prox:Tim | | => 0 3 | -2 2 | low_ball:t2

# Hole 3: prox, low ball other team 1pt
h3: | 4 6 5 6 | prox:tim | | => 1 0 | -1 1 | low_ball:t1

# Hole 4: prox, low ball, low team 5pts
h4: | 5 4 5 5 | prox:scott | | => 5 0 | 4 -4 | low_ball:t1 low_total:t1

# Hole 5: low ball low total, prox other team 3pts
h5: | 4 4 4 5 | prox:tim | | => 3 0 | 7 -7 | low_ball:t1 low_total:t1

# Hole 6: Par 3 - prox for Tim
# h6: | 5 6 3 6 | prox:Tim

# Hole 7: Par 5 - eagles by Brad and Tim (score 3 on par 5)
# h7: | 3 4 3 4

# Hole 8: Par 3
# h8: | 4 4 4 5

# Hole 9: Par 5 - both teams double
# h9: | 4 5 4 5 | | double:t1 double:t2

# ============================================
# BACK NINE
# ============================================

# Hole 10: Par 4
# h10: | 5 5 4 5

# Hole 11: Par 4
# h11: | 5 6 5 6

# Hole 12: Par 4 - prox for Scott
# h12: | 3 3 4 4 | prox:Scott

# Hole 13: Par 3 - Team 2 doubles
# h13: | 5 5 4 4 | | double:t2

# Hole 14: Par 5 - both teams double
# h14: | 4 5 5 4 | | double:t1 double:t2

# Hole 15: Par 4 - birdie by Brad
# h15: | 4 6 5 6

# Hole 16: Par 4 - eagle by Brad (2 on par 4), prox for Tim
# h16: | 2 4 3 4 | prox:Tim

# Hole 17: Par 3
# h17: | 5 6 5 6

# Hole 18: Par 5 - birdies by Brad and Tim, multipliers
# h18: | 4 5 4 5 | | double:t1 double_back:t2
