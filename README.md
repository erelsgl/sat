team-construction
=================

An example of using SAT for solving combinatorial problems related to Ramsey theory.

Motivation
----------

Sometimes, a combinatorical puzzle can be solved using a SAT solver (= a program for solving the logic formula satisfaction problem).

Here is the [original puzzle I asked in Computer Science Stack Exchange] (http://cs.stackexchange.com/questions/12275/team-construction-in-tri-partite-graph).

Based on a comment by András Salamon, I decided to pose it as a SAT problem.

This program converts an instance of the above puzzle to a CNF formula, in 
[the format of the MiniSat solver] (http://www.dwheeler.com/essays/minisat-user-guide.html).

How to use the program
----------------------
    node team-construction.js [NUM-OF-CANDIDATES] > [FILENAME].in
    minisat [FILENAME].in > [FILENAME].out

For small values of NUM-OF-CANDIDATES, minisat will return "SATISFIABLE", which means that it is possible to have a graph with this number of candidates per profession, but without a feasible team. The output file will contain an example of such a graph (as a list of edges that are contained or not contained in the graph)

For large enough values of NUM-OF-CANDIDATES (how much? that's the question) minisat will return "UNSATISFIABLE", which means that it is not possible to have a graph without a feasible team, i.e., it is always possible to construct a team.

Algorithm
---------
* Each possible edge in the tri-partite graph is given a distinct number.
* Each edge is represented by a variable in the CNF formula.
* The CNF formula contains two types of clauses:
    1. "at least one edge" clauses - saying there is at least a single edge between each two groups of three candidates of different professions.
    2. "no cliques" clauses - saying there are no groups of 3 candidates of 3 different professions, such that each candidate is connected to each of the other candidates.

