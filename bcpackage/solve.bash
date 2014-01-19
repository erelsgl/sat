#!/bin/bash

# Put the full path to your SAT solver here:
SATSOLVER=~/Dropbox/theorem-prover/BCpackage-0.35/bczchaff

# Put a regular expression of the "interesting" (not trivial) variables:
# INTERESTING_VARIABLES_REGEXP='entirely_east|entirely_west|entirely_south|entirely_north|intersects_southwest|intersects_northwest|intersects_southeast|intersects_northeast'
INTERESTING_VARIABLES_REGEXP='east|west|south|north|gt'

cpp $1 | (echo "BC1.0"; grep -v "#") | sed 's/;/;\n/g'  > $1.tmp
cpp $1 | (echo "BC1.0"; grep -v "#") | sed 's/;/;\n/g' | $SATSOLVER | tr ' ' '\n' | egrep $INTERESTING_VARIABLES_REGEXP | grep -v "^[~]" | sort
