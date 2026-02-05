# Five Points - Full Game E2E Test
# Comprehensive test covering scoring, junk, and multipliers at Druid Hills

name: Five Points Full Game
desc: Comprehensive E2E test covering scoring, junk, and multipliers
spec: five_points
priority: smoke
tags: scoring junk multipliers full-game

# Players: id name handicap [override]
# Plus handicaps use + prefix (e.g., +0.9)
players: p1 Brad 5.1 [5.1], p2 Scott 4.1, p3 Tim +0.9, p4 Eric 12.9

# Course: name | tee | rating/slope
course: Druid Hills Golf Club | Blue | 71.8/134

# Hole definitions: hole-par-handicap-yards
holes: 1-4-3-444, 2-4-7-392, 3-4-15-320, 4-4-1-413, 5-4-5-380, 6-3-17-122, 7-5-11-485, 8-3-9-193, 9-5-13-485, 10-4-2-432, 11-4-6-416, 12-4-12-333, 13-3-18-160, 14-5-10-493, 15-4-4-352, 16-4-16-319, 17-3-14-192, 18-5-8-509

# ============================================
# FRONT NINE
# ============================================

# Hole 1: Basic scoring - establish teams
h1: (p1 p2) vs (p3 p4) | 4 5 5 6

# Hole 2: Birdie by Tim (par 4, score 3)
h2: | 5 6 3 5 | birdie:p3

# Hole 3: Prox on par 4
h3: | 3 4 3 4 | prox:p1

# Hole 4: Team 1 doubles
h4: | 4 5 5 5 | | t1:double

# Hole 5: Both teams press
h5: | 5 5 4 5 | | t1:double t2:double_back

# Hole 6: Par 3 - birdie + prox (Tim scores 4 on par 3 = bogey, but marking birdie for test)
h6: | 5 6 4 6 | birdie:p3 prox:p3

# Hole 7: Par 5 - eagles by Brad and Tim (score 3 on par 5)
h7: | 3 4 3 4

# Hole 8: Par 3
h8: | 4 4 4 5

# Hole 9: Par 5 - both teams double
h9: | 4 5 4 5 | | t1:double t2:double

# ============================================
# BACK NINE
# ============================================

# Hole 10: Par 4
h10: | 5 5 4 5

# Hole 11: Par 4
h11: | 5 6 5 6

# Hole 12: Par 4 - prox for Scott
h12: | 3 3 4 4 | prox:p2

# Hole 13: Par 3 - Team 2 doubles
h13: | 5 5 4 4 | | t2:double

# Hole 14: Par 5 - both teams double
h14: | 4 5 5 4 | | t1:double t2:double

# Hole 15: Par 4 - birdie by Brad
h15: | 4 6 5 6 | birdie:p1

# Hole 16: Par 4 - eagle by Brad (2 on par 4), birdie marking + prox
h16: | 2 4 3 4 | birdie:p1 prox:p3

# Hole 17: Par 3
h17: | 5 6 5 6

# Hole 18: Par 5 - birdies by Brad and Tim, multipliers
h18: | 4 5 4 5 | birdie:p1 birdie:p3 | t1:double t2:double_back
